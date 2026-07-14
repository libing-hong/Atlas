"use client";

import { useState } from "react";
import { Download, Eraser, FileDown, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";

export function PrivacyControls() {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const runAction = (label: string) => {
    setConfirming(null);
    setMessage(`${label}申请已记录在原型中，正式处理时限待确认。`);
  };

  const requestAction = (label: string) => {
    setConfirming(label);
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <section className="soft-card rounded-[22px] p-5 md:p-6">
        <div className="flex gap-3"><ShieldCheck size={20} className="mt-1 shrink-0 text-[#6f856a]" /><div><h2 className="text-xl font-semibold text-[#2f2924]">资料与授权</h2><p className="mt-2 text-sm leading-6 text-[#6f6256]">文件默认私有。敏感文件授权会绑定具体文件、用户和政策版本。</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ActionButton icon={Download} label="导出个人资料" onClick={() => runAction("导出个人资料")} />
          <ActionButton icon={RotateCcw} label="更正个人信息" onClick={() => runAction("更正个人信息")} />
          <ActionButton icon={Eraser} label="撤回敏感信息授权" onClick={() => requestAction("撤回敏感信息授权")} />
          <ActionButton icon={Trash2} label="删除已上传资料" onClick={() => requestAction("删除已上传资料")} danger />
        </div>
      </section>

      <section className="soft-card rounded-[22px] p-5 md:p-6">
        <h2 className="text-xl font-semibold text-[#2f2924]">账号控制</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f6256]">注销操作需要二次确认。删除后，法律、安全或审计所需记录可能在确认期限内保留。</p>
        <div className="mt-4 flex flex-wrap gap-3"><ActionButton icon={FileDown} label="提交个人信息权利申请" onClick={() => runAction("个人信息权利")} /><ActionButton icon={Trash2} label="注销并删除账号" onClick={() => requestAction("注销并删除账号")} danger /></div>
      </section>

      <section className="soft-card rounded-[22px] p-5 md:p-6">
        <h2 className="text-xl font-semibold text-[#2f2924]">Cookie 设置</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f6256]">必要 Cookie 默认启用；分析、广告和行为追踪默认关闭。</p>
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => runAction("接受必要 Cookie")} className="rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-[#fffaf3]">接受必要 Cookie</button><button type="button" onClick={() => runAction("拒绝非必要追踪")} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]">拒绝非必要追踪</button><button type="button" onClick={() => runAction("管理 Cookie 设置")} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]">管理设置</button></div>
      </section>

      {confirming ? <div className="rounded-[22px] border border-[#e7d0c7] bg-[#fbefea] p-5"><h2 className="text-lg font-semibold text-[#2f2924]">确认：{confirming}</h2><p className="mt-2 text-sm leading-6 text-[#7f594d]">将删除或撤回相关文件、授权和关联数据。因法律、安全或审计需要保留的记录：待确认。预计完成时间：待确认。</p><div className="mt-4 flex gap-3"><button type="button" onClick={() => runAction(confirming)} className="rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-[#fffaf3]">确认申请</button><button type="button" onClick={() => setConfirming(null)} className="rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]">取消</button></div></div> : null}
      {message ? <p className="rounded-xl bg-[#edf4eb] px-4 py-3 text-sm text-[#4f6d54]">{message}</p> : null}
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger = false }: { icon: typeof Download; label: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={danger ? "inline-flex items-center gap-2 rounded-full border border-[#e7d0c7] bg-[#fbefea] px-4 py-2.5 text-sm text-[#9b5d50]" : "inline-flex items-center gap-2 rounded-full border border-[#d8ccbe] px-4 py-2.5 text-sm text-[#4a3d34]"}><Icon size={16} />{label}</button>;
}
