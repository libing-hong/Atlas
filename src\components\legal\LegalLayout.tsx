import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LegalDocument } from "@/lib/legal-data";

export const legalLinks = [
  { href: "/legal/terms", label: "用户协议" },
  { href: "/legal/privacy", label: "隐私政策" },
  { href: "/legal/sensitive-data", label: "敏感个人信息处理规则" },
  { href: "/legal/ai-disclaimer", label: "AI 服务说明与免责声明" },
  { href: "/legal/third-party", label: "第三方信息共享清单" },
  { href: "/legal/privacy-rights", label: "个人信息权利申请" },
  { href: "/legal/contact", label: "联系我们" },
];

export function LegalLayout({ document, children }: { document: LegalDocument; children?: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-[#6f6256]">
          <ArrowLeft size={16} /> 返回 Atlas
        </Link>
        <header className="soft-card rounded-[26px] p-6 md:p-10">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e7ece7] text-[#4f6d54]"><ShieldCheck size={22} /></span>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">Atlas 法律与隐私</p>
              <h1 className="mt-3 font-editorial text-4xl font-semibold text-[#2f2924] md:text-6xl">{document.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6256]">{document.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#6f6256]">
                <span className="rounded-full border border-[#d8ccbe] px-3 py-1.5">版本：{document.version}</span>
                <span className="rounded-full border border-[#d8ccbe] px-3 py-1.5">生效日期：{document.effectiveAt}</span>
                <span className="rounded-full border border-[#d8ccbe] bg-[#f7f0e8] px-3 py-1.5">占位内容待确认</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <nav className="soft-card h-fit rounded-[22px] p-5 lg:sticky lg:top-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">相关页面</p>
            <div className="mt-3 space-y-1.5">
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block rounded-xl px-3 py-2.5 text-sm text-[#5d5148] transition hover:bg-[#f3ece3]">{link.label}</Link>
              ))}
            </div>
          </nav>
          <article className="soft-card rounded-[22px] p-6 md:p-10">
            <div className="space-y-8">
              {document.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-semibold text-[#2f2924]">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-[#5d5148]">
                    {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </section>
              ))}
            </div>
            {children}
          </article>
        </div>
      </div>
    </main>
  );
}
