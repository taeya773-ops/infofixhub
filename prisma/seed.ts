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

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

const seedQuestions = [
  {
    keyword: "윈도우",
    normalizedKeyword: "윈도우",
    slug: "windows-practical-guide",
    title: "윈도우 설정에서 먼저 확인해야 할 필수 항목",
    seoTitle: "윈도우 설정 점검 가이드",
    seoDescription:
      "윈도우 업데이트, 저장소, 보안, 시작 앱을 빠르게 점검하는 방법을 정리했습니다.",
    summary:
      "윈도우 기본 설정에서 업데이트, 저장소, 보안, 시작 앱을 먼저 확인하면 대부분의 초기 성능 문제와 오류를 빠르게 줄일 수 있습니다.",
    contentMarkdown:
      "윈도우가 느려지거나 오류가 자주 보인다면 복잡한 작업보다 기본 설정 점검부터 시작하는 것이 좋습니다.\n\n1. Windows Update에서 보류 중인 업데이트를 적용합니다.\n2. 저장소 설정에서 임시 파일과 여유 공간을 확인합니다.\n3. Windows 보안에서 보호 상태를 점검합니다.\n4. 작업 관리자에서 시작 앱을 줄입니다.\n\n이 네 가지를 먼저 확인하면 부팅 지연, 업데이트 실패, 저장 공간 부족 같은 흔한 문제를 빠르게 좁힐 수 있습니다.",
    searchVolume: 12000,
    competitionScore: 42,
    trendScore: 68,
    opportunityScore: 73,
    adOpportunityScore: 58,
  },
  {
    keyword: "윈도우 부팅 오류",
    normalizedKeyword: "윈도우 부팅 오류",
    slug: "windows-boot-error-checklist",
    title: "윈도우 부팅 오류가 날 때 먼저 확인할 것",
    seoTitle: "윈도우 부팅 오류 해결 체크리스트",
    seoDescription:
      "윈도우 부팅 오류가 발생했을 때 전원, 주변기기, 안전 모드, 복구 옵션 순서로 확인하는 방법입니다.",
    summary:
      "윈도우 부팅 오류는 전원 연결, 외부 장치, 최근 업데이트, 디스크 상태를 순서대로 확인하면 원인을 더 빠르게 찾을 수 있습니다.",
    contentMarkdown:
      "윈도우가 부팅되지 않을 때는 바로 포맷을 시도하기보다 원인을 단계별로 분리해야 합니다.\n\n1. 전원 케이블과 노트북 충전 상태를 확인합니다.\n2. USB, 외장하드, 프린터 같은 주변기기를 제거한 뒤 다시 켭니다.\n3. 자동 복구 화면이 뜨면 안전 모드 진입을 시도합니다.\n4. 최근 설치한 드라이버나 업데이트를 제거합니다.\n5. 중요한 파일이 있다면 복구 작업 전에 백업 가능 여부를 먼저 확인합니다.\n\n부팅 오류가 반복되면 디스크 손상이나 시스템 파일 문제일 수 있으므로 복구 옵션을 신중하게 사용하는 것이 좋습니다.",
    searchVolume: 5400,
    competitionScore: 55,
    trendScore: 62,
    opportunityScore: 78,
    adOpportunityScore: 76,
  },
  {
    keyword: "컴퓨터 느려짐",
    normalizedKeyword: "컴퓨터 느려짐",
    slug: "slow-computer-fix-checklist",
    title: "컴퓨터가 느려졌을 때 효과적인 점검 순서",
    seoTitle: "컴퓨터 느려짐 해결 순서",
    seoDescription:
      "컴퓨터가 느려졌을 때 시작 프로그램, 저장 공간, 악성코드, 업데이트를 점검하는 실용 가이드입니다.",
    summary:
      "컴퓨터가 갑자기 느려졌다면 시작 프로그램, 저장 공간, 백그라운드 작업, 악성코드 여부를 순서대로 확인하는 것이 효율적입니다.",
    contentMarkdown:
      "컴퓨터 속도 저하는 한 가지 원인보다 여러 작은 문제가 겹쳐 발생하는 경우가 많습니다.\n\n1. 작업 관리자에서 CPU와 메모리를 많이 쓰는 앱을 확인합니다.\n2. 시작 프로그램을 줄여 부팅 직후 부담을 낮춥니다.\n3. 저장 공간을 확보하고 임시 파일을 정리합니다.\n4. Windows 보안 또는 신뢰할 수 있는 백신으로 악성코드를 검사합니다.\n5. 그래픽 드라이버와 Windows 업데이트 상태를 확인합니다.\n\n정리 후에도 계속 느리다면 저장장치 상태나 메모리 부족을 의심해볼 수 있습니다.",
    searchVolume: 8900,
    competitionScore: 48,
    trendScore: 66,
    opportunityScore: 81,
    adOpportunityScore: 70,
  },
] as const;

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

  const createdQuestionIds: string[] = [];

  for (const item of seedQuestions) {
    const seedTopic = await db.seedTopic.upsert({
      where: {
        categoryId_keyword_country_language: {
          categoryId: category.id,
          keyword: item.keyword,
          country: "KR",
          language: "ko",
        },
      },
      update: { active: true },
      create: {
        categoryId: category.id,
        keyword: item.keyword,
        country: "KR",
        language: "ko",
      },
    });

    const keyword = await db.keyword.upsert({
      where: {
        normalizedKeyword_country_language: {
          normalizedKeyword: item.normalizedKeyword,
          country: "KR",
          language: "ko",
        },
      },
      update: {
        keyword: item.keyword,
        categoryId: category.id,
        status: "PUBLISHED",
        searchVolume: item.searchVolume,
        competitionScore: item.competitionScore,
        trendScore: item.trendScore,
        opportunityScore: item.opportunityScore,
        adOpportunityScore: item.adOpportunityScore,
        metricsUpdatedAt: new Date(),
      },
      create: {
        keyword: seedTopic.keyword,
        normalizedKeyword: item.normalizedKeyword,
        categoryId: category.id,
        country: "KR",
        language: "ko",
        status: "PUBLISHED",
        searchVolume: item.searchVolume,
        competitionScore: item.competitionScore,
        trendScore: item.trendScore,
        opportunityScore: item.opportunityScore,
        adOpportunityScore: item.adOpportunityScore,
        sources: { create: { provider: "SEED" } },
        snapshots: {
          create: {
            provider: "SEED",
            searchVolume: item.searchVolume,
            competitionScore: item.competitionScore,
            trendScore: item.trendScore,
          },
        },
      },
    });

    const question = await db.question.upsert({
      where: { slug: item.slug },
      update: {
        primaryKeywordId: keyword.id,
        categoryId: category.id,
        title: item.title,
        searchIntent: "informational",
        language: "ko",
        country: "KR",
        status: "PUBLISHED",
        publishedAt: new Date(),
        qualityScore: 82,
      },
      create: {
        primaryKeywordId: keyword.id,
        categoryId: category.id,
        title: item.title,
        slug: item.slug,
        searchIntent: "informational",
        language: "ko",
        country: "KR",
        status: "PUBLISHED",
        qualityScore: 82,
        publishedAt: new Date(),
      },
    });

    await db.answer.upsert({
      where: {
        questionId_version: {
          questionId: question.id,
          version: 1,
        },
      },
      update: {
        summary: item.summary,
        contentMarkdown: item.contentMarkdown,
        contentHtml: markdownToHtml(item.contentMarkdown),
        provider: "seed",
        model: "seed",
        promptVersion: "seed-v1",
        confidenceScore: 90,
        qualityScore: 82,
        isActive: true,
      },
      create: {
        questionId: question.id,
        summary: item.summary,
        contentMarkdown: item.contentMarkdown,
        contentHtml: markdownToHtml(item.contentMarkdown),
        provider: "seed",
        model: "seed",
        promptVersion: "seed-v1",
        confidenceScore: 90,
        qualityScore: 82,
      },
    });

    await db.seoMetadata.upsert({
      where: { questionId: question.id },
      update: {
        title: item.seoTitle,
        description: item.seoDescription,
        canonicalUrl: null,
        noIndex: false,
      },
      create: {
        questionId: question.id,
        title: item.seoTitle,
        description: item.seoDescription,
      },
    });

    createdQuestionIds.push(question.id);
  }

  console.log(
    `Seed complete: category=${category.id}, questions=${createdQuestionIds.length}`,
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
