import { createShellSession, readChallengeState, writeChallengeState } from "./challenge-state.js";

function normalizePath(pathname) {
  const segments = [];
  for (const part of pathname.split("/")) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      segments.pop();
      continue;
    }
    segments.push(part);
  }
  return `/${segments.join("/")}`;
}

function resolvePath(current, target = ".") {
  if (target.startsWith("/")) {
    return normalizePath(target);
  }
  return normalizePath(`${current}/${target}`);
}

function getNode(host, targetPath) {
  return host.files[targetPath] || null;
}

function ensureDir(host, targetPath) {
  if (!host.files[targetPath]) {
    host.files[targetPath] = { type: "dir" };
  }
}

function writeFile(host, targetPath, content, mode = "0644") {
  const parent = normalizePath(targetPath.split("/").slice(0, -1).join("/") || "/");
  ensureDir(host, parent);
  host.files[targetPath] = { type: "file", content, mode };
}

function listChildren(host, targetPath) {
  const prefix = targetPath === "/" ? "/" : `${targetPath}/`;
  const children = [];
  for (const key of Object.keys(host.files)) {
    if (!key.startsWith(prefix) || key === targetPath) {
      continue;
    }
    const remainder = key.slice(prefix.length);
    if (!remainder || remainder.includes("/")) {
      continue;
    }
    children.push(remainder);
  }
  return children.sort();
}

