import type { Metadata } from "next";
import { ApplicationHomeClient } from "@/components/applications/ApplicationHomeClient";

export const metadata: Metadata = {
  title: "我的申请 | Atlas",
  description: "集中管理申请学校、材料、截止日期和下一步事项。",
};

export default function ApplicationsPage() {
  return <ApplicationHomeClient />;
}
