"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/PageShell";
import { clearAtlasCache } from "@/lib/cloud-state";
import { getBrowserSupabase, saveAccessToken } from "@/lib/supabase-browser";

export default function SettingsPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function signOut() {
    await getBrowserSupabase()?.auth.signOut();
    saveAccessToken(null);
    clearAtlasCache();
    router.replace("/");
    router.refresh();
  }

  async function deleteAccount() {
    if (!window.confirm("确认永久删除 Atlas 账号及云端数据？此操作无法撤销。")) return;
    setDeleting(true);
    const response = await fetch("/api/account/delete", { method: "DELETE" });
    if (!response.ok) { setMessage("暂时无法删除，请稍后重试或通过隐私页面联系我们。"); setDeleting(false); return; }
    await getBrowserSupabase()?.auth.signOut();
    saveAccessToken(null);
    clearAtlasCache();
    router.replace("/");
    router.refresh();
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">Account & data</p>
        <h1 className="mt-2 font-editorial text-5xl font-semibold">账号与数据</h1>
        <section className="mt-7 rounded-[24px] border border-[#e8dfd3] bg-[#fffaf3] p-6">
          <h2 className="text-xl font-semibold">云端保存</h2>
          <p className="mt-3 text-sm leading-6 text-[#6f6256]">登录状态下，Atlas 会把档案、规划、推荐、申请、Offer、签证状态与服务订单保存到你的专属云端记录。本地浏览器仅作为临时缓存。</p>
          <button onClick={signOut} className="mt-5 rounded-full border border-[#d8ccbe] px-5 py-3 text-sm">退出登录</button>
        </section>
        <section className="mt-5 rounded-[24px] border border-[#e7d0c7] bg-[#fffaf3] p-6">
          <h2 className="text-xl font-semibold">删除账号与数据</h2>
          <p className="mt-3 text-sm leading-6 text-[#7f594d]">将永久删除个人档案、推荐、申请、材料元数据、Offer、签证进度、订单和操作记录。已经归档的法定义务记录可能按隐私政策保留必要期限。</p>
          <button disabled={deleting} onClick={deleteAccount} className="mt-5 rounded-full bg-[#8a5f54] px-5 py-3 text-sm text-white disabled:opacity-60">{deleting ? "正在删除…" : "永久删除账号和数据"}</button>
          {message ? <p className="mt-3 text-sm text-[#8a5f54]">{message}</p> : null}
        </section>
      </div>
    </DashboardShell>
  );
}


