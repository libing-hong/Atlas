import { spawn } from "node:child_process";
import process from "node:process";

const node = process.execPath;
const server = spawn(node, ["node_modules/next/dist/bin/next", "dev"], {
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });
async function ready() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch("http://localhost:3000")).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Next.js did not become ready.\n${serverLog.slice(-4_000)}`);
}
function runTests() {
  return new Promise((resolve, reject) => {
    const test = spawn(node, ["node_modules/@playwright/test/cli.js", "test"], { stdio: "inherit", windowsHide: true });
    test.once("error", reject);
    test.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Playwright exited with status ${code ?? "unknown"}`)));
  });
}
let failure;
try {
  await ready();
  await runTests();
} catch (error) {
  failure = error;
  console.error(error);
} finally {
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
  else server.kill("SIGTERM");
  server.stdout.destroy();
  server.stderr.destroy();
}
process.exit(failure ? 1 : 0);
