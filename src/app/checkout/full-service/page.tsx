import { ServiceCheckoutClient } from "@/components/applications/ServiceCheckoutClient";

export default async function FullServiceCheckoutPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  return <ServiceCheckoutClient serviceType={country === "france" ? "full_service_france" : "full_service_uk_au"} />;
}
