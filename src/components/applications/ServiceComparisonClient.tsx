"use client";

import { useSyncExternalStore, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { recommendations } from "@/lib/application-prototype-data";
import {
  ApplicationMode,
  ApplicationRecord,
  createApplicationSubmissionOrder,
  createFixedServiceOrder,
  getApplicationStateSnapshot,
  getPaidSubmissionApplicationIds,
  getServerApplicationStateSnapshot,
  subscribeToApplicationState,
  writeApplicationMode,
} from "@/lib/application-store";
import { formatCNY, formatCNYFromFen } from "@/lib/format-currency";
import { servicePricing } from "@/lib/service-pricing";

type Action = "diy" | "submission" | "advisor" | "full_uk_au" | "full_france";

export function ServiceComparisonClient() {
  const router = useRouter();
  const snapshot = useSyncExternalStore(subscribeToApplicationState, getApplicationStateSnapshot, getServerApplicationStateSnapshot);
  const state = snapshot === "server" ? { records: [] as ApplicationRecord[], selection: [] as string[], mode: "unselected" as ApplicationMode } : JSON.parse(snapshot) as { records: ApplicationRecord[]; selection: string[]; mode: ApplicationMode };
  const records = state.records;
  const selectedSchools = recommendations.filter((school) => state.selection.includes(school.id));
  const countries = new Set(records.length ? records.map((record) => record.country) : selectedSchools.map((school) => school.country));
  const hasUkAu = ["英国", "澳洲", "GB", "AU"].some((country) => countries.has(country));
  const hasFrance = ["法国", "FR"].some((country) => countries.has(country));
  const paidIds = getPaidSubmissionApplicationIds();
  const eligibleRecords = records.filter((record) => record.serviceType !== "single_school" && !paidIds.has(record.id));
  const submissionTotalFen = eligibleRecords.length * servicePricing.singleSchoolSubmissionFen;
  const [loading, setLoading] = useState<Action | null>(null);
  const [error, setError] = useState("");

  async function proceed(action: Action) {
    if (loading) return;
    setLoading(action);
    setError("");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      if (action === "diy") {
        writeApplicationMode("DIY");
        router.push(records[0] ? `/applications/${records[0].id}/materials` : "/applications/recommendations");
        return;
      }
      if (action === "submission") {
        const order = createApplicationSubmissionOrder(records);
        if (!order.items.length) throw new Error("no eligible applications");
        router.push("/checkout/application-submission");
        return;
      }
      if (action === "advisor") {
        createFixedServiceOrder("advisor_consultation", records);
        router.push("/checkout/advisor-consultation");
        return;
      }
      if (action === "full_france") {
        createFixedServiceOrder("full_service_france", records.filter((record) => record.country === "法国" || record.country === "FR"));
        router.push("/checkout/full-service?country=france");
        return;
      }
      createFixedServiceOrder("full_service_uk_au", records.filter((record) => ["英国", "澳洲", "GB", "AU"].includes(record.country)));
      router.push("/checkout/full-service?country=uk-au");
    } catch {
      setError(action === "submission" ? "当前学校均已购买代递交服务，或尚未创建正式申请记录。" : "暂时无法创建订单，请重新尝试。");
      setLoading(null);
    }
  }

  return <DashboardShell><div className="space-y-6 pb-16">
    <header>
      <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">申请方式</p>
      <h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924] md:text-6xl">选择如何完成申请</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6256]">你可以自己完成申请，也可以选择 Atlas 的递交、规划或全流程服务。</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#5d5148]"><span className="rounded-full bg-[#f7f0e8] px-3 py-2">已确认 {records.length} 所学校</span>{paidIds.size ? <span className="rounded-full bg-[#e7ece7] px-3 py-2 text-[#4f6d54]">已购买代递交 {paidIds.size} 所</span> : null}</div>
    </header>

    {error ? <div role="alert" className="rounded-2xl border border-[#e7d0c7] bg-[#f6e7df] p-4 text-sm text-[#8a5f54]">{error}</div> : null}

    <div className="grid gap-5 xl:grid-cols-2">
      <ServiceCard title="自己准备申请" price="免费" description="使用 Atlas 整理的学校要求、材料清单和申请步骤，由你自己填写并递交。" items={["学校要求对照", "申请材料清单", "可复用材料关联", "官方申请入口", "字段说明", "截止日期提醒"]} action={<ActionButton loading={loading === "diy"} disabled={Boolean(loading)} onClick={() => proceed("diy")} label="开始自己申请" />} />
      <ServiceCard id="submission" featured title="交给 Atlas 递交" price="￥29.9／学校" description="Atlas 根据你确认的信息填写申请系统、上传材料，并在你最终确认后完成递交。" items={["填写学校申请系统", "上传已准备材料", "递交前信息整理", "用户最终确认后递交"]} extra={<><p>本次待购买：{eligibleRecords.length} 所学校</p><p className="font-semibold text-[#2f2924]">订单金额：{formatCNYFromFen(submissionTotalFen)}</p>{paidIds.size ? <p>已有 {paidIds.size} 所学校开通，本次不重复计费。</p> : null}</>} action={<ActionButton dark loading={loading === "submission"} disabled={Boolean(loading) || !eligibleRecords.length} onClick={() => proceed("submission")} label={eligibleRecords.length === 1 ? `购买单校递交服务 ${formatCNYFromFen(submissionTotalFen)}` : `购买 ${eligibleRecords.length} 所学校递交服务 ${formatCNYFromFen(submissionTotalFen)}`} />} />
      <ServiceCard id="advisor" title="一对一留学规划" price="￥299／次" description="由顾问进一步复核你的背景、学校组合、申请方向和申请优先级。" items={["人工复核学生背景", "调整学校组合", "确认专业方向", "识别申请重点", "制定申请优先顺序", "回答个性化问题"]} action={<ActionButton loading={loading === "advisor"} disabled={Boolean(loading)} onClick={() => proceed("advisor")} label="预约一对一留学规划 ￥299" />} />
      <Card className="p-5 md:p-6"><p className="text-sm text-[#8f847a]">全流程留学服务</p><h2 className="mt-2 text-2xl font-semibold text-[#2f2924]">从规划到后续跟进</h2><p className="mt-3 text-sm leading-6 text-[#6f6256]">覆盖规划、选校、申请递交、签证材料准备和后续事项。国家套餐不会自动合并计费。</p><div className="mt-5 space-y-4">{hasUkAu || (!hasUkAu && !hasFrance) ? <FullOption id="full-uk-au" title="英国／澳洲全流程" price={formatCNY(servicePricing.fullServiceUkAu)} description="覆盖当前英国和澳洲申请" note="不包含学校申请费、签证官方费用及其他第三方官方收费。" button={<ActionButton loading={loading === "full_uk_au"} disabled={Boolean(loading)} onClick={() => proceed("full_uk_au")} label="选择英国／澳洲全流程 ￥4,999" />} /> : null}{hasFrance || (!hasUkAu && !hasFrance) ? <FullOption id="full-france" title="法国商学院全流程" price={formatCNY(servicePricing.fullServiceFrance)} description="覆盖规划、学校申请、Campus France、面试及签证材料准备" note="不包含学校申请费、签证官方费用及其他第三方官方收费。" button={<ActionButton loading={loading === "full_france"} disabled={Boolean(loading)} onClick={() => proceed("full_france")} label="选择法国全流程 ￥6,999" />} /> : null}</div></Card>
    </div>
  </div></DashboardShell>;
}

