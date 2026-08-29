import { generateGeminiStructured } from "@/services/gemini";

export type ScreenshotReviewContext = { questionTitle: string; requiredScreen: string; insertAfter: string; caption: string; highlightDescription?: string | null; contextText?: string | null; allowAiGeneratedReference?: boolean };
export type ScreenshotReview = {
  status: "MATCH" | "TEXT_NEEDS_UPDATE" | "IMAGE_NEEDS_UPDATE";
  isContentMatching: boolean; analysis: string; textSupplement: string;
  imageActionGuide: { issueSummary: string; requiredScreenshotDescription: string; imageGenerationPrompt: string };
  matchScore: number; detectedScreen: string; containsSensitiveData: boolean; sensitiveFindings: string[];
};

export function screenshotStatusFromReview(review: ScreenshotReview) {
  if (review.containsSensitiveData) return "SENSITIVE";
  return review.status === "MATCH" && review.isContentMatching && review.matchScore >= 80 ? "MATCHED" : "MISMATCH";
}
export function recommendedActionFromReview(review: ScreenshotReview) {
  if (review.containsSensitiveData) return "MANUAL_REVIEW";
  if (review.status === "MATCH") return "APPROVE";
  return review.status === "TEXT_NEEDS_UPDATE" ? "TEXT_REVISE" : "IMAGE_REGENERATE";
}

export async function analyzeScreenshot(bytes: Uint8Array, mimeType: string, context: ScreenshotReviewContext): Promise<ScreenshotReview> {
  const imageModeInstruction = context.allowAiGeneratedReference
    ? "이 이미지는 실제 웹사이트 캡처가 아니라 'AI 생성 참고 이미지'로 검수한다. 공식 웹사이트, 실제 예약 화면, 실제 시간표처럼 위장하지 않고, 본문 이해를 돕는 여행 지도·동선·개념도·체험 장면으로 정확히 작동하면 MATCH로 판정한다. 실제 UI 캡처가 아니라는 이유만으로 IMAGE_NEEDS_UPDATE를 주지 않는다. 다만 존재하지 않는 공식 데이터, 확정 가격/시간, 브랜드 로고, 개인정보, 실제 화면처럼 보이는 가짜 UI가 있으면 IMAGE_NEEDS_UPDATE로 판정한다."
    : "이 이미지는 실제 캡처 후보로 검수한다. 필요한 화면과 다르거나 본문 설명을 확인하기 어렵다면 IMAGE_NEEDS_UPDATE로 판정한다.";
  return generateGeminiStructured<ScreenshotReview>({
    system: "당신은 한국어 검색 가이드의 독립적인 이미지 검수자다. 문단과 이미지에 보이는 내용만 비교한다. 없는 버튼·메뉴·화면을 상상하지 않는다. 비밀번호, API 키, 토큰, 이메일, 개인 식별 정보가 보이면 민감정보로 표시한다. 이미지 생성 프롬프트는 실제 UI를 위조하는 용도가 아니라 보완 작업 지시서로만 작성한다.",
    prompt: `글 제목: ${context.questionTitle}\n삽입 위치: ${context.insertAfter}\n검수 대상 문단: ${context.contextText || "문단이 제공되지 않음"}\n필요한 화면/이미지 목적: ${context.requiredScreen}\n강조 대상: ${context.highlightDescription || "없음"}\n예정 캡션: ${context.caption}\n검수 기준: ${imageModeInstruction}\n\n문단과 이미지를 비교해 MATCH, TEXT_NEEDS_UPDATE, IMAGE_NEEDS_UPDATE 중 하나로 판정하세요. 문단만 부족하면 보충 문장을, 이미지가 틀리거나 부족하면 구체적인 보완 지시서를 작성하세요.`,
    inlineData: { mimeType, data: Buffer.from(bytes).toString("base64") },
    schema: {
        type: "object", additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["MATCH", "TEXT_NEEDS_UPDATE", "IMAGE_NEEDS_UPDATE"] },
          isContentMatching: { type: "boolean" }, analysis: { type: "string" }, textSupplement: { type: "string" },
          imageActionGuide: { type: "object", additionalProperties: false, properties: { issueSummary: { type: "string" }, requiredScreenshotDescription: { type: "string" }, imageGenerationPrompt: { type: "string" } }, required: ["issueSummary", "requiredScreenshotDescription", "imageGenerationPrompt"] },
          matchScore: { type: "number", minimum: 0, maximum: 100 }, detectedScreen: { type: "string" }, containsSensitiveData: { type: "boolean" }, sensitiveFindings: { type: "array", items: { type: "string" } },
        },
        required: ["status", "isContentMatching", "analysis", "textSupplement", "imageActionGuide", "matchScore", "detectedScreen", "containsSensitiveData", "sensitiveFindings"],
      },
    timeoutMs: 120_000,
  });
}
