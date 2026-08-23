import OpenAI from "openai";
import { env } from "@/lib/env";

export type ScreenshotReviewContext = {
  questionTitle: string;
  requiredScreen: string;
  insertAfter: string;
  caption: string;
  highlightDescription?: string | null;
};

export type ScreenshotReview = {
  matchScore: number;
  matchesContent: boolean;
  detectedScreen: string;
  matchNotes: string;
  containsSensitiveData: boolean;
  sensitiveFindings: string[];
  recommendedAction: "APPROVE" | "MANUAL_REVIEW" | "REJECT";
};

export function screenshotStatusFromReview(review: ScreenshotReview) {
  if (review.containsSensitiveData) return "SENSITIVE";
  if (review.matchesContent && review.matchScore >= 80) return "MATCHED";
  return "MISMATCH";
}

export async function analyzeScreenshot(
  bytes: Uint8Array,
  mimeType: string,
  context: ScreenshotReviewContext,
): Promise<ScreenshotReview> {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const imageUrl = `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    store: false,
    instructions: "기술 가이드용 스크린샷 검수자다. 실제 이미지에 보이는 내용만 판단한다. 비밀번호, API 키, 토큰, 이메일, 개인 식별 정보가 보이면 민감정보로 판정한다. 이미지에 없는 내용을 추측하지 않는다.",
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: `글 제목: ${context.questionTitle}\n삽입 위치: ${context.insertAfter}\n필요한 화면: ${context.requiredScreen}\n강조 대상: ${context.highlightDescription || "없음"}\n예정 캡션: ${context.caption}\n\n이 이미지가 위 문맥을 정확히 설명하는지, 핵심 메뉴·버튼·화면이 실제로 보이는지 검사하세요.` },
        { type: "input_image", image_url: imageUrl, detail: "high" },
      ],
    }],
    text: {
      format: {
        type: "json_schema",
        name: "screenshot_content_review",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            matchScore: { type: "number", minimum: 0, maximum: 100 },
            matchesContent: { type: "boolean" },
            detectedScreen: { type: "string" },
            matchNotes: { type: "string" },
            containsSensitiveData: { type: "boolean" },
            sensitiveFindings: { type: "array", items: { type: "string" } },
            recommendedAction: { type: "string", enum: ["APPROVE", "MANUAL_REVIEW", "REJECT"] },
          },
          required: ["matchScore", "matchesContent", "detectedScreen", "matchNotes", "containsSensitiveData", "sensitiveFindings", "recommendedAction"],
        },
      },
    },
  });
  return JSON.parse(response.output_text) as ScreenshotReview;
}
