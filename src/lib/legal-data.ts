export type LegalDocumentType =
  | "terms"
  | "privacy"
  | "sensitive-data"
  | "ai-disclaimer"
  | "third-party"
  | "privacy-rights"
  | "contact";

export type LegalDocument = {
  type: LegalDocumentType;
  version: string;
  title: string;
  summary: string;
  effectiveAt: string;
  status: "draft" | "published" | "placeholder";
  sections: { title: string; body: string[] }[];
};

export type UserConsent = {
  userId: string;
  consentType: "sensitive_document" | "cross_border_processing" | "cookie_analytics";
  policyVersion: string;
  accepted: boolean;
  acceptedAt?: string;
  withdrawnAt?: string;
  relatedDocumentId?: string;
};

export type PrivacyRequest = {
  userId: string;
  requestType: "access" | "correction" | "deletion" | "export" | "withdraw_consent" | "account_closure";
  status: "submitted" | "processing" | "completed";
  submittedAt: string;
  completedAt?: string;
};

export type ThirdPartyProcessor = {
  name: string;
  purpose: string;
  dataCategories: string[];
  storageRegion: string;
  crossBorder: "yes" | "no" | "pending";
  privacyUrl: string;
  enabled: boolean;
};

export const legalPlaceholders = {
  operator: "[待确认：运营主体名称]",
  contact: "[待确认：隐私负责人及联系方式]",
  storageRegion: "[待确认：数据存储地区]",
  retention: "[待确认：保存期限]",
  effectiveAt: "[待确认：生效日期]",
};

