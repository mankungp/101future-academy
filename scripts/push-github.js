const fs = require("node:fs/promises");
const path = require("node:path");

const owner = "mankungp";
const repo = "101future-academy";
const branch = "main";
const root = path.resolve(__dirname, "..");

const files = [
  ".gitignore",
  "README.md",
  "admin.html",
  "admin.js",
  "app.js",
  "assets/hero-learning-lab.png",
  "data/.gitkeep",
  "index.html",
  "package.json",
  "server.js",
  "styles.css",
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
    throw new Error(`${options.method || "GET"} ${pathname} failed ${response.status}: ${text}`);
  }
  return data;
}

async function main() {
  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required");

  const tree = [];
  for (const file of files) {
    const buffer = await fs.readFile(path.join(root, file));
    const blob = await gh(`/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: buffer.toString("base64"),
        encoding: "base64",
      }),
    });
    tree.push({ path: file, mode: "100644", type: "blob", sha: blob.sha });
  }

  const treeResult = await gh(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tree }),
  });

  const commit = await gh(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Initial 101 Future enrollment app",
      tree: treeResult.sha,
    }),
  });

  try {
    await gh(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
  } catch (error) {
    await gh(`/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
    });
  }

  console.log(`Pushed ${commit.sha} to ${owner}/${repo}:${branch}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
