import { NextResponse } from "next/server";
import { z } from "zod";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { assertDatabaseConfigured, db } from "@/lib/db";
import { normalizeKeyword, slugify } from "@/lib/slug";

const schema = z.object({
  seedKeyword: z.string().trim().min(2).max(160),
  questions: z.array(z.string().trim().min(5).max(240)).min(1).max(100),
  country: z.string().trim().min(2).max(2).default("KR"),
  language: z.string().trim().min(2).max(5).default("ko"),
  categoryId: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1).max(80).default("google-workflows"),
});

export async function POST(request: Request) {
  try {
    requireAutomationAuth(request);
    assertDatabaseConfigured();
    const input = schema.parse(await request.json());
    const country = input.country.toUpperCase();
    const normalizedKeyword = normalizeKeyword(input.seedKeyword);
    const uniqueQuestions = [...new Set(input.questions.map((q) => q.trim()))];

    const keyword = await db.keyword.upsert({
      where: {
        normalizedKeyword_country_language: {
          normalizedKeyword,
          country,
          language: input.language,
        },
      },
      create: {
        keyword: input.seedKeyword,
        normalizedKeyword,
        categoryId: input.categoryId,
        country,
        language: input.language,
        status: "DISCOVERED",
        sources: { create: { provider: input.source } },
      },
      update: { lastSeenAt: new Date() },
    });

    const stored = [];
    for (const [index, title] of uniqueQuestions.entries()) {
      const existing = await db.question.findFirst({
        where: { primaryKeywordId: keyword.id, title },
        select: { id: true, title: true, slug: true, status: true },
      });
      if (existing) {
        stored.push(existing);
        continue;
      }
      stored.push(
        await db.question.create({
          data: {
            primaryKeywordId: keyword.id,
            categoryId: input.categoryId,
            title,
            slug: `${slugify(title)}-${Date.now().toString(36)}-${index}`,
            searchIntent: "informational",
            language: input.language,
            country,
            status: "NEW",
          },
          select: { id: true, title: true, slug: true, status: true },
        }),
      );
    }

    return NextResponse.json({ keywordId: keyword.id, questions: stored }, { status: 201 });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
