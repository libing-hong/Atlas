"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

type Language = "en" | "zh";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (copy: { en: string; zh: string }) => string;
  text: (value: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const zhText: Record<string, string> = {
  "Lin Muqing": "林沐晴",
  "France student visa application": "法国学生签证申请",
  "Paris, France": "法国巴黎",
  "ESSEC Business School": "ESSEC 商学院",
  "Master in Management": "管理学硕士",
  "September 2026": "2026 年 9 月",
  Application: "申请",
  Visa: "签证",
  Offer: "录取",
  "Pre-arrival": "行前准备",
  Arrival: "抵达",
  "Settling In": "安顿",
  "Student Life": "学生生活",
  Graduation: "毕业",
  completed: "已完成",
  current: "当前阶段",
  upcoming: "尚未开始",
  High: "高",
  Medium: "中",
  Low: "低",
  Today: "今天",
  Yesterday: "昨天",
  "Jul 8": "7 月 8 日",

  "Prepare Student Visa Documents": "准备学生签证材料",
  "Confirm the exact document set before your visa appointment opens.": "在签证预约开放前确认完整材料清单。",
  "Your appointment window is close, and one missing housing document can delay the visa file.":
    "你的签证预约窗口已经临近，缺少住宿证明可能会拖延签证材料准备。",
  "Personalized visa checklist": "个性化签证材料清单",
  "French field translations": "法语字段翻译",
  "Accommodation proof requirements": "住宿证明要求说明",
  "Common missing item reminder": "常见缺失项提醒",
  "Review and prepare materials": "查看并准备材料",
  "Checklist reviewed and required proof uploaded.": "已检查清单并上传所需凭证。",

  "Confirm Accommodation Proof": "确认住宿证明",
  "Secure a housing certificate, lease, or official reservation letter.": "准备住房证明、租约或官方预订确认信。",
  "Campus France and consular review often expect a credible first address in France.":
    "Campus France 和领馆审核通常需要一个可信的法国首住地址。",
  "Draft request email": "住宿证明请求邮件草稿",
  "French address format": "法国地址格式",
  "Accepted proof examples": "可接受证明示例",
  "Blocked because your accommodation address and move-in date are not confirmed.":
    "还需要确认住宿信息。Atlas 需要你的最终住宿地址和入住日期，才能继续准备签证材料。",
  "Atlas needs your final accommodation address and move-in date before it can prepare the visa materials.":
    "还需要确认住宿信息。Atlas 需要你的最终住宿地址和入住日期，才能继续准备签证材料。",
  "French address": "法国地址",
  "Move-in date": "入住日期",
  "Housing provider confirmation": "住宿方确认",
  "Open blocker details": "补充信息",
  "Add accommodation information": "补充住宿信息",
  "France-Visas student visa application": "France-Visas 学生签证申请",
  "Start online application": "开始线上申请",
  "Etudes en France procedure": "Etudes en France 流程",
  "Open official platform": "打开官方平台",
  "ESSEC housing and arrival guidance": "ESSEC 住宿与抵达官方说明",
  "View official requirements": "查看官方要求",
  "Etudes en France account": "Etudes en France 账号",
  "Programme details": "项目信息",
  "Accommodation evidence attached to visa document set.": "住宿凭证已加入签证材料包。",

  "Update Campus France Account": "更新 Campus France 账号",
  "Make sure your school, programme, and intake details match your offer.":
    "确认学校、项目和入学时间与录取通知保持一致。",
  "Mismatched programme details can create avoidable review questions.":
    "项目细节不一致会带来本可避免的审核问题。",
  "Copy-ready programme details": "可复制的项目信息",
  "Date format conversion": "日期格式转换",
  "Saved school facts": "已保存学校信息",
  "Continue workspace": "继续工作区",
  "Account details checked against the offer letter.": "账号信息已与录取通知核对。",

  "Upload Offer Evidence": "上传录取凭证",
  "Attach the final admission offer so Atlas can use verified programme facts.":
    "上传最终录取通知，Atlas 才能使用已验证的项目信息。",
  "The offer letter unlocks visa and arrival dependencies.": "录取通知会解锁签证和抵达相关依赖。",
  "Document category suggestion": "文件分类建议",
  "Minimum field extraction preview": "最小字段提取预览",
  "Upload evidence": "上传凭证",
  "Offer evidence reviewed in the prototype evidence panel.": "录取凭证已检查。",
  "Offer evidence reviewed and confirmed.": "录取凭证已检查并确认。",

  "Accept Offer": "接受录取",
  "Confirm the offer decision and preserve deadline history.": "确认录取决定并保留截止日期记录。",
  "The accepted offer starts visa preparation.": "接受录取后会启动签证准备。",
  "Offer summary": "录取摘要",
  "Acceptance record": "接受记录",
  "Next stage activation": "下一阶段激活",
  "View record": "查看记录",
  "Official offer acceptance confirmed.": "已确认正式接受录取。",

  "Prepare Arrival Administration": "准备抵达行政事项",
  "Plan bank, insurance, transport, and first-week registrations.":
    "规划银行、保险、交通和第一周注册事项。",
  "Arrival tasks become easier once visa documents are stable.": "签证材料稳定后，抵达事项会更容易安排。",
  "Arrival checklist": "抵达清单",
  "Insurance reminder": "保险提醒",
  "First-week map": "第一周安排图",
  "Review completed plan": "查看已完成计划",
  "Arrival plan created from accepted offer and destination facts.": "已根据录取和目的地信息生成抵达计划。",

  "Personalized Visa Checklist": "个性化签证清单",
  "A checklist tailored to France, ESSEC, your intake, and your current missing proof.":
    "根据法国、ESSEC、入学时间和当前缺失证明生成的清单。",
  "Pre-filled Personal Details": "预填个人信息",
  "Name, date of birth, passport expiry, school, programme, and intake fields.":
    "姓名、出生日期、护照有效期、学校、项目和入学时间字段。",
  "French Address Format": "法国地址格式",
  "A copy-ready address structure for visa and accommodation forms.": "可直接复制到签证和住宿表格的地址结构。",
  "Translated Form Fields": "表格字段翻译",
  "French and English labels for common visa application fields.": "常见签证申请字段的法语和英语标签。",
  "Draft Accommodation Request Email": "住宿证明请求邮件草稿",
  "A polite request asking the housing provider for visa-compatible proof.":
    "一封礼貌请求住宿方提供签证可用证明的邮件。",
  "Common Missing Item Reminder": "常见缺失项提醒",
  "A calm reminder of items that are often forgotten before a visa appointment.":
    "提醒签证预约前容易遗漏的材料，帮助你少来回检查。",
  Open: "打开",
  Review: "检查",
  Copy: "复制",
  Download: "下载",
  Edit: "编辑",

  "Visa checklist generated from offer and destination facts.": "已根据录取和目的地信息生成签证清单。",
  "Accommodation proof marked as a blocker.": "Atlas 发现签证步骤仍需要住宿证明。",
  "Atlas found that accommodation proof is still needed for the visa step.": "Atlas 发现签证步骤仍需要住宿证明。",
  "Offer acceptance verified in the prototype journey.": "录取接受状态已加入你的申请记录。",
  "Offer acceptance was added to your application record.": "录取接受状态已加入你的申请记录。",

  Identity: "身份证明",
  Admission: "录取材料",
  "Academic Records": "学术记录",
  Diplomas: "毕业证书",
  "Language Results": "语言成绩",
  CV: "简历",
  "Personal Statement": "个人陈述",
  "Recommendation Letters": "推荐信",
  "Financial Documents": "资金证明",
  Accommodation: "住宿",
  Insurance: "保险",
  "Completion Evidence": "完成凭证",
  "Passport scan": "护照扫描件",
  "Admission offer": "录取通知",
  "Campus France account details": "Campus France 账号信息",
  "Review the required document categories for your current visa stage.": "检查当前签证阶段所需的文件分类。",
  "Confirm whether Atlas already knows each personal, school, and housing fact.":
    "确认 Atlas 是否已经知道你的个人、学校和住宿信息。",
  "Open prepared answers and copy them only after checking the source.":
    "打开已准备好的答案，并在检查来源后再复制。",
  "Upload prototype evidence or mark what still needs review.": "上传原型凭证，或标记仍需检查的内容。",
  "Return to My Atlas to confirm the next best action changed as expected.":
    "返回我的 Atlas，确认下一步最佳行动是否按预期变化。",
  "Housing proof lacks move-in date": "住宿证明缺少入住日期",
  "Programme name differs from offer": "项目名称与录取通知不一致",
  "Bank statement is too old": "银行流水时间太旧",
  "ESSEC offer letter": "ESSEC 录取通知",
  "English transcript": "英文成绩单",
  "CV - finance version": "CV - 金融方向版本",
  "Personal statement": "个人陈述",
  "Recommendation letter - professor": "教授推荐信",
  "Accommodation proof": "住宿证明",
  "Financial proof": "资金证明",
  "Visa documents": "签证材料",
  "Visa, application facts": "签证、申请信息",
  Applications: "我的申请",
  "My Applications": "我的申请",
  "Evidence detected": "已检测到凭证",
  "Self confirmed": "用户已确认",
  "Needs human review": "需要人工检查",
  "Not available": "暂无",
  "Prototype processing": "检查中",
  "Being checked": "检查中",
  "Expired evidence": "凭证已过期",
  "Not applicable": "不适用",
  "Not uploaded": "尚未上传",
  "Required before appointment": "预约前需要",
  View: "查看",
  Replace: "替换",
  Link: "关联",
  Upload: "上传",
  Request: "请求",
  Explain: "解释",
  "View status": "查看状态",
};

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener("atlas-language-change", onChange);
  return () => window.removeEventListener("atlas-language-change", onChange);
}

