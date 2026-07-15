import type { Metadata } from "next";
import { ServiceComparisonClient } from "@/components/applications/ServiceComparisonClient";

export const metadata: Metadata = {
  title: "选择申请方式 | Atlas",
  description: "比较 DIY、单校代递交、一对一规划和国家全流程服务。",
};

export default function ServiceComparisonPage() {
  return <ServiceComparisonClient />;
}
