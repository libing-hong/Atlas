import { RecommendationsClient } from "@/components/applications/RecommendationsClient";

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<{ runId?: string }> }) {
  const { runId } = await searchParams;
  return <RecommendationsClient runId={runId} />;
}
