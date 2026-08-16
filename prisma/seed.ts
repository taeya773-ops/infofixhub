import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDatabaseSchema } from "../src/lib/database-url";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured. Copy .env.example to .env and set a PostgreSQL connection string before seeding.",
  );
}

const db = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString },
    { schema: getDatabaseSchema(connectionString) },
  ),
});

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  const category = await db.category.upsert({
    where: { slug: "guides" },
    update: {
      name: "실용 가이드",
      description: "검색 질문에 직접 답하는 검수된 실용 가이드",
      active: true,
    },
    create: {
      name: "실용 가이드",
      slug: "guides",
      description: "검색 질문에 직접 답하는 검수된 실용 가이드",
    },
  });

  const seedTopic = await db.seedTopic.upsert({
    where: {
      categoryId_keyword_country_language: {
        categoryId: category.id,
        keyword: "윈도우",
        country: "KR",
        language: "ko",
      },
    },
    update: { active: true },
    create: {
      categoryId: category.id,
      keyword: "윈도우",
      country: "KR",
      language: "ko",
    },
  });

  const keyword = await db.keyword.upsert({
    where: {
      normalizedKeyword_country_language: {
        normalizedKeyword: "윈도우",
        country: "KR",
        language: "ko",
      },
    },
    update: {
      categoryId: category.id,
      status: "SELECTED",
      searchVolume: 12000,
      competitionScore: 42,
      trendScore: 68,
      opportunityScore: 73,
      adOpportunityScore: 58,
      metricsUpdatedAt: new Date(),
    },
    create: {
      keyword: seedTopic.keyword,
      normalizedKeyword: "윈도우",
      categoryId: category.id,
      country: "KR",
      language: "ko",
      status: "SELECTED",
      searchVolume: 12000,
      competitionScore: 42,
      trendScore: 68,
      opportunityScore: 73,
      adOpportunityScore: 58,
      sources: { create: { provider: "SEED" } },
      snapshots: {
        create: {
          provider: "SEED",
          searchVolume: 12000,
          competitionScore: 42,
          trendScore: 68,
        },
      },
    },
  });

  const question = await db.question.upsert({
    where: { slug: "windows-practical-guide" },
    update: {
      title: "윈도우 설정에서 먼저 확인할 핵심 항목",
      status: "PUBLISHED",
      publishedAt: new Date(),
      qualityScore: 82,
    },
    create: {
      primaryKeywordId: keyword.id,
      categoryId: category.id,
      title: "윈도우 설정에서 먼저 확인할 핵심 항목",
      slug: "windows-practical-guide",
      searchIntent: "informational",
      language: "ko",
      country: "KR",
      status: "PUBLISHED",
      qualityScore: 82,
      publishedAt: new Date(),
      answers: {
        create: {
          summary: "윈도우 기본 설정을 점검할 때는 업데이트, 저장소, 보안, 시작 앱을 먼저 확인하면 문제 원인을 빠르게 좁힐 수 있습니다.",
          contentMarkdown:
            "윈도우를 새로 설치했거나 속도가 느려졌다면 먼저 업데이트 상태, 저장소 여유 공간, 보안 설정, 시작 앱을 확인하세요. 이 네 가지는 대부분의 초기 성능 문제와 오류를 빠르게 좁혀 줍니다.\n\n1. Windows Update에서 보류 중인 업데이트를 적용합니다.\n2. 저장소 설정에서 임시 파일과 남은 용량을 확인합니다.\n3. Windows 보안에서 보호 상태를 점검합니다.\n4. 작업 관리자에서 시작 앱을 줄입니다.",
          contentHtml:
            "<p>윈도우를 새로 설치했거나 속도가 느려졌다면 먼저 업데이트 상태, 저장소 여유 공간, 보안 설정, 시작 앱을 확인하세요.</p>",
          provider: "seed",
          model: "seed",
          promptVersion: "seed-v1",
          confidenceScore: 90,
          qualityScore: 82,
        },
      },
      seo: {
        create: {
          title: "윈도우 설정 점검 가이드",
          description: "윈도우 업데이트, 저장소, 보안, 시작 앱을 빠르게 점검하는 방법입니다.",
        },
      },
    },
  });

  console.log(
    `Seed complete: category=${category.id}, seedTopic=${seedTopic.id}, keyword=${keyword.id}, question=${question.id}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
