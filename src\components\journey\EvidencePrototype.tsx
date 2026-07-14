"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, ShieldCheck } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { T, useLanguage } from "../language/LanguageProvider";

const states = [
  {
    label: { en: "Upload screenshot or PDF", zh: "上传截图或 PDF" },
    description: {
      en: "After finishing on the official site, add a screenshot, email or PDF so Atlas knows what changed.",
      zh: "在官网办理完成后，上传截图、邮件或 PDF，让 Atlas 知道这一步已经有进展。",
    },
    status: "Ready",
  },
  {
    label: { en: "Ready for your review", zh: "等待你确认" },
    description: {
      en: "Check that the file is the right proof before telling Atlas to update this task.",
      zh: "请先确认这个文件就是对应凭证，然后再让 Atlas 更新这件事。",
    },
    status: "Needs Review",
  },
  {
    label: { en: "This task can be updated", zh: "可以更新当前事项" },
    description: {
      en: "Atlas can now mark this step as handled.",
      zh: "Atlas 现在可以把这一步标记为已处理。",
    },
    status: "Verified",
  },
];

export function EvidencePrototype() {
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const { t } = useLanguage();
  const current = states[step];

  return (
    <div className="rounded-[22px] border border-[#e8dfd3] bg-[#f7f0e8] p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#9a8b7c]">
            <T en="After you finish" zh="完成后告诉 Atlas" />
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#2f2924]">
            <T en="Tell Atlas this is done" zh="告诉 Atlas 这一步已完成" />
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f6256]">
            <T
              en="When you return from the official website, add a screenshot, email or PDF so Atlas can verify and update this task."
              zh="从官方网站办理回来后，上传截图、邮件或 PDF，Atlas 会检查并更新这件事。"
            />
          </p>
        </div>
        <StatusBadge status={current.status} />
      </div>

      <div className="mt-5 rounded-2xl bg-[#fffaf3] p-5">
        <div className="flex items-start gap-3">
          {step >= 2 ? (
            <CheckCircle2 size={22} className="mt-0.5 text-[#6f856a]" />
          ) : step >= 1 ? (
            <ShieldCheck size={22} className="mt-0.5 text-[#8ea08b]" />
          ) : (
            <FileUp size={22} className="mt-0.5 text-[#8ea08b]" />
          )}
          <div>
            <h4 className="font-semibold text-[#2f2924]">{t(current.label)}</h4>
            <p className="mt-2 text-sm leading-6 text-[#6f6256]">{t(current.description)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#2f2924] px-5 py-3 text-sm font-medium text-[#fffaf3]">
          <FileUp size={16} className="mr-2" />
          <T en="Upload screenshot, email or PDF" zh="上传截图、邮件或 PDF" />
          <input
            type="file"
            accept="image/*,.pdf,.eml,.msg,.txt"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              setStep(1);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setFileName("");
            setStep(0);
          }}
          className="inline-flex items-center justify-center rounded-full border border-[#d8ccbe] px-5 py-3 text-sm font-medium text-[#4a3d34]"
        >
          <T en="Not yet" zh="暂时还没有" />
        </button>
      </div>
      {fileName ? (
        <p className="mt-3 text-xs text-[#6f856a]">
          <T en={`Selected: ${fileName}`} zh={`已选择：${fileName}`} />
        </p>
      ) : null}
    </div>
  );
}
