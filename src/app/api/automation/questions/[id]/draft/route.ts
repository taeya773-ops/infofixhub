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
  evaluation: z.object({ status: z.enum(["PASS", "REVISE", "BLOCK"]), overallScore: z.number().min(0).max(100), notes: z.string(), issues: z.array(z.string()), provider: z.string(), model: z.string(), revisionCount: z.number().int().min(0).max(2) }).optional(),
  sources: z.array(z.object({ title: z.string(), url: z.string().url(), domain: z.string() })).max(20).default([]),
  screenshotPlan: z.array(z.object({
    stepNumber: z.number().int().positive(),
    insertAfter: z.string().trim(),
    captureType: z.enum(["AUTO_PUBLIC_WEB", "AUTO_COMPLEX", "USER_REQUIRED"]),
    requiredScreen: z.string().trim().min(5),
    targetUrl: z.string().url().nullable().optional(),
    targetSelector: z.string().trim().nullable().optional(),
    highlightDescription: z.string().trim().nullable().optional(),
    caption: z.string().trim().min(3),
    altText: z.string().trim().min(3),
    reason: z.string().trim().nullable().optional(),
  })).max(20).default([]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAutomationAuth(request);
    assertDatabaseConfigured();
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const question = await db.question.findUniqueOrThrow({
      where: { id },
      select: { slug: true },
    });
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
          evaluationStatus: input.evaluation?.status,
          evaluationScore: input.evaluation?.overallScore,
          evaluationNotes: input.evaluation ? `${input.evaluation.notes}${input.evaluation.issues.length ? `\n- ${input.evaluation.issues.join("\n- ")}` : ""}` : undefined,
          evaluatorProvider: input.evaluation?.provider,
          evaluatorModel: input.evaluation?.model,
          revisionCount: input.evaluation?.revisionCount ?? 0,
          version: (previous?.version ?? 0) + 1,
        },
      }),
      db.seoMetadata.upsert({
        where: { questionId: id },
        create: { questionId: id, title: input.metaTitle, description: input.metaDescription },
        update: { title: input.metaTitle, description: input.metaDescription },
      }),
      db.contentSource.deleteMany({ where: { questionId: id } }),
      db.contentScreenshot.deleteMany({ where: { questionId: id, imageData: null } }),
      ...input.sources.map((source) =>
        db.contentSource.create({
          data: { questionId: id, ...source, provider: "workflow-research", retrievedAt: new Date() },
        }),
      ),
      ...input.screenshotPlan.map((shot) =>
        db.contentScreenshot.create({
          data: {
            questionId: id,
            stepNumber: shot.stepNumber,
            insertAfter: shot.insertAfter || `단계 ${shot.stepNumber} 설명 뒤`,
            captureType: shot.captureType,
            requiredScreen: shot.requiredScreen,
            targetUrl: shot.targetUrl ?? null,
            targetSelector: shot.targetSelector ?? null,
            highlightDescription: shot.highlightDescription ?? null,
            caption: shot.caption,
            altText: shot.altText,
            reason: shot.reason ?? null,
          },
        }),
      ),
      db.question.update({ where: { id }, data: { status: input.evaluation?.status === "BLOCK" ? "REVIEW" : "DRAFT", qualityScore: input.evaluation?.overallScore ?? input.qualityScore } }),
    ]);

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://infofixhub.org").replace(/\/$/, "");
    const publicUrl = `${siteUrl}/q/${question.slug}`;
    const adminPreviewUrl = `${siteUrl}/admin/questions/${id}`;
    return NextResponse.json(
      {
        questionId: id,
        status: input.evaluation?.status === "BLOCK" ? "REVIEW" : "DRAFT",
        evaluationStatus: input.evaluation?.status ?? null,
        adminPreviewUrl,
        publicUrl: null,
        pendingPublicUrl: publicUrl,
        indexTargetUrl: null,
        screenshotRequests: input.screenshotPlan.length,
      },
      { status: 201 },
    );
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
