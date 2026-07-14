import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function DashboardShell({
  children,
  mode = "student",
}: {
  children: React.ReactNode;
  mode?: "student" | "admin";
}) {
  return (
    <>
      <main className="atlas-shell flex gap-6 pb-28 pt-4 lg:py-6">
        <Sidebar mode={mode} />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
      {mode === "student" ? <LegalFooter /> : null}
    </>
  );
}

function LegalFooter() {
  const links = [
    ["/legal/terms", "用户协议"],
    ["/legal/privacy", "隐私政策"],
    ["/legal/sensitive-data", "敏感个人信息处理规则"],
    ["/legal/ai-disclaimer", "AI 服务说明与免责声明"],
    ["/legal/third-party", "第三方信息共享清单"],
    ["/legal/privacy-rights", "个人信息权利申请"],
    ["/legal/contact", "联系我们"],
  ] as const;

  return (
    <footer className="atlas-shell border-t border-[#e8dfd3] pb-8 pt-6 text-xs text-[#8f847a]">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {links.map(([href, label]) => <Link key={href} href={href} className="transition hover:text-[#2f2924]">{label}</Link>)}
      </div>
      <p className="mt-4">Atlas 法律页面当前包含待确认占位内容，正式运营前将由运营方与专业律师审核。</p>
    </footer>
  );
}

export function TopNav() {
  return (
    <header className="atlas-shell flex items-center justify-between py-6">
      <Link href="/" className="font-editorial text-3xl font-semibold text-[#2f2924]">
        Project Atlas
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-[#6f6256] md:flex">
        <Link href="/planner">免费规划</Link>
        <Link href="/dashboard">学生空间</Link>
        <Link href="/admin">顾问后台</Link>
      </nav>
    </header>
  );
}

export function BackHome() {
  return (
    <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[#6f6256]">
      <ArrowLeft size={16} />
      返回首页
    </Link>
  );
}
