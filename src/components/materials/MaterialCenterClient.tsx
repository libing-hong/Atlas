"use client";

import { useEffect, useMemo, useState } from "react";
import { FilePlus2, ShieldCheck, Upload } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { T, useLanguage } from "@/components/language/LanguageProvider";
import { MaterialCategory, MaterialDocument } from "@/lib/visual-prototype-data";
import { cn } from "@/lib/utils";
import { confirmRecognizedMaterial, recognizeMaterial, type MaterialKind, type RecognizedMaterial } from "@/lib/material-recognition";
import { SensitiveUploadPanel } from "./SensitiveUploadPanel";
import { listStoredMaterials, saveMaterialFile, subscribeMaterialLibrary, type StoredMaterial } from "@/lib/material-repository";
import { MaterialPreviewDialog } from "./MaterialPreviewDialog";

export function MaterialCenterClient({
  categories,
  documents,
  readiness,
}: {
  categories: MaterialCategory[];
  documents: MaterialDocument[];
  readiness: { ready: number; total: number; missing: number; expiring: number };
}) {
  const [category, setCategory] = useState("All");
  const [uploadMessage, setUploadMessage] = useState("");
  const [recognized, setRecognized] = useState<RecognizedMaterial | null>(null);
  const [storedMaterials, setStoredMaterials] = useState<StoredMaterial[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<StoredMaterial | null>(null);
  const { t, text } = useLanguage();
  const filteredDocuments = useMemo(
    () => (category === "All" ? documents : documents.filter((document) => document.category === category)),
    [category, documents],
  );
  const readinessValue = Math.round((readiness.ready / readiness.total) * 100);
  useEffect(() => { const refresh = () => setStoredMaterials(listStoredMaterials()); refresh(); return subscribeMaterialLibrary(refresh); }, []);

  return (
    <div className="space-y-6">
      <SensitiveUploadPanel />
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader title={<T en="Document Readiness Summary" zh="文件准备度总览" />} />
          <p className="font-editorial text-6xl font-semibold">{readinessValue}%</p>
          <ProgressBar value={readinessValue} className="mt-4" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Summary label={{ en: "Ready", zh: "已就绪" }} value={`${readiness.ready}/${readiness.total}`} />
            <Summary label={{ en: "Missing", zh: "缺失" }} value={readiness.missing.toString()} />
            <Summary label={{ en: "Expired", zh: "已过期" }} value={readiness.expiring.toString()} />
          </div>
        </Card>

        <Card>
          <CardHeader title={<T en="Priority Uploads" zh="优先上传" />} />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              [
                t({ en: "Upload CV", zh: "上传 CV" }),
                t({ en: "Keep a current version for school and visa tasks.", zh: "为学校申请和签证任务保留最新版简历。" }),
                "cv",
              ],
              [
                t({ en: "Upload Personal Statement", zh: "上传个人陈述" }),
                t({ en: "Atlas can link it to application readiness.", zh: "Atlas 可以把它关联到申请准备度。" }),
                "personal_statement",
              ],
              [
                t({ en: "Add Recommendation Letter", zh: "添加推荐信" }),
                t({ en: "Track recommenders and letter status.", zh: "追踪推荐人和推荐信状态。" }),
                "recommendation",
              ],
            ].map(([title, description, hint]) => (
              <label
                key={title}
                className="cursor-pointer rounded-[20px] border border-[#d8ccbe] bg-[#f7f0e8] p-4 text-left transition hover:bg-[#fffaf3]"
              >
                <Upload size={18} className="text-[#8ea08b]" />
                <span className="mt-3 block text-sm font-semibold text-[#2f2924]">{title}</span>
                <span className="mt-2 block text-sm leading-6 text-[#6f6256]">{description}</span>
                <span className="mt-3 block text-xs uppercase tracking-[0.18em] text-[#6f856a]">
                  <T en="Choose test file" zh="选择测试文件" />
                </span>
                <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void recognizeMaterial(file, hint as MaterialKind).then(async (result) => { await saveMaterialFile(file, result.kind); setRecognized(result); setUploadMessage(`${title} 已完成材料分类并保存到当前浏览器的材料库，请确认识别结果。`); }); event.target.value = ""; }} />
              </label>
            ))}
          </div>
          {uploadMessage ? <p role="status" className="mt-4 rounded-xl bg-[#eef4ed] p-3 text-sm text-[#4f6d54]">{uploadMessage}</p> : null}
          {recognized ? <div className="mt-4 rounded-2xl border border-[#d8ccbe] bg-[#fffaf3] p-4"><p className="font-semibold text-[#2f2924]">识别结果</p><ul className="mt-2 space-y-1 text-sm text-[#5d5148]">{recognized.summary.map((item) => <li key={item}>· {item}</li>)}</ul><button type="button" onClick={() => { confirmRecognizedMaterial(recognized); setUploadMessage("识别结果已写入学生 Profile 和材料记录，相关申请会读取最新信息。"); setRecognized(null); }} className="mt-3 rounded-full bg-[#5f805f] px-4 py-2 text-sm text-white">确认并写入系统</button></div> : null}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6">
          {storedMaterials.length ? <Card><CardHeader title={<T en="Uploaded Material Library" zh="已上传材料库" />} /><p className="mb-4 text-sm text-[#6f6256]">这些文件可在不同学校的申请中直接选择复用。</p><div className="grid gap-3 lg:grid-cols-2">{storedMaterials.map((material) => <article key={material.id} className="rounded-2xl border border-[#c9dbc5] bg-[#e7ece7] p-4"><p className="truncate font-medium text-[#2f2924]">{material.name}</p><p className="mt-1 text-xs text-[#6f6256]">{material.kind} · {(material.size / 1024).toFixed(1)} KB</p><button type="button" onClick={() => setPreviewMaterial(material)} className="mt-3 text-xs text-[#4f6d54] underline underline-offset-4">预览材料</button></article>)}</div></Card> : null}
          <Card>
            <CardHeader title={<T en="Categories" zh="文件分类" />} />
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setCategory("All")}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm",
                  category === "All" ? "bg-[#2f2924] text-[#fffaf3]" : "bg-[#f7f0e8] text-[#4a3d34]",
                )}
              >
                <span>
                  <T en="All Documents" zh="全部文件" />
                </span>
                <span>{documents.length}</span>
              </button>
              {categories.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setCategory(item.name)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm",
                    category === item.name ? "bg-[#2f2924] text-[#fffaf3]" : "bg-[#f7f0e8] text-[#4a3d34]",
                  )}
                >
                  <span>{text(item.name)}</span>
                  <span>
                    {item.ready}/{item.total}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={<T en="Privacy Notice" zh="隐私提示" />} />
            <div className="flex gap-3 text-sm leading-6 text-[#5d5148]">
              <ShieldCheck size={20} className="mt-1 shrink-0 text-[#8ea08b]" />
              <p>
                <T
                  en="Phase 0.5 uses development seed documents only. Production upload, retention, redaction, and deletion workflows are intentionally paused until visual validation is complete."
                  zh="Phase 0.5 仅使用开发种子文件。正式上传、保留、脱敏和删除流程会在视觉验证完成后再实施。"
                />
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={category === "All" ? <T en="All Documents" zh="全部文件" /> : text(category)} />
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          </Card>
        </div>
      </section>
      {previewMaterial ? <MaterialPreviewDialog material={previewMaterial} onClose={() => setPreviewMaterial(null)} /> : null}
    </div>
  );
}

