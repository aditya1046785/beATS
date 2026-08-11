import "server-only";
import crypto from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";
import {
  AppData,
  PaymentRecord,
  RepositoryRecord,
  ResumeRecord,
  UserProfile,
} from "./types";

// ---------- Token encryption (unchanged logic, still worth doing before it hits the DB) ----------

let warnedAboutMissingEncryptionKey = false;

function getEncryptionKey() {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    if (!warnedAboutMissingEncryptionKey) {
      warnedAboutMissingEncryptionKey = true;
      console.warn("[store] TOKEN_ENCRYPTION_KEY is not set; GitHub tokens will remain unencrypted.");
    }
    return null;
  }
  try {
    const decoded = Buffer.from(key, "base64");
    if (decoded.length !== 32) throw new Error("Invalid key length");
    return decoded;
  } catch {
    if (!warnedAboutMissingEncryptionKey) {
      warnedAboutMissingEncryptionKey = true;
      console.warn("[store] TOKEN_ENCRYPTION_KEY must be a valid base64-encoded 32-byte secret.");
    }
    return null;
  }
}

function isEncryptedToken(value: string) {
  return value.split(":").length === 3;
}

export function encryptToken(token: string) {
  const key = getEncryptionKey();
  if (!key || !token || isEncryptedToken(token)) return token;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), encrypted.toString("base64"), tag.toString("base64")].join(":");
}

export function decryptToken(token: string) {
  const key = getEncryptionKey();
  if (!key || !token || !isEncryptedToken(token)) return token;
  try {
    const [ivText, payloadText, tagText] = token.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64"));
    decipher.setAuthTag(Buffer.from(tagText, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payloadText, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return token;
  }
}

// ---------- Row <-> App type mapping (Postgres uses snake_case, our types use camelCase) ----------

type UserRow = {
  id: string;
  github_id: string;
  github_username: string;
  github_access_token: string;
  name: string;
  email: string;
  avatar_url: string;
  phone: string | null;
  city: string | null;
  college_name: string | null;
  degree: string | null;
  graduation_year: string | null;
  cgpa: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  target_roles: string[] | null;
  plan_type: UserProfile["planType"];
  plan_expiry_date: string | null;
  resumes_generated_this_month: number;
  month_tracker: string;
  onboarding_complete: boolean;
  github_processed: boolean;
  github_processing: boolean;
  github_processing_stage: string | null;
  github_processing_progress: number | null;
  github_processing_error: string | null;
  github_processing_current_repo: string | null;
  github_processing_completed: number | null;
  github_processing_total: number | null;
  github_processing_repos: UserProfile["githubProcessingRepos"] | null;
  last_github_sync_at: string | null;
  created_at: string;
};

type RepositoryRow = {
  id: string;
  user_id: string;
  github_repo_name: string;
  github_repo_url: string;
  short_description: string;
  primary_language: string;
  language_breakdown: Record<string, number> | null;
  topics: string[] | null;
  homepage_url: string;
  is_pinned: boolean;
  stars: number;
  ai_summary: RepositoryRecord["aiSummary"];
  vector_embedding: number[] | null;
  github_updated_at: string;
  last_synced_at: string;
};

type ResumeRow = {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  jd_text: string;
  jd_embedding: number[] | null;
  selected_repo_ids: string[] | null;
  generated_resume_content: ResumeRecord["generatedResumeContent"];
  generated_resume_html: string;
  pdf_file_path: string;
  ats_match_score: number;
  ats_matched_keywords: string[] | null;
  ats_missed_keywords: string[] | null;
  ats_domain_mismatch: boolean | null;
  ats_mismatch_reason: string | null;
  ats_recommended_roles: string[] | null;
  generated_at: string;
  template_used: string;
};

type PaymentRow = {
  id: string;
  user_id: string;
  plan_type: PaymentRecord["planType"];
  amount_paid: number;
  payment_timestamp: string;
  subscription_start_date: string;
  subscription_end_date: string;
  payment_status: string;
  order_id: string | null;
  payment_id: string | null;
  signature: string | null;
  currency: string | null;
};

function userRowToProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    githubId: row.github_id,
    githubUsername: row.github_username,
    githubAccessToken: decryptToken(row.github_access_token),
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    phone: row.phone ?? undefined,
    city: row.city ?? undefined,
    collegeName: row.college_name ?? undefined,
    degree: row.degree ?? undefined,
    graduationYear: row.graduation_year ?? undefined,
    cgpa: row.cgpa ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    portfolioUrl: row.portfolio_url ?? undefined,
    targetRoles: row.target_roles ?? undefined,
    planType: row.plan_type,
    planExpiryDate: row.plan_expiry_date ?? undefined,
    resumesGeneratedThisMonth: row.resumes_generated_this_month,
    monthTracker: row.month_tracker,
    onboardingComplete: row.onboarding_complete,
    githubProcessed: row.github_processed,
    githubProcessing: row.github_processing,
    githubProcessingStage: row.github_processing_stage ?? undefined,
    githubProcessingProgress: row.github_processing_progress ?? undefined,
    githubProcessingError: row.github_processing_error ?? undefined,
    githubProcessingCurrentRepo: row.github_processing_current_repo ?? undefined,
    githubProcessingCompleted: row.github_processing_completed ?? undefined,
    githubProcessingTotal: row.github_processing_total ?? undefined,
    githubProcessingRepos: row.github_processing_repos ?? undefined,
    lastGithubSyncAt: row.last_github_sync_at ?? undefined,
    createdAt: row.created_at,
  };
}

