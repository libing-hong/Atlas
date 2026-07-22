import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Project Atlas | AI 留学申请规划", template: "%s | Atlas" },
  description: "面向英国、法国、澳洲硕士申请的 AI 留学规划与申请协作平台。",
  applicationName: "Project Atlas",
  robots: process.env.ATLAS_LEGAL_STATUS === "published"
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