function DocumentCard({ document }: { document: MaterialDocument }) {
  const { text } = useLanguage();

  return (
    <article className="rounded-[20px] border border-[#e8dfd3] bg-[#f7f0e8] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">{text(document.category)}</p>
          <h3 className="mt-2 text-base font-semibold text-[#2f2924]">{text(document.name)}</h3>
        </div>
        <StatusBadge status={document.status} />
      </div>
      <dl className="mt-5 space-y-2 text-sm">
        <Row label={{ en: "Upload", zh: "上传时间" }} value={document.uploadDate} />
        <Row label={{ en: "Used by", zh: "用于" }} value={document.usedBy} />
        <Row label={{ en: "Verification", zh: "验证级别" }} value={document.verificationLevel} />
        <Row label={{ en: "Expiry", zh: "有效期" }} value={document.expiry} />
      </dl>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e8dfd3] pt-4">
        {document.actions.map((action) => (
          <button
            key={action}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8ccbe] px-3 py-2 text-xs text-[#4a3d34]"
          >
            <FilePlus2 size={13} />
            {text(action)}
          </button>
        ))}
      </div>
    </article>
  );
}

function Row({ label, value }: { label: { en: string; zh: string }; value: string }) {
  const { text } = useLanguage();

  return (
    <div className="flex justify-between gap-4 border-b border-[#e8dfd3] pb-2 last:border-0">
      <dt className="text-[#8f847a]">
        <T en={label.en} zh={label.zh} />
      </dt>
      <dd className="text-right text-[#3d342d]">{text(value)}</dd>
    </div>
  );
}

function Summary({ label, value }: { label: { en: string; zh: string }; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7f0e8] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">
        <T en={label.en} zh={label.zh} />
      </p>
      <p className="mt-2 text-xl font-semibold text-[#2f2924]">{value}</p>
    </div>
  );
}
