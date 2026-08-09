import "server-only";
import fs from "node:fs";
import path from "node:path";
import { AtsAnalysis, JobAnalysis, RepoSummary, RepositoryRecord, ResumeContent, UserProfile } from "./types";

function readLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};

  const vars: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }

  return vars;
}

function getEnvValue(key: string) {
  const localEnv = readLocalEnv();
  return localEnv[key] || process.env[key] || "";
}

const MODEL = getEnvValue("OPENROUTER_MODEL") || "openai/gpt-5.6-luna";
const OPENROUTER_TIMEOUT_MS = Number(getEnvValue("OPENROUTER_TIMEOUT_MS") || 45000);

async function callOpenRouter(system: string, user: string) {
  const apiKey = getEnvValue("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  const referer = getEnvValue("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": referer,
    "X-Title": "PositionPerfect AI",
  };

  const startedAt = Date.now();
  const promptType =
    system === atsScoreSystemPrompt
      ? "ats"
      : system.includes("Return valid JSON only")
        ? "retry"
        : system === resumeContentSystemPrompt
          ? "resume"
          : system === jobAnalysisSystemPrompt
            ? "job-meta"
            : system === repositorySummarySystemPrompt
              ? "repo-summary"
              : "unknown";

  console.info("[openrouter] request started", {
    model: MODEL,
    promptType,
    timeoutMs: OPENROUTER_TIMEOUT_MS,
    systemLength: system.length,
    userLength: user.length,
  });

  let response: Response;
  try {
    response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 3500,
          temperature: 0.2,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      }
    );
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error("[openrouter] TIMED OUT", {
        model: MODEL,
        promptType,
        timeoutMs: OPENROUTER_TIMEOUT_MS,
        durationMs: elapsed,
      });
      throw new Error(
        `OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS}ms. Check network access to openrouter.ai and that the model "${MODEL}" is responding.`,
      );
    }
    console.error("[openrouter] request error", {
      model: MODEL,
      promptType,
      durationMs: elapsed,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`OpenRouter request error: ${error instanceof Error ? error.message : String(error)}`);
  }

  const durationMs = Date.now() - startedAt;
  const status = response.status;
  const detail = await response.text().catch(() => "");
  console.info("[openrouter] request finished", {
    model: MODEL,
    promptType,
    status,
    durationMs,
    responseBytes: detail.length,
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${status} ${detail.slice(0, 300)}`);
  }
  const payload = JSON.parse(detail) as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content || "";
}

function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("AI returned malformed JSON");
  const payload = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  if (!payload || typeof payload !== "object") throw new Error("AI returned invalid JSON structure");
  return payload as T;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every(isString);
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isString) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function normalizeTechStack(value: unknown) {
  if (Array.isArray(value)) return value.filter(isString);
  if (!isString(value)) return [];
  return value
    .split(/[,/|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateRepoSummary(value: unknown): RepoSummary {
  if (!value || typeof value !== "object") throw new Error("AI returned invalid repository summary");
  const record = value as Record<string, unknown>;
  const techSkills = record.tech_skills as Record<string, unknown> | undefined;
  if (
    !isString(record.one_liner) ||
    !techSkills ||
    !isString(record.what_it_does) ||
    !isStringArray(record.notable_implementations) ||
    !isNullableString(record.impact_or_scale) ||
    !isStringArray(record.relevant_roles)
  ) {
    throw new Error("AI returned invalid repository summary");
  }

  if (
    !isStringArray(techSkills.languages) ||
    !isStringArray(techSkills.frameworks) ||
    !isStringArray(techSkills.tools) ||
    !isStringArray(techSkills.concepts)
  ) {
    throw new Error("AI returned invalid repository summary");
  }

  return {
    one_liner: record.one_liner,
    tech_skills: {
      languages: techSkills.languages,
      frameworks: techSkills.frameworks,
      tools: techSkills.tools,
      concepts: techSkills.concepts,
    },
    what_it_does: record.what_it_does,
    notable_implementations: record.notable_implementations,
    impact_or_scale: record.impact_or_scale,
    relevant_roles: record.relevant_roles,
  };
}

function validateJobAnalysis(value: unknown): JobAnalysis {
  if (!value || typeof value !== "object") throw new Error("AI returned invalid job metadata");
  const record = value as Record<string, unknown>;
  if (
    !isString(record.job_title) ||
    !isNullableString(record.company_name) ||
    !isStringArray(record.required_skills) ||
    !isStringArray(record.preferred_skills) ||
    !isStringArray(record.key_responsibilities) ||
    !isStringArray(record.keywords) ||
    !isString(record.experience_level) ||
    !isString(record.domain)
  ) {
    throw new Error("AI returned invalid job metadata");
  }

  return {
    job_title: record.job_title,
    company_name: record.company_name,
    required_skills: record.required_skills,
    preferred_skills: record.preferred_skills,
    key_responsibilities: record.key_responsibilities,
    keywords: record.keywords,
    experience_level: record.experience_level,
    domain: record.domain,
  };
}

function validateAtsAnalysis(value: unknown): AtsAnalysis {
  if (!value || typeof value !== "object") throw new Error("AI returned invalid ATS analysis");
  const record = value as Record<string, unknown>;
  if (
    typeof record.ats_score !== "number" ||
    !isStringArray(record.matched_keywords) ||
    !isStringArray(record.missing_keywords) ||
    !isString(record.score_explanation) ||
    typeof record.domain_mismatch !== "boolean" ||
    !(record.mismatch_reason === null || typeof record.mismatch_reason === "string") ||
    !isStringArray(record.recommended_roles)
  ) {
    throw new Error("AI returned invalid ATS analysis");
  }

  return {
    ats_score: record.ats_score,
    matched_keywords: record.matched_keywords,
    missing_keywords: record.missing_keywords,
    score_explanation: record.score_explanation,
    domain_mismatch: record.domain_mismatch,
    mismatch_reason: record.mismatch_reason,
    recommended_roles: record.recommended_roles,
  };
}

function validateResumeContent(value: unknown): ResumeContent {
  if (!value || typeof value !== "object") throw new Error("AI returned invalid resume JSON");
  const record = value as Record<string, unknown>;
  const header = record.header as Record<string, unknown> | undefined;
  const education = Array.isArray(record.education)
    ? record.education
    : record.education && typeof record.education === "object"
      ? [record.education]
      : [];
  const skills = record.skills as Record<string, unknown> | undefined;
  const projects = Array.isArray(record.projects) ? record.projects : [];

  if (!header || !skills) {
    throw new Error("AI returned invalid resume JSON");
  }

  if (
    !(isString(header.name) || typeof header.name === "undefined") ||
    !(isString(header.email) || typeof header.email === "undefined") ||
    !(isString(header.phone) || typeof header.phone === "undefined") ||
    !(isString(header.city) || typeof header.city === "undefined") ||
    !isNullableString(header.linkedin) ||
    !(isString(header.github) || typeof header.github === "undefined") ||
    !isNullableString(header.portfolio) ||
    !(isStringArray(skills.languages) || typeof skills.languages === "undefined") ||
    !(isStringArray(skills.frameworks) || typeof skills.frameworks === "undefined") ||
    !(isStringArray(skills.tools) || typeof skills.tools === "undefined") ||
    !(isStringArray(skills.databases) || typeof skills.databases === "undefined")
  ) {
    throw new Error("AI returned invalid resume JSON");
  }

  return {
    header: {
      fullName: String(header.name || ""),
      phone: String(header.phone || ""),
      email: String(header.email || ""),
      city: String(header.city || ""),
      linkedinUrl: header.linkedin ? String(header.linkedin) : "",
      githubUrl: String(header.github || ""),
      portfolioUrl: header.portfolio ? String(header.portfolio) : "",
    },
    education: education
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          collegeName: String(entry.college || ""),
          degree: String(entry.degree || ""),
          graduationYear: String(entry.graduation_year || ""),
          cgpa: String(entry.cgpa || ""),
        };
      }),
    technicalSkills: {
      programmingLanguages: normalizeStringArray(skills.languages),
      frameworksLibraries: normalizeStringArray(skills.frameworks),
      toolsTechnologies: normalizeStringArray(skills.tools),
      databases: normalizeStringArray(skills.databases),
    },
    projects: projects
      .filter((item) => item && typeof item === "object")
      .slice(0, 4)
      .map((item) => {
        const project = item as Record<string, unknown>;
        return {
          name: String(project.name || ""),
          technologies: normalizeTechStack(project.tech_stack),
          githubLink: String(project.github_url || ""),
          bullets: normalizeStringArray(project.bullets).slice(0, 3),
        };
      }),
    experience: [],
    achievements: [],
  };
}

async function callJson<T>(system: string, user: string, validate: (value: unknown) => T, debugLabel?: string) {
  const first = await callOpenRouter(system, user);
  if (debugLabel) {
    console.info(`[${debugLabel}] raw AI response`, first);
  }
  try {
    return validate(parseJson<T>(first));
  } catch {
    const second = await callOpenRouter(`${system} Return valid JSON only. No markdown, no commentary, no extra text.`, user);
    if (debugLabel) {
      console.info(`[${debugLabel}] raw AI response retry`, second);
    }
    try {
      return validate(parseJson<T>(second));
    } catch (secondError) {
      throw new Error(`AI returned invalid JSON after retry: ${(secondError as Error).message}`);
    }
  }
}

const repositorySummarySystemPrompt = `You are a technical resume writer analyzing a GitHub repository to extract resume-worthy information.

Return ONLY a valid JSON object. No explanation. No markdown. No code fences.
Exactly this structure:

{
  "one_liner": "One sentence describing what this project does in plain English.",
  "tech_skills": {
    "languages": ["list", "of", "programming", "languages", "used"],
    "frameworks": ["list", "of", "frameworks", "and", "libraries"],
    "tools": ["list", "of", "tools", "databases", "platforms", "APIs", "used"],
    "concepts": ["list", "of", "technical", "concepts", "demonstrated"]
  },
  "what_it_does": "2-3 sentences explaining the problem this project solves and how.",
  "notable_implementations": [
    "Specific technical thing implemented, e.g. JWT-based authentication system",
    "Another specific thing, e.g. RESTful API with 10+ endpoints",
    "Another specific thing, e.g. real-time updates using WebSockets"
  ],
  "impact_or_scale": "Any measurable detail if available — users, performance, scale, uptime. Write null if nothing available.",
  "relevant_roles": ["SDE", "Backend Developer", "etc — roles this project is relevant for"]
}

Rules:
- Only include skills that are actually visible in the repository data provided.
- Do not invent or assume any technology not present in the data.
- SKIP minor/utility packages: CSS utilities (clsx, class-variance-authority, cva), date libraries (date-fns, moment, dayjs), icon packs (Lucide React, React Icons), carousels (Embla Carousel, Swiper), dotenv, and sub-dependencies of already-listed frameworks.
- Databases must be actual databases or ORMs: PostgreSQL, MongoDB, MySQL, Firebase, Redis, Prisma, Supabase, DynamoDB, etc. Do not list UI libraries, styling, or utility packages as tools.
- Tools should contain only developer tools, platforms, and services — never UI libraries.
- If a skill is already listed as a Framework, do not duplicate it in Tools.
- notable_implementations must be specific — never generic like "used good coding practices".
- If README is empty or missing, use language and dependency data only.
- If there is truly not enough data, return the JSON with whatever is available and null for missing fields.`;

const jobAnalysisSystemPrompt = `You are a job description analyst.

Given the following job description, extract key information and return ONLY a valid JSON object. No explanation. No markdown. No code fences.

Return exactly this structure:

{
  "job_title": "Exact job title from the JD, e.g. Software Development Engineer Intern",
  "company_name": "Company name if mentioned, else null",
  "required_skills": ["every", "technical", "skill", "explicitly", "required"],
  "preferred_skills": ["skills", "mentioned", "as", "good", "to", "have"],
  "key_responsibilities": [
    "Short phrase describing one main responsibility",
    "Another responsibility"
  ],
  "keywords": ["all", "important", "domain", "and", "technical", "keywords", "from", "the", "JD", "that", "an", "ATS", "would", "scan", "for"],
  "experience_level": "Internship / Entry Level / Mid Level / Senior Level",
  "domain": "e.g. Backend, Frontend, Full Stack, Data Science, ML, DevOps, etc."
}`;

const resumeContentSystemPrompt = `You are an expert technical resume writer specializing in resumes for software engineering students and fresh graduates applying to tech companies.

Your task is to write a complete, ATS-optimized resume tailored specifically for the job description provided.

INSTRUCTIONS:
1. SKILLS SECTION:
   - Collect ALL unique technical skills across all 4 projects.
   - Add any additional skills from the JD that are clearly demonstrated by the projects (do not invent skills not present in projects).
   - Prioritize and list first the skills that appear in the JD.
   - Categorize into: Programming Languages, Frameworks & Libraries, Tools & Technologies, Databases.
   - FILTERING RULES (apply these strictly):
     a) Remove ALL duplicates — if a skill appears in multiple categories, keep it only in the most relevant category.
     b) Remove these minor packages entirely: CSS utilities (clsx, class-variance-authority, cva), date utilities (date-fns, moment, dayjs), icon libraries (Lucide React, React Icons), carousel libraries (Embla Carousel, Swiper), environment tools (dotenv), and any sub-packages of already-listed frameworks.
     c) Databases section: ONLY include actual databases and ORMs — PostgreSQL, MongoDB, MySQL, Firebase, Redis, Prisma, Supabase, DynamoDB. Never include UI libraries, styling tools, or utilities.
     d) Tools & Technologies: ONLY developer tools, platforms, and services — Git, Docker, AWS, CI/CD, testing frameworks. Never include UI libraries, CSS frameworks, or styling tools.
     e) If a skill is already listed as a Framework, do NOT repeat it in Tools.
   - Never leave any category empty. If a category would otherwise be empty, reuse the closest relevant skill from the provided project data instead of omitting it.
   - Use exact, comma-separated technology names from the candidate's repository data.

