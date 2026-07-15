"use client";

import { useSearchParams } from "next/navigation";
import { ServiceCheckoutClient } from "@/components/applications/ServiceCheckoutClient";

export default function FullServiceCheckoutPage() {
  const params = useSearchParams();
  return <ServiceCheckoutClient serviceType={params.get("country") === "france" ? "full_service_france" : "full_service_uk_au"} />;
}
