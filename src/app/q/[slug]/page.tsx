import type { ComponentProps } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/db";
import { recordPageView } from "@/services/analytics";
import { selectAndRecordCampaignsForPage } from "@/services/ads";

export const dynamic = "force-dynamic";

function normalizeSlugParam(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function normalizeOutboundLinks(markdown: string) {
  return markdown.replaceAll(
    "https://api.salonnote.uk",
    "https://app.salonnote.uk",
  );
}

async function getQuestion(slug: string) {
  return db.question.findFirst({
    where: { slug: normalizeSlugParam(slug), status: "PUBLISHED" },
    include: {
      answers: { where: { isActive: true }, take: 1 },
      seo: true,
      category: true,
      primaryKeyword: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const q = await getQuestion(slug);
    if (!q) return {};

    return {
      title: q.seo?.title ?? q.title,
      description: q.seo?.description,
      alternates: { canonical: q.seo?.canonicalUrl ?? `/q/${q.slug}` },
    };
  } catch {
    return {};
  }
}

function MarkdownImage(props: ComponentProps<"img">) {
  const src = typeof props.src === "string" ? props.src : "";
  const isSalonNotePromo = src.includes("/images/salonnote/");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={props.alt ?? ""}
      className={isSalonNotePromo ? "promo-image" : undefined}
      loading="lazy"
    />
  );
}

function MarkdownLink(props: ComponentProps<"a">) {
  const href = typeof props.href === "string" ? props.href : "";
  const safeHref = href.replace("https://api.salonnote.uk", "https://app.salonnote.uk");
  const isExternal = safeHref.startsWith("http");

  return (
    <a
      {...props}
      href={safeHref}
      rel={isExternal ? "noreferrer" : props.rel}
      target={isExternal ? "_blank" : props.target}
    />
  );
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const q = await getQuestion(slug).catch(() => null);
  if (!q) notFound();

  const answer = q.answers[0];
  if (!answer) notFound();

  const ads = await selectAndRecordCampaignsForPage(q.id).catch(() => []);
  await recordPageView(q.id, ads.length).catch(() => null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: q.title,
    datePublished: q.publishedAt?.toISOString(),
    articleBody: answer.summary,
  };

  return (
    <main className="content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="eyebrow">
        {q.category?.name ?? "Guide"} · 검수된 답변
      </div>
      <h1>{q.title}</h1>
      <p className="lead">{answer.summary}</p>
      <ReactMarkdown
        components={{
          a: MarkdownLink,
          img: MarkdownImage,
        }}
      >
        {normalizeOutboundLinks(answer.contentMarkdown)}
      </ReactMarkdown>
      {ads[0] ? (
        <aside className="ad">
          <small>관련 서비스</small>
          <h3>{ads[0].creative.title}</h3>
          <p>{ads[0].creative.description}</p>
          <a className="button" href={`/go/${ads[0].creative.id}?q=${q.id}`}>
            {ads[0].creative.buttonText}
          </a>
        </aside>
      ) : null}
    </main>
  );
}
