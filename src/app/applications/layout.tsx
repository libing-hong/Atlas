import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "我的申请 | Atlas",
    template: "%s | 我的申请 | Atlas",
  },
  description: "管理申请学校、材料、截止日期、学校对比和下一步事项。",
};

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
