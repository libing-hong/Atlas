import "server-only";
import { detectUnmappedRuleRows, PrivateSheetParserRegistry } from "./registry";
import type { PrivateAdmissionImportRepository, PrivateImportIssue, PrivateWorkbookAdapter } from "./types";

function isDirectorySheet(index: number, name: string) {
  return index === 0 && /(?:目录|index|contents?)/i.test(name);
}

export async function importPrivateAdmissionWorkbook(input: {
  workbook: PrivateWorkbookAdapter;
  repository: PrivateAdmissionImportRepository;
  registry: PrivateSheetParserRegistry;
}) {
  const sheets = await input.workbook.listSheets();
  const jobId = await input.repository.begin({
    sourceName: input.workbook.sourceName,
    sourceHash: input.workbook.sourceHash,
    sheetCount: sheets.length,
  });

  let importedRules = 0;
  let skippedSheets = 0;
  const issues: PrivateImportIssue[] = [];

  try {
    for (const descriptor of sheets) {
      if (isDirectorySheet(descriptor.index, descriptor.name)) {
        skippedSheets += 1;
        continue;
      }

      const sheet = await input.workbook.readSheet(descriptor.index);
      const parser = input.registry.resolve(sheet);
      if (!parser) {
        issues.push({
          sheetName: sheet.name,
          code: "parser_missing",
          summary: "该工作表结构尚无可靠解析器，已转入人工核实，未写入录取规则。",
        });
        issues.push(...detectUnmappedRuleRows(sheet));
        continue;
      }

      const sourceReference = `${input.workbook.sourceHash}:${descriptor.index}:${parser.id}`;
      const result = await parser.parse(sheet, sourceReference);
      const safeRules = result.rules.map((rule) => ({
        ...rule,
        confidential: true as const,
        verificationStatus: rule.verificationStatus === "partner_reference"
          ? "needs_official_check" as const
          : rule.verificationStatus,
      }));
      await input.repository.saveRules(jobId, safeRules);
      importedRules += safeRules.length;
      issues.push(...result.issues);
    }

    if (issues.length) await input.repository.saveIssues(jobId, issues);
    await input.repository.complete(jobId, {
      importedRules,
      reviewIssues: issues.length,
      skippedSheets,
    });
    return { importedRules, reviewIssues: issues.length, skippedSheets };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown private workbook import failure";
    await input.repository.fail(jobId, message);
    throw error;
  }
}
