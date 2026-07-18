"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
export function VipCheckoutClient() { const router = useRouter(); const params = useSearchParams(); function activate() { window.localStorage.setItem("atlas.vip.subscription.v1", "active"); router.push(params.get("returnTo") || "/applications"); } return <DashboardShell><div className="mx-auto max-w-2xl"><Card className="p-7 md:p-10"><p className="text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">Atlas VIP</p><h1 className="mt-3 font-editorial text-5xl font-semibold">专属申请文书</h1><p className="mt-4 text-lg">¥29.9 / 月</p><ul className="mt-6 space-y-3 text-sm leading-6 text-[#5d5148]"><li>每所学校生成独立动机信</li><li>结合学生背景、课程特色与录取要求</li><li>一页 A4 内，可编辑并下载 Word</li></ul><div className="mt-7 rounded-2xl bg-[#f7f0e8] p-4 text-sm text-[#6f6256]">当前为功能验证环境，不会产生真实扣款。正式订阅将在支付商户接入后启用。</div><button type="button" onClick={activate} className="mt-5 w-full rounded-full bg-[#2f2924] px-5 py-3.5 text-sm text-white">测试开通 VIP</button></Card></div></DashboardShell>; }

