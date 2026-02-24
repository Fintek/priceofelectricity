import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { join } from "node:path";

function runNpmScript(
  scriptName: string,
  extraEnv?: Record<string, string>
): void {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const env = { ...process.env, ...extraEnv };
  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", `${npmCmd} run ${scriptName}`], {
          stdio: "inherit",
          env,
        })
      : spawnSync(npmCmd, ["run", scriptName], {
          stdio: "inherit",
          env,
        });
  if (result.error) {
    throw new Error(`Unable to run npm script "${scriptName}": ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`npm run ${scriptName} failed (exit ${result.status ?? "unknown"})`);
  }
}

function fail(message: string): never {
  throw new Error(`[predeploy] ${message}`);
}

async function ensureReleaseMetadata(): Promise<void> {
  const releasePath = join(process.cwd(), "public", "release.json");
  try {
    await access(releasePath, constants.F_OK);
    console.log("[predeploy] Found public/release.json");
  } catch {
    console.log("[predeploy] Missing public/release.json, running release:gen...");
    runNpmScript("release:gen");
  }
}

function validateEnvironment(): void {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (!siteUrl) {
    fail("NEXT_PUBLIC_SITE_URL is required");
  }
  if (siteUrl.toLowerCase().includes("localhost")) {
    fail("NEXT_PUBLIC_SITE_URL must not contain localhost");
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  const isProduction = vercelEnv === "production" || nodeEnv === "production";

  if (isProduction) {
    const emailSink = process.env.EMAIL_SINK?.trim().toLowerCase() ?? "log";
    if (emailSink === "file") {
      fail("EMAIL_SINK=file is not allowed in production");
    }

    const token = process.env.ALERT_EXPORT_TOKEN?.trim() ?? "";
    if (!token || token === "change-me") {
      fail(
        "ALERT_EXPORT_TOKEN must be set to a non-placeholder value in production"
      );
    }
  }
}

async function main(): Promise<void> {
  console.log("[predeploy] Validating deployment configuration...");
  validateEnvironment();
  await ensureReleaseMetadata();
  console.log("[predeploy] Running verify...");
  runNpmScript("verify", { VERCEL_ENV: "production", NODE_ENV: "production" });
  console.log("[predeploy] Checks passed.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
