import Link from "next/link";
import { DashboardShell } from "@/components/PageShell";
import { PrivacyControls } from "@/components/legal/PrivacyControls";

export default function PrivacyPage() {
  return (
    <DashboardShell>
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">隐私与数据控制</p>
        <h1 className="mt-2 font-editorial text-5xl font-semibold leading-none text-[#2f2924] md:text-6xl">管理你的个人信息</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6256]">你可以查看、导出、更正或删除资料，也可以撤回敏感信息授权和注销账号。</p>
      </section>
      <PrivacyControls />
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/legal/privacy" className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-[#4a3d34]">查看隐私政策</Link>
        <Link href="/legal/sensitive-data" className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-[#4a3d34]">查看敏感信息规则</Link>
      </div>
    </DashboardShell>
  );
}
