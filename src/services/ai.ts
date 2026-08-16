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
      instructions:
        "한국어 전문 편집자다. 사실을 꾸미거나 출처 URL을 만들지 말고, 검색 질문에 먼저 직접 답하라. JSON만 반환하라.",
      input: `키워드: ${input.keyword}
의도: ${input.intent}
검색 의도, 제목, 요약, 500자 이상의 답변, 단계, 관련 질문, 주제, 광고 문맥, SEO, 신뢰도(0~100)를 생성하라.`,
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
              "answer",
              "steps",
              "relatedQuestions",
              "topics",
              "adContext",
              "seo",
              "confidenceScore",
            ],
            properties: {
              searchIntent: { type: "string" },
              title: { type: "string" },
              summary: { type: "string" },
              answer: { type: "string" },
              steps: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "description"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
              relatedQuestions: { type: "array", items: { type: "string" } },
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
