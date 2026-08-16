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

type SeedQuestion = {
  keyword: string;
  normalizedKeyword: string;
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  contentMarkdown: string;
  searchVolume: number;
  competitionScore: number;
  trendScore: number;
  opportunityScore: number;
  adOpportunityScore: number;
};

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

const pcQuestions: SeedQuestion[] = [
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
];

const salonQuestions: SeedQuestion[] = [
  {
    keyword: "미용실 무료 포스 프로그램",
    normalizedKeyword: "미용실 무료 포스 프로그램",
    slug: "free-salon-pos-program-guide",
    title: "미용실 무료 포스 프로그램을 고를 때 확인할 것",
    seoTitle: "미용실 무료 포스 프로그램 선택 가이드",
    seoDescription:
      "미용실에서 무료 포스 프로그램을 찾을 때 예약, 고객관리, 시술내역, 매출관리, 데이터 백업을 확인하는 방법입니다.",
    summary:
      "미용실 무료 포스 프로그램은 가격만 보지 말고 예약 관리, 고객 기록, 시술 이력, 매출 집계, 데이터 백업 가능 여부를 함께 확인해야 합니다.",
    contentMarkdown:
      "미용실에서 무료 포스 프로그램을 찾을 때는 단순 계산 기능보다 실제 매장 운영에 필요한 기능이 있는지 먼저 봐야 합니다.\n\n1. 예약 시간, 담당 디자이너, 방문 상태를 한 화면에서 볼 수 있는지 확인합니다.\n2. 고객별 시술 이력, 염색/펌 기록, 특이사항 메모가 가능한지 봅니다.\n3. 일별·월별 매출과 결제수단별 집계가 되는지 확인합니다.\n4. 데이터 백업이나 내보내기 기능이 있는지 확인합니다.\n5. 무료 버전의 제한이 예약 건수, 직원 수, 고객 수 중 어디에 걸리는지 확인합니다.\n\n무료 프로그램은 시작 비용을 줄이는 장점이 있지만, 매장이 성장하면 데이터 이전과 기능 제한이 문제가 될 수 있습니다. 처음부터 고객관리와 예약관리 흐름을 기준으로 고르는 것이 안전합니다.",
    searchVolume: 2600,
    competitionScore: 44,
    trendScore: 61,
    opportunityScore: 77,
    adOpportunityScore: 84,
  },
  {
    keyword: "미용실 고객관리 프로그램 무료",
    normalizedKeyword: "미용실 고객관리 프로그램 무료",
    slug: "free-salon-customer-management-program",
    title: "무료 미용실 고객관리 프로그램은 어떤 기능이 필요할까",
    seoTitle: "무료 미용실 고객관리 프로그램 필수 기능",
    seoDescription:
      "무료 미용실 고객관리 프로그램에서 고객 메모, 방문주기, 시술이력, 예약 알림, 재방문 관리 기능을 확인하는 방법입니다.",
    summary:
      "무료 미용실 고객관리 프로그램은 고객 이름 저장보다 방문주기, 시술 이력, 선호 스타일, 재방문 알림을 관리할 수 있는지가 중요합니다.",
    contentMarkdown:
      "미용실 고객관리는 단순 연락처 저장이 아니라 재방문을 만드는 운영 데이터 관리에 가깝습니다.\n\n무료 프로그램을 고를 때는 다음 기능을 확인하세요.\n\n1. 고객별 시술 이력과 사용 약제 메모\n2. 마지막 방문일과 평균 방문 주기 확인\n3. 담당자별 고객 관리\n4. 예약 변경과 노쇼 기록\n5. 생일, 재방문, 이벤트 안내를 위한 메모 또는 알림 기능\n\n무료 도구로 시작해도 괜찮지만, 엑셀처럼 사람이 계속 수동으로 정리해야 한다면 시간이 지나면서 누락이 많아집니다. 매장 규모가 작을수록 입력이 쉬운 프로그램을 고르는 것이 더 중요합니다.",
    searchVolume: 1900,
    competitionScore: 41,
    trendScore: 58,
    opportunityScore: 74,
    adOpportunityScore: 82,
  },
  {
    keyword: "미용실 예약 프로그램 무료",
    normalizedKeyword: "미용실 예약 프로그램 무료",
    slug: "free-salon-booking-program-checklist",
    title: "무료 미용실 예약 프로그램을 쓸 때 주의할 점",
    seoTitle: "무료 미용실 예약 프로그램 체크리스트",
    seoDescription:
      "무료 미용실 예약 프로그램을 사용할 때 예약표, 직원별 일정, 고객 알림, 노쇼 관리, 매출 연결을 확인하는 체크리스트입니다.",
    summary:
      "무료 미용실 예약 프로그램은 예약표가 보기 쉬운지, 직원별 일정 관리가 되는지, 노쇼와 변경 이력을 남길 수 있는지 확인해야 합니다.",
    contentMarkdown:
      "미용실 예약은 시간표가 조금만 꼬여도 대기 시간, 직원 배정, 고객 불만으로 이어질 수 있습니다.\n\n무료 예약 프로그램을 검토할 때는 다음을 확인하세요.\n\n1. 직원별 예약표를 하루 단위로 보기 쉬운가\n2. 예약 변경과 취소 이력이 남는가\n3. 고객별 이전 시술 내역을 예약 화면에서 볼 수 있는가\n4. 문자나 카카오 알림 연동이 가능한가\n5. 예약 데이터가 매출 통계와 연결되는가\n\n무료 프로그램이 당장 비용은 줄여주지만, 예약 변경이 많은 매장이라면 알림과 이력 관리 기능이 특히 중요합니다.",
    searchVolume: 2100,
    competitionScore: 46,
    trendScore: 63,
    opportunityScore: 76,
    adOpportunityScore: 85,
  },
  {
    keyword: "미용실 매출관리 프로그램",
    normalizedKeyword: "미용실 매출관리 프로그램",
    slug: "salon-sales-management-program-guide",
    title: "미용실 매출관리 프로그램에서 봐야 할 지표",
    seoTitle: "미용실 매출관리 프로그램 핵심 지표",
    seoDescription:
      "미용실 매출관리 프로그램에서 일매출, 객단가, 재방문율, 직원별 매출, 시술별 매출을 확인하는 방법입니다.",
    summary:
      "미용실 매출관리 프로그램은 총매출뿐 아니라 객단가, 재방문율, 직원별 매출, 시술별 매출을 함께 볼 수 있어야 운영 개선에 도움이 됩니다.",
    contentMarkdown:
      "미용실 매출관리는 단순히 하루 매출을 보는 것에서 끝나면 효과가 작습니다. 어떤 서비스가 잘 팔리는지, 어떤 고객이 다시 오는지, 어떤 시간대가 비는지 봐야 합니다.\n\n확인하면 좋은 지표는 다음과 같습니다.\n\n1. 일별·월별 총매출\n2. 고객 1명당 평균 결제금액인 객단가\n3. 신규 고객과 재방문 고객 비율\n4. 직원별 매출과 예약 점유율\n5. 컷, 펌, 염색, 클리닉 등 시술별 매출\n\n이 지표가 쌓이면 할인 이벤트보다 재방문 관리, 예약 배치, 직원별 강점 분석으로 매출을 개선할 수 있습니다.",
    searchVolume: 1700,
    competitionScore: 49,
    trendScore: 57,
    opportunityScore: 72,
    adOpportunityScore: 80,
  },
];

