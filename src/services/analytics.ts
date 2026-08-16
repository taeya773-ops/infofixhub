import { db } from "@/lib/db";
import { recommendGrowth } from "@/lib/growth";
import type { GrowthType } from "@/generated/prisma/enums";

function todayUtcDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function recordPageView(questionId: string, adImpressions: number) {
  return db.pageAnalytics.upsert({
    where: { questionId_date: { questionId, date: todayUtcDate() } },
    update: {
      pageViews: { increment: 1 },
      adImpressions: { increment: adImpressions },
    },
    create: {
      questionId,
      date: todayUtcDate(),
      pageViews: 1,
      adImpressions,
      adClicks: 0,
    },
  });
}

export async function recordAdClick(questionId: string) {
  return db.pageAnalytics.upsert({
    where: { questionId_date: { questionId, date: todayUtcDate() } },
    update: { adClicks: { increment: 1 } },
    create: {
      questionId,
      date: todayUtcDate(),
      pageViews: 0,
      adImpressions: 0,
      adClicks: 1,
    },
  });
}

export async function refreshGrowthRecommendations() {
  const questions = await db.question.findMany({
    where: { status: "PUBLISHED" },
    include: {
      analytics: true,
      searchPerformance: true,
      recommendations: { where: { status: "OPEN" } },
      primaryKeyword: true,
    },
  });

  let created = 0;

  for (const question of questions) {
    const pageViews = question.analytics.reduce((sum, row) => sum + row.pageViews, 0);
    const adClicks = question.analytics.reduce((sum, row) => sum + row.adClicks, 0);
    const searchImpressions = question.searchPerformance.reduce(
      (sum, row) => sum + row.impressions,
      0,
    );
    const searchClicks = question.searchPerformance.reduce((sum, row) => sum + row.clicks, 0);
    const avgPosition =
      question.searchPerformance.length > 0
        ? question.searchPerformance.reduce((sum, row) => sum + row.position, 0) /
          question.searchPerformance.length
        : 0;
    const campaignCount = await db.campaign.count({
      where: {
        status: "ACTIVE",
        targets: {
          some: {
            OR: [
              { categoryId: question.categoryId },
              { keyword: question.primaryKeyword.normalizedKeyword },
              { intent: question.searchIntent },
            ],
          },
        },
      },
    });

    const types = recommendGrowth({
      impressions: searchImpressions || pageViews,
      clicks: searchClicks || adClicks,
      position: avgPosition || 99,
      relatedQueries: question.searchPerformance.length,
      campaigns: campaignCount,
    }) as GrowthType[];

    if (pageViews >= 1 && adClicks === 0 && campaignCount > 0) {
      types.push("IMPROVE_CONTENT");
    }

    for (const type of [...new Set(types)]) {
      const exists = question.recommendations.some((rec) => rec.type === type);
      if (exists) continue;

      await db.growthRecommendation.create({
        data: {
          questionId: question.id,
          type,
          title: growthTitle(type),
          rationale: growthRationale(type),
          score: 70,
        },
      });
      created += 1;
    }
  }

  return created;
}

function growthTitle(type: GrowthType) {
  switch (type) {
    case "IMPROVE_TITLE":
      return "제목과 메타 설명 개선";
    case "EXPAND_CLUSTER":
      return "관련 질문 클러스터 확장";
    case "CONNECT_CAMPAIGN":
      return "관련 광고 캠페인 연결";
    case "IMPROVE_CONTENT":
      return "콘텐츠 본문 개선";
    default:
      return "콘텐츠 성장 작업";
  }
}

function growthRationale(type: GrowthType) {
  switch (type) {
    case "IMPROVE_TITLE":
      return "노출 대비 클릭이 낮아 검색 결과에서 더 분명한 제목이 필요합니다.";
    case "EXPAND_CLUSTER":
      return "관련 검색어가 있어 추가 질문 콘텐츠로 확장할 여지가 있습니다.";
    case "CONNECT_CAMPAIGN":
      return "방문 수요가 있으나 연결된 광고 캠페인이 부족합니다.";
    case "IMPROVE_CONTENT":
      return "방문 또는 광고 노출 대비 후속 행동이 낮아 본문 구조 개선이 필요합니다.";
    default:
      return "성과 데이터를 기준으로 개선 후보가 감지되었습니다.";
  }
}
