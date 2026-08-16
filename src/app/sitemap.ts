import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

const pathSegment = (value: string) => encodeURIComponent(value);

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;

  try {
    const [questions, categories] = await Promise.all([
      db.question.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      db.category.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      { url: base, lastModified: new Date() },
      ...categories.map((category) => ({
        url: `${base}/category/${pathSegment(category.slug)}`,
        lastModified: category.updatedAt,
      })),
      ...questions.map((question) => ({
        url: `${base}/q/${pathSegment(question.slug)}`,
        lastModified: question.updatedAt,
      })),
    ];
  } catch {
    return [{ url: base, lastModified: new Date() }];
  }
}
