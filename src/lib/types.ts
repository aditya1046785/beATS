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
  explanation: string;
  skills: string[];
  problem: string;
  implementations: string[];
  relevantRoles: string[];
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
  selectedRepoIds: string[];
  generatedResumeContent: ResumeContent;
  generatedResumeHtml: string;
  pdfFilePath: string;
  atsMatchScore: number;
  atsMatchedKeywords: string[];
  atsMissedKeywords: string[];
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