async function handleCurl(host, command) {
  const urlMatch = command.match(/https?:\/\/[^\s'"]+/);
  if (!urlMatch) {
    return "curl: no URL specified";
  }

  const target = new URL(urlMatch[0]);
  if (target.hostname !== "127.0.0.1") {
    return `curl: simulated shell only allows localhost training services (${target.href})`;
  }

  const headers = {};
  const authMatch = command.match(/Authorization:\s*Bearer\s+([A-Za-z0-9._-]+)/);
  if (authMatch) {
    headers.Authorization = `Bearer ${authMatch[1]}`;
  }
  const bodyMatch = command.match(/-d\s+'([^']+)'/);

  const response = await fetch(target.href, {
    method: command.includes("-X POST") ? "POST" : "GET",
    headers: {
      ...(Object.keys(headers).length ? headers : {}),
      ...(bodyMatch ? { "Content-Type": "application/json" } : {})
    },
    body: bodyMatch ? bodyMatch[1] : undefined
  });

  return await response.text();
}

function applyBackgroundJobs(host, state) {
  if (host.actor === "devops" && !host.flags.tarEscalated) {
    const stagingChildren = listChildren(host, "/srv/fan-backups/staging");
    const hasCheckpoint = stagingChildren.includes("--checkpoint=1");
    const hasAction = stagingChildren.some((name) => name.startsWith("--checkpoint-action="));
    if (hasCheckpoint && hasAction) {
      host.flags.tarEscalated = true;
      state.virtualHosts.root = {
        ...structuredClone(host),
        actor: "root",
        cwd: "/root",
        home: "/root",
        files: {
          ...structuredClone(host.files),
          "/root": { type: "dir" },
          "/root/root.txt": {
            type: "file",
            content: "flag{fansonly-root-compromise-simulated}\n"
          }
        }
      };
      state.shellSessions = Object.fromEntries(
        Object.entries(state.shellSessions).map(([token, session]) => {
          if (session.actor === "devops") {
            return [token, { ...session, actor: "root" }];
          }
          return [token, session];
        })
      );
    }
  }

  if (host.actor === "devops" && !host.flags.pathEscalated) {
    const planted = getNode(host, "/home/devops/.local/bin/du") || getNode(host, "/home/devops/.local/bin/find");
    if (planted?.type === "file") {
      host.flags.pathEscalated = true;
      state.virtualHosts.root = {
        ...structuredClone(host),
        actor: "root",
        cwd: "/root",
        home: "/root",
        files: {
          ...structuredClone(host.files),
          "/root": { type: "dir" },
          "/root/root.txt": {
            type: "file",
            content: "flag{fansonly-root-compromise-simulated}\n"
          }
        }
      };
      state.shellSessions = Object.fromEntries(
        Object.entries(state.shellSessions).map(([token, session]) => {
          if (session.actor === "devops") {
            return [token, { ...session, actor: "root" }];
          }
          return [token, session];
        })
      );
    }
  }
}

function parseWriteCommand(command) {
  const match = command.match(/^(?:echo|printf)\s+['"]([\s\S]*)['"]\s*>\s*(\S+)$/);
  if (!match) {
    return null;
  }
  return { content: match[1].replace(/\\n/g, "\n"), target: match[2] };
}

function promptFor(host) {
  return `${host.actor}@fansonly:${host.cwd}$`;
}

export function createWebShellSession() {
  return createShellSession("www-data", "server-action");
}

export function createDevopsShellSession() {
  return createShellSession("devops", "ssh-sim");
}

export async function runShellCommand(sessionToken, command) {
  const state = readChallengeState();
  const session = state.shellSessions[sessionToken];
  if (!session) {
    return { error: "Unknown shell session." };
  }

  const host = state.virtualHosts[session.actor];
  const trimmed = command.trim();
  let output = "";

  if (!trimmed) {
    return { actor: session.actor, cwd: host.cwd, prompt: promptFor(host), output: "" };
  }

  if (trimmed === "help") {
    output = "Supported commands: pwd, ls, cd, cat, touch, mkdir, chmod, echo/printf > file, curl, whoami, id, env, help";
  } else if (trimmed === "pwd") {
    output = host.cwd;
  } else if (trimmed === "whoami") {
    output = session.actor;
  } else if (trimmed === "id") {
    output = session.actor === "root"
      ? "uid=0(root) gid=0(root) groups=0(root)"
      : session.actor === "devops"
        ? "uid=1001(devops) gid=1001(devops) groups=1001(devops)"
        : "uid=33(www-data) gid=33(www-data) groups=33(www-data)";
  } else if (trimmed === "env") {
    output = Object.entries(host.env).map(([key, value]) => `${key}=${value}`).join("\n");
  } else if (trimmed.startsWith("cd ")) {
    const targetPath = resolvePath(host.cwd, trimmed.slice(3).trim());
    const node = getNode(host, targetPath);
    if (node?.type === "dir") {
      host.cwd = targetPath;
    } else {
      output = `cd: no such file or directory: ${trimmed.slice(3).trim()}`;
    }
  } else if (trimmed === "ls" || trimmed.startsWith("ls ")) {
    const targetPath = trimmed === "ls" ? host.cwd : resolvePath(host.cwd, trimmed.slice(3).trim());
    const node = getNode(host, targetPath);
    if (node?.type !== "dir") {
      output = `ls: cannot access '${targetPath}': No such directory`;
    } else {
      output = listChildren(host, targetPath).join("\n");
    }
  } else if (trimmed.startsWith("cat ")) {
    const targetPath = resolvePath(host.cwd, trimmed.slice(4).trim());
    const node = getNode(host, targetPath);
    if (node?.type !== "file") {
      output = `cat: ${trimmed.slice(4).trim()}: No such file`;
    } else {
      output = node.content;
    }
  } else if (trimmed.startsWith("mkdir ")) {
    const targetPath = resolvePath(host.cwd, trimmed.slice(6).trim());
    ensureDir(host, targetPath);
  } else if (trimmed.startsWith("touch ")) {
    const rawTarget = trimmed.slice(6).replace(/^--\s*/, "").trim();
    const targetPath = resolvePath(host.cwd, rawTarget.replace(/^['"]|['"]$/g, ""));
    writeFile(host, targetPath, "");
  } else if (trimmed.startsWith("chmod ")) {
    const modeMatch = trimmed.match(/^chmod\s+(\S+)\s+(\S+)$/);
    if (!modeMatch) {
      output = "chmod: unsupported syntax";
    } else {
      const targetPath = resolvePath(host.cwd, modeMatch[2]);
      const node = getNode(host, targetPath);
      if (!node?.type) {
        output = `chmod: cannot access '${modeMatch[2]}'`;
      } else {
        node.mode = modeMatch[1];
      }
    }
  } else if (trimmed.startsWith("curl ")) {
    output = await handleCurl(host, trimmed);
  } else {
    const write = parseWriteCommand(trimmed);
    if (write) {
      const targetPath = resolvePath(host.cwd, write.target);
      writeFile(host, targetPath, write.content, "0755");
    } else {
      output = `sh: ${trimmed.split(/\s+/)[0]}: command not found`;
    }
  }

  applyBackgroundJobs(host, state);
  writeChallengeState(state);

  const refreshedSession = state.shellSessions[sessionToken] || session;
  const refreshedHost = state.virtualHosts[refreshedSession.actor];
  return {
    actor: refreshedSession.actor,
    cwd: refreshedHost.cwd,
    prompt: promptFor(refreshedHost),
    output
  };
}
