import { describe, expect, it } from "vitest";
import { scoreCampaignTarget, shouldShowCta } from "./campaign-matching";

const baseContext = {
  categoryId: null,
  searchIntent: "informational",
  country: "KR",
  language: "ko",
};

describe("campaign CTA matching", () => {
  it("shows PC AutoCare CTA for Windows troubleshooting context", () => {
    const result = scoreCampaignTarget(
      {
        keyword: "윈도우",
        intent: "informational",
        categoryId: null,
        country: "KR",
        language: "ko",
        weight: 1,
      },
      {
        ...baseContext,
        questionTitle: "윈도우 부팅 오류 해결방법",
        primaryKeyword: "윈도우 부팅 오류",
      },
    );

    expect(shouldShowCta(result)).toBe(true);
  });

  it("does not show PC AutoCare CTA for unrelated travel context", () => {
    const result = scoreCampaignTarget(
      {
        keyword: "윈도우",
        intent: "informational",
        categoryId: null,
        country: "KR",
        language: "ko",
        weight: 1,
      },
      {
        ...baseContext,
        questionTitle: "방콕 여행 준비물은 무엇인가요?",
        primaryKeyword: "방콕 여행 준비물",
      },
    );

    expect(shouldShowCta(result)).toBe(false);
  });

  it("shows Salon Management CTA for salon management context", () => {
    const result = scoreCampaignTarget(
      {
        keyword: "미용실, 고객관리, 예약, 시술, 매출",
        intent: "informational",
        categoryId: null,
        country: "KR",
        language: "ko",
        weight: 1,
      },
      {
        ...baseContext,
        questionTitle: "미용실 고객 관리를 쉽게 하는 방법",
        primaryKeyword: "미용실 고객관리",
      },
    );

    expect(shouldShowCta(result)).toBe(true);
  });

  it("does not show Salon Management CTA for Windows troubleshooting context", () => {
    const result = scoreCampaignTarget(
      {
        keyword: "미용실, 고객관리, 예약, 시술, 매출",
        intent: "informational",
        categoryId: null,
        country: "KR",
        language: "ko",
        weight: 1,
      },
      {
        ...baseContext,
        questionTitle: "윈도우 부팅 오류 해결방법",
        primaryKeyword: "윈도우 부팅 오류",
      },
    );

    expect(shouldShowCta(result)).toBe(false);
  });
});
