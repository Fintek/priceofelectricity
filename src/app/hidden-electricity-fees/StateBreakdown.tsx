import Link from "next/link";
import type { AmountUnit, HiddenFeeCharge, ItemizedStateFee } from "@/data/hidden-fees";

const USAGE_KWH = 900;

function cents(value: number): string {
  return `${value.toFixed(2)}\u00a2`;
}

function dollars0(value: number): string {
  return `$${Math.round(value)}`;
}

function sharePct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatCharge(amount: number, unit: AmountUnit): string {
  switch (unit) {
    case "usd_per_month":
      return `$${amount.toFixed(2)}/mo`;
    case "cents_per_kwh":
      return `${amount.toFixed(2)}\u00a2/kWh`;
    case "percent":
      return `${amount.toFixed(1)}%`;
    case "usd_flat":
      return `$${amount.toFixed(2)} (one-time)`;
    default: {
      const never: never = unit;
      return never;
    }
  }
}

const cellStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid var(--color-border, #e5e7eb)",
  verticalAlign: "top",
};

const headStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid var(--color-border, #e5e7eb)",
  backgroundColor: "var(--color-surface-alt, #f9fafb)",
  whiteSpace: "nowrap",
};

type ComponentRow = { label: string; value: number };

/** CA-only: riders we name but do not price per-line (filed values are dated). */
function caNamedRiders(charges: HiddenFeeCharge[]): HiddenFeeCharge[] {
  return charges.filter((c) => !c.includedInAddon && !c.name.includes("Credit"));
}

function caCredits(charges: HiddenFeeCharge[]): HiddenFeeCharge[] {
  return charges.filter((c) => !c.includedInAddon && c.name.includes("Credit"));
}

