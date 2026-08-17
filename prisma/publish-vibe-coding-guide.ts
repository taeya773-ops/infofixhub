import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDatabaseSchema } from "../src/lib/database-url";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const db = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString },
    { schema: getDatabaseSchema(connectionString) },
  ),
});

const slug = "vibe-coding-web-domain-api-deploy-guide";
const title = "바이브코딩으로 웹 하나를 실제 배포하고 DB/API까지 연결하는 과정";
const summary =
  "바이브코딩으로 만든 웹을 실제 서비스로 만들려면 GitHub, Render 배포, Supabase PostgreSQL, DATABASE_URL, API Key, 도메인, DB 연결 검증까지 이어서 확인해야 합니다.";

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function loadMarkdown() {
  return readFileSync("outputs/vibe-coding-web-domain-api-guide.md", "utf8")
    .replaceAll("./01-render-project-dashboard.png", "/images/vibe-coding/01-render-project-dashboard.png")
    .replaceAll("./02-render-web-service-detail.png", "/images/vibe-coding/02-render-web-service-detail.png")
    .replaceAll("./03-render-environment-variables.png", "/images/vibe-coding/03-render-environment-variables.png")
    .replaceAll("./04-supabase-direct-connection-string.png", "/images/vibe-coding/04-supabase-direct-connection-string.png")
    .replaceAll("./db-check-terminal.png", "/images/vibe-coding/05-db-check-terminal.png");
}

async function main() {
  const category = await db.category.upsert({
    where: { slug: "vibe-coding" },
    update: {
      name: "바이브코딩",
      description: "AI와 함께 웹서비스를 만들고 실제 운영 환경에 연결하는 가이드",
      active: true,
    },
    create: {
      name: "바이브코딩",
      slug: "vibe-coding",
      description: "AI와 함께 웹서비스를 만들고 실제 운영 환경에 연결하는 가이드",
      active: true,
    },
  });

  const keyword = await db.keyword.upsert({
    where: {
      normalizedKeyword_country_language: {
        normalizedKeyword: "바이브코딩 웹 배포 api db 연결",
        country: "KR",
        language: "ko",
      },
    },
    update: {
      keyword: "바이브코딩 웹 배포 API DB 연결",
      categoryId: category.id,
      status: "PUBLISHED",
      opportunityScore: 88,
      adOpportunityScore: 20,
    },
    create: {
      keyword: "바이브코딩 웹 배포 API DB 연결",
      normalizedKeyword: "바이브코딩 웹 배포 api db 연결",
      categoryId: category.id,
      country: "KR",
      language: "ko",
      status: "PUBLISHED",
      searchVolume: 120,
      competitionScore: 0.25,
      trendScore: 0.8,
      opportunityScore: 88,
      adOpportunityScore: 20,
    },
  });

  const question = await db.question.upsert({
    where: { slug },
    update: {
      title,
      primaryKeywordId: keyword.id,
      categoryId: category.id,
      searchIntent: "HOW_TO",
      status: "PUBLISHED",
      qualityScore: 94,
      publishedAt: new Date(),
    },
    create: {
      title,
      slug,
      primaryKeywordId: keyword.id,
      categoryId: category.id,
      searchIntent: "HOW_TO",
      language: "ko",
      country: "KR",
      status: "PUBLISHED",
      qualityScore: 94,
      publishedAt: new Date(),
    },
    include: { answers: { orderBy: { version: "desc" }, take: 1 } },
  });

  const contentMarkdown = loadMarkdown();
  const nextVersion = (question.answers[0]?.version ?? 0) + 1;

  await db.$transaction([
    db.answer.updateMany({
      where: { questionId: question.id, isActive: true },
      data: { isActive: false },
    }),
    db.answer.create({
      data: {
        questionId: question.id,
        summary,
        contentMarkdown,
        contentHtml: markdownToHtml(contentMarkdown),
        provider: "manual-editor",
        model: "vibe-coding-guide",
        promptVersion: "manual-v1",
        confidenceScore: 94,
        qualityScore: 94,
        version: nextVersion,
        isActive: true,
      },
    }),
    db.seoMetadata.upsert({
      where: { questionId: question.id },
      update: {
        title: "바이브코딩 웹 배포: 도메인, DB, API 연결 과정",
        description:
          "바이브코딩으로 만든 웹을 Render, Supabase PostgreSQL, Prisma, API Key, 도메인까지 연결해 실제 서비스로 배포하는 전체 과정입니다.",
      },
      create: {
        questionId: question.id,
        title: "바이브코딩 웹 배포: 도메인, DB, API 연결 과정",
        description:
          "바이브코딩으로 만든 웹을 Render, Supabase PostgreSQL, Prisma, API Key, 도메인까지 연결해 실제 서비스로 배포하는 전체 과정입니다.",
      },
    }),
  ]);

  console.log(`Published https://infofixhub.org/q/${slug} version ${nextVersion}`);
}

main()
  .finally(async () => db.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
