import type { GeneratedContent } from "./validation";

export function evaluateQuality(content: GeneratedContent) {
  const text = `${content.summary} ${content.answer}`;
  let score = 100;
  const issues: string[] = [];

  if (text.length < 500) {
    score -= 20;
    issues.push("내용이 충분히 구체적이지 않습니다.");
  }

  if (content.steps.length === 0) {
    score -= 10;
    issues.push("실행 단계가 없습니다.");
  }

  if (content.confidenceScore < 60) {
    score -= 20;
    issues.push("신뢰도가 낮습니다.");
  }

  const repeated = text.match(/(.{20,})\1/g);
  if (repeated) {
    score -= 15;
    issues.push("반복 문장이 감지되었습니다.");
  }

  return {
    score: Math.max(0, score),
    issues,
    decision: score >= 80 ? "PASS" : score >= 60 ? "REVIEW" : "REJECT",
  } as const;
}
