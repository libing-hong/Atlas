export type Country = "英国" | "法国" | "澳洲";

export type ApplicationStatus =
  | "准备中"
  | "已递交"
  | "审核中"
  | "补材料"
  | "面试"
  | "已获Offer"
  | "被拒";

export type OrderStatus = "pending" | "paid" | "in_progress" | "completed";

export type MaterialStatus = "已上传" | "待上传" | "需更新" | "审核中";

export type Student = {
  id: string;
  name: string;
  contact: string;
  email: string;
  school: string;
  major: string;
  gpa: string;
  language: string;
  targetCountries: Country[];
  targetMajor: string;
  budget: string;
  intake: string;
  paidStatus: "免费线索" | "已付报告" | "服务中";
  stage: string;
  updatedAt: string;
  score: number;
};

export type Material = {
  name: string;
  status: MaterialStatus;
  note: string;
};

export type Application = {
  school: string;
  country: Country;
  program: string;
  status: ApplicationStatus;
  nextStep: string;
  deadline: string;
  progress: number;
};

export type Order = {
  id: string;
  type: "AI报告" | "DIY申请" | "文书服务";
  amount: number;
  status: OrderStatus;
  createdAt: string;
};
