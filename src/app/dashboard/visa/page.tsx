import type { Metadata } from "next";
import { VisaHomeClient } from "@/components/visa/VisaHomeClient";

export const metadata: Metadata = { title: "我的签证 | Atlas", description: "根据已确认录取信息准备签证材料与后续步骤。" };

export default function VisaPage() { return <VisaHomeClient />; }
