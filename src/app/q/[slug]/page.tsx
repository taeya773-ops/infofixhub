import type { ComponentProps } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
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
      robots: q.seo?.noIndex
        ? { index: false, follow: false }
        : { index: true, follow: true },
      alternates: { canonical: q.seo?.canonicalUrl ?? `/q/${q.slug}` },
      openGraph: {
        title: q.seo?.title ?? q.title,
        description: q.seo?.description ?? undefined,
        type: "article",
        url: q.seo?.canonicalUrl ?? `/q/${q.slug}`,
        publishedTime: q.publishedAt?.toISOString(),
        modifiedTime: q.updatedAt.toISOString(),
        siteName: "InfoFixHub",
      },
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
  const safeHref = href.replace(
    "https://api.salonnote.uk",
    "https://app.salonnote.uk",
  );
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
  const pageUrl = `${env.NEXT_PUBLIC_SITE_URL}/q/${q.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    headline: q.title,
    description: q.seo?.description ?? answer.summary,
    datePublished: q.publishedAt?.toISOString(),
    dateModified: q.updatedAt.toISOString(),
    inLanguage: q.language,
    author: {
      "@type": "Organization",
      name: "InfoFixHub",
    },
    publisher: {
      "@type": "Organization",
      name: "InfoFixHub",
    },
    about: q.primaryKeyword?.keyword,
    articleSection: q.category?.name,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: env.NEXT_PUBLIC_SITE_URL,
      },
      ...(q.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: q.category.name,
              item: `${env.NEXT_PUBLIC_SITE_URL}/category/${q.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: q.category ? 3 : 2,
        name: q.title,
        item: pageUrl,
      },
    ],
  };
  const faqJsonLd =
    q.slug === "vibe-coding-web-domain-api-deploy-guide"
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "바이브코딩으로 만든 웹도 실제 운영 배포가 가능한가요?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "가능합니다. 다만 코드 생성 이후 GitHub 저장, Render 같은 배포 서비스 연결, Supabase PostgreSQL DATABASE_URL 설정, API Key 환경변수 분리, 도메인과 HTTPS 연결, 실제 DB/API 동작 검증까지 확인해야 합니다.",
              },
            },
            {
              "@type": "Question",
              name: "API 키와 DATABASE_URL은 어디에 저장해야 안전한가요?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "코드나 공개 문서에 직접 적지 말고 로컬 .env와 Render 같은 배포 플랫폼의 Environment Variables에 저장해야 합니다. GitHub에 올라가지 않도록 .env는 반드시 .gitignore에 포함해야 합니다.",
              },
            },
            {
              "@type": "Question",
              name: "배포 후 무엇을 확인해야 하나요?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "실제 도메인 접속, robots.txt와 sitemap.xml, DB health endpoint, Prisma migration, seed 데이터, 공개 페이지, 관리자 CRUD, CTA redirect, lint/typecheck/test/build 결과를 순서대로 확인하는 것이 좋습니다.",
              },
            },
          ],
        }
      : null;

  return (
    <main className="content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
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
