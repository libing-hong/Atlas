import { spawn } from "node:child_process";
import process from "node:process";

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev"], {
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });
let failure;
try {
  await import("./smoke-test.mjs");
} catch (error) {
  console.error(serverLog.slice(-4_000));
  console.error(error);
  failure = error;
} finally {
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore", windowsHide: true });
  else server.kill("SIGTERM");
  server.stdout.destroy();
  server.stderr.destroy();
}
process.exit(failure ? 1 : 0);
