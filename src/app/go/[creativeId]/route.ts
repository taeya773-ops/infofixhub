import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAdClick } from "@/services/analytics";
import { z } from "zod";

const paramsSchema = z.object({ creativeId: z.string().min(1) });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ creativeId: string }> },
) {
  const { creativeId } = paramsSchema.parse(await params);
  const creative = await db.adCreative.findUnique({
    where: { id: creativeId },
    include: { campaign: true },
  });

  if (!creative || !creative.active || creative.campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "Campaign unavailable" }, { status: 404 });
  }

  const now = new Date();
  if (
    (creative.campaign.startAt && creative.campaign.startAt > now) ||
    (creative.campaign.endAt && creative.campaign.endAt < now)
  ) {
    return NextResponse.json({ error: "Campaign inactive" }, { status: 410 });
  }

  let landing: URL;
  try {
    landing = new URL(creative.campaign.landingUrl);
    if (!["http:", "https:"].includes(landing.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Unsafe campaign URL" }, { status: 400 });
  }

  const requestedQuestionId = new URL(request.url).searchParams.get("q");
  const question = requestedQuestionId
    ? await db.question.findUnique({
        where: { id: requestedQuestionId },
        select: { id: true },
      })
    : null;
  const questionId = question?.id ?? null;

  await db.adClick.create({
    data: {
      campaignId: creative.campaignId,
      creativeId: creative.id,
      questionId,
    },
  });

  if (questionId) {
    await recordAdClick(questionId).catch(() => null);
  }

  return NextResponse.redirect(landing, 302);
}
