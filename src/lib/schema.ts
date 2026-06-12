import { STATES } from "@/data/states";
import type { NormalizedState } from "@/lib/stateBuilder";
import { SITE_URL } from "@/lib/site";
import { getElectricityPriceIndexForState } from "@/lib/priceIndex";

const BASE_URL = SITE_URL;

export type FAQItem = { question: string; answer: string };

function buildFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function buildDcFaqItems(ns: NormalizedState): FAQItem[] {
  const mdRate = STATES.maryland?.avgRateCentsPerKwh;
  const vaRate = STATES.virginia?.avgRateCentsPerKwh;
  const dcRate = ns.avgRateCentsPerKwh;

  let mdVaComparison =
    "Compare live rates on this page and our Maryland and Virginia state pages.";
  if (mdRate != null && vaRate != null) {
    const cheaperThanMd = dcRate < mdRate;
    const cheaperThanVa = dcRate < vaRate;
    if (cheaperThanMd && cheaperThanVa) {
      mdVaComparison = `At ${dcRate}¢/kWh, DC is cheaper than both Maryland (${mdRate}¢/kWh) and Virginia (${vaRate}¢/kWh).`;
    } else if (!cheaperThanMd && !cheaperThanVa) {
      mdVaComparison = `At ${dcRate}¢/kWh, DC is more expensive than both Maryland (${mdRate}¢/kWh) and Virginia (${vaRate}¢/kWh).`;
    } else if (cheaperThanMd) {
      mdVaComparison = `At ${dcRate}¢/kWh, DC is cheaper than Maryland (${mdRate}¢/kWh) but more expensive than Virginia (${vaRate}¢/kWh).`;
    } else {
      mdVaComparison = `At ${dcRate}¢/kWh, DC is more expensive than Maryland (${mdRate}¢/kWh) but cheaper than Virginia (${vaRate}¢/kWh).`;
    }
  }

  return [
    {
      question: "What is the average electricity rate in Washington DC?",
      answer: `Washington DC's average residential electricity rate is ${dcRate}¢/kWh (updated ${ns.updated}).`,
    },
    {
      question: "Who is the electric utility in DC?",
      answer:
        "Pepco (Potomac Electric Power Company) is DC's sole regulated distribution utility; customers can choose a retail electricity supplier for generation supply.",
    },
    {
      question: "Is electricity cheaper in DC than Maryland or Virginia?",
      answer: mdVaComparison,
    },
    {
      question: "Why is DC listed separately from the 50 states?",
      answer:
        "The District of Columbia is a federal district, not a state, but EIA reports residential electricity prices for DC on the same monthly schedule as the 50 states.",
    },
  ];
}

export function buildStateSchema(ns: NormalizedState) {
  const description = `${ns.name} average residential electricity rate is ${ns.avgRateCentsPerKwh}¢/kWh (updated ${ns.updated}). Estimate your monthly bill with our quick calculator.`;

  const faqItems: FAQItem[] =
    ns.slug === "district-of-columbia"
      ? buildDcFaqItems(ns)
      : [
          {
            question: `What is the average residential electricity price in ${ns.name}?`,
            answer: `${ns.name}'s average residential electricity rate is ${ns.avgRateCentsPerKwh}¢/kWh (updated ${ns.updated}).`,
          },
          {
            question: "How is the bill estimate calculated?",
            answer: `The estimate uses: kWh * (${ns.avgRateCentsPerKwh}¢/kWh) / 100. It is an energy-only estimate.`,
          },
          {
            question: "Does the estimate include delivery fees and taxes?",
            answer:
              "No. It excludes delivery fees, taxes, fixed charges, and other utility fees.",
          },
        ];

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${ns.name} Electricity Price`,
    url: `${BASE_URL}/${ns.slug}`,
    description,
    about: {
      "@type": "Thing",
      name: `${ns.name} average residential electricity price`,
      description: `${ns.name} average residential electricity rate is ${ns.avgRateCentsPerKwh}¢/kWh.`,
    },
    ...(ns.source.slug && {
      citation: {
        "@type": "CreativeWork",
        name: ns.source.name,
        url: ns.source.url,
      },
    }),
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Electricity Affordability Index",
        value: ns.affordabilityIndex,
      },
      ...(getElectricityPriceIndexForState(ns.slug)
        ? [
            {
              "@type": "PropertyValue" as const,
              name: "Electricity Price Index",
              value: getElectricityPriceIndexForState(ns.slug)!.indexValue,
            },
          ]
        : []),
    ],
  };

  const faq = buildFAQSchema(faqItems);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${BASE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compare",
        item: `${BASE_URL}/compare`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: ns.name,
        item: `${BASE_URL}/${ns.slug}`,
      },
    ],
  };

  return { webPage, faq, breadcrumb, faqItems };
}

export function buildBillSchema(ns: NormalizedState, kwh: number) {
  const estimatedBill = (kwh * ns.avgRateCentsPerKwh) / 100;

  const faqItems: FAQItem[] = [
    {
      question: `How much is a ${kwh} kWh electric bill in ${ns.name}?`,
      answer: `At ${ns.name}'s average rate of ${ns.avgRateCentsPerKwh}¢/kWh, a ${kwh} kWh electric bill is approximately $${estimatedBill.toFixed(2)} for energy only. This excludes delivery fees, taxes, and fixed charges.`,
    },
    {
      question: "Does this include delivery and taxes?",
      answer:
        "No. This is an energy-only estimate. Actual bills include delivery fees, taxes, fixed charges, and other utility fees.",
    },
  ];

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${kwh} kWh Electric Bill in ${ns.name}`,
    url: `${BASE_URL}/${ns.slug}/bill/${kwh}`,
    description: `Energy-only estimate for ${kwh} kWh electric bill in ${ns.name} at ${ns.avgRateCentsPerKwh}¢/kWh.`,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Electricity Affordability Index",
        value: ns.affordabilityIndex,
      },
    ],
  };

  const faq = buildFAQSchema(faqItems);

  return { webPage, faq, faqItems };
}
