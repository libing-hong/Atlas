import type { Metadata } from "next";
import { ServiceCheckoutClient } from "@/components/applications/ServiceCheckoutClient";

export const metadata: Metadata = { title: "一对一留学规划订单 | Atlas" };

export default function AdvisorConsultationCheckoutPage() {
  return <ServiceCheckoutClient serviceType="advisor_consultation" />;
}
