import { db } from "@/lib/db";
import {
  scoreCampaignTarget,
  shouldShowCta,
  type CampaignMatchResult,
} from "@/lib/campaign-matching";

export async function selectCampaignsForPage(questionId: string) {
  const q = await db.question.findUniqueOrThrow({
    where: { id: questionId },
    include: {
      primaryKeyword: true,
      answers: { where: { isActive: true }, take: 1, select: { summary: true, contentMarkdown: true } },
    },
  });
  const now = new Date();
  const campaigns = await db.campaign.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    include: { targets: true, creatives: { where: { active: true } } },
  });

  return campaigns
    .flatMap((campaign) => {
      const bestMatch = campaign.targets.reduce<CampaignMatchResult>(
        (best, target) => {
          const result = scoreCampaignTarget(
            {
              keyword: target.keyword,
              intent: target.intent,
              categoryId: target.categoryId,
              country: target.country,
              language: target.language,
              weight: target.weight,
            },
            {
              questionTitle: q.title,
              primaryKeyword: q.primaryKeyword.keyword,
              categoryId: q.categoryId,
              searchIntent: q.searchIntent,
              country: q.country,
              language: q.language,
              answerText: `${q.answers[0]?.summary ?? ""}\n${q.answers[0]?.contentMarkdown ?? ""}`,
            },
          );
          return result.score > best.score ? result : best;
        },
        { score: 0, matchedKeywords: [], reasons: [] },
      );

      const score = Math.min(100, bestMatch.score + Math.min(5, campaign.priority));

      return campaign.creatives.map((creative) => ({
        campaign,
        creative,
        score,
        match: bestMatch,
      }));
    })
    .filter((candidate) => shouldShowCta({ ...candidate.match, score: candidate.score }))
    .sort((a, b) => b.score - a.score);
}

export async function selectAndRecordCampaignsForPage(questionId: string) {
  const candidates = await selectCampaignsForPage(questionId);
  const selected = candidates.slice(0, 3);

  if (selected.length) {
    await db.adImpression.createMany({
      data: selected.map(({ campaign, creative }) => ({
        campaignId: campaign.id,
        creativeId: creative.id,
        questionId,
      })),
    });
  }

  return selected;
}
