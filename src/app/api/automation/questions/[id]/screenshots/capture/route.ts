import { NextResponse } from "next/server";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { assertDatabaseConfigured, db } from "@/lib/db";
import { analyzeScreenshot, recommendedActionFromReview, screenshotStatusFromReview, type ScreenshotReviewContext } from "@/services/screenshot-review";

async function captureOne(id: string, url: string, selector: string | null, context: ScreenshotReviewContext) {
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  if (!accessKey) throw new Error("SCREENSHOTONE_ACCESS_KEY is not configured");

  const response = await fetch("https://api.screenshotone.com/take", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      url,
      format: "png",
      full_page: !selector,
      selector: selector || undefined,
      viewport_width: 1440,
      viewport_height: 1024,
      block_cookie_banners: true,
      block_ads: true,
      reduced_motion: true,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`ScreenshotOne returned ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("Captured image exceeds 8MB");

  const review = await analyzeScreenshot(bytes, response.headers.get("content-type") || "image/png", context);
  const status = screenshotStatusFromReview(review);
  await db.contentScreenshot.update({
    where: { id },
    data: {
      imageData: bytes,
      imageSize: bytes.byteLength,
      mimeType: response.headers.get("content-type") || "image/png",
      fileName: `${id}.png`,
      sourceType: "SCREENSHOTONE",
      status,
      matchScore: review.matchScore,
      matchesContent: review.isContentMatching,
      detectedScreen: review.detectedScreen,
      matchNotes: review.containsSensitiveData ? `${review.analysis} 민감정보: ${review.sensitiveFindings.join(", ")}` : review.analysis,
      recommendedAction: recommendedActionFromReview(review),
      reviewStatus: review.status,
      textSupplement: review.textSupplement || null,
      imageIssueSummary: review.imageActionGuide.issueSummary || null,
      requiredScreenshotDescription: review.imageActionGuide.requiredScreenshotDescription || null,
      imageGenerationPrompt: review.imageActionGuide.imageGenerationPrompt || null,
      containsSensitiveData: review.containsSensitiveData,
      analyzedAt: new Date(),
    },
  });
  return { status, review };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAutomationAuth(request);
    assertDatabaseConfigured();
    const { id } = await context.params;
    const plans = await db.contentScreenshot.findMany({
      where: { questionId: id, captureType: "AUTO_PUBLIC_WEB", status: "PLANNED", targetUrl: { not: null } },
      orderBy: { stepNumber: "asc" },
      take: 5,
    });
    const question = await db.question.findUniqueOrThrow({ where: { id }, select: { title: true, answers: { where: { isActive: true }, take: 1, select: { contentMarkdown: true } } } });

    const results: Array<{ id: string; status: string; reviewStatus?: string; textSupplement?: string; imageActionGuide?: unknown }> = [];
    for (const plan of plans) {
      try {
        const outcome = await captureOne(plan.id, plan.targetUrl!, plan.targetSelector, { questionTitle: question.title, requiredScreen: plan.requiredScreen, insertAfter: plan.insertAfter, caption: plan.caption, highlightDescription: plan.highlightDescription, contextText: question.answers[0]?.contentMarkdown });
        results.push({ id: plan.id, status: outcome.status, reviewStatus: outcome.review.status, textSupplement: outcome.review.textSupplement, imageActionGuide: outcome.review.imageActionGuide });
      } catch {
        await db.contentScreenshot.update({ where: { id: plan.id }, data: { status: "CAPTURE_FAILED" } });
        results.push({ id: plan.id, status: "CAPTURE_FAILED" });
      }
    }

    const overallStatus = results.some((item) => item.reviewStatus === "IMAGE_NEEDS_UPDATE") ? "IMAGE_NEEDS_UPDATE" : results.some((item) => item.reviewStatus === "TEXT_NEEDS_UPDATE") ? "TEXT_NEEDS_UPDATE" : "MATCH";
    return NextResponse.json({ questionId: id, attempted: plans.length, overallStatus, results, humanApprovalRequired: true });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
