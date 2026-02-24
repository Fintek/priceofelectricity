"use client";

import { FormEvent, useMemo, useState } from "react";

type NewsletterFormProps = {
  states: Array<{ slug: string; name: string }>;
};

type ApiSuccess = { ok: true };
type ApiFailure = { ok: false; error?: string };

function getErrorMessage(error?: string): string {
  if (error === "invalid_email") {
    return "Enter a valid email address.";
  }
  if (error === "invalid_state") {
    return "Select a valid state option.";
  }
  return "Unable to submit right now. Please try again.";
}

export default function NewsletterForm({ states }: NewsletterFormProps) {
  const sortedStates = useMemo(
    () => [...states].sort((a, b) => a.name.localeCompare(b.name)),
    [states],
  );
  const [email, setEmail] = useState("");
  const [state, setState] = useState("all");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          state,
        }),
      });

      const data = (await response.json()) as ApiSuccess | ApiFailure;
      if (!response.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(getErrorMessage((data as ApiFailure).error));
        return;
      }

      setStatus("success");
      setEmail("");
      setState("all");
    } catch {
      setStatus("error");
      setErrorMessage(getErrorMessage());
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <label htmlFor="newsletter-email" style={{ display: "block", marginBottom: 6 }}>
        Email
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        placeholder="you@example.com"
        style={{ width: "100%", maxWidth: 360, padding: "8px 10px" }}
      />

      <label htmlFor="newsletter-state" style={{ display: "block", marginTop: 12, marginBottom: 6 }}>
        State (optional)
      </label>
      <select
        id="newsletter-state"
        name="state"
        value={state}
        onChange={(event) => setState(event.target.value)}
        style={{ width: "100%", maxWidth: 360, padding: "8px 10px" }}
      >
        <option value="all">All states</option>
        {sortedStates.map((entry) => (
          <option key={entry.slug} value={entry.slug}>
            {entry.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 14 }}>
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting..." : "Join newsletter"}
        </button>
      </div>

      {status === "success" ? (
        <p style={{ color: "#2e7d32", marginTop: 12 }}>
          You&apos;re on the list. Monthly updates will be available soon.
        </p>
      ) : null}
      {status === "error" ? (
        <p style={{ color: "#b00020", marginTop: 12 }}>{errorMessage}</p>
      ) : null}
    </form>
  );
}