2. PROJECTS SECTION (most important section):
   - For each project, write exactly 3 bullet points.
   - Every bullet point must:
     a) Start with a strong past-tense action verb (Built, Developed, Implemented, Designed, Integrated, Optimized, Engineered, Automated, Deployed, Architected, Reduced, Improved)
     b) Mention specific technologies used — use the EXACT spelling and casing from the JD where they match (e.g. if JD says "Node.js", write "Node.js" exactly; if JD says "React", write "React" not "react")
     c) Include a measurable result or scale wherever possible (e.g. "reducing API response time by 40%", "supporting 500+ concurrent users", "handling 10,000+ records")
     d) If no measurement is available, describe the specific technical complexity or impact instead
   - Do NOT write vague bullets like "worked on frontend" or "used good practices"
   - Do NOT mention skills or technologies not present in the project data
   - When describing a technology that appears in the JD's required_skills, use that technology name with exact casing from the JD

3. KEYWORD MATCHING:
   - Naturally embed important keywords from the JD into bullet points and skills section.
   - Do not stuff keywords unnaturally — they must fit the sentence.
   - Priority keywords are those in the JD's required_skills list.
   - Use exact spelling and casing for all JD keywords found in project data.

4. TONE:
   - Professional, technical, and concise.
   - No first-person pronouns (no "I", "my", "we").
   - Every word must earn its place.

