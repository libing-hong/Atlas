import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Card } from "@/components/Card";
import { TopNav } from "@/components/PageShell";

// Private Beta production landing page.
const steps = [
  ["01", "填写一次背景", "约 5–8 分钟。填写教育、成绩、语言、预算和申请目标。"],
  ["02", "获得已核验推荐", "OpenAI 理解不同背景与专业需求，正式推荐只展示通过官方来源核验的项目。"],
  ["03", "推进学校申请", "选择学校、准备材料，并由你决定 DIY、购买数字工作区或寻求人工服务。"],
  ["04", "从 Offer 进入签证", "确认最终接受的 Offer 后，Atlas 才会创建对应国家的个性化签证流程。"],
];

const trust = [
  "推荐项目经过学校官方来源核验",
  "未核验候选不会作为正式推荐展示",
  "规则显示来源、版本与核验日期",
  "自动识别结果始终可以确认和修改",
  "高敏感信息不会用于无关用途",
  "Atlas 不是学校或政府机构，最终决定由用户作出",
];

export default function Home() {
  return (
    <>
      <TopNav />
      <main>
        <section className="atlas-shell grid min-h-[calc(100vh-96px)] items-center gap-10 pb-16 pt-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e8dfd3] bg-[#fffaf3]/70 px-4 py-2 text-sm text-[#6f6256]"><ShieldCheck size={16} />Atlas Private Beta · 英国 / 法国 / 澳大利亚</p>
            <h1 className="font-editorial text-6xl font-semibold leading-[1.02] text-[#2f2924] md:text-7xl">从选校到签证，Atlas 始终告诉你下一步该做什么。</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6f6256]">填写一次背景，Atlas 为你匹配真实学校专业、核对申请条件、追踪 Offer，并在确定入读国家后生成个性化签证流程。</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#2f2924] px-6 py-3.5 text-sm font-medium text-white">注册并开始规划 <ArrowRight size={17} /></Link>
              <Link href="/planner" className="inline-flex items-center rounded-full border border-[#d8ccbe] px-6 py-3.5 text-sm font-medium text-[#4a3d34]">先了解需要填写什么</Link>
            </div>
            <p className="mt-4 text-xs text-[#8f847a]">基础背景分析、少量已核验推荐、申请时间线预览和核心风险提示免费。</p>
          </div>
          <Card className="p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">What you get</p>
            <h2 className="mt-4 font-editorial text-4xl font-semibold">一条真实可执行的留学路径</h2>
            <div className="mt-7 space-y-3">{["与你背景对应的真实学校专业", "满足、缺失与待确认条件", "官方项目、学费与申请入口", "Offer 状态与最终入读选择", "英国、法国或澳洲签证下一步"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f6efe6] p-4 text-sm text-[#4a3d34]"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#8ea08b] text-white"><Check size={15} /></span>{item}</div>)}</div>
          </Card>
        </section>
        <section className="atlas-shell pb-20"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{steps.map(([number, title, description]) => <Card key={number} className="p-5"><p className="font-editorial text-4xl text-[#c8a96b]">{number}</p><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6f6256]">{description}</p></Card>)}</div></section>
        <section className="atlas-shell grid gap-6 pb-24 lg:grid-cols-[1fr_0.9fr]">
          <Card className="p-7"><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">Trust & privacy</p><h2 className="mt-3 font-editorial text-4xl font-semibold">每个结论都应能被核验</h2><div className="mt-6 grid gap-3">{trust.map((item) => <p key={item} className="flex gap-3 text-sm leading-6 text-[#5d5148]"><Check size={16} className="mt-1 shrink-0 text-[#6f856a]" />{item}</p>)}</div></Card>
          <Card className="p-7"><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">Services</p><h2 className="mt-3 font-editorial text-4xl font-semibold">免费规划，按需要选择服务</h2><div className="mt-6 space-y-4 text-sm leading-6 text-[#5d5148]"><p><strong>免费：</strong>基础背景分析、已核验推荐、申请时间线与核心风险。</p><p><strong>¥29.9 单校 DIY 工作区：</strong>材料清单、申请步骤、表格辅助与截止日期提醒；不包含 Atlas 代替用户正式递交。</p><p><strong>人工服务：</strong>背景或选校复核、文书、材料复核、申请代办和签证协助会分别说明范围、交付、响应时间与退款条件。</p></div></Card>
        </section>
      </main>
    </>
  );
}

