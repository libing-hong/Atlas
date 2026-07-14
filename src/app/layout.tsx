import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Atlas | AI 留学申请规划",
  description: "面向英国、法国、澳洲硕士申请的 AI 留学规划 MVP。",
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