export const legalDocuments: Record<LegalDocumentType, LegalDocument> = {
  terms: {
    type: "terms",
    version: "v0.1-placeholder",
    title: "用户协议",
    summary: "说明 Atlas 的服务范围、用户责任和使用边界。正式文本待运营方与律师确认。",
    effectiveAt: legalPlaceholders.effectiveAt,
    status: "placeholder",
    sections: [
      { title: "服务定位", body: ["Atlas 是独立的 AI 留学与跨境生活辅助平台。服务范围、运营主体和正式商业条款仍待确认。"] },
      { title: "用户责任", body: ["用户应确保提交的信息真实、准确，并在正式提交前核对学校、使领馆及主管机关发布的最新要求。"] },
      { title: "版本信息", body: [`当前版本：v0.1-placeholder。生效日期：${legalPlaceholders.effectiveAt}。`] },
    ],
  },
  privacy: {
    type: "privacy",
    version: "v0.1-placeholder",
    title: "隐私政策",
    summary: "这是一份合规结构原型。主体、期限、服务器、供应商和跨境方案将在确认后替换。",
    effectiveAt: legalPlaceholders.effectiveAt,
    status: "placeholder",
    sections: [
      { title: "运营主体与联系方式", body: [`运营主体：${legalPlaceholders.operator}。隐私负责人及联系方式：${legalPlaceholders.contact}。`] },
      { title: "我们收集什么", body: ["账号信息、联系方式、护照或身份证明、录取通知、住宿地址、资金证明、签证进度、上传文件及完成凭证。具体字段和必填状态将在正式版本列明。"] },
      { title: "处理目的与必填状态", body: ["用于生成材料清单、核验任务状态、提供办理辅助、保存用户选择和处理隐私请求。每类信息的必填状态：待确认。用户可在上传前查看该文件的处理说明。"] },
      { title: "使用方式与保存期限", body: [`Atlas 仅按用户选择的服务目的处理信息。保存期限：${legalPlaceholders.retention}。数据存储地区：${legalPlaceholders.storageRegion}。`] },
      { title: "委托处理、共享与境外传输", body: ["第三方处理方清单目前为待配置。未完成配置前，Atlas 不应将真实用户文件默认发送至境外 AI、OCR、云服务器或其他服务商。若未来发生境外传输，将在传输前显著提示、取得单独同意并记录政策版本。"] },
      { title: "安全保护措施", body: ["文件默认私有，采用最小权限、敏感信息脱敏、短时授权链接和敏感操作审计记录。日志不得记录完整护照号、银行卡号或 IBAN。正式技术措施和责任边界待确认。"] },
      { title: "你的权利", body: ["你可以申请查询、更正、删除、导出个人资料，撤回授权，注销账号或投诉。入口：个人信息权利申请页面。处理时限和身份核验方式：待确认。"] },
      { title: "未成年人保护", body: ["Atlas 将在正式运营规则中明确未成年人使用条件、监护人同意和特殊保护措施。当前规则：待确认。"] },
      { title: "更新与生效", body: [`政策版本：v0.1-placeholder。生效日期：${legalPlaceholders.effectiveAt}。更新时将展示新版本并在需要时重新获取授权。`] },
    ],
  },
  "sensitive-data": {
    type: "sensitive-data",
    version: "v0.1-placeholder",
    title: "敏感个人信息处理规则",
    summary: "护照、签证、住宿和资金材料会单独请求授权，不使用注册时的统一勾选替代。",
    effectiveAt: legalPlaceholders.effectiveAt,
    status: "placeholder",
    sections: [
      { title: "适用资料", body: ["护照或身份证明、签证和居留材料、住宿地址、资金或银行证明，以及其他能够识别身份的官方文件。"] },
      { title: "单独授权", body: ["上传上述资料前，用户必须主动勾选具体授权框。授权框默认不勾选，接受与拒绝按钮保持接近的视觉权重。"] },
      { title: "授权记录", body: ["系统记录 consentType、policyVersion、acceptedAt、userId 和 relatedDocumentId。用户可以随时申请撤回授权。"] },
      { title: "必要性与保护", body: ["该文件仅用于识别材料状态和提供办理辅助。Atlas 将尽量屏蔽 IBAN、银行卡号、签证号码等非必要敏感信息。"] },
    ],
  },
  "ai-disclaimer": {
    type: "ai-disclaimer",
    version: "v0.1-placeholder",
    title: "AI 服务说明与免责声明",
    summary: "AI 用于整理和辅助，不代表官方结论、法律意见或申请结果。",
    effectiveAt: legalPlaceholders.effectiveAt,
    status: "placeholder",
    sections: [
      { title: "页面提示", body: ["本页面使用人工智能分析资料并生成建议，重要内容请在正式提交前确认。"] },
      { title: "平台定位", body: ["Atlas 是独立的 AI 留学与跨境生活辅助平台，不属于使领馆、移民机关、学校、Campus France、France-Visas 或其他政府机构。"] },
      { title: "服务边界", body: ["Atlas 根据用户提供的信息、上传材料及公开信息，协助整理办理步骤、材料清单、语言内容和任务进度。相关内容不构成法律意见，也不代表任何官方机构的最终要求或决定。"] },
      { title: "最终核对", body: ["政策和办理要求可能发生变化，用户在正式提交前应以学校、使领馆及主管机关发布的信息为准。Atlas 不保证签证、录取、居留许可或其他行政申请必然获批。"] },
      { title: "不会代替提交", body: ["Atlas 不会在未经用户明确确认的情况下，代替用户向官方机构正式提交申请。"] },
    ],
  },
  "third-party": {
    type: "third-party",
    version: "v0.1-placeholder",
    title: "第三方信息共享清单",
    summary: "未确认的供应商不编造，统一显示为待配置。",
    effectiveAt: legalPlaceholders.effectiveAt,
    status: "placeholder",
    sections: [
      { title: "当前状态", body: ["第三方名称、服务类型、处理目的、信息类型、存储地区、隐私政策链接和跨境传输状态：待配置。"] },
    ],
  },
  "privacy-rights": {
    type: "privacy-rights",
    version: "v0.1-placeholder",
    title: "个人信息权利申请",
    summary: "提交查询、更正、删除、导出、撤回授权或注销账号的申请。",
    effectiveAt: legalPlaceholders.effectiveAt,
    status: "placeholder",
    sections: [
      { title: "可申请事项", body: ["查询个人信息、更正信息、导出资料、删除单个文件、清空已上传资料、撤回授权、注销账号及删除关联数据。"] },
      { title: "处理说明", body: ["删除操作需要二次确认。系统会说明将删除的数据、因法律安全或审计需要暂时保留的记录，以及预计完成时间。正式时限：待确认。"] },
    ],
  },
  contact: {
    type: "contact",
    version: "v0.1-placeholder",
    title: "联系我们",
    summary: "运营主体、隐私负责人和投诉渠道尚待确认。",
    effectiveAt: legalPlaceholders.effectiveAt,
    status: "placeholder",
    sections: [
      { title: "隐私与数据问题", body: [`联系人：${legalPlaceholders.contact}`] },
      { title: "运营主体", body: [`主体名称：${legalPlaceholders.operator}`] },
      { title: "投诉与反馈", body: ["正式邮箱、地址和投诉渠道：待确认。"] },
    ],
  },
};

export const thirdPartyProcessors: ThirdPartyProcessor[] = [
  {
    name: "待配置",
    purpose: "待配置",
    dataCategories: ["待配置"],
    storageRegion: "待配置",
    crossBorder: "pending",
    privacyUrl: "待配置",
    enabled: false,
  },
];
