import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Card } from "@/components/Card";
import { TopNav } from "@/components/PageShell";
import { formatCNY } from "@/lib/format-currency";
import { SERVICE_CATALOG } from "@/lib/service-catalog";

const flow = ["免费规划", "AI报告", "DIY申请/文书", "Offer追踪"];
const prices = [
  { name: SERVICE_CATALOG.planning.name, price: "免费", note: "完整分析、学校推荐、要求对照与申请时间规划" },
  { name: SERVICE_CATALOG.consultation.name, price: `${formatCNY(SERVICE_CATALOG.consultation.amount)}／${SERVICE_CATALOG.consultation.unit}`, note: "人工复核背景、方向和申请优先级" },
  { name: SERVICE_CATALOG.submission.name, price: `${formatCNY(SERVICE_CATALOG.submission.amount)}／${SERVICE_CATALOG.submission.unit}`, note: "根据确认信息完成申请系统填写与递交" },
  { name: SERVICE_CATALOG.essay.name, price: `${formatCNY(SERVICE_CATALOG.essay.amount)}／${SERVICE_CATALOG.essay.unit}`, note: "PS / CV / 推荐信方向打磨" },
];

export default function Home() {
  return (
    <>
      <TopNav />
      <main>
        <section className="atlas-shell grid min-h-[calc(100vh-96px)] items-center gap-10 pb-16 pt-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e8dfd3] bg-[#fffaf3]/70 px-4 py-2 text-sm text-[#6f6256]">
              <Sparkles size={16} />
              AI-powered boutique admission planning
            </p>
            <h1 className="font-editorial text-6xl font-semibold leading-[0.98] text-[#2f2924] md:text-7xl">
              你的英国、法国、澳洲硕士申请，从这里开始
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6f6256]">
              Project Atlas 把选校判断、申请节奏、材料清单与服务订单放进一个优雅的留学旅程空间。
              Atlas 将逐步完善规划、数据服务与申请支持流程。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 rounded-full bg-[#2f2924] px-6 py-3 text-sm font-medium text-[#fffaf3] transition hover:bg-[#4a3d34]"
              >
                免费开始规划
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-[#d8ccbe] px-6 py-3 text-sm font-medium text-[#4a3d34] transition hover:bg-[#fffaf3]"
              >
                预览学生 Dashboard
              </Link>
            </div>
          </div>
          <Card className="relative overflow-hidden p-7">
            <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-[#d7c8ad]" />
            <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Verified planning, clear next steps</p>
            <h2 className="mt-5 font-editorial text-5xl font-semibold text-[#2f2924]">Atlas Report</h2>
            <div className="mt-8 space-y-4">
              {["竞争力评分 82/100", "英国匹配度 88%", "法国精品商学院路径", "3 周材料行动表"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f6efe6] p-4">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#8ea08b] text-[#fffaf3]">
                    <Check size={15} />
                  </span>
                  <span className="text-sm text-[#4a3d34]">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#e8dfd3] pt-6 text-center">
              <div>
                <p className="font-editorial text-3xl font-semibold">UK</p>
                <p className="text-xs text-[#8f847a]">申请密度</p>
              </div>
              <div>
                <p className="font-editorial text-3xl font-semibold">FR</p>
                <p className="text-xs text-[#8f847a]">差异化</p>
              </div>
              <div>
                <p className="font-editorial text-3xl font-semibold">AU</p>
                <p className="text-xs text-[#8f847a]">稳妥组合</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="atlas-shell pb-20">
          <div className="grid gap-5 md:grid-cols-4">
            {flow.map((item, index) => (
              <Card key={item} className="p-5">
                <p className="font-editorial text-4xl text-[#c8a96b]">0{index + 1}</p>
                <h3 className="mt-4 text-lg font-semibold">{item}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                  {index === 0 && "输入背景与目标，获得第一版申请判断。"}
                  {index === 1 && "完整申请规划、学校梯队和风险清单免费开放。"}
                  {index === 2 && "按学校下单 DIY 申请，也可加购文书。"}
                  {index === 3 && "在 Dashboard 追踪材料、节点与 Offer。"}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="atlas-shell pb-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Pricing</p>
              <h2 className="mt-2 font-editorial text-5xl font-semibold">克制清晰的服务价格</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {prices.map((item) => (
              <Card key={item.name}>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="mt-5 font-editorial text-5xl font-semibold text-[#2f2924]">{item.price}</p>
                <p className="mt-4 text-sm leading-6 text-[#6f6256]">{item.note}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
