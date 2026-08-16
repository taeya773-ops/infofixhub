import { NextResponse } from "next/server";
import { assertDatabaseConfigured, db, formatDatabaseError } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    assertDatabaseConfigured();

    const [{ ok }] = await db.$queryRaw<Array<{ ok: number }>>`select 1 as ok`;
    const [categories, seedTopics, keywords, questions] = await Promise.all([
      db.category.count(),
      db.seedTopic.count(),
      db.keyword.count(),
      db.question.count(),
    ]);

    return NextResponse.json({
      ok: ok === 1,
      database: "postgresql",
      counts: { categories, seedTopics, keywords, questions },
    });
  } catch (error) {
    console.error(formatDatabaseError(error));

    return NextResponse.json(
      {
        ok: false,
        database: "postgresql",
        error: "Database health check failed. Check server logs and DATABASE_URL configuration.",
      },
      { status: 503 },
    );
  }
}
