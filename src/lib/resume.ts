import "server-only";
import { ResumeContent } from "./types";

const asStringArray = (value: unknown) => (Array.isArray(value) ? value.map(String).filter(Boolean) : []);

// Skills to skip: minor packages, utilities, and sub-tools
const SKILLS_TO_SKIP = new Set([
  // CSS utilities
  "clsx",
  "class-variance-authority",
  "cva",
  "classnames",
  "classname",
  // Date utilities
  "date-fns",
  "moment",
  "dayjs",
  // Icon libraries
  "lucide react",
  "lucide-react",
  "react icons",
  "react-icons",
  "feather icons",
  "feather-icons",
  "@heroicons/react",
  // Carousel/Slider libraries
  "embla carousel",
  "embla-carousel",
  "swiper",
  "react-slick",
  // Environment tools
  "dotenv",
  "dotenv-webpack",
  // Other utilities typically found in package.json
  "uuid",
  "lodash-es",
  "axios", // too generic, usually covered by "API" or specific framework
]);

// Valid databases and ORMs (whitelist approach for databases)
const VALID_DATABASES = new Set([
  "postgresql",
  "postgres",
  "mongodb",
  "mysql",
  "firebase",
  "firestore",
  "redis",
  "prisma",
  "supabase",
  "dynamodb",
  "cassandra",
  "elasticsearch",
  "sqlalchemy",
  "sequelize",
  "typeorm",
  "knex",
  "drizzle",
  "neo4j",
  "cockroachdb",
  "mariadb",
  "oracle",
  "sql server",
  "ibm db2",
  "realm",
  "couchdb",
  "fauna",
  "planetscale",
]);

// UI libraries and styling tools to skip from Tools section
const UI_LIBRARIES_TO_SKIP = new Set([
  "react",
  "vue",
  "angular",
  "svelte",
  "nextjs",
  "next.js",
  "nuxt",
  "gatsby",
  "remix",
  "tailwind",
  "tailwindcss",
  "bootstrap",
  "material-ui",
  "mui",
  "@mui",
  "chakra ui",
  "chakra-ui",
  "@chakra-ui",
  "shadcn",
  "shadcn/ui",
  "ant design",
  "antd",
  "react bootstrap",
  "styled-components",
  "emotion",
  "@emotion",
  "sass",
  "scss",
  "less",
  "css-in-js",
  "storybook",
]);

function isValidDatabase(skill: string): boolean {
  const normalized = skill.toLowerCase().trim();
  return VALID_DATABASES.has(normalized);
}

function shouldSkipSkill(skill: string): boolean {
  const normalized = skill.toLowerCase().trim();
  return SKILLS_TO_SKIP.has(normalized);
}

function isUiLibrary(skill: string): boolean {
  const normalized = skill.toLowerCase().trim();
  return UI_LIBRARIES_TO_SKIP.has(normalized);
}

function normalizeSkillName(skill: string): string {
  return skill.trim();
}

function filterAndDeduplicateSkills(
  languages: string[],
  frameworks: string[],
  tools: string[],
  databases: string[],
): { programmingLanguages: string[]; frameworksLibraries: string[]; toolsTechnologies: string[]; databases: string[] } {
  // Remove skipped skills and normalize
  const cleanedLanguages = languages.filter((s) => !shouldSkipSkill(s)).map(normalizeSkillName);
  const cleanedFrameworks = frameworks.filter((s) => !shouldSkipSkill(s)).map(normalizeSkillName);
  let cleanedTools = tools.filter((s) => !shouldSkipSkill(s) && !isUiLibrary(s)).map(normalizeSkillName);
  let cleanedDatabases = databases
    .filter((s) => !shouldSkipSkill(s) && isValidDatabase(s))
    .map(normalizeSkillName);

  // Remove duplicates: create a set of all skills already listed
  const seenSkills = new Set(
    [...cleanedLanguages, ...cleanedFrameworks, ...cleanedDatabases].map((s) => s.toLowerCase()),
  );

  // Remove from tools any skill already in other categories
  cleanedTools = cleanedTools.filter((tool) => !seenSkills.has(tool.toLowerCase()));

  // Remove duplicate framework from tools (e.g., React appearing in both)
  const frameworkNames = new Set(cleanedFrameworks.map((f) => f.toLowerCase()));
  cleanedTools = cleanedTools.filter((tool) => !frameworkNames.has(tool.toLowerCase()));

  return {
    programmingLanguages: cleanedLanguages,
    frameworksLibraries: cleanedFrameworks,
    toolsTechnologies: cleanedTools,
    databases: cleanedDatabases,
  };
}

