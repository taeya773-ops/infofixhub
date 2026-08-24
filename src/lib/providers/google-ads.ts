import { env } from "../env";
import type {
  KeywordCandidate,
  KeywordDiscoveryInput,
  KeywordMetric,
  KeywordProvider,
} from "./types";

type GoogleAdsIdea = {
  text?: string;
  keywordIdeaMetrics?: {
    avgMonthlySearches?: string | number;
    competitionIndex?: string | number;
  };
};

type GoogleAdsResponse = { results?: GoogleAdsIdea[]; error?: { message?: string } };

const languageIds: Record<string, string> = { ko: "1012", en: "1000" };
const geoIds: Record<string, string> = { KR: "2410", US: "2840" };

function digits(value: string | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is required for Google Ads`);
  return value;
}

function score(value: string | number | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
}

export class GoogleAdsKeywordProvider implements KeywordProvider {
  name = "GOOGLE_ADS";
  private lastMetrics = new Map<string, KeywordMetric>();

  private async accessToken() {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: required(env.GOOGLE_ADS_CLIENT_ID, "GOOGLE_ADS_CLIENT_ID"),
        client_secret: required(env.GOOGLE_ADS_CLIENT_SECRET, "GOOGLE_ADS_CLIENT_SECRET"),
        refresh_token: required(env.GOOGLE_ADS_REFRESH_TOKEN, "GOOGLE_ADS_REFRESH_TOKEN"),
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(env.PROVIDER_TIMEOUT_MS),
    });
    const body = (await response.json()) as { access_token?: string; error_description?: string };
    if (!response.ok || !body.access_token) {
      throw new Error(`Google OAuth refresh failed (${response.status}): ${body.error_description ?? "unknown error"}`);
    }
    return body.access_token;
  }

  async discover(input: KeywordDiscoveryInput): Promise<KeywordCandidate[]> {
    const customerId = digits(required(env.GOOGLE_ADS_CUSTOMER_ID, "GOOGLE_ADS_CUSTOMER_ID"));
    const loginCustomerId = digits(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
    const accessToken = await this.accessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "developer-token": required(env.GOOGLE_ADS_DEVELOPER_TOKEN, "GOOGLE_ADS_DEVELOPER_TOKEN"),
    };
    if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

    const response = await fetch(
      `https://googleads.googleapis.com/${env.GOOGLE_ADS_API_VERSION}/customers/${customerId}:generateKeywordIdeas`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          language: `languageConstants/${languageIds[input.language] ?? "1012"}`,
          geoTargetConstants: [`geoTargetConstants/${geoIds[input.country] ?? "2410"}`],
          includeAdultKeywords: false,
          keywordPlanNetwork: "GOOGLE_SEARCH",
          keywordSeed: { keywords: [input.seed] },
          pageSize: 100,
        }),
        signal: AbortSignal.timeout(env.PROVIDER_TIMEOUT_MS),
      },
    );
    const body = (await response.json()) as GoogleAdsResponse;
    if (!response.ok) {
      throw new Error(`Google Ads keyword ideas failed (${response.status}): ${body.error?.message ?? "unknown error"}`);
    }

    this.lastMetrics.clear();
    for (const result of body.results ?? []) {
      const keyword = result.text?.trim();
      if (!keyword) continue;
      const volume = Number(result.keywordIdeaMetrics?.avgMonthlySearches);
      this.lastMetrics.set(keyword, {
        keyword,
        searchVolume: Number.isFinite(volume) ? volume : null,
        competitionScore: score(result.keywordIdeaMetrics?.competitionIndex),
      });
    }
    return [...this.lastMetrics.keys()].map((keyword) => ({ keyword, provider: this.name }));
  }

  async metrics(keywords: string[]): Promise<KeywordMetric[]> {
    return keywords.map(
      (keyword) => this.lastMetrics.get(keyword) ?? { keyword, searchVolume: null, competitionScore: null },
    );
  }
}