function getLanguageSnapshot(): Language {
  const saved = window.localStorage.getItem("atlas-language");
  return saved === "zh" || saved === "en" ? saved : "en";
}

function getServerLanguageSnapshot(): Language {
  return "en";
}

function subscribeToHydration() {
  return () => {};
}

function getHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The server snapshot stays English while the browser can restore the saved
  // preference without changing the server-rendered markup during hydration.
  const language = useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, getServerLanguageSnapshot);
  const hydrated = useSyncExternalStore(subscribeToHydration, getHydrationSnapshot, getServerHydrationSnapshot);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    window.localStorage.setItem("atlas-language", nextLanguage);
    document.documentElement.lang = nextLanguage === "zh" ? "zh-CN" : "en";
    window.dispatchEvent(new Event("atlas-language-change"));
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (copy) => copy[language],
      text: (value) => (language === "zh" ? zhText[value] ?? value : value),
    }),
    [language],
  );

  if (!hydrated) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

export function T({ en, zh }: { en: string; zh: string }) {
  const { t } = useLanguage();
  return <>{t({ en, zh })}</>;
}

export function LT({ value }: { value: string }) {
  const { text } = useLanguage();
  return <>{text(value)}</>;
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="grid grid-cols-2 rounded-full border border-[#d8ccbe] bg-[#fffaf3]/80 p-1 text-xs">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={
          language === "en"
            ? "rounded-full bg-[#2f2924] px-3 py-1.5 text-[#fffaf3]"
            : "rounded-full px-3 py-1.5 text-[#6f6256]"
        }
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("zh")}
        className={
          language === "zh"
            ? "rounded-full bg-[#2f2924] px-3 py-1.5 text-[#fffaf3]"
            : "rounded-full px-3 py-1.5 text-[#6f6256]"
        }
      >
        中文
      </button>
    </div>
  );
}
