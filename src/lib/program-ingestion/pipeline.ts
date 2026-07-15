import "server-only";
import { discoverProgramSources, OfficialSiteSearchAdapter } from "./source-discovery";
import { appearsJavascriptDependent, extractStaticHtml, validateProgramIdentity } from "./extractors";
import { fetchOfficialPage } from "./source-policy";
import { createKnowledgeReview, markProgramSourcesPublished, publishProgramContent, recordProgramSourceSnapshot, saveExtractedEvidence, updateIngestionJob } from "./repository";
import type { BrowserRenderAdapter, ChineseSummaryAdapter, ExtractedProgramField, PdfExtractionAdapter, ProgramDiscoveryInput } from "./types";

export type IngestionDependencies = {
  officialSearch?: OfficialSiteSearchAdapter;
  browserRenderer?: BrowserRenderAdapter;
  pdfExtractor?: PdfExtractionAdapter;
  summarizer: ChineseSummaryAdapter;
};

function uniqueValues(fields: ExtractedProgramField[], name: ExtractedProgramField["field"]) {
  return fields.filter((field) => field.field === name).map((field) => field.value).filter((value, index, all) => value && all.indexOf(value) === index);
}

function moduleFromField(field: ExtractedProgramField) {
  const match = field.value.match(/^(?:([A-Z]{2,8}\d{2,5})\s+)?(.+?)(?:\s+(\d+(?:\.\d+)?)\s*(?:credits?|ects))?$/i);
  if (!match || match[2].length > 180) return undefined;
  return {
    code: match[1] || undefined,
    name: match[2].trim(),
    credits: match[3] ? Number(match[3]) : undefined,
    type: field.field === "core_module" ? "core" as const : "optional" as const,
    sourceUrl: field.sourceUrl,
  };
}

function conservativePdfFields(text: string, sourceUrl: string, title: string) {
  const now = new Date().toISOString();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const fields: ExtractedProgramField[] = [];
  let mode: "core_module" | "optional_module" | undefined;
  for (const line of lines) {
    if (/compulsory|core modules?/i.test(line)) { mode = "core_module"; continue; }
    if (/optional|elective modules?/i.test(line)) { mode = "optional_module"; continue; }
    if (mode && /^[A-Z]{2,8}\d{2,5}\s+/.test(line)) {
      fields.push({ field: mode, value: line, sourceUrl, sourcePageTitle: title, sourceText: line.slice(0, 500), retrievedAt: now, confidence: 0.72, verificationStatus: "needs_review" });
    }
  }
  return fields;
}

