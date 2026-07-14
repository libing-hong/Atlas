export type JourneyNodeStatus =
  | "ready"
  | "blocked"
  | "in_progress"
  | "awaiting_evidence"
  | "verified"
  | "completed";

export type StageState = "completed" | "current" | "upcoming";

export type JourneyStage = {
  id: string;
  name: string;
  state: StageState;
  progress: number;
};

export type PreparedItem = {
  title: string;
  description: string;
  action: "Open" | "Review" | "Copy" | "Download" | "Edit";
};

export type JourneyNode = {
  id: string;
  title: string;
  stage: string;
  explanation: string;
  status: JourneyNodeStatus;
  deadline: string;
  priority: "High" | "Medium" | "Low";
  whyItMatters: string;
  atlasCanHelpWith: string[];
  blocker?: string;
  missingInformation?: string[];
  primaryCta: string;
  completionRequirement: string;
  officialResources?: OfficialResource[];
};

export type OfficialResource = {
  title: string;
  organization: string;
  url: string;
  actionLabel: string;
  resourceType: "official_website" | "application_form" | "appointment" | "download" | "guidance";
  country?: string;
  region?: string;
  language?: string;
  lastReviewedAt?: string;
  handlingMethod: "online" | "offline" | "email";
  requiredMaterials: string[];
};

export type ActivityItem = {
  label: string;
  time: string;
};

export type DashboardContext = {
  studentName: string;
  currentJourney: string;
  destination: string;
  school: string;
  programme: string;
  intakeDate: string;
  currentStage: string;
  daysUntilVisaAppointment: number;
  daysUntilIntake: number;
};

export type MaterialStatus = "Ready" | "Missing" | "Processing" | "Needs Review" | "Verified" | "Expired";

export type MaterialDocument = {
  id: string;
  name: string;
  category: string;
  status: MaterialStatus;
  uploadDate: string;
  usedBy: string;
  verificationLevel: string;
  expiry: string;
  actions: string[];
};

export type MaterialCategory = {
  name: string;
  ready: number;
  total: number;
};

const dashboardContext: DashboardContext = {
  studentName: "Lin Muqing",
  currentJourney: "France student visa application",
  destination: "Paris, France",
  school: "ESSEC Business School",
  programme: "Master in Management",
  intakeDate: "September 2026",
  currentStage: "Visa",
  daysUntilVisaAppointment: 18,
  daysUntilIntake: 62,
};

const stages: JourneyStage[] = [
  { id: "offer", name: "Offer", state: "completed", progress: 100 },
  { id: "visa", name: "Visa", state: "current", progress: 46 },
  { id: "pre-arrival", name: "Pre-arrival", state: "upcoming", progress: 12 },
  { id: "arrival", name: "Arrival", state: "upcoming", progress: 0 },
  { id: "settling-in", name: "Settling In", state: "upcoming", progress: 0 },
  { id: "student-life", name: "Student Life", state: "upcoming", progress: 0 },
  { id: "graduation", name: "Graduation", state: "upcoming", progress: 0 },
];

