import type { Prisma } from "@/generated/prisma/client";

export function normalizeSearchQuery(value: string | string[] | undefined) {
  return (typeof value === "string" ? value : "").trim().replace(/\s+/g, " ").slice(0, 120);
}

export function publicSearchWhere(query: string): Prisma.QuestionWhereInput {
  const terms = normalizeSearchQuery(query).split(" ").filter(Boolean).slice(0, 8);
  return {
    status: "PUBLISHED",
    AND: terms.map((term) => ({ OR: [
      { title: { contains: term, mode: "insensitive" } },
      { category: { is: { name: { contains: term, mode: "insensitive" } } } },
    ] })),
  };
}
