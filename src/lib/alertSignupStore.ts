import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type AlertArea = "regulatory" | "ai-energy" | "state";

export type AlertSignup = {
  id: string;
  createdAt: string;
  email: string;
  area: AlertArea;
  state?: string;
  region?: string;
  frequency?: "weekly" | "monthly";
  topics?: string[];
  userAgent?: string;
  ipHint?: string;
};

type EmailSinkMode = "log" | "file" | "none";

function getEmailSinkMode(): EmailSinkMode {
  const raw = process.env.EMAIL_SINK?.trim().toLowerCase();
  if (raw === "file" || raw === "none" || raw === "log") return raw;
  return "log";
}

function getStorePath(): string {
  return path.join(process.cwd(), ".data", "alert-signups.jsonl");
}

export async function storeAlertSignup(
  signup: AlertSignup
): Promise<"stored" | "logged" | "dropped"> {
  const mode = getEmailSinkMode();

  if (mode === "none") {
    return "dropped";
  }

  if (mode === "log") {
    console.log(JSON.stringify({ type: "alert-signup", ...signup }));
    return "logged";
  }

  try {
    const filePath = getStorePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(signup)}\n`, "utf8");
    return "stored";
  } catch {
    // Fallback to server log so signups are not silently lost.
    console.log(JSON.stringify({ type: "alert-signup-fallback-log", ...signup }));
    return "logged";
  }
}
