import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Card, CardHeader } from "./Card";
import { DashboardShell } from "./PageShell";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <DashboardShell>
      <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm text-[#6f6256]">
        <ArrowLeft size={16} />
        Back to My Atlas
      </Link>
      <Card className="max-w-3xl">
        <Clock className="text-[#8ea08b]" size={28} />
        <CardHeader title={title} eyebrow="Coming in a later phase" />
        <p className="text-sm leading-7 text-[#5d5148]">{description}</p>
        <p className="mt-5 rounded-2xl bg-[#f7f0e8] p-4 text-sm leading-6 text-[#6f6256]">
          Phase 0.5 is intentionally limited to visual validation for Dashboard, Journey, Journey Node Workspace, and
          Material Center. Backend, authentication, agents, payments, and production workflows are paused.
        </p>
      </Card>
    </DashboardShell>
  );
}
