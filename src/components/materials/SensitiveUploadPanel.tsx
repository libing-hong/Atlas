"use client";

import { useState } from "react";
import { FileUp, ShieldCheck } from "lucide-react";
import { confirmRecognizedMaterial, recognizeMaterial, type RecognizedMaterial } from "@/lib/material-recognition";

export function SensitiveUploadPanel() {
  const serverUploadsEnabled = process.env.NEXT_PUBLIC_SENSITIVE_UPLOADS_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [consented, setConsented] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [recognized, setRecognized] = useState<RecognizedMaterial | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function selectFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);
    const result = await recognizeMaterial(file);
    setRecognized(result);
    setAnalyzing(false);
    if (serverUploadsEnabled) {
      setMessage("文件已选择，等待进入私有存储上传流程。");
      return;
    }
    window.localStorage.setItem("atlas.prototype.material-selection.v1", JSON.stringify({ name: file.name, size: file.size, selectedAt: new Date().toISOString() }));
    setMessage("识别已完成。确认识别结果后，Atlas 才会写入学生资料和材料状态；文件内容没有上传到服务器。");
  }

  return (
    <section className="rounded-[22px] border-2 border-[#d5c2ad] bg-[#fffaf3] p-5 md:p-6">
      <div className="flex gap-3"><ShieldCheck size={21} className="mt-1 shrink-0 text-[#6f856a]" /><div><p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">敏感文件上传说明</p><h2 className="mt-2 text-xl font-semibold text-[#2f2924]">上传前先了解 Atlas 会如何处理</h2></div></div>
      <div className="mt-5 grid gap-3 text-sm leading-6 text-[#5d5148] md:grid-cols-2">
        <Info title="为什么需要">用于识别材料状态、生成材料清单和提供办理辅助。</Info>
        <Info title="会读取什么">姓名、学校、项目、日期、地址和与当前申请相关的字段。</Info>
        <Info title="不会读取或保存什么">Atlas 将尽量屏蔽 IBAN、银行卡号、签证号码等非必要敏感信息。</Info>
        <Info title="保存与第三方处理">保存期限与第三方处理仍待正式配置；Prototype Mode 不会发送文件内容。</Info>
      </div>
      {!serverUploadsEnabled ? <p className="mt-5 rounded-xl bg-[#fbf2df] p-3 text-sm text-[#7b6541]">Prototype Mode：可选择任意测试文件来模拟材料流程；浏览器只记录文件名称、大小和状态，不上传文件内容。请不要使用真实护照、签证、成绩单或资金证明。</p> : null}
      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8ccbe] bg-[#fbf6ef] p-3 text-sm text-[#4a3d34]">
        <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} className="h-4 w-4 accent-[#2f2924]" />
        <span>我已了解 Atlas 将识别该文件中的身份及申请信息，仅用于生成材料清单、核验任务状态和提供办理辅助。</span>
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className={consented ? "inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-[#fffaf3]" : "inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-[#d8ccbe] px-4 py-2.5 text-sm text-[#8f847a]"}>
          <FileUp size={16} /> 选择文件
          <input type="file" accept="image/*,.pdf,.eml,.msg,.txt,.csv,.doc,.docx" disabled={!consented || analyzing} className="sr-only" onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        <button type="button" onClick={() => { setFileName(""); setRecognized(null); window.localStorage.removeItem("atlas.prototype.material-selection.v1"); setMessage("当前模拟文件记录已删除。"); }} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]">删除文件</button>
        {fileName ? <span className="text-sm text-[#4f6d54]">已选择：{fileName}</span> : null}
      </div>
      {message ? <p role="status" className="mt-3 text-xs text-[#6f856a]">{message}</p> : null}
      {recognized ? <div className="mt-4 rounded-2xl border border-[#d8ccbe] bg-[#f7f0e8] p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-semibold text-[#2f2924]">识别结果 · {recognized.confidence === "high" ? "高置信度" : recognized.confidence === "medium" ? "需要确认" : "信息不足"}</p><ul className="mt-2 space-y-1 text-sm text-[#5d5148]">{recognized.summary.map((item) => <li key={item}>· {item}</li>)}</ul></div><button type="button" onClick={() => { confirmRecognizedMaterial(recognized); setMessage("识别结果已确认，并已同步到学生 Profile 与材料记录。"); setRecognized(null); }} className="shrink-0 rounded-full bg-[#5f805f] px-4 py-2.5 text-sm text-white">确认并写入系统</button></div></div> : null}
    </section>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="font-semibold text-[#2f2924]">{title}</p><p className="mt-1">{children}</p></div>;
}
