import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/PageShell";
import { recommendations } from "@/lib/application-prototype-data";
import { MaterialsWorkspaceClient } from "@/components/applications/MaterialsWorkspaceClient";

export default async function ApplicationMaterialsPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const schoolId = applicationId.replace(/^app-/, "");
  const school = recommendations.find((item) => item.id === schoolId) ?? recommendations[0];
  return <DashboardShell><div className="space-y-6"><Link href="/applications" className="inline-flex items-center gap-2 text-sm text-[#6f6256]"><ArrowLeft size={16} />返回我的申请</Link><header><p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">申请材料准备</p><h1 className="mt-2 font-editorial text-5xl font-semibold text-[#2f2924]">准备 {school.universityName} 的申请材料</h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6256]">Atlas 已根据这所学校的正式要求生成材料清单，并标记了可以复用的已有材料。</p></header><MaterialsWorkspaceClient school={school} applicationId={applicationId} /></div></DashboardShell>;
}
