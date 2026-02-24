import { rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { freePort } from "./_ports";

function getNpmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

async function main(): Promise<void> {
  console.log("[dev:reset] Releasing common dev/test ports...");
  await freePort(3000);
  await freePort(3005);

  console.log("[dev:reset] Removing .next cache...");
  await rm(".next", {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 150,
  });

  console.log("[dev:reset] Starting next dev on http://localhost:3000");
  const npmCmd = getNpmCommand();
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", `${npmCmd} run dev`], {
          stdio: "inherit",
          env: process.env,
        })
      : spawn(npmCmd, ["run", "dev"], {
          stdio: "inherit",
          env: process.env,
        });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("[dev:reset] Failed:", error);
  process.exit(1);
});