function userProfileToRow(user: UserProfile) {
  return {
    id: user.id,
    github_id: user.githubId,
    github_username: user.githubUsername,
    github_access_token: encryptToken(user.githubAccessToken),
    name: user.name,
    email: user.email,
    avatar_url: user.avatarUrl,
    phone: user.phone ?? null,
    city: user.city ?? null,
    college_name: user.collegeName ?? null,
    degree: user.degree ?? null,
    graduation_year: user.graduationYear ?? null,
    cgpa: user.cgpa ?? null,
    linkedin_url: user.linkedinUrl ?? null,
    portfolio_url: user.portfolioUrl ?? null,
    target_roles: user.targetRoles ?? null,
    plan_type: user.planType,
    plan_expiry_date: user.planExpiryDate ?? null,
    resumes_generated_this_month: user.resumesGeneratedThisMonth,
    month_tracker: user.monthTracker,
    onboarding_complete: user.onboardingComplete,
    github_processed: user.githubProcessed,
    github_processing: user.githubProcessing,
    github_processing_stage: user.githubProcessingStage ?? null,
    github_processing_progress: user.githubProcessingProgress ?? null,
    github_processing_error: user.githubProcessingError ?? null,
    github_processing_current_repo: user.githubProcessingCurrentRepo ?? null,
    github_processing_completed: user.githubProcessingCompleted ?? null,
    github_processing_total: user.githubProcessingTotal ?? null,
    github_processing_repos: user.githubProcessingRepos ?? null,
    last_github_sync_at: user.lastGithubSyncAt ?? null,
    created_at: user.createdAt,
  };
}

function repoRowToRecord(row: RepositoryRow): RepositoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    githubRepoName: row.github_repo_name,
    githubRepoUrl: row.github_repo_url,
    shortDescription: row.short_description,
    primaryLanguage: row.primary_language,
    languageBreakdown: row.language_breakdown ?? {},
    topics: row.topics ?? [],
    homepageUrl: row.homepage_url,
    isPinned: row.is_pinned,
    stars: row.stars,
    aiSummary: row.ai_summary,
    vectorEmbedding: row.vector_embedding ?? [],
    githubUpdatedAt: row.github_updated_at,
    lastSyncedAt: row.last_synced_at,
  };
}

