"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { recommendations } from "@/lib/application-prototype-data";
import { readApplicationRecords, readApplicationSelection } from "@/lib/application-store";
import { formatCNY } from "@/lib/format-currency";
import { servicePricing } from "@/lib/service-pricing";

export function OrderApplicationClient() {
  const params = useSearchParams();
  const service = params.get("service") ?? "single-school";
  const records = useMemo(() => readApplicationRecords(), []);
  const selectedIds = useMemo(() => readApplicationSelection(), []);
  const schools = records.length ? records.map((record) => recommendations.find((school) => school.id === record.schoolRecommendationId)).filter(Boolean) as typeof recommendations : recommendations.filter((school) => selectedIds.includes(school.id));
  const [selected, setSelected] = useState<string[]>(schools.slice(0, 1).map((school) => school.id));
  const price = selected.length * servicePricing.singleSchoolSubmission;
  if (service === "full-service") return <ServiceDetail title="全流程申请服务" price="英国全流程申请：￥1,999 · 澳洲全流程申请：￥1,999 · 法国全流程申请：￥5,999" description="查看国家套餐、人工服务边界和后续服务计划。" />;
  if (service === "consultation") return <ServiceDetail title="一对一留学规划咨询" price="￥299／次" description="人工复核学生背景、国家与专业方向，调整申请优先级。" />;
  return <DashboardShell><div className="space-y-6"><header><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">服务确认</p><h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924]">单校申请递交</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6256]">Atlas 会根据你已确认的学校和材料准备情况协助填写申请系统，正式递交前由你最终确认。</p></header><div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><Card><CardHeader title="选择需要 Atlas 递交的学校" />{schools.length ? <div className="space-y-3">{schools.map((school) => <button key={school.id} type="button" onClick={() => setSelected((items) => items.includes(school.id) ? items.filter((id) => id !== school.id) : [...items, school.id])} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${selected.includes(school.id) ? "border-[#8ea08b] bg-[#e7ece7]" : "border-[#e8dfd3] bg-[#fffaf3]"}`}><span><strong className="block text-[#2f2924]">{school.universityName}</strong><span className="mt-1 block text-sm text-[#6f6256]">{school.programName} · {school.intake}</span></span>{selected.includes(school.id) ? <Check className="text-[#4f6d54]" size={18} /> : null}</button>)}</div> : <p className="text-sm text-[#6f6256]">请先在推荐学校页面确认申请名单。</p>}</Card><Card><CardHeader title="服务方案" /><div className="space-y-4 text-sm text-[#5d5148]"><div className="flex justify-between"><span>单校递交</span><strong>{formatCNY(servicePricing.singleSchoolSubmission)}／学校</strong></div><div className="flex justify-between"><span>已选择</span><strong>{selected.length} 所</strong></div><div className="border-t border-[#e8dfd3] pt-4 flex justify-between text-base"><span>服务费用</span><strong>{formatCNY(price)}</strong></div><p className="rounded-2xl bg-[#f7f0e8] p-4 text-xs leading-5">不包含文书服务、学校申请费、签证、Campus France 或保录取。付款尚未接入，本页面用于确认服务方案。</p><button type="button" disabled={!selected.length} className="w-full rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-[#fffaf3] disabled:opacity-40">确认服务方案 <ArrowRight className="ml-1 inline" size={15} /></button></div></Card></div></div></DashboardShell>;
}

function ServiceDetail({ title, price, description }: { title: string; price: string; description: string }) { return <DashboardShell><Card className="max-w-3xl"><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">服务详情</p><h1 className="mt-3 font-editorial text-5xl font-semibold text-[#2f2924]">{title}</h1><p className="mt-4 text-2xl font-semibold text-[#2f2924]">{price}</p><p className="mt-4 text-base leading-7 text-[#6f6256]">{description}</p><ul className="mt-6 grid gap-3 text-sm text-[#4a3d34] md:grid-cols-2">{["学校要求整理", "材料清单", "申请节点管理", "正式递交前由用户确认", "不包含保录取", "不代替官方决定"].map((item) => <li key={item} className="rounded-xl bg-[#f7f0e8] p-3">✓ {item}</li>)}</ul><button type="button" className="mt-7 rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-[#fffaf3]">确认服务方案</button></Card></DashboardShell>; }
