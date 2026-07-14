import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { BackHome } from "@/components/PageShell";
import { reportHighlights } from "@/lib/mock-data";

export default function ResultPage() {
  return (
    <main className="atlas-shell py-8">
      <BackHome />
      <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">Free result</p>
          <h1 className="mt-3 font-editorial text-6xl font-semibold leading-none">基础分析已生成</h1>
          <div className="mt-8 rounded-[22px] bg-[#f4ede4] p-6 text-center">
            <p className="text-sm text-[#6f6256]">申请竞争力分数</p>
            <p className="font-editorial text-7xl font-semibold text-[#2f2924]">{reportHighlights.score}</p>
            <ProgressBar value={reportHighlights.score} className="mt-4" />
          </div>
          <p className="mt-4 text-xs leading-5 text-[#8f847a]">该分数用于帮助你识别当前优势和需要补充的部分，不代表录取概率或学校最终决定。</p>
          <Link href="/applications/recommendations" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2f2924] px-6 py-4 text-sm font-medium text-[#fffaf3]">
            查看完整推荐学校 <ArrowRight size={17} />
          </Link>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="推荐国家匹配度" />
            <div className="space-y-5">
              {reportHighlights.countryFit.map((item) => <div key={item.country}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">{item.country}</span><span className="text-[#8f847a]">{item.fit}%</span></div><ProgressBar value={item.fit} /><p className="mt-2 text-sm text-[#6f6256]">{item.note}</p></div>)}
            </div>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card><CardHeader title="申请优势" /><ul className="space-y-3 text-sm text-[#5d5148]">{reportHighlights.strengths.map((item) => <li key={item}>· {item}</li>)}</ul></Card>
            <Card><CardHeader title="申请风险" /><ul className="space-y-3 text-sm text-[#5d5148]">{reportHighlights.risks.map((item) => <li key={item}>· {item}</li>)}</ul></Card>
          </div>
          <Card>
            <CardHeader title="完整推荐学校" />
            <div className="grid gap-3 md:grid-cols-3">{reportHighlights.blurredSchools.map((school) => <div key={school} className="rounded-2xl border border-[#e8dfd3] bg-[#f7f0e8] p-4"><p>{school}</p><p className="mt-3 text-xs text-[#8f847a]">完整录取要求、课程和推荐理由均可查看</p></div>)}</div>
          </Card>
        </div>
      </section>
    </main>
  );
}
