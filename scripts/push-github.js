const fs = require("node:fs/promises");
const path = require("node:path");

const owner = "mankungp";
const repo = "101future-academy";
const branch = "main";
const root = path.resolve(__dirname, "..");

const files = [
  ".gitignore",
  "EDTECH_10_PHASES.md",
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

async function existingSha(file) {
  try {
    const data = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponentPath(file)}?ref=${branch}`);
    return data.sha;
  } catch (error) {
    if (error.status === 404 || error.status === 409) return null;
    throw error;
  }
}

async function putFile(file) {
  const buffer = await fs.readFile(path.join(root, file));
  const sha = await existingSha(file);
  const body = {
    message: `${sha ? "Update" : "Add"} ${file}`,
    content: buffer.toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponentPath(file)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(`${sha ? "Updated" : "Added"} ${file}`);
}

function encodeURIComponentPath(file) {
  return file.split("/").map(encodeURIComponent).join("/");
}

async function main() {
  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required");
  for (const file of files) {
    await putFile(file);
  }
  console.log(`Published ${files.length} files to https://github.com/${owner}/${repo}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
