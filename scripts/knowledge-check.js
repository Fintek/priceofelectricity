"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const releaseMode = process.env.RELEASE_MODE === "1";
console.log(`RELEASE_MODE: ${releaseMode ? "ON" : "OFF"}`);
console.log("");

const packagePath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const scripts = packageJson.scripts || {};
const hasKnowledgeTypes = "knowledge:types" in scripts;

const STEPS = [
  { name: "knowledge:build", cmd: "npm", args: ["run", "knowledge:build"] },
  { name: "knowledge:verify", cmd: "npm", args: ["run", "knowledge:verify"] },
  ...(hasKnowledgeTypes ? [{ name: "knowledge:types", cmd: "npm", args: ["run", "knowledge:types"] }] : []),
  { name: "build", cmd: "npm", args: ["run", "build"] },
];

function runStep(step) {
  const start = Date.now();
  const result = spawnSync(step.cmd, step.args, {
    stdio: "pipe",
    shell: true,
    cwd: process.cwd(),
    env: { ...process.env },
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  return { ...step, exitCode: result.status, elapsed, result };
}

function lastLines(str, n = 40) {
  if (!str || typeof str !== "string") return "";
  const lines = str.trim().split(/\r?\n/);
  return lines.slice(-n).join("\n");
}

console.log("KNOWLEDGE CHECK REPORT");
console.log("");

let firstFailure = null;
const results = [];

for (const step of STEPS) {
  const outcome = runStep(step);
  results.push(outcome);

  const status = outcome.exitCode === 0 ? "PASS" : "FAIL";
  const elapsedStr = `(${outcome.elapsed}s)`;
  const label = step.name.padEnd(18);
  console.log(`- ${label} .... ${status} ${elapsedStr}`);

  if (outcome.exitCode !== 0) {
    firstFailure = outcome;
    break;
  }
}

if (!hasKnowledgeTypes && !firstFailure) {
  console.log("- knowledge:types  .... SKIP (script missing)");
}

console.log("");

if (firstFailure) {
  console.log("OVERALL: FAIL");
  console.log("");
  console.log(`First failure: ${firstFailure.name}`);
  console.log("");
  const out = (firstFailure.result.stdout || "").toString();
  const err = (firstFailure.result.stderr || "").toString();
  const combined = [out, err].filter(Boolean).join("\n");
  const tail = lastLines(combined, 40);
  if (tail) {
    console.log("Last 40 lines of output:");
    console.log("---");
    console.log(tail);
    console.log("---");
  }
  process.exit(1);
}

console.log("OVERALL: PASS");
process.exit(0);