function LineItems({ state }: { state: ItemizedStateFee }) {
  const counted = state.charges.filter((c) => c.includedInAddon);
  const isCalifornia = state.slug === "california";

  if (isCalifornia) {
    const riders = caNamedRiders(state.charges);
    const credits = caCredits(state.charges);
    return (
      <div style={{ marginTop: 8 }}>
        <h4 style={{ fontSize: 14, margin: "8px 0 4px 0" }}>Counted in the total</h4>
        <ul style={{ margin: "0 0 10px 0", paddingLeft: 20, lineHeight: 1.7 }}>
          {counted.map((c) => (
            <li key={c.name}>
              {c.name} &mdash; {formatCharge(c.amount, c.unit)}
            </li>
          ))}
        </ul>
        <h4 style={{ fontSize: 14, margin: "8px 0 4px 0" }}>
          Delivery + riders &mdash; 24.23&cent;/kWh (combined)
        </h4>
        <p className="muted" style={{ margin: "0 0 6px 0", fontSize: 13, lineHeight: 1.6, maxWidth: "62ch" }}>
          PG&amp;E files these as separate line items; we show the combined 24.23&cent;/kWh figure rather than
          per-line amounts because the available per-line values are dated.
        </p>
        <ul style={{ margin: "0 0 10px 0", paddingLeft: 20, lineHeight: 1.7 }}>
          {riders.map((c) => (
            <li key={c.name}>{c.name}</li>
          ))}
        </ul>
        {credits.length > 0 ? (
          <details>
            <summary className="muted" style={{ cursor: "pointer", fontSize: 13 }}>
              Credits (not counted)
            </summary>
            <ul className="muted" style={{ margin: "6px 0 0 0", paddingLeft: 20, lineHeight: 1.7, fontSize: 13 }}>
              {credits.map((c) => (
                <li key={c.name}>
                  {c.name}
                  {c.note ? ` — ${c.note}` : ""}
                </li>
              ))}
            </ul>
            <p className="muted" style={{ margin: "6px 0 0 0", fontSize: 12, lineHeight: 1.6, maxWidth: "62ch" }}>
              The Recovery Bond Charge above is offset by a matching Recovery Bond Credit (net about zero).
            </p>
          </details>
        ) : null}
      </div>
    );
  }

  const excluded = state.charges.filter((c) => !c.includedInAddon);
  return (
    <div style={{ marginTop: 8 }}>
      <ul style={{ margin: "0 0 10px 0", paddingLeft: 20, lineHeight: 1.7 }}>
        {counted.map((c) => (
          <li key={c.name}>
            {c.name} &mdash; {formatCharge(c.amount, c.unit)}
          </li>
        ))}
      </ul>
      {excluded.length > 0 ? (
        <details>
          <summary className="muted" style={{ cursor: "pointer", fontSize: 13 }}>
            Not counted in the total
          </summary>
          <ul className="muted" style={{ margin: "6px 0 0 0", paddingLeft: 20, lineHeight: 1.7, fontSize: 13 }}>
            {excluded.map((c) => (
              <li key={c.name}>
                {c.name} &mdash; {formatCharge(c.amount, c.unit)}
                {c.note ? ` (${c.note})` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function ComponentTable({
  caption,
  rows,
  total,
  rounded,
}: {
  caption: string;
  rows: ComponentRow[];
  total: { label: string; value: number };
  rounded: boolean;
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table" style={{ maxWidth: "44ch" }}>
        <caption className="muted" style={{ textAlign: "left", padding: "0 0 10px 0", fontSize: 13, lineHeight: 1.5 }}>
          {caption}
          {rounded
            ? " Figures are rounded to the nearest 0.01\u00a2, so the rows may not visibly sum to the all-in."
            : ""}
        </caption>
        <thead>
          <tr>
            <th scope="col" style={{ ...headStyle, textAlign: "left" }}>
              Component
            </th>
            <th scope="col" style={{ ...headStyle, textAlign: "right" }}>
              &cent;/kWh
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" style={{ ...cellStyle, textAlign: "left", fontWeight: 400 }}>
                {row.label}
              </th>
              <td style={{ ...cellStyle, textAlign: "right" }}>{cents(row.value)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" style={{ ...cellStyle, textAlign: "left", fontWeight: 700 }}>
              {total.label}
            </th>
            <td style={{ ...cellStyle, textAlign: "right", fontWeight: 700 }}>{cents(total.value)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function StateBreakdown({ state }: { state: ItemizedStateFee }) {
  const fixedPerKwh = (state.fixedUsdPerMonth / USAGE_KWH) * 100;

  if (state.isDeregulatedDeliveryOnly) {
    const rows: ComponentRow[] = [
      { label: `Fixed charge ($${state.fixedUsdPerMonth.toFixed(2)} \u00f7 ${USAGE_KWH} kWh)`, value: fixedPerKwh },
      { label: "Delivery + riders", value: state.ridersCentsPerKwh },
    ];
    return (
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, marginBottom: 4 }}>
          <Link href={`/${state.slug}`}>{state.state}</Link> &mdash; {state.utility}
        </h3>
        <ComponentTable
          caption="How the Texas delivery charge breaks down (delivery only)."
          rows={rows}
          total={{ label: "Delivery subtotal", value: fixedPerKwh + state.ridersCentsPerKwh }}
          rounded={false}
        />
        <p style={{ margin: "8px 0 0 0", lineHeight: 1.7, maxWidth: "65ch", fontSize: 14 }}>
          Texas is deregulated &mdash; Oncor bills only delivery; your energy is billed separately by a
          competitive retailer, so there&apos;s no single all-in figure.
        </p>
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>See every line item</summary>
          <LineItems state={state} />
        </details>
      </section>
    );
  }

  const energy = state.energyRateCentsPerKwh ?? 0;
  const taxPerKwh = ((energy + state.ridersCentsPerKwh + fixedPerKwh) * state.taxPercent) / 100;
  const allIn = state.allInCentsPerKwh ?? energy + state.ridersCentsPerKwh + fixedPerKwh + taxPerKwh;

  const rows: ComponentRow[] = [
    { label: "Energy (the electricity itself)", value: energy },
    { label: "Delivery + riders", value: state.ridersCentsPerKwh },
    { label: `Fixed charge ($${state.fixedUsdPerMonth.toFixed(2)} \u00f7 ${USAGE_KWH} kWh)`, value: fixedPerKwh },
    { label: `Taxes (${state.taxPercent}% of subtotal)`, value: taxPerKwh },
  ];

  return (
    <section style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 18, marginBottom: 4 }}>
        <Link href={`/${state.slug}`}>{state.state}</Link> &mdash; {state.utility}
      </h3>
      {state.nonEnergyAddonUsd != null && state.nonEnergySharePercent != null ? (
        <p style={{ margin: "0 0 10px 0", lineHeight: 1.6, maxWidth: "65ch", fontWeight: 500 }}>
          {dollars0(state.nonEnergyAddonUsd)}/mo in non-energy charges &mdash;{" "}
          {sharePct(state.nonEnergySharePercent)} of a typical {USAGE_KWH} kWh bill.
        </p>
      ) : null}
      <ComponentTable
        caption={`How the ${cents(allIn)}/kWh all-in breaks down.`}
        rows={rows}
        total={{ label: "All-in cost", value: allIn }}
        rounded
      />
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>See every line item</summary>
        <LineItems state={state} />
      </details>
    </section>
  );
}
