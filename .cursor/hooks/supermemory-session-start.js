#!/usr/bin/env node
// Cursor `sessionStart` hook for the PriceOfElectricity (POE) project.
//
// Injects a non-skippable system reminder telling the agent that the literal
// trigger phrase "end of session" must invoke the POE Supermemory save
// protocol. This guarantees every new agent conversation in the POE
// workspace knows about the trigger and the procedure, even when rules
// loading is unreliable.
//
// Reads JSON from stdin, writes JSON to stdout. Failing open is intentional
// (any error becomes an empty object so session start is never blocked).

"use strict";

const PROTOCOL = `<system-reminder>
PriceOfElectricity (POE) Supermemory protocol — REQUIRED.

== START SESSION (recall prior context) ==
At the start of a new session, or whenever the user says the phrase
"Start Session" (or close variants such as "start session", with trailing
punctuation), load prior project context BEFORE substantive work:

1. Call the "recall" tool on the project-scoped Supermemory MCP server
   "project-0-priceofelectricity-supermemory". It is already scoped to the
   POE space, so the tool does not take a containerTag argument.
2. Use a query covering recent decisions, conventions, recent changes, and
   open threads/follow-ups. Briefly orient yourself from what is returned
   before acting. Treat repo files and git state as the source of truth;
   memories are supplementary context.

== END OF SESSION (save a summary) ==
When the user types the literal phrase "end of session" (or close variants
such as "end-of-session", "end_of_session", or with trailing punctuation),
you MUST run this protocol BEFORE doing anything else in that turn:

1. Use the "memory" tool with action "save" on the same
   "project-0-priceofelectricity-supermemory" server (no containerTag) and a
   single \`content\` string summarizing this session. Aim for a focused list
   of short bullets or sentences. Do not paste large code blocks.
2. The summary must capture:
   - What the user asked for this session
   - What changed (files touched, commands run, decisions made, and any
     commit SHAs and titles)
   - Current state and verification results (typecheck/build/verify
     outcomes, deploy status, open PRs)
   - Open items or deliberate follow-ups so the next agent picks them up
3. Do NOT save secrets, API keys, tokens, or .env values.
4. After the save call returns, briefly confirm to the user what was saved
   and surface any deferred follow-ups in your response. If the save fails,
   surface the error to the user instead of silently continuing.

This injection comes from the project's sessionStart hook
(.cursor/hooks/supermemory-session-start.js) and the .cursor/rules/
supermemory-poe.mdc rule. It is mandatory — do not skip it.
</system-reminder>`;

function readStdin() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      raw += chunk;
    });
    process.stdin.on("end", () => resolve(raw));
    process.stdin.on("error", () => resolve(raw));
  });
}

(async function main() {
  await readStdin();
  process.stdout.write(JSON.stringify({ additional_context: PROTOCOL }));
})().catch(() => {
  process.stdout.write("{}");
});
