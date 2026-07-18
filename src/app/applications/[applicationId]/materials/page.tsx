import { ApplicationMaterialsPageClient } from "@/components/applications/ApplicationMaterialsPageClient";

export default async function ApplicationMaterialsPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  return <ApplicationMaterialsPageClient applicationId={applicationId} />;
}

