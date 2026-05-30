import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
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
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivText, "base64"),
    );
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

function normalizeUser(user: UserProfile): UserProfile {
  return {
    ...user,
    githubAccessToken: decryptToken(user.githubAccessToken),
  };
}

function persistUser(user: UserProfile): UserProfile {
  return {
    ...user,
    githubAccessToken: encryptToken(user.githubAccessToken),
  };
}

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
  const data = JSON.parse(raw) as AppData;
  return {
    ...data,
    users: data.users.map(normalizeUser),
  };
}

export async function writeData(data: AppData) {
  await ensureStorage();
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(
      {
        ...data,
        users: data.users.map(persistUser),
      },
      null,
      2,
    ),
  );
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
    const next = normalizeUser(user);
    if (index >= 0) data.users[index] = next;
    else data.users.push(next);
  });
}

export async function replaceUserRepositories(userId: string, repositories: RepositoryRecord[]) {
  await updateData((data) => {
    data.repositories = data.repositories.filter((repo) => repo.userId !== userId);
    data.repositories.push(...repositories);
  });
}

export async function upsertUserRepositories(userId: string, repositories: RepositoryRecord[]) {
  await updateData((data) => {
    const existing = data.repositories.filter((repo) => repo.userId === userId);
    const merged = new Map(existing.map((repo) => [repo.githubRepoName, repo]));
    for (const repository of repositories) {
      merged.set(repository.githubRepoName, repository);
    }
    data.repositories = data.repositories.filter((repo) => repo.userId !== userId);
    data.repositories.push(...merged.values());
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

export async function addPaymentRecord(payment: import("./types").PaymentRecord) {
  await updateData((data) => {
    data.payments.push(payment);
  });
}

export async function getUserPayments(userId: string) {
  const data = await readData();
  return data.payments.filter((payment) => payment.userId === userId).sort((a, b) => b.paymentTimestamp.localeCompare(a.paymentTimestamp));
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
