import { NextResponse } from "next/server";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { assertDatabaseConfigured, db } from "@/lib/db";

async function captureOne(id: string, url: string, selector: string | null) {
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

  await db.contentScreenshot.update({
    where: { id },
    data: {
      imageData: bytes,
      imageSize: bytes.byteLength,
      mimeType: response.headers.get("content-type") || "image/png",
      fileName: `${id}.png`,
      sourceType: "SCREENSHOTONE",
      status: "UPLOADED",
    },
  });
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

    const results: Array<{ id: string; status: string }> = [];
    for (const plan of plans) {
      try {
        await captureOne(plan.id, plan.targetUrl!, plan.targetSelector);
        results.push({ id: plan.id, status: "UPLOADED" });
      } catch {
        await db.contentScreenshot.update({ where: { id: plan.id }, data: { status: "CAPTURE_FAILED" } });
        results.push({ id: plan.id, status: "CAPTURE_FAILED" });
      }
    }

    return NextResponse.json({ questionId: id, attempted: plans.length, results });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