export function normalizeResumeContent(content: ResumeContent): ResumeContent {
  // Filter and deduplicate skills
  const filteredSkills = filterAndDeduplicateSkills(
    asStringArray(content.technicalSkills?.programmingLanguages),
    asStringArray(content.technicalSkills?.frameworksLibraries),
    asStringArray(content.technicalSkills?.toolsTechnologies),
    asStringArray(content.technicalSkills?.databases),
  );

  return {
    header: {
      fullName: String(content.header?.fullName || ""),
      phone: String(content.header?.phone || ""),
      email: String(content.header?.email || ""),
      city: String(content.header?.city || ""),
      linkedinUrl: content.header?.linkedinUrl ? String(content.header.linkedinUrl) : "",
      githubUrl: String(content.header?.githubUrl || ""),
      portfolioUrl: content.header?.portfolioUrl ? String(content.header.portfolioUrl) : "",
    },
    education: Array.isArray(content.education)
      ? content.education.map((item) => ({
          collegeName: String(item.collegeName || ""),
          degree: String(item.degree || ""),
          graduationYear: String(item.graduationYear || ""),
          cgpa: String(item.cgpa || ""),
        }))
      : [],
    technicalSkills: {
      programmingLanguages: filteredSkills.programmingLanguages,
      frameworksLibraries: filteredSkills.frameworksLibraries,
      toolsTechnologies: filteredSkills.toolsTechnologies,
      databases: filteredSkills.databases,
    },
    projects: Array.isArray(content.projects)
      ? content.projects.slice(0, 4).map((project) => ({
          name: String(project.name || ""),
          technologies: asStringArray(project.technologies),
          githubLink: String(project.githubLink || ""),
          bullets: asStringArray(project.bullets).slice(0, 3),
        }))
      : [],
    experience: Array.isArray(content.experience)
      ? content.experience.map((item) => ({
          title: String(item.title || ""),
          company: String(item.company || ""),
          duration: String(item.duration || ""),
          bullets: asStringArray(item.bullets),
        }))
      : [],
    achievements: asStringArray(content.achievements),
  };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const list = (items: string[]) => items.filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

export function renderResumeHtml(content: ResumeContent) {
  const headerLinks = [
    content.header.linkedinUrl,
    content.header.githubUrl,
    content.header.portfolioUrl,
  ].filter(Boolean);

  const skills = content.technicalSkills;
  const experience = content.experience?.length
    ? `<section><h2>Experience</h2>${content.experience
        .map(
          (item) =>
            `<div class="item"><div class="row"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(
              item.duration,
            )}</span></div><div>${escapeHtml(item.company)}</div><ul>${list(item.bullets)}</ul></div>`,
        )
        .join("")}</section>`
    : "";

  const achievements = content.achievements?.length
    ? `<section><h2>Achievements</h2><ul>${list(content.achievements)}</ul></section>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    content.header.fullName,
  )} Resume</title></head><body>
<div class="page">
<header>
  <h1>${escapeHtml(content.header.fullName)}</h1>
  <p>${[content.header.phone, content.header.email, content.header.city].filter(Boolean).map(escapeHtml).join(" | ")}</p>
  <p>${headerLinks.map((link) => `<span>${escapeHtml(link || "")}</span>`).join(" | ")}</p>
</header>
<section><h2>Education</h2>${content.education
    .map(
      (item) =>
        `<div class="row"><strong>${escapeHtml(item.collegeName)}</strong><span>${escapeHtml(
          item.graduationYear,
        )}</span></div><div>${escapeHtml(item.degree)} | CGPA: ${escapeHtml(item.cgpa)}</div>`,
    )
    .join("")}</section>
<section><h2>Technical Skills</h2>
  <p><strong>Programming Languages:</strong> ${skills.programmingLanguages.map(escapeHtml).join(", ")}</p>
  <p><strong>Frameworks & Libraries:</strong> ${skills.frameworksLibraries.map(escapeHtml).join(", ")}</p>
  <p><strong>Tools & Technologies:</strong> ${skills.toolsTechnologies.map(escapeHtml).join(", ")}</p>
  <p><strong>Databases:</strong> ${skills.databases.map(escapeHtml).join(", ")}</p>
</section>
<section><h2>Projects</h2>${content.projects
    .map(
      (project) =>
        `<div class="item"><div class="row"><strong>${escapeHtml(project.name)}</strong><span>${escapeHtml(
          project.technologies.join(", "),
        )}</span></div><div>${escapeHtml(project.githubLink)}</div><ul>${list(project.bullets)}</ul></div>`,
    )
    .join("")}</section>
${experience}
${achievements}
</div>
<style>
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { margin: 0; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.35; }
.page { width: 210mm; min-height: 297mm; padding: 14mm; margin: 0 auto; background: #fff; }
header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
h1 { font-size: 22px; margin: 0 0 3px; letter-spacing: 0; }
h2 { font-size: 13px; margin: 9px 0 4px; text-transform: uppercase; border-bottom: 1px solid #000; letter-spacing: 0; }
p { margin: 2px 0; }
ul { margin: 3px 0 6px 16px; padding: 0; }
li { margin: 2px 0; }
.row { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.row span { text-align: right; }
.item { margin-bottom: 6px; }
@media print { body { background: #fff; } .page { margin: 0; padding: 0; width: auto; min-height: auto; } }
</style></body></html>`;
}

export async function renderHtmlToPdf(html: string, absolutePath: string) {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "load",
      timeout: Number(process.env.PDF_RENDER_TIMEOUT_MS || 15000),
    });
    await page.emulateMediaType("print");
    await page.pdf({
      path: absolutePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "14mm",
        bottom: "14mm",
        left: "14mm",
        right: "14mm",
      },
    });
    await page.close();
  } finally {
    await browser.close();
  }
}

export async function writeSimplePdf(html: string, absolutePath: string) {
  return renderHtmlToPdf(html, absolutePath);
}

export function calculateAtsScore(jd: string, resumeHtml: string) {
  const stop = new Set(["and", "the", "for", "with", "you", "are", "our", "this", "that", "from", "will", "have"]);
  const keywords = Array.from(
    new Set((jd.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || []).filter((word) => !stop.has(word))),
  ).slice(0, 45);
  const resumeText = resumeHtml.toLowerCase();
  const matched = keywords.filter((word) => resumeText.includes(word));
  const missed = keywords.filter((word) => !resumeText.includes(word));
  return {
    score: keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0,
    matched,
    missed,
  };
}