const nodes: JourneyNode[] = [
  {
    id: "prepare-student-visa-documents",
    title: "Prepare Student Visa Documents",
    stage: "Visa",
    explanation: "Confirm the exact document set before your visa appointment opens.",
    status: "ready",
    deadline: "2026-07-31",
    priority: "High",
    whyItMatters:
      "Your appointment window is close, and one missing housing document can delay the visa file.",
    atlasCanHelpWith: [
      "Personalized visa checklist",
      "French field translations",
      "Accommodation proof requirements",
      "Common missing item reminder",
    ],
    primaryCta: "Review and prepare materials",
    completionRequirement: "Checklist reviewed and required proof uploaded.",
    officialResources: [
      {
        title: "France-Visas student visa application",
        organization: "France-Visas",
        url: "https://france-visas.gouv.fr/",
        actionLabel: "Start online application",
        resourceType: "application_form",
        country: "France",
        language: "French / English",
        lastReviewedAt: "2026-07-13",
        handlingMethod: "online",
        requiredMaterials: [
          "Passport scan",
          "Admission offer",
          "Accommodation proof",
          "Financial proof",
          "Campus France account details",
        ],
      },
      {
        title: "Etudes en France procedure",
        organization: "Campus France",
        url: "https://pastel.diplomatie.gouv.fr/etudesenfrance/",
        actionLabel: "Open official platform",
        resourceType: "official_website",
        country: "France",
        language: "French / English",
        lastReviewedAt: "2026-07-13",
        handlingMethod: "online",
        requiredMaterials: ["Admission offer", "Passport scan", "Programme details"],
      },
    ],
  },
  {
    id: "confirm-accommodation-proof",
    title: "Confirm Accommodation Proof",
    stage: "Visa",
    explanation: "Secure a housing certificate, lease, or official reservation letter.",
    status: "blocked",
    deadline: "2026-08-03",
    priority: "High",
    whyItMatters:
      "Campus France and consular review often expect a credible first address in France.",
    atlasCanHelpWith: ["Draft request email", "French address format", "Accepted proof examples"],
    blocker: "Atlas needs your final accommodation address and move-in date before it can prepare the visa materials.",
    missingInformation: ["French address", "Move-in date", "Housing provider confirmation"],
    primaryCta: "Add accommodation information",
    completionRequirement: "Accommodation evidence attached to visa document set.",
    officialResources: [
      {
        title: "ESSEC housing and arrival guidance",
        organization: "ESSEC Business School",
        url: "https://www.essec.edu/en/pages/about-essec/essec-business-school/essec-housing/",
        actionLabel: "View official requirements",
        resourceType: "guidance",
        country: "France",
        region: "Ile-de-France",
        language: "English",
        lastReviewedAt: "2026-07-13",
        handlingMethod: "online",
        requiredMaterials: ["Admission offer", "Move-in date", "Housing provider confirmation"],
      },
    ],
  },
  {
    id: "campus-france-account",
    title: "Update Campus France Account",
    stage: "Visa",
    explanation: "Make sure your school, programme, and intake details match your offer.",
    status: "in_progress",
    deadline: "2026-07-24",
    priority: "Medium",
    whyItMatters: "Mismatched programme details can create avoidable review questions.",
    atlasCanHelpWith: ["Copy-ready programme details", "Date format conversion", "Saved school facts"],
    primaryCta: "Continue workspace",
    completionRequirement: "Account details checked against the offer letter.",
    officialResources: [
      {
        title: "Etudes en France account",
        organization: "Campus France",
        url: "https://pastel.diplomatie.gouv.fr/etudesenfrance/",
        actionLabel: "Open official platform",
        resourceType: "official_website",
        country: "France",
        language: "French / English",
        lastReviewedAt: "2026-07-13",
        handlingMethod: "online",
        requiredMaterials: ["Passport scan", "Admission offer", "Programme details"],
      },
    ],
  },
  {
    id: "upload-offer-evidence",
    title: "Upload Offer Evidence",
    stage: "Offer",
    explanation: "Attach the final admission offer so Atlas can use verified programme facts.",
    status: "awaiting_evidence",
    deadline: "2026-07-18",
    priority: "Medium",
    whyItMatters: "The offer letter unlocks visa and arrival dependencies.",
    atlasCanHelpWith: ["Document category suggestion", "Minimum field extraction preview"],
    primaryCta: "Upload evidence",
    completionRequirement: "Offer evidence reviewed and confirmed.",
  },
  {
    id: "accept-offer",
    title: "Accept Offer",
    stage: "Offer",
    explanation: "Confirm the offer decision and preserve deadline history.",
    status: "verified",
    deadline: "2026-07-08",
    priority: "High",
    whyItMatters: "The accepted offer starts visa preparation.",
    atlasCanHelpWith: ["Offer summary", "Acceptance record", "Next stage activation"],
    primaryCta: "View record",
    completionRequirement: "Official offer acceptance confirmed.",
  },
  {
    id: "prepare-arrival-admin",
    title: "Prepare Arrival Administration",
    stage: "Pre-arrival",
    explanation: "Plan bank, insurance, transport, and first-week registrations.",
    status: "completed",
    deadline: "2026-09-05",
    priority: "Low",
    whyItMatters: "Arrival tasks become easier once visa documents are stable.",
    atlasCanHelpWith: ["Arrival checklist", "Insurance reminder", "First-week map"],
    primaryCta: "Review completed plan",
    completionRequirement: "Arrival plan created from accepted offer and destination facts.",
  },
];

const preparedItems: PreparedItem[] = [
  {
    title: "Personalized Visa Checklist",
    description: "A checklist tailored to France, ESSEC, your intake, and your current missing proof.",
    action: "Open",
  },
  {
    title: "Pre-filled Personal Details",
    description: "Name, date of birth, passport expiry, school, programme, and intake fields.",
    action: "Review",
  },
  {
    title: "French Address Format",
    description: "A copy-ready address structure for visa and accommodation forms.",
    action: "Copy",
  },
  {
    title: "Translated Form Fields",
    description: "French and English labels for common visa application fields.",
    action: "Download",
  },
  {
    title: "Draft Accommodation Request Email",
    description: "A polite request asking the housing provider for visa-compatible proof.",
    action: "Edit",
  },
  {
    title: "Common Missing Item Reminder",
    description: "A calm reminder of items that are often forgotten before a visa appointment.",
    action: "Review",
  },
];

