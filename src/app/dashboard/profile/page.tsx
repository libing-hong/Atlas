import Link from "next/link";
import { DashboardShell } from "@/components/PageShell";

export default function ProfilePage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl rounded-[24px] border border-[#e8dfd3] bg-[#fffaf3] p-7">
        <p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">Student profile</p>
        <h1 className="mt-2 font-editorial text-5xl font-semibold">统一学生档案</h1>
        <p className="mt-4 text-sm leading-7 text-[#6f6256]">学校推荐、申请材料判断与签证流程都读取同一份档案。修改背景后，Atlas 会创建新的规划并重新计算推荐，旧结果仍会保留在历史记录中。</p>
        <Link href="/planner" className="mt-6 inline-flex rounded-full bg-[#2f2924] px-6 py-3.5 text-sm text-white">查看或修改档案</Link>
      </div>
    </DashboardShell>
  );
}