function repoRecordToRow(repo: RepositoryRecord) {
  return {
    id: repo.id,
    user_id: repo.userId,
    github_repo_name: repo.githubRepoName,
    github_repo_url: repo.githubRepoUrl,
    short_description: repo.shortDescription,
    primary_language: repo.primaryLanguage,
    language_breakdown: repo.languageBreakdown,
    topics: repo.topics,
    homepage_url: repo.homepageUrl,
    is_pinned: repo.isPinned,
    stars: repo.stars,
    ai_summary: repo.aiSummary,
    // pgvector rejects a zero-dimension array ("vector must have at least 1 dimension").
    // A repo with no embedding (nothing to analyze, or embedding call failed) stores
    // NULL; repoRowToRecord reads NULL back as [].
    vector_embedding: repo.vectorEmbedding.length ? repo.vectorEmbedding : null,
    github_updated_at: repo.githubUpdatedAt,
    last_synced_at: repo.lastSyncedAt,
  };
}

function resumeRowToRecord(row: ResumeRow): ResumeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    jobTitle: row.job_title,
    companyName: row.company_name,
    jdText: row.jd_text,
    jdEmbedding: row.jd_embedding ?? undefined,
    selectedRepoIds: row.selected_repo_ids ?? [],
    generatedResumeContent: row.generated_resume_content,
    generatedResumeHtml: row.generated_resume_html,
    pdfFilePath: row.pdf_file_path,
    atsMatchScore: row.ats_match_score,
    atsMatchedKeywords: row.ats_matched_keywords ?? [],
    atsMissedKeywords: row.ats_missed_keywords ?? [],
    atsDomainMismatch: row.ats_domain_mismatch ?? undefined,
    atsMismatchReason: row.ats_mismatch_reason ?? undefined,
    atsRecommendedRoles: row.ats_recommended_roles ?? undefined,
    generatedAt: row.generated_at,
    templateUsed: row.template_used,
  };
}

function resumeRecordToRow(resume: ResumeRecord) {
  return {
    id: resume.id,
    user_id: resume.userId,
    job_title: resume.jobTitle,
    company_name: resume.companyName,
    jd_text: resume.jdText,
    jd_embedding: resume.jdEmbedding ?? null,
    selected_repo_ids: resume.selectedRepoIds,
    generated_resume_content: resume.generatedResumeContent,
    generated_resume_html: resume.generatedResumeHtml,
    pdf_file_path: resume.pdfFilePath,
    ats_match_score: resume.atsMatchScore,
    ats_matched_keywords: resume.atsMatchedKeywords,
    ats_missed_keywords: resume.atsMissedKeywords,
    ats_domain_mismatch: resume.atsDomainMismatch ?? null,
    ats_mismatch_reason: resume.atsMismatchReason ?? null,
    ats_recommended_roles: resume.atsRecommendedRoles ?? null,
    generated_at: resume.generatedAt,
    template_used: resume.templateUsed,
  };
}

function paymentRowToRecord(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    planType: row.plan_type,
    amountPaid: row.amount_paid,
    paymentTimestamp: row.payment_timestamp,
    subscriptionStartDate: row.subscription_start_date,
    subscriptionEndDate: row.subscription_end_date,
    paymentStatus: row.payment_status,
    orderId: row.order_id ?? undefined,
    paymentId: row.payment_id ?? undefined,
    signature: row.signature ?? undefined,
    currency: row.currency ?? undefined,
  };
}

function paymentRecordToRow(payment: PaymentRecord) {
  return {
    id: payment.id,
    user_id: payment.userId,
    plan_type: payment.planType,
    amount_paid: payment.amountPaid,
    payment_timestamp: payment.paymentTimestamp,
    subscription_start_date: payment.subscriptionStartDate,
    subscription_end_date: payment.subscriptionEndDate,
    payment_status: payment.paymentStatus,
    order_id: payment.orderId ?? null,
    payment_id: payment.paymentId ?? null,
    signature: payment.signature ?? null,
    currency: payment.currency ?? null,
  };
}

// ---------- Public API (same function names/signatures as before) ----------

// No-op now — tables are created once via schema.sql, not at request time.
export async function ensureStorage() {
  return;
}

