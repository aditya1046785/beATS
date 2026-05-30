import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { AppData, RepositoryRecord, ResumeRecord, UserProfile } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "app.json");
const PDF_DIR = path.join(process.cwd(), "public", "generated-resumes");

const emptyData: AppData = {
  users: [],
  repositories: [],
  resumes: [],
  payments: [],
};

export async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(PDF_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(emptyData, null, 2));
  }
}

export async function readData(): Promise<AppData> {
  await ensureStorage();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as AppData;
}

export async function writeData(data: AppData) {
  await ensureStorage();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function updateData(mutator: (data: AppData) => void | Promise<void>) {
  const data = await readData();
  await mutator(data);
  await writeData(data);
  return data;
}

export async function getUser(id: string) {
  const data = await readData();
  return data.users.find((user) => user.id === id);
}

export async function saveUser(user: UserProfile) {
  await updateData((data) => {
    const index = data.users.findIndex((item) => item.id === user.id);
    if (index >= 0) data.users[index] = user;
    else data.users.push(user);
  });
}

export async function replaceUserRepositories(userId: string, repositories: RepositoryRecord[]) {
  await updateData((data) => {
    data.repositories = data.repositories.filter((repo) => repo.userId !== userId);
    data.repositories.push(...repositories);
  });
}

export async function getUserRepositories(userId: string) {
  const data = await readData();
  return data.repositories.filter((repo) => repo.userId === userId);
}

export async function addResume(resume: ResumeRecord) {
  await updateData((data) => {
    data.resumes.push(resume);
  });
}

export async function getUserResumes(userId: string) {
  const data = await readData();
  return data.resumes
    .filter((resume) => resume.userId === userId)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export async function getResumeForUser(userId: string, resumeId: string) {
  const data = await readData();
  return data.resumes.find((resume) => resume.id === resumeId && resume.userId === userId);
}

export function generatedPdfPath(fileName: string) {
  return {
    absolute: path.join(PDF_DIR, fileName),
    publicUrl: `/generated-resumes/${fileName}`,
  };
}