5. FIELD RULES:
  - header.name must be the candidate's exact name from the prompt data. Never use "Resume", "Target Role", or any generic placeholder.
  - header.github must be the candidate's GitHub profile URL.
  - education.college must always be populated with the candidate's college name.
  - projects[].github_url must be a valid GitHub repository URL for that project when available.
  - projects[].bullets must contain exactly 3 concrete bullet points.

Return ONLY a valid JSON object. No explanation. No markdown. No code fences.

{
  "header": {
    "name": "Full name",
    "email": "email",
    "phone": "phone",
    "city": "city",
    "linkedin": "url or null",
    "github": "url or null",
    "portfolio": "url or null"
  },
  "education": {
    "college": "College name",
    "degree": "B.Tech, Computer Science Engineering",
    "graduation_year": "2027",
    "cgpa": "7.75"
  },
  "skills": {
    "languages": ["Python", "JavaScript"],
    "frameworks": ["React", "Node.js", "Express"],
    "tools": ["Git", "Docker", "Postman"],
    "databases": ["MongoDB", "PostgreSQL"]
  },
  "projects": [
    {
      "name": "Project Name",
      "tech_stack": "React, Node.js, MongoDB",
      "github_url": "https://github.com/...",
      "bullets": [
        "Built a RESTful API with Node.js and Express handling 15+ endpoints for user authentication, product management, and order processing",
        "Implemented JWT-based authentication with refresh token rotation, securing all protected routes and reducing unauthorized access attempts",
        "Integrated Stripe payment gateway with webhook verification, processing transactions with 99.9% success rate"
      ]
    }
  ]
}`;

const atsScoreSystemPrompt = `You are an ATS (Applicant Tracking System) evaluator.

