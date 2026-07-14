"use client";

import { useState } from "react";
import { FileUp, ShieldCheck } from "lucide-react";

export function SensitiveUploadPanel() {
  const [consented, setConsented] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section className="rounded-[22px] border-2 border-[#d5c2ad] bg-[#fffaf3] p-5 md:p-6">
      <div className="flex gap-3"><ShieldCheck size={21} className="mt-1 shrink-0 text-[#6f856a]" /><div><p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">敏感文件上传说明</p><h2 className="mt-2 text-xl font-semibold text-[#2f2924]">上传前先了解 Atlas 会如何处理</h2></div></div>
      <div className="mt-5 grid gap-3 text-sm leading-6 text-[#5d5148] md:grid-cols-2">
        <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="font-semibold text-[#2f2924]">为什么需要</p><p className="mt-1">用于识别材料状态、生成材料清单和提供办理辅助。</p></div>
        <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="font-semibold text-[#2f2924]">会读取什么</p><p className="mt-1">姓名、学校、项目、日期、地址和与当前申请相关的字段。</p></div>
        <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="font-semibold text-[#2f2924]">不会读取或保存什么</p><p className="mt-1">Atlas 将尽量屏蔽 IBAN、银行卡号、签证号码等非必要敏感信息。</p></div>
        <div className="rounded-2xl bg-[#f7f0e8] p-4"><p className="font-semibold text-[#2f2924]">保存与第三方处理</p><p className="mt-1">保存期限：待确认。第三方 AI、OCR、云服务和跨境处理：待配置，未完成配置前不默认发送真实文件。</p></div>
      </div>
      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8ccbe] bg-[#fbf6ef] p-3 text-sm text-[#4a3d34]">
        <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} className="h-4 w-4 accent-[#2f2924]" />
        <span>我已了解 Atlas 将识别该文件中的身份及申请信息，仅用于生成材料清单、核验任务状态和提供办理辅助。</span>
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className={consented ? "inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-[#fffaf3]" : "inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-[#d8ccbe] px-4 py-2.5 text-sm text-[#8f847a]"}>
          <FileUp size={16} /> 选择文件
          <input type="file" accept="image/*,.pdf,.eml,.msg,.txt" disabled={!consented} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFileName(file.name); setMessage("授权记录已在原型中生成，正式保存方式待配置。"); } }} />
        </label>
        <button type="button" onClick={() => { setFileName(""); setMessage("文件已从当前原型选择中移除。"); }} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]">删除文件</button>
        {fileName ? <span className="text-sm text-[#4f6d54]">已选择：{fileName}</span> : null}
      </div>
      {message ? <p className="mt-3 text-xs text-[#6f856a]">{message}</p> : null}
    </section>
  );
}
