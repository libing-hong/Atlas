import { Application, Material, Order, Student } from "./types";

export const primaryStudent: Student = {
  id: "stu-001",
  name: "林沐晴",
  contact: "WeChat: muqing_atlas",
  email: "muqing@example.com",
  school: "上海财经大学",
  major: "金融学",
  gpa: "86/100",
  language: "IELTS 7.0",
  targetCountries: ["英国", "法国"],
  targetMajor: "Management / Finance",
  budget: "35-45万人民币",
  intake: "2027 Fall",
  paidStatus: "已付报告",
  stage: "选校与材料准备",
  updatedAt: "2026-07-08",
  score: 82,
};

export const students: Student[] = [
  primaryStudent,
  {
    id: "stu-002",
    name: "周以辰",
    contact: "138****9021",
    email: "yichen@example.com",
    school: "华南理工大学",
    major: "软件工程",
    gpa: "3.55/4.0",
    language: "TOEFL 101",
    targetCountries: ["澳洲", "英国"],
    targetMajor: "Data Science",
    budget: "40万人民币以内",
    intake: "2027 Spring",
    paidStatus: "服务中",
    stage: "已递交 2 所",
    updatedAt: "2026-07-07",
    score: 88,
  },
  {
    id: "stu-003",
    name: "陈予安",
    contact: "WeChat: cyan_paris",
    email: "yuan@example.com",
    school: "四川大学",
    major: "法语",
    gpa: "84/100",
    language: "DALF C1",
    targetCountries: ["法国"],
    targetMajor: "Luxury Brand Management",
    budget: "30万人民币以内",
    intake: "2027 Fall",
    paidStatus: "免费线索",
    stage: "等待报告解锁",
    updatedAt: "2026-07-08",
    score: 76,
  },
  {
    id: "stu-004",
    name: "沈知夏",
    contact: "136****1188",
    email: "zhixia@example.com",
    school: "南京大学",
    major: "新闻传播",
    gpa: "89/100",
    language: "IELTS 7.5",
    targetCountries: ["英国"],
    targetMajor: "Media and Communication",
    budget: "45万人民币以内",
    intake: "2026 Fall",
    paidStatus: "服务中",
    stage: "等待 Offer",
    updatedAt: "2026-07-06",
    score: 91,
  },
];

export const materials: Material[] = [
  { name: "护照", status: "已上传", note: "有效期至 2031 年" },
  { name: "成绩单", status: "审核中", note: "等待英文版盖章件确认" },
  { name: "语言成绩", status: "已上传", note: "IELTS 7.0，小分达标" },
  { name: "CV", status: "需更新", note: "建议补充两段项目经历" },
  { name: "PS", status: "待上传", note: "可购买文书服务生成初稿" },
  { name: "推荐信", status: "待上传", note: "建议准备 2 封学术推荐" },
];

export const applications: Application[] = [
  {
    school: "University of Edinburgh",
    country: "英国",
    program: "MSc Finance",
    status: "准备中",
    nextStep: "确认课程匹配并整理 PS 素材",
    deadline: "2026-10-15",
    progress: 32,
  },
  {
    school: "ESSEC Business School",
    country: "法国",
    program: "Master in Management",
    status: "补材料",
    nextStep: "上传英文成绩单与动机信终稿",
    deadline: "2026-09-30",
    progress: 58,
  },
  {
    school: "University of Melbourne",
    country: "澳洲",
    program: "Master of Management",
    status: "已递交",
    nextStep: "等待学校初审结果",
    deadline: "2026-11-20",
    progress: 74,
  },
];

export const orders: Order[] = [
  { id: "ORD-1008", type: "AI报告", amount: 29.9, status: "paid", createdAt: "2026-07-04" },
  { id: "ORD-1012", type: "DIY申请", amount: 299, status: "pending", createdAt: "2026-07-08" },
  { id: "ORD-1013", type: "文书服务", amount: 500, status: "in_progress", createdAt: "2026-07-08" },
];

export const reportHighlights = {
  score: 82,
  countryFit: [
    { country: "英国", fit: 88, note: "课程密度高，金融与管理方向选择丰富" },
    { country: "法国", fit: 81, note: "商学院与精品管理方向有差异化优势" },
    { country: "澳洲", fit: 72, note: "录取稳定性较高，可作为稳妥组合" },
  ],
  strengths: ["财经背景清晰", "语言成绩已达多数项目门槛", "目标专业与经历叙事可形成一致性"],
  risks: ["部分英国热门项目竞争强", "PS 需要突出量化与实习成果", "法国项目可能需要更早准备面试素材"],
  blurredSchools: ["London B***** School", "HEC P****", "The University of S*****"],
};

export const adminMetrics = [
  { label: "今日新增线索", value: "18", tone: "rose" },
  { label: "已付费报告用户", value: "42", tone: "gold" },
  { label: "DIY申请订单", value: "16", tone: "sage" },
  { label: "文书订单", value: "11", tone: "blue" },
  { label: "申请中学生", value: "73", tone: "mist" },
  { label: "已获Offer学生", value: "9", tone: "gold" },
];
