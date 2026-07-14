"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileCheck2, LockKeyhole, PlayCircle } from "lucide-react";
import { JourneyNode, JourneyNodeStatus } from "@/lib/visual-prototype-data";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../StatusBadge";
import { T, useLanguage } from "../language/LanguageProvider";

const iconByStatus: Record<JourneyNodeStatus, React.ElementType> = {
  ready: PlayCircle,
  blocked: LockKeyhole,
  in_progress: Clock,
  awaiting_evidence: FileCheck2,
  verified: CheckCircle2,
  completed: CheckCircle2,
};

const borderByStatus: Record<JourneyNodeStatus, string> = {
  ready: "border-[#8ea08b]",
  blocked: "border-[#d19a86]",
  in_progress: "border-[#9fb2c5]",
  awaiting_evidence: "border-[#c8a96b]",
  verified: "border-[#8ea08b]",
  completed: "border-[#d8ccbe]",
};

const statusReason: Record<JourneyNodeStatus, { en: string; zh: string }> = {
  ready: {
    en: "Atlas has enough information for you to start this now.",
    zh: "Atlas 已经有足够信息，你现在可以开始处理。",
  },
  blocked: {
    en: "This needs one missing piece before you can move forward.",
    zh: "这件事需要先补齐一个关键信息，才能继续推进。",
  },
  in_progress: {
    en: "You have already started this. Continue from the prepared workspace.",
    zh: "你已经开始处理这件事，可以从准备好的工作区继续。",
  },
  awaiting_evidence: {
    en: "Atlas is waiting for you to confirm that this has been completed.",
    zh: "Atlas 正在等待你确认这件事已经完成。",
  },
  verified: {
    en: "Atlas has confirmed this item for your current application.",
    zh: "Atlas 已经为当前申请确认了这件事。",
  },
  completed: {
    en: "This has been handled. You can review it if needed.",
    zh: "这件事已经处理完成，需要时可以回看。",
  },
};

const statusActionTitle: Record<JourneyNodeStatus, { en: string; zh: string }> = {
  ready: { en: "You can start this now", zh: "现在可以开始" },
  blocked: { en: "What you need to add", zh: "你需要补充什么" },
  in_progress: { en: "Next step from here", zh: "接下来怎么做" },
  awaiting_evidence: { en: "Confirm this is done", zh: "确认这一步已完成" },
  verified: { en: "Atlas has confirmed this", zh: "Atlas 已确认" },
  completed: { en: "This step is complete", zh: "这一步已完成" },
};

export function JourneyNodeCard({ node, compact = false }: { node: JourneyNode; compact?: boolean }) {
  const Icon = iconByStatus[node.status];
  const { text, t } = useLanguage();

  return (
    <article className={cn("soft-card rounded-[22px] border-l-4 p-5", borderByStatus[node.status])}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={18} className="shrink-0 text-[#6f6256]" />
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">{text(node.stage)}</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-[#2f2924]">{text(node.title)}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6f6256]">{text(node.explanation)}</p>
        </div>
        <StatusBadge status={node.status} />
      </div>

      <div className="mt-4 rounded-2xl bg-[#f7f0e8] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">
          {t(statusActionTitle[node.status])}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#4a3d34]">{t(statusReason[node.status])}</p>
        {node.blocker ? <p className="mt-2 text-sm leading-6 text-[#7f594d]">{text(node.blocker)}</p> : null}
      </div>

      {!compact ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-[#f7f0e8] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">
              <T en="Why it matters" zh="为什么重要" />
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4a3d34]">{text(node.whyItMatters)}</p>
          </div>
          <div className="rounded-2xl bg-[#f7f0e8] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9a8b7c]">
              <T en="Atlas prepared" zh="Atlas 已准备" />
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4a3d34]">
              {node.atlasCanHelpWith.slice(0, 3).map(text).join(t({ en: ", ", zh: "、" }))}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-[#e8dfd3] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6f6256]">
          <span className="font-medium text-[#3d342d]">
            <T en="Deadline:" zh="截止日期：" />
          </span>{" "}
          {node.deadline}
        </div>
        <Link
          href={`/dashboard/journey/${node.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2924] px-4 py-2.5 text-sm font-medium text-[#fffaf3]"
        >
          {text(node.primaryCta)}
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
