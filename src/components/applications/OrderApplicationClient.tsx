"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { DashboardShell } from "@/components/PageShell";

export function OrderApplicationClient() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const service = params.get("service");
    const target = service === "consultation"
      ? "/applications/service-comparison#advisor"
      : service === "full-service"
        ? "/applications/service-comparison#full-service"
        : "/applications/service-comparison#submission";
    router.replace(target);
  }, [params, router]);

  return <DashboardShell><div className="grid min-h-[50vh] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-[#6f856a]" size={24} /><p className="mt-3 text-sm text-[#6f6256]">正在打开最新服务方案…</p></div></div></DashboardShell>;
}
