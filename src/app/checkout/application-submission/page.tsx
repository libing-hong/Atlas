import type { Metadata } from "next";
import { ServiceCheckoutClient } from "@/components/applications/ServiceCheckoutClient";

export const metadata: Metadata = { title: "确认代申请订单 | Atlas" };

export default function ApplicationSubmissionCheckoutPage() {
  return <ServiceCheckoutClient serviceType="single_school_submission" />;
}
