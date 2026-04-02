"use client";

import type { FormEvent } from "react";

const CONTACT_EMAIL = "priceofelectricity@gmail.com";

const formAction = process.env.NEXT_PUBLIC_ADVERTISER_INQUIRY_FORM_ACTION?.trim();

const fieldStyle = { width: "100%", maxWidth: 420, padding: "8px 10px" } as const;
const labelStyle = { display: "block", marginTop: 12, marginBottom: 6 } as const;

function buildMailtoBody(fd: FormData): string {
  const name = String(fd.get("name") ?? "").trim();
  const company = String(fd.get("company") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const website = String(fd.get("website") ?? "").trim();
  const interest = String(fd.get("interest") ?? "").trim();
  const budget = String(fd.get("budget") ?? "").trim();
  const message = String(fd.get("message") ?? "").trim();

  const lines = [
    "Advertiser inquiry — PriceOfElectricity.com",
    "",
    `Name: ${name}`,
    `Company: ${company}`,
    `Work email: ${email}`,
    website ? `Website: ${website}` : null,
    `Interest: ${interest}`,
    budget ? `Budget range: ${budget}` : null,
    "",
    "Message:",
    message,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

export default function AdvertiserInquiryForm() {
  function handleMailtoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const subject = "Advertiser inquiry — PriceOfElectricity.com";
    const body = buildMailtoBody(fd);
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  const fields = (
    <>
      <label htmlFor="adv-name" style={labelStyle}>
        Name <span className="muted">(required)</span>
      </label>
      <input
        id="adv-name"
        name="name"
        type="text"
        autoComplete="name"
        required
        style={fieldStyle}
      />

      <label htmlFor="adv-company" style={labelStyle}>
        Company <span className="muted">(required)</span>
      </label>
      <input
        id="adv-company"
        name="company"
        type="text"
        autoComplete="organization"
        required
        style={fieldStyle}
      />

      <label htmlFor="adv-email" style={labelStyle}>
        Work email <span className="muted">(required)</span>
      </label>
      <input
        id="adv-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="you@company.com"
        style={fieldStyle}
      />

      <label htmlFor="adv-website" style={labelStyle}>
        Website <span className="muted">(optional)</span>
      </label>
      <input
        id="adv-website"
        name="website"
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://"
        style={fieldStyle}
      />

      <label htmlFor="adv-interest" style={labelStyle}>
        Interest type <span className="muted">(required)</span>
      </label>
      <select id="adv-interest" name="interest" required style={fieldStyle}>
        <option value="">Select one</option>
        <option value="Sponsorship or brand partnership">Sponsorship or brand partnership</option>
        <option value="Display or content adjacency">Display or content adjacency</option>
        <option value="Lead generation or performance">Lead generation or performance</option>
        <option value="Data or research collaboration">Data or research collaboration</option>
        <option value="Other">Other</option>
      </select>

      <label htmlFor="adv-budget" style={labelStyle}>
        Budget range <span className="muted">(optional)</span>
      </label>
      <select id="adv-budget" name="budget" style={fieldStyle}>
        <option value="">Prefer not to say</option>
        <option value="Under $1,000 / month">Under $1,000 / month</option>
        <option value="$1,000 – $5,000 / month">$1,000 – $5,000 / month</option>
        <option value="$5,000 – $15,000 / month">$5,000 – $15,000 / month</option>
        <option value="$15,000+ / month">$15,000+ / month</option>
      </select>

      <label htmlFor="adv-message" style={labelStyle}>
        Message <span className="muted">(required)</span>
      </label>
      <textarea
        id="adv-message"
        name="message"
        required
        rows={5}
        style={{ ...fieldStyle, resize: "vertical" as const }}
      />
    </>
  );

  if (formAction) {
    return (
      <form method="post" action={formAction} style={{ marginTop: 16 }}>
        <input type="hidden" name="_subject" value="Advertiser inquiry — PriceOfElectricity.com" />
        {fields}
        <button type="submit" style={{ marginTop: 16 }}>
          Submit inquiry
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleMailtoSubmit} style={{ marginTop: 16 }}>
      {fields}
      <button type="submit" style={{ marginTop: 16 }}>
        Open email to send inquiry
      </button>
      <p className="muted" style={{ marginTop: 12, fontSize: "var(--font-size-sm)", maxWidth: 480 }}>
        This opens your email app with a pre-filled message to {CONTACT_EMAIL}. If nothing opens, use
        the email address below.
      </p>
    </form>
  );
}
