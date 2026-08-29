import { NextResponse } from "next/server";
import { z } from "zod";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { env } from "@/lib/env";

const screenshotPlanItem = z.object({
  stepNumber: z.number().int(), insertAfter: z.string(), captureType: z.string(), requiredScreen: z.string(),
  targetUrl: z.string().nullable(), targetSelector: z.string().nullable(), highlightDescription: z.string().nullable(),
  caption: z.string(), altText: z.string(), reason: z.string().nullable(),
});
const draftSchema = z.object({
  summary: z.string(), contentMarkdown: z.string(), contentHtml: z.string(), metaTitle: z.string(), metaDescription: z.string(),
  confidenceScore: z.number(), qualityScore: z.number(), screenshotPlan: z.array(screenshotPlanItem),
});
const requestSchema = z.object({
  question: z.string().min(5),
  userNotes: z.string().trim().max(4000).default(""),
  draft: draftSchema,
  evidence: z.array(z.object({ title: z.string(), url: z.string(), snippet: z.string().default("") })).max(10),
  maxRevisions: z.number().int().min(0).max(2).default(2),
  minimumScore: z.number().int().min(80).max(95).default(80),
});

type Draft = z.infer<typeof draftSchema>;
type Evaluation = {
  status: "PASS" | "REVISE" | "BLOCK";
  overallScore: number;
  factualityScore: number;
  usefulnessScore: number;
  safetyScore: number;
  screenshotPlanScore: number;
  issues: string[];
  notes: string;
  revisedDraft?: Draft;
};

async function evaluateWithClaude(question: string, userNotes: string, draft: Draft, evidence: Array<{ title: string; url: string; snippet: string }>, minimumScore: number) {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 6000,
      system: `당신은 검색 가이드의 독립 검수자이자 수정 편집자다. 사용자 메모의 직접 경험과 감상은 1인칭 체험으로 보존하되, 역사·교통·가격·운영 정보는 검색 근거와 대조한다. 제공된 근거에 없는 사실, 존재하지 않는 장소·공연·메뉴·버튼·화면, 위험한 우회 방법, 질문과 무관한 내용, 부정확한 스크린샷 계획을 엄격하게 찾는다. PASS는 전체 ${minimumScore}점 이상이고 중대한 사실·안전 문제가 없을 때만 허용한다. ${minimumScore}점 미만이지만 제공된 근거로 고칠 수 있으면 반드시 REVISE와 ${minimumScore}점 이상을 목표로 한 완전한 수정본을 반환한다. BLOCK은 근거 부족, 위험, 검증 불가능처럼 현재 자료만으로 ${minimumScore}점 이상으로 고칠 수 없는 경우에만 반환한다. 점수를 임의로 올리지 말고 실제 수정 결과를 평가한다. URL이나 비밀값을 상상하지 않는다.`,
      messages: [{ role: "user", content: `질문:\n${question}\n\n사용자 메모(보존할 직접 경험과 검증할 사실 주장):\n${userNotes || "없음"}\n\n검색 근거 JSON:\n${JSON.stringify(evidence)}\n\n검수할 초안 JSON:\n${JSON.stringify(draft)}` }],
      tools: [{
        name: "submit_content_review",
        description: "검수 결과와 수정된 전체 초안을 제출한다.",
        input_schema: {
          type: "object", additionalProperties: false,
          properties: {
            status: { type: "string", enum: ["PASS", "REVISE", "BLOCK"] },
            overallScore: { type: "number", minimum: 0, maximum: 100 }, factualityScore: { type: "number", minimum: 0, maximum: 100 },
            usefulnessScore: { type: "number", minimum: 0, maximum: 100 }, safetyScore: { type: "number", minimum: 0, maximum: 100 }, screenshotPlanScore: { type: "number", minimum: 0, maximum: 100 },
            issues: { type: "array", items: { type: "string" } }, notes: { type: "string" },
            revisedDraft: { type: "object", additionalProperties: false, properties: {
              summary: { type: "string" }, contentMarkdown: { type: "string" }, contentHtml: { type: "string" }, metaTitle: { type: "string" }, metaDescription: { type: "string" },
              confidenceScore: { type: "number" }, qualityScore: { type: "number" }, screenshotPlan: { type: "array", items: { type: "object" } },
            }, required: ["summary", "contentMarkdown", "contentHtml", "metaTitle", "metaDescription", "confidenceScore", "qualityScore", "screenshotPlan"] },
          }, required: ["status", "overallScore", "factualityScore", "usefulnessScore", "safetyScore", "screenshotPlanScore", "issues", "notes", "revisedDraft"],
        },
      }],
      tool_choice: { type: "tool", name: "submit_content_review" },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: { type?: string; message?: string } } | null;
    const errorType = errorBody?.error?.type ?? "unknown_error";
    throw new Error(`Anthropic review failed (${response.status}, ${errorType})`);
  }
  const message = await response.json() as { content?: Array<{ type: string; name?: string; input?: unknown }> };
  const toolUse = message.content?.find((item) => item.type === "tool_use" && item.name === "submit_content_review");
  if (!toolUse?.input) throw new Error("Claude did not return a structured review");
  return toolUse.input as Evaluation;
}

export async function POST(request: Request) {
  try {
    requireAutomationAuth(request);
    const input = requestSchema.parse(await request.json());
    let draft = input.draft;
    let revisionCount = 0;
    let evaluation: Evaluation | undefined;
    for (let attempt = 0; attempt <= input.maxRevisions; attempt += 1) {
    evaluation = await evaluateWithClaude(input.question, input.userNotes, draft, input.evidence, input.minimumScore);
    const needsRevision = evaluation.status === "REVISE" || evaluation.overallScore < input.minimumScore;
    if (!needsRevision || attempt === input.maxRevisions) {
      if (evaluation.overallScore < input.minimumScore && evaluation.status !== "BLOCK") {
        evaluation = {
          ...evaluation,
          status: "BLOCK",
          issues: [...evaluation.issues, `최종 검수 점수가 최소 기준 ${input.minimumScore}점에 미달했습니다.`],
          notes: `${evaluation.notes}\n최소 품질 기준 ${input.minimumScore}점을 충족하지 못해 사람 검토가 필요합니다.`.trim(),
        };
      }
      break;
    }
    const revisedDraft = draftSchema.safeParse(evaluation.revisedDraft);
    if (!revisedDraft.success) {
      evaluation = {
        ...evaluation,
        status: "BLOCK",
        issues: [...evaluation.issues, "Claude가 REVISE 판정에 필요한 전체 수정본을 반환하지 않았습니다."],
        notes: `${evaluation.notes}\n사람 검토가 필요합니다: 구조화된 수정본이 누락되었습니다.`.trim(),
      };
      break;
    }
    draft = revisedDraft.data;
      revisionCount += 1;
    }
    if (!evaluation) throw new Error("Claude review returned no result");
    return NextResponse.json({ draft, evaluation: { ...evaluation, revisedDraft: undefined }, revisionCount, evaluator: { provider: "anthropic", model: env.ANTHROPIC_MODEL }, humanApprovalRequired: true });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
