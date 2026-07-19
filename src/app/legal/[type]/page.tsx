import { notFound } from "next/navigation";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { legalDocuments, LegalDocumentType, thirdPartyProcessors } from "@/lib/legal-data";
import Link from "next/link";
import type { Metadata } from "next";

const validTypes = Object.keys(legalDocuments) as LegalDocumentType[];

export function generateStaticParams() {
  return validTypes.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params; const document = legalDocuments[type as LegalDocumentType];
  return { title: document?.title ?? "法律与隐私", description: document?.summary, robots: { index: false, follow: false } };
}

export default async function LegalDocumentPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!validTypes.includes(type as LegalDocumentType)) notFound();
  const document = legalDocuments[type as LegalDocumentType];

  return (
    <LegalLayout document={document}>
      {type === "third-party" ? (
        <div className="mt-10 overflow-x-auto rounded-2xl border border-[#e8dfd3]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#f7f0e8] text-[#6f6256]"><tr>{["第三方名称", "服务类型", "处理的信息", "存储地区", "跨境传输", "隐私政策"].map((item) => <th key={item} className="px-4 py-3 font-medium">{item}</th>)}</tr></thead>
            <tbody>{thirdPartyProcessors.map((processor) => <tr key={processor.name} className="border-t border-[#e8dfd3] text-[#5d5148]"><td className="px-4 py-4">{processor.name}</td><td className="px-4 py-4">{processor.purpose}</td><td className="px-4 py-4">{processor.dataCategories.join("、")}</td><td className="px-4 py-4">{processor.storageRegion}</td><td className="px-4 py-4">待配置</td><td className="px-4 py-4">{processor.privacyUrl}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
      {type === "privacy-rights" ? <div className="mt-10"><Link href="/dashboard/privacy" className="inline-flex rounded-full bg-[#2f2924] px-4 py-2.5 text-sm text-[#fffaf3]">打开隐私控制中心</Link></div> : null}
    </LegalLayout>
  );
}
