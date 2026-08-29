import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { env } from "@/lib/env";
import { crawlPublicPage } from "@/services/web-research";

const schema = z.object({
  question: z.string().min(5).max(300),
  userNotes: z.string().trim().max(4000).default(""),
  sources: z.array(z.object({ title: z.string().default("검색 자료"), url: z.string().url(), snippet: z.string().default("") })).min(1).max(10),
});

export async function POST(request: Request) {
  try {
    requireAutomationAuth(request);
    const input = schema.parse(await request.json());
    const crawled: Array<{ title: string; url: string; snippet: string; content: string }> = [];
    const failures: Array<{ url: string; reason: string }> = [];
    for (const source of input.sources.slice(0, 6)) {
      try { const page = await crawlPublicPage(source.url); crawled.push({ ...source, url: page.finalUrl, content: page.text }); }
      catch (error) { failures.push({ url: source.url, reason: error instanceof Error ? error.message : "Crawl failed" }); }
    }
    if (!crawled.length) throw new Error("No public source pages could be crawled");
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    const response = await new OpenAI({ apiKey: env.OPENAI_API_KEY }).responses.create({
      model: env.OPENAI_MODEL, store: false,
      instructions: "당신은 근거 중심의 한국어 AI Researcher다. 제공된 원문에 실제로 있는 내용만 사실 근거로 사용한다. 사용자 메모의 직접 경험·감상은 필자의 체험으로 구분하고 존중하되, 메모에 포함된 역사·교통·가격·운영 정보는 원문으로 확인해야 한다. 사실로 확인되지 않거나 서로 충돌하는 내용은 cautions에 기록한다. URL이나 사실을 만들지 않는다.",
      input: `질문: ${input.question}\n\n사용자 메모(직접 경험과 글에 반영할 초점):\n${input.userNotes || "없음"}\n\n수집 원문 JSON:\n${JSON.stringify(crawled)}`,
      text: { format: { type: "json_schema", name: "deep_research", strict: true, schema: { type: "object", additionalProperties: false, properties: {
        summary: { type: "string" }, findings: { type: "array", items: { type: "object", additionalProperties: false, properties: { claim: { type: "string" }, evidence: { type: "string" }, sourceUrl: { type: "string" } }, required: ["claim", "evidence", "sourceUrl"] } }, cautions: { type: "array", items: { type: "string" } }
      }, required: ["summary", "findings", "cautions"] } } },
    });
    const research = JSON.parse(response.output_text) as { summary: string; findings: Array<{ claim: string; evidence: string; sourceUrl: string }>; cautions: string[] };
    const allowed = new Set(crawled.map((item) => item.url));
    research.findings = research.findings.filter((item) => allowed.has(item.sourceUrl));
    return NextResponse.json({ research, evidence: crawled.map(({ title, url, content }) => ({ title, url, snippet: content.slice(0, 1200) })), sources: crawled.map(({ title, url }) => ({ title, url, domain: new URL(url).hostname })), crawlStats: { requested: Math.min(input.sources.length, 6), succeeded: crawled.length, failed: failures.length }, failures, researcher: { provider: "openai", model: env.OPENAI_MODEL } });
  } catch (error) { const result = automationError(error); return NextResponse.json({ error: result.message }, { status: result.status }); }
}