Compare the resume content against the job description and calculate a match score.

Job Description Keywords and Skills:
{{jd_keywords}}
{{jd_required_skills}}
{{jd_preferred_skills}}

Resume Content (all text combined):
{{resume_full_text}}

Return ONLY a valid JSON object. No explanation. No markdown. No code fences.

{
  "ats_score": 78,
  "matched_keywords": ["React", "Node.js", "REST API"],
  "missing_keywords": ["Docker", "CI/CD"],
  "score_explanation": "One sentence explaining the score honestly.",
  "domain_mismatch": true or false,
  "mismatch_reason": "If domain_mismatch is true, write one clear sentence explaining WHY the profile does not match this job. If domain_mismatch is false, write null.",
  "recommended_roles": ["If domain_mismatch is true, list 2-3 job roles that better match the candidate's actual skills. If domain_mismatch is false, return empty array."]
}

DOMAIN MISMATCH DETECTION RULES:

1. EXPERIENCE LEVEL MISMATCH:
   - If the JD explicitly mentions "X+ years of experience" (where X >= 2) and the resume indicates the candidate is a student or fresher (graduation year is 2024 or later, or includes "pursuing", "expected graduation" text), set domain_mismatch to true.
   - Mismatch reason: "This is a [X+ years] role requiring significant industry experience. As a student/fresher, this role is not suitable at this stage of your career."

