import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

type ReleaseMetadata = {
  commit: string;
  builtAt: string;
  dataVersion: string;
  node: string;
  appVersion: string;
};

function getCommitHash(): string {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0) return "unknown";
  const hash = result.stdout.trim();
  return hash.length > 0 ? hash : "unknown";
}

async function getAppVersion(): Promise<string> {
  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const raw = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : "unknown";
  } catch {
    return "unknown";
  }
}

async function getDataVersion(): Promise<string> {
  try {
    const latestSnapshotPath = join(
      process.cwd(),
      "src",
      "data",
      "snapshots",
      "latest.json"
    );
    const raw = await readFile(latestSnapshotPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : "unknown";
  } catch {
    return "unknown";
  }
}

async function main(): Promise<void> {
  const release: ReleaseMetadata = {
    commit: getCommitHash(),
    builtAt: new Date().toISOString(),
    dataVersion: await getDataVersion(),
    node: process.version,
    appVersion: await getAppVersion(),
  };

  const publicDir = join(process.cwd(), "public");
  const outputPath = join(publicDir, "release.json");
  await mkdir(publicDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(release, null, 2)}\n`, "utf8");

  console.log(`[release:gen] Wrote ${outputPath}`);
  console.log(`[release:gen] commit=${release.commit} dataVersion=${release.dataVersion}`);
}

main().catch((error) => {
  console.error("[release:gen] Failed to generate release metadata.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
