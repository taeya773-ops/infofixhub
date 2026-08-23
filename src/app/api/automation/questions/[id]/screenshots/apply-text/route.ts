import { NextResponse } from "next/server";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { assertDatabaseConfigured, db } from "@/lib/db";

function markdownToSafeHtml(markdown: string) {
  return markdown.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]!).replace(/\n/g, "<br>");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAutomationAuth(request);
    assertDatabaseConfigured();
    const { id } = await context.params;
    const answer = await db.answer.findFirstOrThrow({ where: { questionId: id, isActive: true }, orderBy: { version: "desc" } });
    const revisions = await db.contentScreenshot.findMany({
      where: { questionId: id, reviewStatus: "TEXT_NEEDS_UPDATE", textSupplement: { not: null } },
      orderBy: { stepNumber: "asc" },
      select: { insertAfter: true, textSupplement: true },
    });
    let contentMarkdown = answer.contentMarkdown;
    let applied = 0;
    for (const revision of revisions) {
      const supplement = revision.textSupplement?.trim();
      if (!supplement || contentMarkdown.includes(supplement)) continue;
      const markerIndex = contentMarkdown.indexOf(revision.insertAfter);
      if (markerIndex >= 0) {
        const insertionPoint = markerIndex + revision.insertAfter.length;
        contentMarkdown = `${contentMarkdown.slice(0, insertionPoint)}\n\n${supplement}${contentMarkdown.slice(insertionPoint)}`;
      } else {
        contentMarkdown = `${contentMarkdown}\n\n## 화면 보충 설명\n\n${supplement}`;
      }
      applied += 1;
    }
    if (applied > 0) {
      await db.answer.update({ where: { id: answer.id }, data: { contentMarkdown, contentHtml: markdownToSafeHtml(contentMarkdown) } });
    }
    return NextResponse.json({ questionId: id, status: "TEXT_REVISED", applied, humanApprovalRequired: true });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
