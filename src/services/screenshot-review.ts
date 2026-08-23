import { env } from "@/lib/env";

export type ScreenshotReviewContext = { questionTitle: string; requiredScreen: string; insertAfter: string; caption: string; highlightDescription?: string | null; contextText?: string | null };
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
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL, max_tokens: 2500,
      system: "당신은 한국어 기술 가이드의 독립적인 스크린샷 검수자다. 문단과 실제 이미지에 보이는 화면만 비교한다. 없는 버튼·메뉴·화면을 상상하지 않는다. 비밀번호, API 키, 토큰, 이메일, 개인 식별 정보가 보이면 민감정보로 표시한다. 이미지 생성 프롬프트는 실제 UI를 위조하는 용도가 아니라 재캡처 작업 지시서로만 작성한다.",
      messages: [{ role: "user", content: [
        { type: "text", text: `글 제목: ${context.questionTitle}\n삽입 위치: ${context.insertAfter}\n검수 대상 문단: ${context.contextText || "문단이 제공되지 않음"}\n필요한 화면: ${context.requiredScreen}\n강조 대상: ${context.highlightDescription || "없음"}\n예정 캡션: ${context.caption}\n\n문단과 스크린샷을 비교해 MATCH, TEXT_NEEDS_UPDATE, IMAGE_NEEDS_UPDATE 중 하나로 판정하세요. 문단만 부족하면 보충 문장을, 이미지가 틀리거나 부족하면 구체적인 재캡처 지시서를 작성하세요.` },
        { type: "image", source: { type: "base64", media_type: mimeType, data: Buffer.from(bytes).toString("base64") } },
      ] }],
      tools: [{ name: "submit_screenshot_review", description: "문단과 이미지의 비교 검수 결과를 제출한다.", input_schema: {
        type: "object", additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["MATCH", "TEXT_NEEDS_UPDATE", "IMAGE_NEEDS_UPDATE"] },
          isContentMatching: { type: "boolean" }, analysis: { type: "string" }, textSupplement: { type: "string" },
          imageActionGuide: { type: "object", additionalProperties: false, properties: { issueSummary: { type: "string" }, requiredScreenshotDescription: { type: "string" }, imageGenerationPrompt: { type: "string" } }, required: ["issueSummary", "requiredScreenshotDescription", "imageGenerationPrompt"] },
          matchScore: { type: "number", minimum: 0, maximum: 100 }, detectedScreen: { type: "string" }, containsSensitiveData: { type: "boolean" }, sensitiveFindings: { type: "array", items: { type: "string" } },
        },
        required: ["status", "isContentMatching", "analysis", "textSupplement", "imageActionGuide", "matchScore", "detectedScreen", "containsSensitiveData", "sensitiveFindings"],
      } }],
      tool_choice: { type: "tool", name: "submit_screenshot_review" },
    }), signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) { const body = await response.json().catch(() => null) as { error?: { type?: string } } | null; throw new Error(`Anthropic screenshot review failed (${response.status}, ${body?.error?.type ?? "unknown_error"})`); }
  const message = await response.json() as { content?: Array<{ type: string; name?: string; input?: unknown }> };
  const toolUse = message.content?.find((item) => item.type === "tool_use" && item.name === "submit_screenshot_review");
  if (!toolUse?.input) throw new Error("Claude did not return a structured screenshot review");
  return toolUse.input as ScreenshotReview;
}
