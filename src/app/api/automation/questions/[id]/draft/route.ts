import { NextResponse } from "next/server";
import { z } from "zod";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { assertDatabaseConfigured, db } from "@/lib/db";

const schema = z.object({
  summary: z.string().trim().min(10),
  contentMarkdown: z.string().trim().min(100),
  contentHtml: z.string().trim().min(100),
  metaTitle: z.string().trim().min(5).max(70),
  metaDescription: z.string().trim().min(20).max(180),
  confidenceScore: z.number().min(0).max(100).default(80),
  qualityScore: z.number().min(0).max(100).default(80),
  provider: z.string().default("openai"),
  model: z.string().default("gpt-4.1-mini"),
  sources: z.array(z.object({ title: z.string(), url: z.string().url(), domain: z.string() })).max(20).default([]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAutomationAuth(request);
    assertDatabaseConfigured();
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const previous = await db.answer.findFirst({ where: { questionId: id }, orderBy: { version: "desc" } });

    await db.$transaction([
      db.answer.updateMany({ where: { questionId: id, isActive: true }, data: { isActive: false } }),
      db.answer.create({
        data: {
          questionId: id,
          summary: input.summary,
          contentMarkdown: input.contentMarkdown,
          contentHtml: input.contentHtml,
          provider: input.provider,
          model: input.model,
          promptVersion: "workflow-research-v1",
          confidenceScore: input.confidenceScore,
          qualityScore: input.qualityScore,
          version: (previous?.version ?? 0) + 1,
        },
      }),
      db.seoMetadata.upsert({
        where: { questionId: id },
        create: { questionId: id, title: input.metaTitle, description: input.metaDescription },
        update: { title: input.metaTitle, description: input.metaDescription },
      }),
      db.contentSource.deleteMany({ where: { questionId: id } }),
      ...input.sources.map((source) =>
        db.contentSource.create({
          data: { questionId: id, ...source, provider: "workflow-research", retrievedAt: new Date() },
        }),
      ),
      db.question.update({ where: { id }, data: { status: "DRAFT", qualityScore: input.qualityScore } }),
    ]);

    return NextResponse.json({ questionId: id, status: "DRAFT" }, { status: 201 });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
