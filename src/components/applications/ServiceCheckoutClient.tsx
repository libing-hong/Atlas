"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { completeServiceOrder, markServiceOrderProcessing, readActiveServiceOrder, readApplicationRecords, ServiceType } from "@/lib/application-store";
import { formatCNYFromFen } from "@/lib/format-currency";

type PaymentState = "idle" | "processing" | "success" | "error";

const included = [
  "根据你确认的信息填写学校申请系统",
  "上传已准备的申请材料",
  "整理递交前的申请信息",
  "由你最终确认后正式递交",
  "保存申请账号、申请编号和递交状态",
];

const excluded = [
  "专业文书写作",
  "人工翻译",
  "学校收取的申请费",
  "签证官方费用",
  "Campus France 官方费用",
  "保录取或保 Offer",
];

const serviceCopy: Record<ServiceType, { title: string; description: string; backHref: string }> = {
  single_school_submission: {
    title: "确认代申请订单",
    description: "Atlas 将先审核学校申请信息和材料，正式递交前仍需由你最终确认。",
    backHref: "/applications/service-comparison",
  },
  advisor_consultation: {
    title: "确认一对一留学规划订单",
    description: "顾问将复核你的背景、学校组合、专业方向和申请优先级。",
    backHref: "/applications/service-comparison#advisor",
  },
  full_service_uk_au: {
    title: "确认英国／澳洲全流程订单",
    description: "覆盖规划、选校、申请递交、签证材料准备与后续跟进。",
    backHref: "/applications/service-comparison#full-uk-au",
  },
  full_service_france: {
    title: "确认法国商学院全流程订单",
    description: "覆盖规划、申请、Campus France、面试和签证材料准备。",
    backHref: "/applications/service-comparison#full-france",
  },
};

export function ServiceCheckoutClient({ serviceType }: { serviceType: ServiceType }) {
  const router = useRouter();
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [error, setError] = useState("");
  const order = useMemo(() => readActiveServiceOrder(serviceType), [serviceType]);
  const previouslyPurchased = useMemo(() => readApplicationRecords().filter((record) => record.serviceType === "single_school").length, []);
  const copy = serviceCopy[serviceType];

  async function pay() {
    if (!order || !order.items.length || paymentState === "processing" || order.status === "paid") return;
    setPaymentState("processing");
    setError("");
    try {
      markServiceOrderProcessing(order.id);
      await new Promise((resolve) => window.setTimeout(resolve, 850));
      completeServiceOrder(order.id);
      setPaymentState("success");
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      router.push(`/applications?payment=success&service=${serviceType}`);
    } catch {
      setPaymentState("error");
      setError("暂时无法完成测试支付，请重新尝试。订单仍已保存。");
    }
  }

  if (!order) {
    return <DashboardShell><Card className="mx-auto max-w-2xl p-7 text-center"><h1 className="font-editorial text-4xl font-semibold text-[#2f2924]">暂未找到待支付订单</h1><p className="mt-3 text-sm text-[#6f6256]">请返回申请方式页面重新选择服务。</p><Link href="/applications/service-comparison" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-white">返回选择申请方式</Link></Card></DashboardShell>;
  }

  const isSubmission = serviceType === "single_school_submission";
  return <DashboardShell><div className="space-y-6 pb-16">
    <header>
      <Link href={copy.backHref} className="inline-flex items-center gap-2 text-sm text-[#6f6256]"><ArrowLeft size={15} />返回调整服务</Link>
      <p className="mt-6 text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">订单确认</p>
      <h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924]">{copy.title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6256]">{copy.description}</p>
    </header>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <Card className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-[#2f2924]">{isSubmission ? `已选择 ${order.items.length} 所学校` : "服务项目"}</h2><span className="text-sm text-[#8f847a]">{order.id}</span></div>
          <div className="mt-5 divide-y divide-[#e8dfd3]">
            {order.items.map((item, index) => <div key={item.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-medium text-[#2f2924]">{isSubmission ? `${index + 1}. ${item.schoolName}` : item.schoolName}</p>{item.programName ? <p className="mt-1 text-sm text-[#6f6256]">{item.programName}</p> : null}</div><strong className="shrink-0 text-[#2f2924]">{formatCNYFromFen(item.totalPriceFen)}</strong></div>)}
          </div>
          {isSubmission && previouslyPurchased > 0 ? <p className="mt-4 rounded-2xl bg-[#f7f0e8] p-4 text-sm leading-6 text-[#6f6256]">已有 {previouslyPurchased} 所学校开通代递交服务，本次仅计算剩余 {order.items.length} 所。</p> : null}
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="p-5"><h2 className="font-semibold text-[#2f2924]">服务包含</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-[#5d5148]">{(isSubmission ? included : ["订单所列服务范围", "服务启动后的进度同步", "需要你确认时集中提醒"]).map((item) => <li key={item} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-[#5f805f]" />{item}</li>)}</ul></Card>
          <Card className="p-5"><h2 className="font-semibold text-[#2f2924]">本服务不包含</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-[#6f6256]">{excluded.map((item) => <li key={item}>• {item}</li>)}</ul></Card>
        </div>
      </div>

      <Card className="h-fit p-5 md:p-6">
        <h2 className="text-xl font-semibold text-[#2f2924]">订单金额</h2>
        <div className="mt-5 space-y-3 text-sm text-[#5d5148]"><div className="flex justify-between"><span>服务数量</span><strong>{isSubmission ? `${order.items.length} 所学校` : "1 项服务"}</strong></div><div className="flex justify-between"><span>小计</span><strong>{formatCNYFromFen(order.subtotalFen)}</strong></div><div className="flex items-end justify-between border-t border-[#e8dfd3] pt-4"><span>订单合计</span><strong className="text-2xl text-[#2f2924]">{formatCNYFromFen(order.totalFen)}</strong></div></div>
        <div className="mt-5 rounded-2xl border border-[#c9dbc5] bg-[#e7ece7] p-4 text-sm leading-6 text-[#4f6d54]"><ShieldCheck size={18} /><p className="mt-2">Atlas 不会在未经你最终确认的情况下递交申请。</p></div>
        {error ? <p role="alert" className="mt-4 text-sm text-[#9a574d]">{error}</p> : null}
        <button type="button" onClick={pay} disabled={!order.items.length || paymentState === "processing" || paymentState === "success" || order.status === "paid"} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f2924] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#493d34] disabled:cursor-not-allowed disabled:opacity-50">{paymentState === "processing" ? <><LoaderCircle size={16} className="animate-spin" />正在处理测试支付……</> : paymentState === "success" || order.status === "paid" ? <><Check size={16} />支付成功，正在同步……</> : `测试支付并开始服务 · ${formatCNYFromFen(order.totalFen)}`}</button>
        <Link href={copy.backHref} className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[#d8ccbe] px-5 py-3 text-sm text-[#4a3d34]">返回调整学校</Link>
        <p className="mt-4 text-xs leading-5 text-[#8f847a]">当前为可测试的模拟付款流程。接入真实支付后，订单和服务状态结构保持不变。</p>
      </Card>
    </div>
  </div></DashboardShell>;
}
