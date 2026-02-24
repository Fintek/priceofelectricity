import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { TOPICS } from "@/data/topics";
import { isValidQuestionSlug } from "@/lib/slugGuard";
import {
  getQuestionBodyContext,
  getQuestionSlugs,
  parseQuestionSlug,
} from "@/lib/questions";
import { SITE_URL } from "@/lib/site";
import { getRelatedForQuestion } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 2592000;

type QuestionParams = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getQuestionSlugs(STATES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: QuestionParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseQuestionSlug(slug);
  if (!parsed) {
    return {
      title: "Question not found | PriceOfElectricity.com",
      description: "Question page not found.",
      alternates: { canonical: `${BASE_URL}/compare` },
    };
  }

  const state = STATES[parsed.stateSlug];
  if (!state) {
    return {
      title: "Question not found | PriceOfElectricity.com",
      description: "Question page not found.",
      alternates: { canonical: `${BASE_URL}/compare` },
    };
  }

  const title = `${parsed.template.titleTemplate(state.name)} | PriceOfElectricity.com`;
  const description = parsed.template.descriptionTemplate(state.name);
  const canonicalUrl = `${BASE_URL}/questions/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PriceOfElectricity.com",
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function QuestionPage({
  params,
}: {
  params: QuestionParams;
}) {
  const { slug } = await params;
  if (!isValidQuestionSlug(slug)) notFound();
  const parsed = parseQuestionSlug(slug);
  if (!parsed) {
    notFound();
  }

  const state = STATES[parsed.stateSlug];
  if (!state) {
    notFound();
  }

  const context = getQuestionBodyContext(state, STATES);
  const title = parsed.template.titleTemplate(state.name);
  const description = parsed.template.descriptionTemplate(state.name);
  const body = parsed.template.bodyBuilder(context);
  const topicForQuestion = TOPICS.find((topic) =>
    (topic.matchPrefixes ?? []).includes(parsed.template.slugPrefix),
  );

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: `${BASE_URL}/questions/${slug}`,
    description,
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the average residential electricity rate in ${state.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${state.name}'s average residential electricity rate is ${context.avgRateCentsPerKwh.toFixed(2)} cents per kWh.`,
        },
      },
      {
        "@type": "Question",
        name: `What is an example monthly energy-only bill in ${state.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `At 1000 kWh, the energy-only benchmark is about $${context.billAt1000Kwh.toFixed(2)} in ${state.name}.`,
        },
      },
      {
        "@type": "Question",
        name: "Does this estimate include delivery charges and taxes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. It is an energy-only estimate and excludes delivery fees, taxes, fixed charges, and other utility line items.",
        },
      },
    ],
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href={`/${state.slug}`}>{state.name}</Link> {"→"} Common electricity questions
      </p>
      <h1>{title}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {description}
      </p>

      {body.slice(0, 6).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {topicForQuestion ? (
        <p className="muted" style={{ marginTop: 8 }}>
          Explore this topic:{" "}
          <Link href={`/topics/${topicForQuestion.slug}`}>{topicForQuestion.name}</Link>
        </p>
      ) : null}

      <RelatedLinks links={getRelatedForQuestion(slug)} />
    </main>
  );
}
