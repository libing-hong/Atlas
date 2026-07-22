"use client";

import { ChangeEvent, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, FileUp, Lock, PlaneTakeoff } from "lucide-react";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { getApplicationStateSnapshot, getServerApplicationStateSnapshot, subscribeToApplicationState } from "@/lib/application-store";
import type { ApplicationRecord } from "@/lib/application-prototype-data";
import { listStoredMaterials, saveMaterialFile } from "@/lib/material-repository";
import type { MaterialKind } from "@/lib/material-recognition";

type VisaItem = { id: string; title: string; description: string; kind: MaterialKind };
const visaItems: VisaItem[] = [
  { id: "passport", title: "护照扫描件", description: "确认有效期覆盖预计停留时间。", kind: "identity" },
  { id: "offer", title: "录取通知书", description: "已从录取阶段自动关联。", kind: "other" },
  { id: "finance", title: "资金证明", description: "具体金额和持有时间以目的地官方规则为准。", kind: "other" },
  { id: "accommodation", title: "住宿或地址证明", description: "部分签证流程会在递交或抵达阶段要求。", kind: "other" },
];

export function VisaHomeClient() {
  const snapshot = useSyncExternalStore(subscribeToApplicationState, getApplicationStateSnapshot, getServerApplicationStateSnapshot);
  const records = snapshot === "server" ? [] : (JSON.parse(snapshot) as { records: ApplicationRecord[] }).records;
  const offers = records.filter((record) => record.status === "offer_received" && record.offerEvidenceAvailable);
  const [stored, setStored] = useState(() => listStoredMaterials());
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const [target, setTarget] = useState<VisaItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedOffer = offers[0];

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !target) return;
    await saveMaterialFile(file, target.kind, selectedOffer?.id);
    setStored(listStoredMaterials()); setUploaded((current) => ({ ...current, [target.id]: file.name })); event.target.value = "";
  }
  if (!selectedOffer) return <DashboardShell><Card className="mx-auto max-w-2xl p-7 text-center"><Lock className="mx-auto text-[#8f847a]" /><h1 className="mt-4 font-editorial text-4xl font-semibold text-[#2f2924]">我的签证尚未解锁</h1><p className="mt-3 text-sm leading-6 text-[#6f6256]">收到录取结果并完成录取通知书同步后，Atlas 才会生成签证材料入口。</p><Link href="/dashboard/applications" className="mt-5 inline-flex rounded-full bg-[#2f2924] px-5 py-3 text-sm text-white">返回我的申请</Link></Card></DashboardShell>;

  const passport = stored.find((item) => item.kind === "identity");
  return <DashboardShell><div className="space-y-6">
    <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="sr-only" onChange={(event) => { void upload(event); }} />
    <header><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Visa workspace</p><h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924] md:text-6xl">我的签证</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6256]">根据已确认的录取信息集中准备签证材料。最终要求仍以目的地主管机关公布的规则为准。</p></header>
    <Card className="border border-[#c9dbc5] bg-[#f0f5ef] p-5 md:p-6"><div className="flex gap-3"><PlaneTakeoff className="mt-1 shrink-0 text-[#5f805f]" /><div><p className="text-xs uppercase tracking-[0.2em] text-[#6f856a]">用于本次签证准备的录取</p><h2 className="mt-2 text-xl font-semibold text-[#2f2924]">{selectedOffer.universityName}</h2><p className="mt-1 text-sm text-[#5d5148]">{selectedOffer.programName} · {selectedOffer.intake}</p><p className="mt-2 text-xs text-[#6f856a]">录取通知书已关联：{selectedOffer.offerFileName}</p></div></div></Card>
    <Card><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">签证材料</p><h2 className="mt-2 font-editorial text-3xl font-semibold text-[#2f2924]">准备清单</h2></div><span className="text-xs text-[#8f847a]">已关联材料中心中的可复用文件</span></div><div className="mt-5 grid gap-3 md:grid-cols-2">{visaItems.map((item) => { const automatic = item.id === "offer" || (item.id === "passport" && passport); const fileName = item.id === "offer" ? selectedOffer.offerFileName : item.id === "passport" ? passport?.name : uploaded[item.id]; const ready = Boolean(automatic || fileName); return <article key={item.id} className={`rounded-2xl border p-4 ${ready ? "border-[#c9dbc5] bg-[#e7ece7]" : "border-[#e8dfd3] bg-[#fffaf3]"}`}><div className="flex items-start gap-3">{ready ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#5f805f]" /> : <FileUp size={18} className="mt-0.5 shrink-0 text-[#9a6257]" />}<div><h3 className="font-medium text-[#2f2924]">{item.title}</h3><p className="mt-1 text-sm leading-6 text-[#6f6256]">{item.description}</p>{fileName ? <p className="mt-2 text-xs text-[#4f6d54]">文件：{fileName}</p> : null}</div></div>{!ready ? <button type="button" onClick={() => { setTarget(item); inputRef.current?.click(); }} className="mt-3 rounded-full border border-[#d8ccbe] px-4 py-2 text-xs text-[#4a3d34]">上传到材料中心</button> : null}</article>; })}</div></Card>
    <Card className="p-5 md:p-6"><h2 className="font-editorial text-3xl font-semibold text-[#2f2924]">官方办理入口</h2><p className="mt-2 text-sm leading-6 text-[#6f6256]">Atlas 不会代替主管机关作出签证判断，请在正式递交前再次核对官方材料要求。</p><OfficialVisaLink country={selectedOffer.country} /></Card>
  </div></DashboardShell>;
}

function OfficialVisaLink({ country }: { country: string }) { const france = country === "法国" || country === "FR"; const href = france ? "https://france-visas.gouv.fr/" : "https://www.gov.uk/student-visa"; const label = france ? "France-Visas 官方学生签证入口" : "UK Government Student visa 官方入口"; return <a href={href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#4f6d54] underline underline-offset-4">{label}<ExternalLink size={15} /></a>; }