export async function ingestProgramContent(jobId: string, input: ProgramDiscoveryInput, dependencies: IngestionDependencies) {
  try {
    await updateIngestionJob(jobId, "discovering");
    const sources = await discoverProgramSources(input, dependencies.officialSearch);
    if (!sources.length) {
      await createKnowledgeReview(input.programId, "未找到可信的官方专业页面", { officialDomains: input.officialDomains });
      await updateIngestionJob(jobId, "needs_review", "No official source discovered");
      return { status: "manual_review" as const, fields: 0 };
    }

    await updateIngestionJob(jobId, "fetching");
    const fields: ExtractedProgramField[] = [];
    const acceptedSources: string[] = [];
    let sourceChanged = false;

    for (const source of sources.slice(0, 4)) {
      try {
        if (source.type === "programme_specification_pdf" || source.url.toLowerCase().endsWith(".pdf")) {
          if (!dependencies.pdfExtractor) continue;
          const document = await dependencies.pdfExtractor.extract(source.url);
          const identity = validateProgramIdentity({
            html: document.text,
            universityName: input.universityName,
            programName: input.programName,
            intakeYear: input.intakeYear,
          });
          if (!identity.valid) {
            await createKnowledgeReview(input.programId, "官方 PDF 与目标学校或专业名称无法可靠对应", {
              url: source.url,
              identityConfidence: identity.confidence,
            });
            continue;
          }
          const snapshot = await recordProgramSourceSnapshot({
            programId: input.programId,
            source,
            extractionMethod: "pdf",
            content: document.text,
            pageTitle: document.title,
          });
          sourceChanged ||= snapshot.changed;
          fields.push(...conservativePdfFields(document.text, source.url, document.title));
          acceptedSources.push(source.url);
          continue;
        }

        const response = await fetchOfficialPage(source.url, input.officialDomains);
        if (!response.ok) continue;
        const html = await response.text();
        let finalHtml = html;
        let extractionMethod: "static_html" | "browser_rendered" = "static_html";
        let extracted = extractStaticHtml(html, source.url);
        let identity = validateProgramIdentity({ html, universityName: input.universityName, programName: input.programName, intakeYear: input.intakeYear });

        if (appearsJavascriptDependent(html, extracted.fields.length) && dependencies.browserRenderer) {
          const rendered = await dependencies.browserRenderer.render(source.url);
          finalHtml = rendered.html;
          extractionMethod = "browser_rendered";
          extracted = extractStaticHtml(rendered.html, source.url);
          identity = validateProgramIdentity({ html: rendered.html, universityName: input.universityName, programName: input.programName, intakeYear: input.intakeYear });
        }

        if (!identity.valid) {
          await createKnowledgeReview(input.programId, "官方页面与目标学校或专业名称无法可靠对应", { url: source.url, identityConfidence: identity.confidence });
          continue;
        }
        if (!identity.intakeMatch) {
          for (const field of extracted.fields) field.verificationStatus = "needs_review";
        }
        const snapshot = await recordProgramSourceSnapshot({
          programId: input.programId,
          source,
          extractionMethod,
          content: finalHtml,
          pageTitle: extracted.title,
          httpStatus: response.status,
        });
        sourceChanged ||= snapshot.changed;
        fields.push(...extracted.fields);
        acceptedSources.push(source.url);
      } catch (error) {
        await createKnowledgeReview(input.programId, "官方来源无法自动读取", { url: source.url, error: error instanceof Error ? error.message : "Unknown source error" });
      }
    }

    await updateIngestionJob(jobId, "extracting");
    const unique = [...new Map(fields.map((field) => [`${field.field}:${field.value.toLowerCase()}`, field])).values()];
    await saveExtractedEvidence(input.programId, unique);
    if (sourceChanged) {
      await updateIngestionJob(jobId, "needs_review", "Official source changed; review required before publishing");
      return { status: "manual_review" as const, fields: unique.length };
    }
    if (unique.length < 4 || !acceptedSources.length) {
      await createKnowledgeReview(input.programId, "提取字段不足，不能自动发布专业内容", { fieldCount: unique.length, acceptedSources });
      await updateIngestionJob(jobId, "needs_review", "Insufficient verified fields");
      return { status: "manual_review" as const, fields: unique.length };
    }

    await updateIngestionJob(jobId, "validating");
    const summary = await dependencies.summarizer.summarize({ programName: input.programName, fields: unique });
    const coreModules = unique.filter((field) => field.field === "core_module").flatMap((field) => {
      const module = moduleFromField(field);
      return module ? [module] : [];
    });
    const optionalModules = unique.filter((field) => field.field === "optional_module").flatMap((field) => {
      const module = moduleFromField(field);
      return module ? [module] : [];
    });
    const verifiedFields = unique.filter((field) => field.verificationStatus === "verified");
    const coverageStatus = verifiedFields.length >= 8 && coreModules.length >= 3 ? "verified" as const : "partially_verified" as const;
    const verifiedAt = new Date().toISOString();

    await publishProgramContent({
      programId: input.programId,
      introduction: summary.introduction,
      learningFocus: summary.learningFocus,
      learningOutcomes: summary.learningOutcomes,
      practicalComponents: uniqueValues(unique, "practical_component"),
      careerDirections: summary.careerDirections,
      targetStudents: uniqueValues(unique, "target_students")[0],
      durationOptions: uniqueValues(unique, "duration").map((label) => ({ label })),
      accreditation: uniqueValues(unique, "accreditation"),
      teachingLocation: uniqueValues(unique, "teaching_location")[0],
      teachingFormat: uniqueValues(unique, "teaching_format")[0],
      officialCurriculumUrl: sources.find((source) => source.type === "curriculum_page")?.url,
      modules: [...coreModules, ...optionalModules],
      coverageStatus,
      verifiedAt,
    });

    await markProgramSourcesPublished(input.programId);
    await updateIngestionJob(jobId, "published");
    return { status: coverageStatus, fields: unique.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion failure";
    await updateIngestionJob(jobId, "failed", message);
    await createKnowledgeReview(input.programId, "专业知识采集任务失败", { error: message });
    return { status: "manual_review" as const, fields: 0 };
  }
}
