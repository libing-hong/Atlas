import { CalendarDays, ChevronRight } from "lucide-react";
import { Application } from "@/lib/types";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

export function ApplicationCard({ application }: { application: Application }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#8f847a]">{application.country}</p>
          <h3 className="mt-1 text-lg font-semibold text-[#2f2924]">{application.school}</h3>
          <p className="mt-1 text-sm text-[#6f6256]">{application.program}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-[#8f847a]">
          <span>申请进度</span>
          <span>{application.progress}%</span>
        </div>
        <ProgressBar value={application.progress} />
      </div>
      <div className="mt-5 rounded-2xl bg-[#f7f0e8] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">Next step</p>
        <p className="mt-2 text-sm text-[#3d342d]">{application.nextStep}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-[#6f6256]">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={16} />
          {application.deadline}
        </span>
        <ChevronRight size={18} />
      </div>
    </Card>
  );
}
