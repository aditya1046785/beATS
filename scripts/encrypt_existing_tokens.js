const fs = require("fs/promises");
const crypto = require("crypto");
const path = require("path");

const DATA_FILE = path.join(process.cwd(), ".data", "app.json");

function getKey() {
  const value = process.env.TOKEN_ENCRYPTION_KEY;
  if (!value) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be set before running this migration.");
  }
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes.");
  }
  return decoded;
}

function isEncryptedToken(value) {
  return typeof value === "string" && value.split(":").length === 3;
}

function encryptToken(token, key) {
  if (!token || isEncryptedToken(token)) return token;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), encrypted.toString("base64"), tag.toString("base64")].join(":");
}

async function main() {
  const key = getKey();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const data = JSON.parse(raw);
  let changed = false;

  if (Array.isArray(data.users)) {
    data.users = data.users.map((user) => {
      if (!user || typeof user !== "object" || !user.githubAccessToken) return user;
      const next = { ...user };
      const encrypted = encryptToken(next.githubAccessToken, key);
      if (encrypted !== next.githubAccessToken) changed = true;
      next.githubAccessToken = encrypted;
      return next;
    });
  }

  if (changed) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    console.log("Encrypted existing GitHub tokens in .data/app.json");
  } else {
    console.log("No plain GitHub tokens found.");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});