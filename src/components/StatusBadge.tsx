"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "./language/LanguageProvider";

const toneByStatus: Record<string, string> = {
  ready: "bg-[#e7ece7] text-[#4f6d54] border-[#c9dbc5]",
  blocked: "bg-[#f1e2dc] text-[#8a5f54] border-[#e7d0c7]",
  in_progress: "bg-[#e8edf1] text-[#52687a] border-[#d2dce5]",
  awaiting_evidence: "bg-[#eee5d0] text-[#80683f] border-[#dfcfaa]",
  verified: "bg-[#e1eadf] text-[#506c4b] border-[#c9dbc5]",
  completed: "bg-[#eee7dc] text-[#6f6256] border-[#ded4c7]",
  Ready: "bg-[#e7ece7] text-[#4f6d54] border-[#c9dbc5]",
  Missing: "bg-[#f1e7dd] text-[#7b6756] border-[#dfd2c5]",
  Processing: "bg-[#e8edf1] text-[#52687a] border-[#d2dce5]",
  "Needs Review": "bg-[#f1e2dc] text-[#8a5f54] border-[#e7d0c7]",
  Verified: "bg-[#e1eadf] text-[#506c4b] border-[#c9dbc5]",
  Expired: "bg-[#eee8e4] text-[#7b6a62] border-[#ded5cf]",
  pending: "bg-[#f1e7dd] text-[#7b6756] border-[#dfd2c5]",
  paid: "bg-[#e1eadf] text-[#506c4b] border-[#c9dbc5]",
  preparing: "bg-[#eee7dc] text-[#6f6256] border-[#ded4c7]",
  submitted: "bg-[#e7ece7] text-[#5b725d] border-[#d4ded2]",
  reviewing: "bg-[#e8edf1] text-[#52687a] border-[#d2dce5]",
  additional_materials: "bg-[#f1e2dc] text-[#8a5f54] border-[#e7d0c7]",
  interview: "bg-[#eee5d0] text-[#80683f] border-[#dfcfaa]",
  offer: "bg-[#e1eadf] text-[#506c4b] border-[#c9dbc5]",
  rejected: "bg-[#eee8e4] text-[#7b6a62] border-[#ded5cf]",
};

const labelByStatus: Record<string, string> = {
  ready: "Ready to start",
  blocked: "Needs information first",
  in_progress: "In progress",
  awaiting_evidence: "Verifying",
  verified: "Completed",
  completed: "Completed",
  Ready: "Ready",
  Missing: "Missing",
  Processing: "Processing",
  "Needs Review": "Needs review",
  Verified: "Verified",
  Expired: "Expired",
  pending: "Pending",
  paid: "Paid",
  preparing: "Preparing",
  submitted: "Submitted",
  reviewing: "Reviewing",
  additional_materials: "More materials needed",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const zhLabelByStatus: Record<string, string> = {
  ready: "现在可以开始",
  blocked: "需要先补充信息",
  in_progress: "正在进行",
  awaiting_evidence: "等待你确认完成",
  verified: "Atlas 已确认",
  completed: "已完成",
  Ready: "已就绪",
  Missing: "缺失",
  Processing: "处理中",
  "Needs Review": "需要检查",
  Verified: "已验证",
  Expired: "已过期",
  pending: "待处理",
  paid: "已支付",
  preparing: "准备中",
  submitted: "已提交",
  reviewing: "审核中",
  additional_materials: "需补材料",
  interview: "面试",
  offer: "录取",
  rejected: "被拒",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { language } = useLanguage();
  const label = language === "zh" ? zhLabelByStatus[status] ?? status : labelByStatus[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        toneByStatus[status] ?? "bg-[#eee7dc] text-[#6f6256] border-[#ded4c7]",
        className,
      )}
    >
      {label}
    </span>
  );
}
