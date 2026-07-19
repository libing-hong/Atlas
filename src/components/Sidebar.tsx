"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileText,
  FolderOpen,
  Gift,
  GraduationCap,
  Home,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageToggle, useLanguage } from "./language/LanguageProvider";

const studentLinks = [
  { href: "/dashboard", label: { en: "My Atlas", zh: "我的 Atlas" }, icon: LayoutDashboard, active: true },
  { href: "/dashboard/journey", label: { en: "Current Tasks", zh: "当前事项" }, icon: Sparkles, active: true },
  { href: "/dashboard/applications", label: { en: "My Applications", zh: "我的申请" }, icon: GraduationCap, active: true },
  { href: "/dashboard/materials", label: { en: "Materials", zh: "材料中心" }, icon: FolderOpen, active: true },
  { href: "/dashboard/form-assistant", label: { en: "Form Assistant", zh: "表格助手" }, icon: FileText, active: false },
  { href: "/dashboard/action-center", label: { en: "Action Center", zh: "行动中心" }, icon: Search, active: false },
  { href: "/dashboard/benefits", label: { en: "Student Benefits", zh: "学生权益" }, icon: Gift, active: false },
  { href: "/dashboard/assistant", label: { en: "Atlas Assistant", zh: "Atlas 助手" }, icon: Bot, active: false },
  { href: "/dashboard/profile", label: { en: "Profile", zh: "个人资料" }, icon: User, active: false },
  { href: "/dashboard/privacy", label: { en: "Privacy", zh: "隐私" }, icon: Shield, active: false },
  { href: "/dashboard/settings", label: { en: "Settings", zh: "设置" }, icon: Settings, active: false },
];

const adminLinks = [
  { href: "/admin", label: { en: "CRM Overview", zh: "CRM 总览" }, icon: Home },
  { href: "/admin/students", label: { en: "Students", zh: "学生" }, icon: Users },
  { href: "/admin/students/stu-001", label: { en: "Student Detail", zh: "学生详情" }, icon: FileText },
];

export function Sidebar({ mode = "student" }: { mode?: "student" | "admin" }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const links = mode === "admin" ? adminLinks : studentLinks;

  return (
    <>
      <aside className="soft-card sticky top-6 hidden h-[calc(100vh-48px)] w-64 shrink-0 rounded-[24px] p-5 lg:block">
        <Link href="/" className="block border-b border-[#e8dfd3] pb-5">
          <p className="font-editorial text-3xl font-semibold">Atlas</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[#9a8b7c]">
            {mode === "admin" ? "Operations" : "Task OS"}
          </p>
        </Link>
        <nav className="mt-6 space-y-1.5">
          {links.map((item) => {
            const Icon = item.icon;
            const unavailable = "active" in item && !item.active;
            const isActive = item.href === "/dashboard/applications"
              ? pathname.startsWith("/dashboard/applications") || pathname.startsWith("/applications")
              : pathname === item.href;
            if (unavailable) return (
              <div key={item.href} aria-disabled="true" className="flex cursor-not-allowed items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm text-[#8f847a]">
                <span className="flex min-w-0 items-center gap-3"><Icon size={18} className="shrink-0" /><span className="truncate">{t(item.label)}</span></span>
                <span className="inline-flex items-center gap-1 text-[10px]"><Lock size={12} />即将开放</span>
              </div>
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm text-[#5d5148] transition hover:bg-[#f3ece3] hover:text-[#2f2924]",
                  isActive && "bg-[#2f2924] text-[#fffaf3] hover:bg-[#2f2924] hover:text-[#fffaf3]",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{t(item.label)}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-[#f4ede4] p-4">
          <LanguageToggle />
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">Atlas</p>
          <p className="mt-2 text-sm leading-6 text-[#5d5148]">
            {t({
              en: "Atlas keeps the next useful step in focus.",
              zh: "Atlas 会聚焦当前最有用的下一步。",
            })}
          </p>
        </div>
      </aside>

      {mode === "student" ? (
        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-[#e8dfd3] bg-[#fffaf3]/95 px-2 py-2 shadow-[0_-10px_30px_rgba(88,72,55,0.08)] backdrop-blur lg:hidden">
          {studentLinks.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard/applications"
              ? pathname.startsWith("/dashboard/applications") || pathname.startsWith("/applications")
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] text-[#6f6256]",
                  isActive && "bg-[#2f2924] text-[#fffaf3]",
                )}
              >
                <Icon size={18} />
                <span className="whitespace-nowrap">{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      {mode === "student" ? (
        <div className="fixed left-4 top-4 z-40 lg:hidden">
          <LanguageToggle />
        </div>
      ) : null}

      {mode === "student" ? (
        <div className="fixed bottom-[74px] right-4 z-40 lg:hidden">
          <button type="button" disabled className="grid h-12 w-12 cursor-not-allowed place-items-center rounded-full bg-[#8f847a] text-[#fffaf3] shadow-lg" aria-label="Atlas 助手即将开放" title="即将开放">
            <MessageSquare size={20} />
          </button>
        </div>
      ) : null}
    </>
  );
}