export async function readData(): Promise<AppData> {
  const [{ data: users, error: usersErr }, { data: repos, error: reposErr }, { data: resumes, error: resumesErr }, { data: payments, error: paymentsErr }] =
    await Promise.all([
      supabaseAdmin.from("users").select("*"),
      supabaseAdmin.from("repositories").select("*"),
      supabaseAdmin.from("resumes").select("*"),
      supabaseAdmin.from("payments").select("*"),
    ]);

  if (usersErr) throw usersErr;
  if (reposErr) throw reposErr;
  if (resumesErr) throw resumesErr;
  if (paymentsErr) throw paymentsErr;

  return {
    users: (users ?? []).map(userRowToProfile),
    repositories: (repos ?? []).map(repoRowToRecord),
    resumes: (resumes ?? []).map(resumeRowToRecord),
    payments: (payments ?? []).map(paymentRowToRecord),
  };
}

// Bulk overwrite — kept for compatibility with any code using updateData().
// For most cases, prefer the targeted functions below (saveUser, addResume, etc.)
// since they avoid re-reading/re-writing the entire dataset.
export async function writeData(data: AppData) {
  if (data.users.length) {
    const { error } = await supabaseAdmin.from("users").upsert(data.users.map(userProfileToRow));
    if (error) throw error;
  }
  if (data.repositories.length) {
    const { error } = await supabaseAdmin.from("repositories").upsert(data.repositories.map(repoRecordToRow));
    if (error) throw error;
  }
  if (data.resumes.length) {
    const { error } = await supabaseAdmin.from("resumes").upsert(data.resumes.map(resumeRecordToRow));
    if (error) throw error;
  }
  if (data.payments.length) {
    const { error } = await supabaseAdmin.from("payments").upsert(data.payments.map(paymentRecordToRow));
    if (error) throw error;
  }
}

export async function updateData(mutator: (data: AppData) => void | Promise<void>) {
  const data = await readData();
  await mutator(data);
  await writeData(data);
  return data;
}

export async function getUser(id: string) {
  const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? userRowToProfile(data) : undefined;
}

export async function saveUser(user: UserProfile) {
  const { error } = await supabaseAdmin.from("users").upsert(userProfileToRow(user));
  if (error) throw error;
}

export async function replaceUserRepositories(userId: string, repositories: RepositoryRecord[]) {
  const { error: deleteError } = await supabaseAdmin.from("repositories").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (repositories.length) {
    const { error: insertError } = await supabaseAdmin
      .from("repositories")
      .insert(repositories.map(repoRecordToRow));
    if (insertError) throw insertError;
  }
}

export async function upsertUserRepositories(userId: string, repositories: RepositoryRecord[]) {
  if (!repositories.length) return;
  // Relies on the unique(user_id, github_repo_name) constraint from schema.sql
  // to merge on conflict instead of creating duplicates.
  const { error } = await supabaseAdmin
    .from("repositories")
    .upsert(repositories.map(repoRecordToRow), { onConflict: "user_id,github_repo_name" });
  if (error) throw error;
}

export async function getUserRepositories(userId: string) {
  const { data, error } = await supabaseAdmin.from("repositories").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map(repoRowToRecord);
}

export async function addResume(resume: ResumeRecord) {
  const { error } = await supabaseAdmin.from("resumes").insert(resumeRecordToRow(resume));
  if (error) throw error;
}

export async function addPaymentRecord(payment: PaymentRecord) {
  const { error } = await supabaseAdmin.from("payments").insert(paymentRecordToRow(payment));
  if (error) throw error;
}

export async function getUserPayments(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("payment_timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(paymentRowToRecord);
}

export async function getUserResumes(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(resumeRowToRecord);
}

export async function getResumeForUser(userId: string, resumeId: string) {
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? resumeRowToRecord(data) : undefined;
}

// Uploads a generated PDF buffer to the 'resumes' bucket in Supabase Storage
// and returns its public URL. Replaces local filesystem writes, which don't
// persist (and aren't even writable) on Vercel's serverless functions.
export async function uploadResumePdf(fileName: string, pdfBuffer: Buffer): Promise<string> {
  const { error } = await supabaseAdmin.storage.from("resumes").upload(fileName, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from("resumes").getPublicUrl(fileName);
  return data.publicUrl;
}