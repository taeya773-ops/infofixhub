import { assertDatabaseConfigured, db } from "@/lib/db";
import { ManualSeedProvider } from "@/lib/providers/manual";
import { GoogleAdsKeywordProvider } from "@/lib/providers/google-ads";
import { env } from "@/lib/env";
import {
  calculateAdOpportunityScore,
  calculateOpportunityScore,
} from "@/lib/scoring";
import { normalizeKeyword } from "@/lib/slug";

const provider = env.GOOGLE_ADS_ENABLED === "true"
  ? new GoogleAdsKeywordProvider()
  : new ManualSeedProvider();

export async function discoverKeywords(seedTopicId: string) {
  assertDatabaseConfigured();

  const seed = await db.seedTopic.findUniqueOrThrow({
    where: { id: seedTopicId },
  });
  const started = Date.now();

  try {
    const candidates = await provider.discover({
      seed: seed.keyword,
      country: seed.country,
      language: seed.language,
    });
    const metrics = await provider.metrics(candidates.map((c) => c.keyword));
    const results = [];

    for (const candidate of candidates) {
      const metric = metrics.find((m) => m.keyword === candidate.keyword);
      const opportunity = calculateOpportunityScore({
        searchVolume: metric?.searchVolume ?? null,
        trend: null,
        competition: metric?.competitionScore ?? null,
        contentGap: null,
        questionIntent: null,
        freshness: null,
      });
      const adOpportunity = calculateAdOpportunityScore({
        campaignRelevance: null,
        commercialIntent: null,
        searchVolume: metric?.searchVolume ?? null,
        ctr: null,
        conversion: null,
      });

      results.push(
        await db.keyword.upsert({
          where: {
            normalizedKeyword_country_language: {
              normalizedKeyword: normalizeKeyword(candidate.keyword),
              country: seed.country,
              language: seed.language,
            },
          },
          create: {
            keyword: candidate.keyword,
            normalizedKeyword: normalizeKeyword(candidate.keyword),
            categoryId: seed.categoryId,
            country: seed.country,
            language: seed.language,
            opportunityScore: opportunity,
            adOpportunityScore: adOpportunity,
            sources: { create: { provider: candidate.provider } },
            snapshots: {
              create: {
                provider: candidate.provider,
                searchVolume: metric?.searchVolume ?? null,
                competitionScore: metric?.competitionScore ?? null,
              },
            },
          },
          update: {
            lastSeenAt: new Date(),
            opportunityScore: opportunity,
            adOpportunityScore: adOpportunity,
            snapshots: {
              create: {
                provider: candidate.provider,
                searchVolume: metric?.searchVolume ?? null,
                competitionScore: metric?.competitionScore ?? null,
              },
            },
          },
        }),
      );
    }

    await db.$transaction([
      db.seedTopic.update({
        where: { id: seed.id },
        data: { lastDiscoveryAt: new Date() },
      }),
      db.providerStatus.upsert({
        where: { provider: provider.name },
        create: {
          provider: provider.name,
          enabled: true,
          lastSuccessAt: new Date(),
          requestCount: 1,
        },
        update: { lastSuccessAt: new Date(), requestCount: { increment: 1 } },
      }),
      db.apiUsageLog.create({
        data: {
          provider: provider.name,
          operation: "discover",
          success: true,
          latencyMs: Date.now() - started,
        },
      }),
    ]);

    return results;
  } catch (error) {
    await db.providerStatus.upsert({
      where: { provider: provider.name },
      create: {
        provider: provider.name,
        enabled: true,
        lastFailureAt: new Date(),
        lastError: String(error),
      },
      update: {
        lastFailureAt: new Date(),
        lastError: String(error),
        requestCount: { increment: 1 },
      },
    });
    throw error;
  }
}
