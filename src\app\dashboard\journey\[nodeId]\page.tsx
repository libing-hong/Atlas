import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/PageShell";
import { EvidencePrototype } from "@/components/journey/EvidencePrototype";
import { OfficialResources } from "@/components/journey/OfficialResources";
import { T, LT } from "@/components/language/LanguageProvider";
import { DevelopmentJourneyRepository, DevelopmentMaterialRepository, JourneyNode, MaterialDocument } from "@/lib/visual-prototype-data";

export default async function JourneyNodeWorkspace({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const node = DevelopmentJourneyRepository.getNodes().find((item) => item.id === nodeId);

  if (!node) notFound();

  const preparedItems = DevelopmentJourneyRepository.getPreparedItems();
  const documents = DevelopmentMaterialRepository.getDocuments();
  const title = node.id === "prepare-student-visa-documents"
    ? { en: "Prepare student visa documents", zh: "准备学生签证材料" }
    : undefined;

  return (
    <DashboardShell>
      <Link href="/dashboard/journey" className="mb-5 inline-flex items-center gap-2 text-sm text-[#6f6256]">
        <ArrowLeft size={16} />
        <T en="Back to current tasks" zh="返回当前事项" />
      </Link>

      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">
          <T en="Current task workspace" zh="当前事项工作区" />
        </p>
        <h1 className="mt-3 font-editorial text-5xl font-semibold leading-none text-[#2f2924] md:text-6xl">
          {title ? <T en={title.en} zh={title.zh} /> : <LT value={node.title} />}
        </h1>
      </section>

      <OfficialResources
        resources={node.officialResources}
        atlasPrepared={node.atlasCanHelpWith}
        preparedItems={preparedItems}
      />

      <MaterialStatusList node={node} documents={documents} />

      <EvidencePrototype />
    </DashboardShell>
  );
}

function MaterialStatusList({ node, documents }: { node: JourneyNode; documents: MaterialDocument[] }) {
  const requiredMaterials = node.officialResources?.[0]?.requiredMaterials ?? [];
  if (!requiredMaterials.length) return null;

  const hasDocument = (material: string) => {
    const key = material.toLowerCase();
    const document = documents.find((item) => {
      const name = item.name.toLowerCase();
      if (key.includes("admission offer")) return name.includes("offer");
      if (key.includes("programme details")) return false;
      return name === key;
    });
    return Boolean(document && ["Ready", "Verified"].includes(document.status));
  };

  const getHref = (material: string) => {
    const key = material.toLowerCase();
    return key.includes("accommodation") || key.includes("move-in") || key.includes("housing")
      ? "/dashboard/journey/confirm-accommodation-proof"
      : "/dashboard/materials";
  };

  return (
    <section className="mb-6 rounded-[22px] border border-[#e8dfd3] bg-[#fffaf3] p-5 md:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b7c]">Checklist</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#2f2924]">需要准备的材料</h2>
        </div>
        <Link href="/dashboard/materials" className="hidden text-sm font-medium text-[#6f6256] sm:inline-flex">查看材料中心</Link>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {requiredMaterials.map((material) => {
          const available = hasDocument(material);
          return (
            <div
              key={material}
              className={available
                ? "flex items-center justify-between gap-3 rounded-[16px] border border-[#c9dbc5] bg-[#edf4eb] px-4 py-3"
                : "flex items-center justify-between gap-3 rounded-[16px] border border-[#e7d0c7] bg-[#fbefea] px-4 py-3"}
            >
              <div className="flex min-w-0 items-center gap-3">
                {available
                  ? <CheckCircle2 size={18} className="shrink-0 text-[#4f6d54]" />
                  : <AlertCircle size={18} className="shrink-0 text-[#a66758]" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2f2924]">{material}</p>
                  <p className={available ? "mt-1 text-xs text-[#4f6d54]" : "mt-1 text-xs text-[#a66758]"}>
                    {available ? "已准备" : "未检测到，请准备"}
                  </p>
                </div>
              </div>
              <Link
                href={available ? "/dashboard/materials" : getHref(material)}
                className={available ? "shrink-0 text-xs font-medium text-[#4f6d54]" : "shrink-0 text-xs font-medium text-[#9b5d50]"}
              >
                {available ? "查看材料" : "准备材料"}
              </Link>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-5 text-[#8f847a]">未检测到表示 Atlas 尚未从资料或上传文件中确认该材料，不代表你一定没有。</p>
    </section>
  );
}
