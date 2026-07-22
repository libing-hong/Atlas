"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Download, FileUp, PlaneTakeoff } from "lucide-react";
import { Card } from "@/components/Card";
import { updateApplicationRecord } from "@/lib/application-store";
import type { ApplicationRecord } from "@/lib/application-prototype-data";
import { saveMaterialFile } from "@/lib/material-repository";

const statusCopy = { offer_received: "已录取", waiting_result: "等待结果", waitlisted: "候补名单", rejected: "未录取" } as const;

export function AdmissionResultsClient({ records }: { records: ApplicationRecord[] }) {
  const [items, setItems] = useState(records);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasOfferEvidence = items.some((item) => item.decisionStatus === "offer_received" && item.offerEvidenceAvailable);

  async function uploadOffer(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const target = items.find((item) => item.id === uploadTarget);
    if (!file || !target) return;
    await saveMaterialFile(file, "other", target.id);
    updateApplicationRecord(target.id, { status: "offer_received", decisionStatus: "offer_received", offerSource: "student", offerEvidenceAvailable: true, offerFileName: file.name, applicationProgress: 100, nextAction: "准备签证材料" });
    setItems((current) => current.map((item) => item.id === target.id ? { ...item, status: "offer_received", decisionStatus: "offer_received", offerSource: "student", offerEvidenceAvailable: true, offerFileName: file.name, applicationProgress: 100, nextAction: "准备签证材料" } : item));
    event.target.value = "";
  }

  function downloadAtlasOffer(record: ApplicationRecord) {
    const content = `Atlas 录取通知书同步副本\n\n学校：${record.universityName}\n专业：${record.programName}\n入学时间：${record.intake}\n\n本文件用于原型流程验证，请以学校签发的正式原件为准。`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = record.offerFileName ?? `${record.universityName}-Offer-Letter.txt`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="space-y-4">
    <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="sr-only" onChange={(event) => { void uploadOffer(event); }} />
    <div><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">录取进展</p><h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">全部学校申请结果</h2><p className="mt-2 text-sm leading-6 text-[#6f6256]">所有已申请学校会同时显示，方便统一核对录取结果和通知书。</p></div>
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((record) => { const status = record.decisionStatus ?? "waiting_result"; const offered = status === "offer_received"; const managed = record.offerSource === "atlas" || record.serviceType !== "none"; return <Card key={record.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-[#8f847a]">{record.country} · {record.intake}</p><h3 className="mt-1 text-lg font-semibold text-[#2f2924]">{record.universityName}</h3><p className="mt-1 text-sm text-[#6f6256]">{record.programName}</p></div><span className={`rounded-full border px-3 py-1 text-xs ${offered ? "border-[#c9dbc5] bg-[#e7ece7] text-[#4f6d54]" : "border-[#d8ccbe] bg-[#f7f0e8] text-[#6f6256]"}`}>{statusCopy[status]}</span></div><div className="mt-5 border-t border-[#e8dfd3] pt-4">{offered ? <>{managed ? <p className="flex items-center gap-2 text-sm text-[#4f6d54]"><CheckCircle2 size={16} />Atlas 服务已同步录取结果与通知书</p> : <p className="text-sm text-[#5d5148]">你选择了自行提交，请上传学校签发的录取通知书。</p>}{record.offerEvidenceAvailable ? <div className="mt-3"><p className="text-xs text-[#8f847a]">通知书：{record.offerFileName}</p>{managed ? <button type="button" onClick={() => downloadAtlasOffer(record)} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#4f6d54] underline underline-offset-4"><Download size={15} />下载录取通知书</button> : <p className="mt-2 text-sm font-medium text-[#4f6d54]">录取通知书已保存到材料中心</p>}</div> : <button type="button" onClick={() => { setUploadTarget(record.id); inputRef.current?.click(); }} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-white"><FileUp size={15} />上传录取通知书</button>}</> : <p className="flex items-center gap-2 text-sm text-[#6f6256]"><Clock3 size={16} />学校结果尚未公布，Atlas 会继续保留该申请进展。</p>}</div></Card>; })}
    </div>
      {hasOfferEvidence ? <Card className="border border-[#c9dbc5] bg-[#f0f5ef] p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><PlaneTakeoff className="mt-1 shrink-0 text-[#5f805f]" /><div><h3 className="font-semibold text-[#36573c]">录取凭证已完成，签证阶段已解锁</h3><p className="mt-1 text-sm text-[#58705b]">Atlas 将使用录取学校、专业和入学时间生成对应的签证材料清单。</p></div></div><Link href="/dashboard/visa" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#5f805f] px-5 py-3 text-sm text-white">进入签证材料准备</Link></div></Card> : null}
  </section>;
}
