import type { GeneratedContent } from "./validation";

export function evaluateQuality(content: GeneratedContent) {
  const text = `${content.summary} ${content.directAnswer ?? ""} ${content.answer}`;
  const wordLikeCount = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  let score = 100;
  const issues: string[] = [];
  const dimensions = {
    directAnswerScore: content.directAnswer || content.summary.length >= 60 ? 90 : 55,
    intentMatchScore: content.searchIntent ? 90 : 50,
    specificityScore: 100,
    actionabilityScore: 100,
    completenessScore: 100,
    readabilityScore: 90,
    duplicationScore: 100,
    spamRiskScore: 100,
    sourceRiskScore: 90,
    adIntrusionScore: 100,
  };

  if (text.length < 1800 || wordLikeCount < 260) {
    score -= 28;
    dimensions.completenessScore -= 35;
    issues.push("THIN_CONTENT: 답변 분량과 문제 해결 정보가 부족합니다.");
  }

  if (content.steps.length < 4) {
    score -= 14;
    dimensions.actionabilityScore -= 30;
    issues.push("실행 가능한 단계가 부족합니다.");
  }

  if (content.quickChecks.length === 0 && content.causes.length === 0) {
    score -= 8;
    dimensions.specificityScore -= 20;
    issues.push("빠른 확인 항목 또는 원인 설명이 부족합니다.");
  }

  if (content.warnings.length === 0) {
    score -= 6;
    dimensions.completenessScore -= 10;
    issues.push("주의사항이 없습니다.");
  }

  if (content.faq.length < 2 && content.relatedQuestions.length < 2) {
    score -= 6;
    dimensions.completenessScore -= 10;
    issues.push("FAQ 또는 관련 질문이 부족합니다.");
  }

  if (content.confidenceScore < 60) {
    score -= 20;
    dimensions.sourceRiskScore -= 25;
    issues.push("신뢰도 점수가 낮습니다.");
  }

  const repeated = text.match(/(.{20,})\1/g);
  if (repeated) {
    score -= 15;
    dimensions.duplicationScore -= 35;
    issues.push("반복 문장이 감지되었습니다.");
  }

  const adMentions = (text.match(/광고|CTA|서비스|무료로 시작|가입/gi) ?? []).length;
  if (adMentions > 8) {
    score -= 10;
    dimensions.adIntrusionScore -= 35;
    issues.push("본문 대비 광고성 문구가 과합니다.");
  }

  const boundedScore = Math.max(0, score);
  const decision =
    issues.some((issue) => issue.startsWith("THIN_CONTENT")) ||
    dimensions.specificityScore < 70 ||
    dimensions.actionabilityScore < 70 ||
    dimensions.completenessScore < 70 ||
    boundedScore < 60
      ? "REJECT"
      : boundedScore >= 82
        ? "PASS"
        : "REVIEW";

  return {
    score: boundedScore,
    dimensions,
    issues,
    decision,
  } as const;
}