async function upsertCategory(slug: string, name: string, description: string) {
  return db.category.upsert({
    where: { slug },
    update: { name, description, active: true },
    create: { slug, name, description },
  });
}

async function upsertQuestions(categoryId: string, questions: SeedQuestion[]) {
  const questionIds: string[] = [];

  for (const item of questions) {
    const seedTopic = await db.seedTopic.upsert({
      where: {
        categoryId_keyword_country_language: {
          categoryId,
          keyword: item.keyword,
          country: "KR",
          language: "ko",
        },
      },
      update: { active: true },
      create: {
        categoryId,
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
        categoryId,
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
        categoryId,
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
        categoryId,
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
        categoryId,
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

    questionIds.push(question.id);
  }

  return questionIds;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  const guides = await upsertCategory(
    "guides",
    "실용 가이드",
    "검색 질문에 직접 답하는 검수된 실용 가이드",
  );
  const salon = await upsertCategory(
    "salon-pos",
    "미용실 포스·예약 관리",
    "미용실 운영자를 위한 포스, 예약, 고객관리, 매출관리 가이드",
  );

  const pcQuestionIds = await upsertQuestions(guides.id, pcQuestions);
  const salonQuestionIds = await upsertQuestions(salon.id, salonQuestions);

  console.log(
    `Seed complete: categories=2, pcQuestions=${pcQuestionIds.length}, salonQuestions=${salonQuestionIds.length}`,
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