function ServiceCard({ id, title, price, description, items, extra, action, featured = false }: { id?: string; title: string; price: string; description: string; items: string[]; extra?: React.ReactNode; action: React.ReactNode; featured?: boolean }) {
  return <Card className={`p-5 md:p-6 ${featured ? "border-2 border-[#2f2924]" : ""}`}><div id={id}><p className="text-sm text-[#8f847a]">{title}</p><p className="mt-2 text-3xl font-semibold text-[#2f2924]">{price}</p><p className="mt-3 text-sm leading-6 text-[#6f6256]">{description}</p>{extra ? <div className="mt-4 rounded-2xl bg-[#f7f0e8] p-4 text-sm leading-6 text-[#5d5148]">{extra}</div> : null}<ul className="mt-5 grid gap-2 text-sm text-[#4a3d34] sm:grid-cols-2">{items.map((item) => <li key={item} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#5f805f]" />{item}</li>)}</ul><div className="mt-6">{action}</div></div></Card>;
}

function FullOption({ id, title, price, description, note, button }: { id: string; title: string; price: string; description: string; note: string; button: React.ReactNode }) {
  return <div id={id} className="rounded-2xl border border-[#e8dfd3] p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h3 className="font-semibold text-[#2f2924]">{title}</h3><p className="mt-1 text-sm text-[#6f6256]">{description}</p></div><strong className="text-xl text-[#2f2924]">{price}</strong></div><p className="mt-3 text-xs leading-5 text-[#8f847a]">{note}</p><div className="mt-4">{button}</div></div>;
}

function ActionButton({ label, loading, disabled, onClick, dark = false }: { label: string; loading: boolean; disabled: boolean; onClick: () => void; dark?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${dark ? "bg-[#2f2924] text-white hover:bg-[#493d34]" : "border border-[#2f2924] text-[#2f2924] hover:bg-[#f7f0e8]"}`}>{loading ? <><LoaderCircle size={16} className="animate-spin" />正在创建订单……</> : <>{label}<ArrowRight size={15} /></>}</button>;
}
