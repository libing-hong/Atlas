import { SchoolComparisonClient } from "@/components/applications/SchoolComparisonClient";

export default async function SchoolComparisonPage({ searchParams }: { searchParams: Promise<{ runId?: string }> }) {
  const { runId } = await searchParams;
  return <SchoolComparisonClient runId={runId} />;
}
