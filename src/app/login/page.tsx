"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase, saveAccessToken } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) { setMessage("登录服务尚未完成配置，请联系 Atlas。"); return; }
    setBusy(true);
    setMessage("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/login` } });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage("注册成功。请打开邮箱完成验证，然后返回登录。");
      else { saveAccessToken(data.session.access_token); router.replace("/planner"); router.refresh(); }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("邮箱或密码不正确，请重新输入。");
      else { saveAccessToken(data.session.access_token); router.replace("/dashboard"); router.refresh(); }
    }
    setBusy(false);
  }

  return (
    <main className="atlas-shell grid min-h-screen place-items-center py-12">
      <section className="w-full max-w-md rounded-[28px] border border-[#e8dfd3] bg-[#fffaf3] p-7 shadow-sm md:p-9">
        <Link href="/" className="font-editorial text-2xl font-semibold text-[#2f2924]">Atlas</Link>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">Private Beta</p>
        <h1 className="mt-2 font-editorial text-4xl font-semibold">{mode === "login" ? "登录你的 Atlas" : "创建 Atlas 账号"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f6256]">登录后，档案、推荐、申请、Offer 与签证进度会保存到云端，并可在其他设备恢复。</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "signup" ? <label className="block text-sm text-[#5d5148]">姓名<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8ccbe] bg-white px-4 py-3 outline-none focus:border-[#789276]" /></label> : null}
          <label className="block text-sm text-[#5d5148]">邮箱<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8ccbe] bg-white px-4 py-3 outline-none focus:border-[#789276]" /></label>
          <label className="block text-sm text-[#5d5148]">密码<input required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8ccbe] bg-white px-4 py-3 outline-none focus:border-[#789276]" /></label>
          <button disabled={busy} className="w-full rounded-full bg-[#2f2924] px-5 py-3.5 text-sm text-white disabled:opacity-60">{busy ? "正在处理…" : mode === "login" ? "登录" : "注册并继续"}</button>
        </form>
        {message ? <p className="mt-4 rounded-xl bg-[#f7f0e8] p-3 text-sm leading-6 text-[#6f6256]">{message}</p> : null}
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} className="mt-5 text-sm text-[#4f6d54] underline underline-offset-4">{mode === "login" ? "还没有账号？使用邮箱注册" : "已经有账号？返回登录"}</button>
        <p className="mt-6 text-xs leading-5 text-[#8f847a]">继续即表示你同意 Atlas 的用户协议和隐私政策。Atlas 不是学校或政府机构，最终申请决定由你作出。</p>
      </section>
    </main>
  );
}


