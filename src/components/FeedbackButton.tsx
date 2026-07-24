"use client";

import { FormEvent, useState } from "react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: window.location.pathname, summary: message, errorType: "user_feedback" }) });
    if (response.ok) { setStatus("已提交，Atlas 会进入人工复核。"); setMessage(""); }
    else setStatus("请先登录后再提交，或通过隐私页面联系我们。");
  }
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? <form onSubmit={submit} className="mb-3 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-[#d8ccbe] bg-[#fffaf3] p-4 shadow-xl"><label className="text-sm font-medium">报告错误或请求人工复核<textarea required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="请说明发生在哪一步，以及你看到的问题。" className="mt-3 min-h-24 w-full rounded-xl border border-[#d8ccbe] bg-white p-3 text-sm" /></label><div className="mt-3 flex gap-2"><button className="rounded-full bg-[#2f2924] px-4 py-2 text-xs text-white">提交反馈</button><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[#d8ccbe] px-4 py-2 text-xs">关闭</button></div>{status ? <p className="mt-3 text-xs text-[#6f6256]">{status}</p> : null}</form> : null}
      <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full border border-[#d8ccbe] bg-[#fffaf3] px-4 py-2.5 text-xs text-[#4a3d34] shadow-md">错误反馈 / 人工复核</button>
    </div>
  );
}

