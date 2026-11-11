import { spawn, spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const shared = spawnSync(npm, ["run", "build", "-w", "@himatu/shared"], { stdio: "inherit" });
if (shared.status !== 0) process.exit(shared.status || 1);

const children = [];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (!child.pid) continue;
    try {
      if (process.platform === "win32") child.kill("SIGTERM");
      else process.kill(-child.pid, "SIGTERM");
    } catch { /* The child may already have stopped. */ }
  }
}
for (const args of [
  ["run", "dev:api"],
  ["run", "dev:web", "--", ...process.argv.slice(2)],
]) {
  const child = spawn(npm, args, { stdio: "inherit", detached: process.platform !== "win32" });
  children.push(child);
  child.on("error", error => { console.error(error.message); stop(1); });
  child.on("exit", code => stop(code || 0));
}
process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));
