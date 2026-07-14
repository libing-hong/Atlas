"use client";

import { Copy, ExternalLink, Pencil, PlayCircle, ShieldCheck } from "lucide-react";
import { OfficialResource, PreparedItem } from "@/lib/visual-prototype-data";
import { LT, T, useLanguage } from "../language/LanguageProvider";

const typeLabel: Record<OfficialResource["resourceType"], { en: string; zh: string }> = {
  official_website: { en: "Official website", zh: "官方网站" }, application_form: { en: "Application form", zh: "申请表格" }, appointment: { en: "Appointment", zh: "预约办理" }, download: { en: "Download", zh: "下载文件" }, guidance: { en: "Official guidance", zh: "官方要求" },
};
const methodLabel: Record<OfficialResource["handlingMethod"], { en: string; zh: string }> = { online: { en: "Online", zh: "线上" }, offline: { en: "In person", zh: "线下" }, email: { en: "Email", zh: "邮件" } };
const icons = { Open: ExternalLink, Review: PlayCircle, Copy, Download: ExternalLink, Edit: Pencil };

export function VisaWorkspaceResources({ resources, atlasPrepared, preparedItems }: { resources?: OfficialResource[]; atlasPrepared: string[]; preparedItems: PreparedItem[] }) {
  if (!resources?.length) return null;
  const primary = resources[0];
  const items = preparedItems.length ? preparedItems.slice(0, 4) : atlasPrepared.slice(0, 4).map((title) => ({ title, description: "Prepared for this step", action: "Review" as const }));
  return <section className="mb-6 rounded-[26px] border-2 border-[#d5c2ad] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(88,72,55,0.10)] md:p-6">
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7ece7] text-[#4f6d54]"><ShieldCheck size={21} /></span><div><p className="text-xs uppercase tracking-[0.22em] text-[#8c7a68]"><T en="Official entry" zh="官方办理入口" /></p><h2 className="mt-2 text-2xl font-semibold leading-8 text-[#1f1a17]"><T en="Check what Atlas prepared before opening the official service" zh="先核对 Atlas 已准备的内容，再打开官方服务" /></h2></div></div>
    <div className="mt-6 grid gap-4 xl:grid-cols-[1.12fr_0.88fr]"><PrimaryResource resource={primary} /><PreparedTools items={items} /></div>
  </section>;
}

function PreparedTools({ items }: { items: PreparedItem[] }) {
  const { text } = useLanguage();
  return <div className="rounded-[22px] border border-[#e3d6c8] bg-[#fbf6ef] p-5"><p className="text-xs uppercase tracking-[0.18em] text-[#8c7a68]"><T en="Atlas prepared" zh="Atlas 已准备" /></p><h3 className="mt-2 text-lg font-semibold text-[#2f2924]"><T en="Support for this step" zh="这一步的辅助内容" /></h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item) => { const Icon = icons[item.action]; return <button key={item.title} type="button" className="rounded-[18px] border border-[#d8ccbe] bg-[#fffaf3] p-4 text-left transition hover:border-[#c9b49e]"><span className="flex items-start gap-3"><Icon size={17} className="mt-0.5 shrink-0 text-[#6f856a]" /><span><span className="block text-sm font-semibold text-[#2f2924]">{text(item.title)}</span><span className="mt-1 block text-xs leading-5 text-[#6f6256]">{text(item.description)}</span></span></span></button>; })}</div></div>;
}

function PrimaryResource({ resource }: { resource: OfficialResource }) {
  const { t } = useLanguage();
  return <div className="rounded-[24px] border border-[#c9b49e] bg-[#f8efe5] p-5 md:p-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-[#b8d0b4] bg-[#e7ece7] px-3 py-1 text-xs font-medium text-[#4f6d54]"><T en="Official entry" zh="官方入口" /></span><span className="rounded-full border border-[#d8ccbe] bg-[#fffaf3] px-3 py-1 text-xs text-[#6f6256]">{t(typeLabel[resource.resourceType])}</span></div><p className="mt-6 text-sm font-medium text-[#8c7a68]">{resource.organization}</p><h3 className="mt-2 text-3xl font-semibold leading-tight text-[#1f1a17]"><LT value={resource.title} /></h3><dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><Info label={{ en: "Applies to", zh: "适用地区" }} value={[resource.country, resource.region].filter(Boolean).join(" / ")} /><Info label={{ en: "Method", zh: "办理方式" }} value={t(methodLabel[resource.handlingMethod])} /></dl><a href={resource.url} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3.5 text-sm font-semibold text-[#fffaf3] shadow-[0_12px_28px_rgba(47,41,36,0.22)] transition hover:bg-[#1f1a17] sm:w-auto"><LT value={resource.actionLabel} /><ExternalLink size={16} /></a></div>;
}

function Info({ label, value }: { label: { en: string; zh: string }; value: string }) { return <div><dt className="text-xs uppercase tracking-[0.16em] text-[#9a8b7c]"><T en={label.en} zh={label.zh} /></dt><dd className="mt-1 font-medium leading-6 text-[#2f2924]">{value || "-"}</dd></div>; }
