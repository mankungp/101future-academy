#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { Server } = require("/opt/homebrew/lib/node_modules/openclaw/node_modules/@modelcontextprotocol/sdk/dist/cjs/server/index.js");
const { StdioServerTransport } = require("/opt/homebrew/lib/node_modules/openclaw/node_modules/@modelcontextprotocol/sdk/dist/cjs/server/stdio.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("/opt/homebrew/lib/node_modules/openclaw/node_modules/@modelcontextprotocol/sdk/dist/cjs/types.js");

const DEFAULT_ROOM_DIR = path.join(__dirname, "..", ".agent-room");
const ROOM_DIR = process.env.AGENT_ROOM_DIR || DEFAULT_ROOM_DIR;
const STATE_FILE = path.join(ROOM_DIR, "state.json");

function ensureRoom() {
  fs.mkdirSync(ROOM_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) {
    writeState({
      version: 1,
      updatedAt: new Date().toISOString(),
      plan: null,
      tasks: [],
      updates: [],
    });
  }
}

function readState() {
  ensureRoom();
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), plan: null, tasks: [], updates: [] };
  }
}

function writeState(state) {
  fs.mkdirSync(ROOM_DIR, { recursive: true });
  state.updatedAt = new Date().toISOString();
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, STATE_FILE);
}

function appendUpdate(state, update) {
  const now = new Date().toISOString();
  state.updates = Array.isArray(state.updates) ? state.updates : [];
  state.updates.push({
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: now,
    from: clean(update.from) || "agent",
    kind: clean(update.kind) || "note",
    task: clean(update.task),
    text: clean(update.text),
    files: Array.isArray(update.files) ? update.files.map(clean).filter(Boolean) : [],
  });
  state.updates = state.updates.slice(-250);
}

function clean(value) {
  return String(value || "").trim();
}

function asText(data) {
  return { content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] };
}

function listRecent(state, limit = 20, since = "") {
  let updates = Array.isArray(state.updates) ? state.updates : [];
  if (since) updates = updates.filter((item) => item.at > since);
  return updates.slice(-Math.max(1, Math.min(Number(limit) || 20, 100)));
}

function upsertTask(state, args) {
  const title = clean(args.title || args.task);
  if (!title) throw new Error("title is required");
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  const existing = state.tasks.find((item) => item.title === title || item.id === args.id);
  const task = existing || { id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title };
  task.owner = clean(args.owner) || task.owner || "";
  task.status = clean(args.status) || task.status || "todo";
  task.notes = clean(args.notes) || task.notes || "";
  task.updatedAt = new Date().toISOString();
  if (!existing) state.tasks.push(task);
  return task;
}

const mcp = new Server(
  { name: "agent-room", version: "0.1.0" },
  {
    capabilities: { tools: {} },
    instructions:
      "Use this local room to coordinate work with other coding agents. Post concise updates, read the shared plan/status before editing, and do not put API keys or secrets here.",
  },
);

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "post_update",
      description: "Post a short work update for Codex/Claude coordination. Do not include secrets.",
      inputSchema: {
        type: "object",
        properties: {
          from: { type: "string", description: "Agent name, e.g. Claude Code or Codex" },
          kind: { type: "string", description: "note, plan, blocker, done, question, review" },
          task: { type: "string", description: "Optional task label" },
          text: { type: "string", description: "Short update text" },
          files: { type: "array", items: { type: "string" }, description: "Optional file paths touched or relevant" },
        },
        required: ["text"],
      },
    },
    {
      name: "read_updates",
      description: "Read recent shared updates from the agent room.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "How many updates to read, max 100" },
          since: { type: "string", description: "Optional ISO timestamp; only return newer updates" },
        },
      },
    },
    {
      name: "set_plan",
      description: "Set the current shared plan/objective for the project.",
      inputSchema: {
        type: "object",
        properties: {
          from: { type: "string" },
          objective: { type: "string" },
          status: { type: "string", description: "active, blocked, paused, done" },
          phases: { type: "array", items: { type: "string" } },
        },
        required: ["objective"],
      },
    },
    {
      name: "upsert_task",
      description: "Create or update a shared task in the room.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          owner: { type: "string" },
          status: { type: "string", description: "todo, doing, review, done, blocked" },
          notes: { type: "string" },
        },
        required: ["title"],
      },
    },
    {
      name: "get_status",
      description: "Get shared plan, open tasks, and latest updates.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Recent updates to include" },
        },
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  const args = req.params.arguments || {};
  const state = readState();

  switch (req.params.name) {
    case "post_update": {
      appendUpdate(state, args);
      writeState(state);
      return asText({ ok: true, latest: state.updates.at(-1) });
    }
    case "read_updates": {
      return asText({ updates: listRecent(state, args.limit, clean(args.since)) });
    }
    case "set_plan": {
      state.plan = {
        objective: clean(args.objective),
        status: clean(args.status) || "active",
        phases: Array.isArray(args.phases) ? args.phases.map(clean).filter(Boolean) : [],
        updatedBy: clean(args.from) || "agent",
        updatedAt: new Date().toISOString(),
      };
      appendUpdate(state, {
        from: state.plan.updatedBy,
        kind: "plan",
        text: `Set plan: ${state.plan.objective}`,
      });
      writeState(state);
      return asText({ ok: true, plan: state.plan });
    }
    case "upsert_task": {
      const task = upsertTask(state, args);
      appendUpdate(state, {
        from: clean(args.owner) || "agent",
        kind: "task",
        task: task.title,
        text: `Task ${task.status}: ${task.title}`,
      });
      writeState(state);
      return asText({ ok: true, task });
    }
    case "get_status": {
      return asText({
        plan: state.plan,
        tasks: (state.tasks || []).filter((item) => item.status !== "done"),
        recent: listRecent(state, args.limit || 12),
        stateFile: STATE_FILE,
      });
    }
    default:
      throw new Error(`Unknown tool: ${req.params.name}`);
  }
});

async function main() {
  ensureRoom();
  const transport = new StdioServerTransport();
  await mcp.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`agent-room MCP error: ${error.stack || error.message || error}\n`);
  process.exit(1);
});
