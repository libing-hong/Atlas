import { CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { DashboardShell } from "@/components/PageShell";
import { LT, T } from "@/components/language/LanguageProvider";
import { MaterialCenterClient } from "@/components/materials/MaterialCenterClient";
import { DevelopmentMaterialRepository } from "@/lib/visual-prototype-data";

export default function MaterialsPage() {
  const categories = DevelopmentMaterialRepository.getCategories();
  const documents = DevelopmentMaterialRepository.getDocuments();
  const readiness = DevelopmentMaterialRepository.getReadiness();
  const missing = documents.filter((document) => document.status === "Missing");
  const expiring = documents.filter((document) => document.status === "Expired");

  return (
    <DashboardShell>
      <section className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9a8b7c]">
          <T en="Material Center" zh="材料中心" />
        </p>
        <h1 className="mt-2 font-editorial text-5xl font-semibold leading-none text-[#2f2924] md:text-6xl">
          <T en="Your study documents" zh="你的留学材料" />
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f6256]">
          <T
            en="Atlas keeps your identity, admission, academic, visa, accommodation, and completion documents in one place so you can use the right file at the right step."
            zh="Atlas 会把身份、录取、学术、签证、住宿和完成凭证集中在这里，方便你在对应步骤使用正确文件。"
          />
        </p>
      </section>

      <section className="mb-6">
        <Card className="border-2 border-[#d5c2ad]">
          <CardHeader title={<T en="Atlas prepared" zh="Atlas 已准备" />} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { en: "Personalized material checklist", zh: "个性化材料清单" },
              { en: "Known personal and school details", zh: "已知个人和学校资料" },
              { en: "Visa document categories", zh: "签证材料分类" },
              { en: "Completion evidence reminders", zh: "完成凭证提醒" },
            ].map((item) => (
              <div key={item.en} className="flex gap-3 rounded-2xl bg-[#f7f0e8] p-4 text-sm text-[#4a3d34]">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#6f856a]" />
                <span>
                  <T en={item.en} zh={item.zh} />
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={<T en="Missing Documents" zh="缺失文件" />} />
          <div className="space-y-3">
            {missing.map((document) => (
              <div key={document.id} className="rounded-2xl bg-[#f1e7dd] p-4 text-sm">
                <p className="font-semibold text-[#2f2924]">
                  <LT value={document.name} />
                </p>
                <p className="mt-1 text-[#6f6256]">
                  <T en="Needed by " zh="用于：" />
                  <LT value={document.usedBy} />
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title={<T en="Expiring Documents" zh="即将过期文件" />} />
          <div className="space-y-3">
            {expiring.map((document) => (
              <div key={document.id} className="rounded-2xl bg-[#eee8e4] p-4 text-sm">
                <p className="font-semibold text-[#2f2924]">
                  <LT value={document.name} />
                </p>
                <p className="mt-1 text-[#6f6256]">
                  <T en={`Expiry: ${document.expiry}`} zh={`有效期：${document.expiry}`} />
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <MaterialCenterClient categories={categories} documents={documents} readiness={readiness} />
    </DashboardShell>
  );
}
