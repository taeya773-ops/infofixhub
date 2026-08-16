import OpenAI from "openai";
import { env } from "@/lib/env";
import {
  generatedContentSchema,
  type GeneratedContent,
} from "@/lib/validation";

export interface AIProvider {
  generateContent(input: {
    keyword: string;
    intent: string;
  }): Promise<GeneratedContent>;
}

export class OpenAIProvider implements AIProvider {
  async generateContent(input: { keyword: string; intent: string }) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OpenAI provider is not connected");
    }

    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      instructions: [
        "당신은 검색 유입용 문제 해결 콘텐츠를 만드는 한국어 전문 편집자입니다.",
        "짧은 요약형 답변이나 일반론만 반복하는 글을 만들지 마세요.",
        "사용자가 이 페이지 하나만 보고 다음 행동을 결정할 수 있도록 구체적인 확인 위치, 실행 순서, 실패 시 다음 단계, 주의사항을 제공합니다.",
        "사실을 모르면 추정하거나 출처를 지어내지 말고, 확인이 필요하다고 명확히 말하세요.",
        "광고나 CTA는 본문보다 중요하지 않습니다. 관련성이 높을 때만 자연스럽게 연결될 수 있는 문맥을 adContext에 담으세요.",
        "동일 문장을 표현만 바꿔 반복해 길이를 채우지 마세요.",
        "응답은 반드시 JSON만 반환하세요.",
      ].join("\n"),
      input: [
        `검색어: ${input.keyword}`,
        `검색 의도: ${input.intent}`,
        "",
        "다음 구조에 맞춰 고품질 답변을 생성하세요.",
        "- directAnswer: 2~4문장으로 바로 답합니다.",
        "- answer: Markdown 본문입니다. 최소 1,800자 이상으로 작성하고, H2/H3, 번호 단계, 체크리스트, 주의사항, FAQ를 포함합니다.",
        "- causes/quickChecks/steps/advancedSteps/warnings/commonMistakes/faq는 검색 의도에 맞는 항목만 채웁니다.",
        "- 각 step에는 왜 필요한지, 어디서 확인하는지, 정상 결과, 실패 시 다음 행동을 넣습니다.",
        "- TROUBLESHOOTING은 원인→빠른 확인→기본 해결→고급 해결→주의사항 순서로 씁니다.",
        "- HOW_TO/TRAVEL_GUIDE는 준비물→작성/실행 순서→실수 방지→제출/확인 순서로 씁니다.",
        "- SEO title/description은 검색자가 실제로 클릭할 문장으로 씁니다.",
      ].join("\n"),
      text: {
        format: {
          type: "json_schema",
          name: "content",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "searchIntent",
              "title",
              "summary",
              "directAnswer",
              "answer",
              "causes",
              "quickChecks",
              "steps",
              "advancedSteps",
              "warnings",
              "commonMistakes",
              "relatedQuestions",
              "faq",
              "topics",
              "adContext",
              "seo",
              "confidenceScore",
            ],
            properties: {
              searchIntent: { type: "string" },
              title: { type: "string" },
              summary: { type: "string" },
              directAnswer: { type: "string" },
              answer: { type: "string" },
              causes: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "explanation", "likelihood"],
                  properties: {
                    title: { type: "string" },
                    explanation: { type: "string" },
                    likelihood: { type: "string" },
                  },
                },
              },
              quickChecks: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "instruction"],
                  properties: {
                    title: { type: "string" },
                    instruction: { type: "string" },
                  },
                },
              },
              steps: { type: "array", items: stepJsonSchema },
              advancedSteps: { type: "array", items: stepJsonSchema },
              warnings: { type: "array", items: { type: "string" } },
              commonMistakes: { type: "array", items: { type: "string" } },
              relatedQuestions: { type: "array", items: { type: "string" } },
              faq: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["question", "answer"],
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                },
              },
              topics: { type: "array", items: { type: "string" } },
              adContext: {
                type: "object",
                additionalProperties: false,
                required: ["categories", "keywords", "intent"],
                properties: {
                  categories: { type: "array", items: { type: "string" } },
                  keywords: { type: "array", items: { type: "string" } },
                  intent: { type: "string" },
                },
              },
              seo: {
                type: "object",
                additionalProperties: false,
                required: ["title", "description"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                },
              },
              confidenceScore: { type: "number" },
            },
          },
        },
      },
    });

    return generatedContentSchema.parse(JSON.parse(response.output_text));
  }
}

const stepJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "explanation",
    "instructions",
    "expectedResult",
    "ifFailed",
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    explanation: { type: "string" },
    instructions: { type: "array", items: { type: "string" } },
    expectedResult: { type: "string" },
    ifFailed: { type: "string" },
  },
} as const;
