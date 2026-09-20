import { db } from "@/lib/db";
import { normalizeSearchQuery, publicSearchWhere } from "@/lib/public-search";

export async function GET(request: Request) {
  const query = normalizeSearchQuery(new URL(request.url).searchParams.get("q") ?? "");
  const headers = { "Cache-Control": "no-store" };
  if (!query) return Response.json({ items: [] }, { headers });
  try {
    const items = await db.question.findMany({
      where: publicSearchWhere(query),
      select: { slug: true, title: true },
      orderBy: { publishedAt: "desc" }, take: 5,
    });
    return Response.json({ items }, { headers });
  } catch {
    return Response.json({ error: "검색 제안을 불러오지 못했습니다." }, { status: 503, headers });
  }
}