2. CORE BACKEND MISMATCH:
   - If the JD has backend framework requirements (Node.js, NestJS, Express, Spring Boot, Django, FastAPI, Kotlin, Go, Rust, etc.) as PRIMARY keywords AND the resume shows no backend development (only frontend frameworks like React, Vue, Angular, or Firebase/BaaS with no server-side code), set domain_mismatch to true.
   - Mismatch reason: "This role requires strong backend development experience with [detected framework(s)]. Your profile demonstrates frontend strength but lacks server-side backend development experience."

3. PRIMARY TECH STACK ABSENCE:
   - If the JD's top 2-3 required_skills are completely absent from the resume (not found at all, neither in skills nor in projects), set domain_mismatch to true.
   - Only apply this if the missing skills are truly core (e.g., primary language or primary framework).

4. DEFAULT (no mismatch if above do not apply):
   - If none of the above patterns match, set domain_mismatch to false.

General Rules:
- Score is a number from 0 to 100.
- matched_keywords: skills/keywords from JD that appear in resume.
- missing_keywords: important skills from JD not found in resume.
- Be accurate — do not inflate the score.
- domain_mismatch should be false if the candidate has any partial or relevant experience, even if not a perfect match.
- domain_mismatch should be true only when there is a genuine career stage or fundamental skill mismatch.`;

export async function summarizeRepository(input: {
  name: string;
  description: string;
  topics: string[];
  languageBreakdown: Record<string, number>;
  readme: string;
  dependencies: string;
}) {
  const user = `Repository Data:\n- Name: ${input.name}\n- Description: ${input.description || ""}\n- Primary Language: ${Object.keys(input.languageBreakdown || {})[0] || ""}\n- All Languages: ${JSON.stringify(input.languageBreakdown)}\n- Topics/Tags: ${JSON.stringify(input.topics)}\n- README Content: ${input.readme || ""}\n- Dependencies (package.json / requirements.txt): ${input.dependencies || ""}`;

  return callJson<RepoSummary>(repositorySummarySystemPrompt, user, validateRepoSummary);
}

export async function extractJobMeta(jd: string) {
  const user = `Job Description:\n${jd}`;
  return callJson<JobAnalysis>(jobAnalysisSystemPrompt, user, validateJobAnalysis);
}

function findSkillCaseInJd(skillName: string, jobAnalysis: JobAnalysis): string {
  // Search for the skill in JD's required_skills and keywords, returning exact casing
  const allJdSkills = [...jobAnalysis.required_skills, ...jobAnalysis.preferred_skills, ...jobAnalysis.keywords];
  const found = allJdSkills.find((jdSkill) => jdSkill.toLowerCase() === skillName.toLowerCase());
  return found || skillName; // Return exact casing from JD if found, otherwise return as-is
}

function isSkillInResume(skill: string, technicalSkills: { programmingLanguages: string[]; frameworksLibraries: string[]; toolsTechnologies: string[]; databases: string[] }): boolean {
  const allSkills = [...technicalSkills.programmingLanguages, ...technicalSkills.frameworksLibraries, ...technicalSkills.toolsTechnologies, ...technicalSkills.databases];
  return allSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
}

function getSkillCategory(skill: string): "languages" | "frameworks" | "tools" | "databases" {
  const lower = skill.toLowerCase();
  if (/sql|mongo|postgres|mysql|sqlite|redis|firebase|firestore|supabase|dynamodb|cassandra|elasticsearch|prisma|typeorm|sequelize|realm|couchdb|fauna|planetscale|cockroach|oracle|mariadb|db2/i.test(lower)) {
    return "databases";
  }
  if (/python|javascript|java|c\+\+|c#|typescript|go|rust|kotlin|scala|ruby|php|swift|objective-c|r\b|matlab|dart|groovy|clojure|haskell|elixir|perl|powershell/i.test(lower)) {
    return "languages";
  }
  if (/react|react\s+native|vue|angular|svelte|nextjs|next\.js|nuxt|gatsby|remix|express|flask|django|fastapi|spring|spring\s+boot|laravel|rails|sinatra|asp\.net|asp\.net\s+core|blazor|dot\s+net|\.net|gin|gorilla|echo|fiber|node\.js|nodejs|node/i.test(lower)) {
    return "frameworks";
  }
  return "tools";
}

export async function generateResumeContent(user: UserProfile, jd: string, repos: RepositoryRecord[], jobAnalysis?: JobAnalysis) {
  const selectedRepos = repos.slice(0, 4);
  const repoSummaryShape = (repo: RepositoryRecord) => {
    const summary = isRecord(repo.aiSummary) ? (repo.aiSummary as Record<string, unknown>) : {};
    const tech = isRecord(summary.tech_skills) ? (summary.tech_skills as Record<string, unknown>) : {};
    return {
      oneLiner: String(summary.one_liner || repo.shortDescription || ""),
      whatItDoes: String(summary.what_it_does || repo.shortDescription || ""),
      notableImplementations: normalizeStringArray(summary.notable_implementations),
      languages: normalizeStringArray(tech.languages),
      frameworks: normalizeStringArray(tech.frameworks),
      tools: normalizeStringArray(tech.tools),
      concepts: normalizeStringArray(tech.concepts),
    };
  };

  const projectBlocks = repos
    .slice(0, 4)
    .map((repo, index) => {
      const summary = repoSummaryShape(repo);
      const displayedSkills = [
        ...summary.languages,
        ...summary.frameworks,
        ...summary.tools,
        ...summary.concepts,
      ].join(", ");
      return [
        `Project ${index + 1}:`,
        `- Name: ${repo.githubRepoName}`,
        `- GitHub URL: ${repo.githubRepoUrl}`,
        `- Summary: ${repo.shortDescription}`,
        `- Skills demonstrated: ${displayedSkills}`,
        `- Notable implementations: ${summary.notableImplementations.join("; ")}`,
      ].join("\n");
    })
    .join("\n\n");

  const userPrompt = `CANDIDATE INFORMATION:\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone || ""}\nCity: ${user.city || ""}\nLinkedIn: ${user.linkedinUrl || ""}\nGitHub: ${"https://github.com/" + user.githubUsername}\nPortfolio: ${user.portfolioUrl || ""}\nCollege: ${user.collegeName || ""}\nDegree & Branch: ${user.degree || ""}\nGraduation Year: ${user.graduationYear || ""}\nCGPA: ${user.cgpa || ""}\n\nJOB DESCRIPTION:\n${jd}\n\nCANDIDATE'S RELEVANT PROJECTS (selected based on relevance to this JD):\n\n${projectBlocks || "No repositories available."}`;

  console.info("[resume] prompt data check", {
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    city: user.city || "",
    linkedinUrl: user.linkedinUrl || "",
    githubUrl: `https://github.com/${user.githubUsername}`,
    portfolioUrl: user.portfolioUrl || "",
    collegeName: user.collegeName || "",
    degree: user.degree || "",
    graduationYear: user.graduationYear || "",
    cgpa: user.cgpa || "",
    selectedRepos: selectedRepos.map((repo) => repo.githubRepoName),
  });
  console.info("[resume] exact prompt", userPrompt);

  const parsed = await callJson<ResumeContent>(resumeContentSystemPrompt, userPrompt, validateResumeContent, "resume");

  const normalizedRepoData = selectedRepos.map((repo) => ({
    repo,
    summary: repoSummaryShape(repo),
  }));

  const repoTechnologies = dedupeStrings([
    ...normalizedRepoData.flatMap((item) => item.summary.languages),
    ...normalizedRepoData.flatMap((item) => item.summary.frameworks),
    ...normalizedRepoData.flatMap((item) => item.summary.tools),
  ]);
  const repoDatabases = dedupeStrings(
    normalizedRepoData
      .flatMap((item) => item.summary.tools)
      .filter((item) => /sql|mongo|postgres|mysql|sqlite|redis|firebase|supabase|dynamo|prisma|db/i.test(item)),
  );

  const parsedProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
  const normalizedProjects = normalizedRepoData.slice(0, 4).map(({ repo, summary }, index) => {
    const parsedProject = parsedProjects[index] && isRecord(parsedProjects[index]) ? (parsedProjects[index] as Record<string, unknown>) : undefined;
    const fallbackBullets = dedupeStrings([
      `Developed ${summary.oneLiner}`,
      ...summary.notableImplementations,
      summary.whatItDoes,
    ]).slice(0, 3);
    return {
      name: String(parsedProject?.name || repo.githubRepoName || "Project"),
      technologies: dedupeStrings([
        ...normalizeTechStack(parsedProject?.technologies),
        ...repoTechnologies,
      ]).slice(0, 8),
      githubLink: String(parsedProject?.github_url || repo.githubRepoUrl || ""),
      bullets: dedupeStrings([
        ...normalizeStringArray(parsedProject?.bullets),
        ...fallbackBullets,
      ]).slice(0, 3),
    };
  });

  const normalizedEducation = Array.isArray(parsed.education) && parsed.education.length
    ? parsed.education.map((item) => {
        const entry = item as Record<string, unknown>;
        return {
          collegeName: String(entry.collegeName || entry.college || user.collegeName || ""),
          degree: String(entry.degree || user.degree || ""),
          graduationYear: String(entry.graduationYear || entry.graduation_year || user.graduationYear || ""),
          cgpa: String(entry.cgpa || user.cgpa || ""),
        };
      })
    : [
        {
          collegeName: user.collegeName || "",
          degree: user.degree || "",
          graduationYear: user.graduationYear || "",
          cgpa: user.cgpa || "",
        },
      ];

  const normalizedSkills = {
    programmingLanguages: dedupeStrings([
      ...normalizeStringArray(parsed.technicalSkills?.programmingLanguages),
      ...normalizedRepoData.flatMap((item) => item.summary.languages),
    ]),
    frameworksLibraries: dedupeStrings([
      ...normalizeStringArray(parsed.technicalSkills?.frameworksLibraries),
      ...normalizedRepoData.flatMap((item) => item.summary.frameworks),
    ]),
    toolsTechnologies: dedupeStrings([
      ...normalizeStringArray(parsed.technicalSkills?.toolsTechnologies),
      ...normalizedRepoData.flatMap((item) => item.summary.tools),
    ]),
    databases: dedupeStrings([
      ...normalizeStringArray(parsed.technicalSkills?.databases),
      ...repoDatabases,
    ]),
  };

  const fallbackDatabase = normalizedRepoData
    .flatMap((item) => item.summary.tools)
    .find((item) => /sql|mongo|postgres|mysql|sqlite|redis|firebase|supabase|dynamo|prisma|db/i.test(item));
  if (!normalizedSkills.programmingLanguages.length) normalizedSkills.programmingLanguages = dedupeStrings(normalizedRepoData.flatMap((item) => item.summary.languages));
  if (!normalizedSkills.frameworksLibraries.length) normalizedSkills.frameworksLibraries = dedupeStrings(normalizedRepoData.flatMap((item) => item.summary.frameworks));
  if (!normalizedSkills.toolsTechnologies.length) normalizedSkills.toolsTechnologies = dedupeStrings(normalizedRepoData.flatMap((item) => item.summary.tools));
  if (!normalizedSkills.databases.length && fallbackDatabase) normalizedSkills.databases = [fallbackDatabase];

  // POST-PROCESSING: Add missing JD keywords if projects demonstrate them
  if (jobAnalysis) {
    const allJdSkills = [...jobAnalysis.required_skills, ...jobAnalysis.preferred_skills];
    const allProjectTechs = normalizedRepoData.flatMap((item) => [
      ...item.summary.languages,
      ...item.summary.frameworks,
      ...item.summary.tools,
      ...item.summary.concepts,
    ]);

    for (const jdSkill of allJdSkills) {
      const alreadyInResume = isSkillInResume(jdSkill, normalizedSkills);
      if (!alreadyInResume) {
        // Check if any project demonstrates this skill
        const projectDemonstrates = allProjectTechs.some((tech) => tech.toLowerCase() === jdSkill.toLowerCase());
        if (projectDemonstrates) {
          // Add to appropriate category with exact JD casing
          const category = getSkillCategory(jdSkill);
          const exactCasing = findSkillCaseInJd(jdSkill, jobAnalysis);
          const targetArray =
            category === "languages"
              ? normalizedSkills.programmingLanguages
              : category === "frameworks"
                ? normalizedSkills.frameworksLibraries
                : category === "databases"
                  ? normalizedSkills.databases
                  : normalizedSkills.toolsTechnologies;
          if (!targetArray.includes(exactCasing)) {
            targetArray.push(exactCasing);
          }
          console.info("[resume] added missing JD keyword", { skill: exactCasing, category, fromProjects: true });
        }
      }
    }
  }

  return {
    header: {
      fullName: String(parsed.header.fullName || user.name || ""),
      phone: String(parsed.header.phone || user.phone || ""),
      email: String(parsed.header.email || user.email || ""),
      city: String(parsed.header.city || user.city || ""),
      linkedinUrl: String(parsed.header.linkedinUrl || user.linkedinUrl || ""),
      githubUrl: String(parsed.header.githubUrl || `https://github.com/${user.githubUsername}`),
      portfolioUrl: String(parsed.header.portfolioUrl || user.portfolioUrl || ""),
    },
    education: normalizedEducation,
    technicalSkills: {
      programmingLanguages: normalizedSkills.programmingLanguages,
      frameworksLibraries: normalizedSkills.frameworksLibraries,
      toolsTechnologies: normalizedSkills.toolsTechnologies,
      databases: normalizedSkills.databases,
    },
    projects: normalizedProjects,
    experience: parsed.experience || [],
    achievements: parsed.achievements || [],
  };
}

export async function evaluateAtsScore(input: {
  jdKeywords: string[];
  jdRequiredSkills: string[];
  jdPreferredSkills: string[];
  resumeFullText: string;
}) {
  const user = `Job Description Keywords and Skills:\n${JSON.stringify(input.jdKeywords)}\n${JSON.stringify(input.jdRequiredSkills)}\n${JSON.stringify(input.jdPreferredSkills)}\n\nResume Content (all text combined):\n${input.resumeFullText}`;
  return callJson<AtsAnalysis>(atsScoreSystemPrompt, user, validateAtsAnalysis);
}
