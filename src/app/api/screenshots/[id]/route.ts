import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const screenshot = await db.contentScreenshot.findUnique({
    where: { id },
    include: { question: { select: { status: true } } },
  });

  if (!screenshot?.imageData || !screenshot.mimeType) return new NextResponse(null, { status: 404 });

  const publicImage = screenshot.status === "APPROVED" && screenshot.question.status === "PUBLISHED";
  if (!publicImage && !isAdminRequest(request)) return new NextResponse(null, { status: 401 });

  return new NextResponse(Buffer.from(screenshot.imageData), {
    headers: {
      "Content-Type": screenshot.mimeType,
      "Content-Length": String(screenshot.imageSize ?? screenshot.imageData.length),
      "Cache-Control": publicImage ? "public, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
