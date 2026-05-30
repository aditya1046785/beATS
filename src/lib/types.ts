export type PlanType = "free" | "pro";

export type UserProfile = {
  id: string;
  githubId: string;
  githubUsername: string;
  githubAccessToken: string;
  name: string;
  email: string;
  avatarUrl: string;
  phone?: string;
  city?: string;
  collegeName?: string;
  degree?: string;
  graduationYear?: string;
  cgpa?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  targetRoles?: string[];
  planType: PlanType;
  planExpiryDate?: string;
  resumesGeneratedThisMonth: number;
  monthTracker: string;
  onboardingComplete: boolean;
  githubProcessed: boolean;
  githubProcessing: boolean;
  githubProcessingStage?: string;
  githubProcessingProgress?: number;
  githubProcessingError?: string;
  lastGithubSyncAt?: string;
  createdAt: string;
};

export type RepoSummary = {
  one_liner: string;
  tech_skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    concepts: string[];
  };
  what_it_does: string;
  notable_implementations: string[];
  impact_or_scale: string | null;
  relevant_roles: string[];
};

export type JobAnalysis = {
  job_title: string;
  company_name: string | null;
  required_skills: string[];
  preferred_skills: string[];
  key_responsibilities: string[];
  keywords: string[];
  experience_level: string;
  domain: string;
};

export type AtsAnalysis = {
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  score_explanation: string;
  domain_mismatch: boolean;
  mismatch_reason: string | null;
  recommended_roles: string[];
};

export type RepositoryRecord = {
  id: string;
  userId: string;
  githubRepoName: string;
  githubRepoUrl: string;
  shortDescription: string;
  primaryLanguage: string;
  languageBreakdown: Record<string, number>;
  topics: string[];
  homepageUrl: string;
  isPinned: boolean;
  stars: number;
  aiSummary: RepoSummary;
  vectorEmbedding: number[];
  githubUpdatedAt: string;
  lastSyncedAt: string;
};

export type ResumeRecord = {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  jdText: string;
  jdEmbedding?: number[];
  selectedRepoIds: string[];
  generatedResumeContent: ResumeContent;
  generatedResumeHtml: string;
  pdfFilePath: string;
  atsMatchScore: number;
  atsMatchedKeywords: string[];
  atsMissedKeywords: string[];
  atsDomainMismatch?: boolean;
  atsMismatchReason?: string | null;
  atsRecommendedRoles?: string[];
  generatedAt: string;
  templateUsed: string;
};

export type PaymentRecord = {
  id: string;
  userId: string;
  planType: "monthly" | "annual";
  amountPaid: number;
  paymentTimestamp: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  paymentStatus: string;
  orderId?: string;
  paymentId?: string;
  signature?: string;
  currency?: string;
};

export type ResumeContent = {
  header: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    linkedinUrl?: string;
    githubUrl: string;
    portfolioUrl?: string;
  };
  education: Array<{
    collegeName: string;
    degree: string;
    graduationYear: string;
    cgpa: string;
  }>;
  technicalSkills: {
    programmingLanguages: string[];
    frameworksLibraries: string[];
    toolsTechnologies: string[];
    databases: string[];
  };
  projects: Array<{
    name: string;
    technologies: string[];
    githubLink: string;
    bullets: string[];
  }>;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  achievements?: string[];
};

export type AppData = {
  users: UserProfile[];
  repositories: RepositoryRecord[];
  resumes: ResumeRecord[];
  payments: PaymentRecord[];
};