const activities: ActivityItem[] = [
  { label: "Visa checklist generated from offer and destination facts.", time: "Today" },
  { label: "Atlas found that accommodation proof is still needed for the visa step.", time: "Yesterday" },
  { label: "Offer acceptance was added to your application record.", time: "Jul 8" },
];

const materialCategories: MaterialCategory[] = [
  { name: "Identity", ready: 2, total: 2 },
  { name: "Admission", ready: 1, total: 1 },
  { name: "Academic Records", ready: 1, total: 2 },
  { name: "Diplomas", ready: 0, total: 1 },
  { name: "Language Results", ready: 1, total: 1 },
  { name: "CV", ready: 1, total: 1 },
  { name: "Personal Statement", ready: 0, total: 1 },
  { name: "Recommendation Letters", ready: 1, total: 2 },
  { name: "Financial Documents", ready: 0, total: 1 },
  { name: "Accommodation", ready: 0, total: 1 },
  { name: "Insurance", ready: 0, total: 1 },
  { name: "Visa", ready: 2, total: 5 },
  { name: "Completion Evidence", ready: 1, total: 2 },
];

const documents: MaterialDocument[] = [
  {
    id: "passport",
    name: "Passport scan",
    category: "Identity",
    status: "Verified",
    uploadDate: "2026-07-04",
    usedBy: "Visa documents",
    verificationLevel: "Evidence detected",
    expiry: "2031-05-12",
    actions: ["View", "Replace", "Link"],
  },
  {
    id: "offer-letter",
    name: "ESSEC offer letter",
    category: "Admission",
    status: "Ready",
    uploadDate: "2026-07-08",
    usedBy: "Visa, application facts",
    verificationLevel: "Self confirmed",
    expiry: "Not applicable",
    actions: ["View", "Replace", "Link"],
  },
  {
    id: "transcript",
    name: "English transcript",
    category: "Academic Records",
    status: "Needs Review",
    uploadDate: "2026-07-06",
    usedBy: "Applications",
    verificationLevel: "Needs human review",
    expiry: "Not applicable",
    actions: ["Review", "Replace"],
  },
  {
    id: "cv",
    name: "CV - finance version",
    category: "CV",
    status: "Ready",
    uploadDate: "2026-07-05",
    usedBy: "Applications",
    verificationLevel: "Self confirmed",
    expiry: "Not applicable",
    actions: ["View", "Replace", "Download"],
  },
  {
    id: "ps",
    name: "Personal statement",
    category: "Personal Statement",
    status: "Missing",
    uploadDate: "Not uploaded",
    usedBy: "Applications",
    verificationLevel: "Not available",
    expiry: "Not applicable",
    actions: ["Upload"],
  },
  {
    id: "recommendation-1",
    name: "Recommendation letter - professor",
    category: "Recommendation Letters",
    status: "Processing",
    uploadDate: "2026-07-09",
    usedBy: "Applications",
    verificationLevel: "Being checked",
    expiry: "Not applicable",
    actions: ["View status"],
  },
  {
    id: "housing-proof",
    name: "Accommodation proof",
    category: "Accommodation",
    status: "Missing",
    uploadDate: "Not uploaded",
    usedBy: "Visa documents",
    verificationLevel: "Not available",
    expiry: "Required before appointment",
    actions: ["Upload", "Request"],
  },
  {
    id: "bank-statement",
    name: "Financial proof",
    category: "Financial Documents",
    status: "Expired",
    uploadDate: "2026-06-01",
    usedBy: "Visa documents",
    verificationLevel: "Expired evidence",
    expiry: "2026-07-01",
    actions: ["Replace", "Explain"],
  },
];

export const DevelopmentUserContext = {
  getDashboardContext: () => dashboardContext,
};

export const DevelopmentJourneyRepository = {
  getStages: () => stages,
  getNodes: () => nodes,
  getNode: (nodeId: string) => nodes.find((node) => node.id === nodeId) ?? nodes[0],
  getNextBestAction: () => nodes[0],
  getPreparedItems: () => preparedItems,
  getRecentActivity: () => activities,
};

export const DevelopmentMaterialRepository = {
  getCategories: () => materialCategories,
  getDocuments: () => documents,
  getReadiness: () => ({
    ready: documents.filter((document) => document.status === "Ready" || document.status === "Verified").length,
    total: documents.length,
    missing: documents.filter((document) => document.status === "Missing").length,
    expiring: documents.filter((document) => document.status === "Expired").length,
  }),
};
