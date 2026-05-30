const fs = require("node:fs/promises");
const path = require("node:path");

const owner = "mankungp";
const repo = "101future-academy";
const branch = "main";
const root = path.resolve(__dirname, "..");

const files = [
  ".gitignore",
  "EDTECH_10_PHASES.md",
  "OPEN_THIS_FIRST.md",
  "PROJECT_STATUS.md",
  "README.md",
  "admin.html",
  "admin.js",
  "app.js",
  "assets/hero-learning-lab.png",
  "data/.gitkeep",
  "index.html",
  "learn.html",
  "learn.js",
  "package-lock.json",
  "package.json",
  "pay.html",
  "pay.js",
  "privacy-policy.html",
  "refund-policy.html",
  "scripts/push-github.js",
  "server.js",
  "styles.css",
  "terms.html",
];

async function gh(pathname, options = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(`${options.method || "GET"} ${pathname} failed ${response.status}: ${text}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function existingFile(file) {
  try {
    return await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponentPath(file)}?ref=${branch}`);
  } catch (error) {
    if (error.status === 404 || error.status === 409) return null;
    throw error;
  }
}

async function putFile(file) {
  const buffer = await fs.readFile(path.join(root, file));
  const content = buffer.toString("base64");
  const existing = await existingFile(file);
  if (existing?.content?.replace(/\s/g, "") === content) {
    console.log(`Skipped ${file}`);
    return false;
  }

  const body = {
    message: `${existing ? "Update" : "Add"} ${file}`,
    content,
    branch,
  };
  if (existing?.sha) body.sha = existing.sha;

  await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponentPath(file)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(`${existing ? "Updated" : "Added"} ${file}`);
  return true;
}

function encodeURIComponentPath(file) {
  return file.split("/").map(encodeURIComponent).join("/");
}

async function main() {
  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required");
  const targetFiles = process.argv.slice(2);
  const publishFiles = targetFiles.length ? targetFiles : files;
  let changed = 0;
  for (const file of publishFiles) {
    if (!files.includes(file)) throw new Error(`Unknown publish file: ${file}`);
    if (await putFile(file)) changed += 1;
  }
  console.log(`Published ${changed} changed file(s) to https://github.com/${owner}/${repo}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
