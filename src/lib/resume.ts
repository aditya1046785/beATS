import "server-only";
import { promises as fs } from "fs";
import { ResumeContent } from "./types";

const asStringArray = (value: unknown) => (Array.isArray(value) ? value.map(String).filter(Boolean) : []);

export function normalizeResumeContent(content: ResumeContent): ResumeContent {
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
      programmingLanguages: asStringArray(content.technicalSkills?.programmingLanguages),
      frameworksLibraries: asStringArray(content.technicalSkills?.frameworksLibraries),
      toolsTechnologies: asStringArray(content.technicalSkills?.toolsTechnologies),
      databases: asStringArray(content.technicalSkills?.databases),
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

export async function writeSimplePdf(html: string, absolutePath: string) {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim()
    .slice(0, 12000);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const content = lines
    .slice(0, 80)
    .map((line, index) => `BT /F1 10 Tf 50 ${790 - index * 13} Td (${line.replace(/[()\\]/g, "")}) Tj ET`)
    .join("\n");
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${content.length} >> stream
${content}
endstream endobj
xref
0 6
0000000000 65535 f 
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%EOF`;
  await fs.writeFile(absolutePath, pdf);
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
