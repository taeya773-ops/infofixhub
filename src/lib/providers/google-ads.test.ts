import { afterEach, describe, expect, it, vi } from "vitest";

describe("GoogleAdsKeywordProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("refreshes OAuth and maps keyword ideas to metrics", async () => {
    process.env.GOOGLE_ADS_CLIENT_ID = "client-id";
    process.env.GOOGLE_ADS_CLIENT_SECRET = "client-secret";
    process.env.GOOGLE_ADS_REFRESH_TOKEN = "refresh-token";
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "developer-token";
    process.env.GOOGLE_ADS_CUSTOMER_ID = "123-456-7890";
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = "867-056-2821";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                text: "윈도우 11 업데이트 오류",
                keywordIdeaMetrics: { avgMonthlySearches: "1200", competitionIndex: "34" },
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { GoogleAdsKeywordProvider } = await import("./google-ads");
    const provider = new GoogleAdsKeywordProvider();
    const ideas = await provider.discover({ seed: "Windows 11", country: "KR", language: "ko" });
    const metrics = await provider.metrics(ideas.map((idea) => idea.keyword));

    expect(ideas).toEqual([{ keyword: "윈도우 11 업데이트 오류", provider: "GOOGLE_ADS" }]);
    expect(metrics).toEqual([
      { keyword: "윈도우 11 업데이트 오류", searchVolume: 1200, competitionScore: 34 },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://googleads.googleapis.com/v25/customers/1234567890:generateKeywordIdeas",
      expect.objectContaining({
        headers: expect.objectContaining({ "login-customer-id": "8670562821" }),
      }),
    );
  });
});
