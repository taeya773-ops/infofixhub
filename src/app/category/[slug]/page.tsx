import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await db.category.findUnique({
      where: { slug },
      select: { name: true, description: true },
    });
    if (!category) return {};
    return {
      title: category.name,
      description: category.description,
      alternates: { canonical: `/category/${encodeURIComponent(slug)}` },
    };
  } catch {
    return { alternates: { canonical: `/category/${encodeURIComponent(slug)}` } };
  }
}

function SalonNoteCategoryPromo() {
  return (
    <section className="panel">
      <div className="eyebrow">SalonNote 추천 서비스</div>
      <h2>미용실 예약·고객관리·매출관리를 한 곳에서 관리하세요</h2>
      <p className="lead">
        SalonNote는 미용실 운영자를 위한 관리 서비스입니다. 고객 정보, 예약 일정,
        시술 기록, 매출과 정산 흐름을 한 화면에서 정리해 작은 매장도 복잡한 운영을
        더 쉽게 관리할 수 있도록 돕습니다.
      </p>
      <p className="muted">광고/서비스 주소: https://app.salonnote.uk</p>
      <Link className="mini-button" href="/go/salonnote-main-creative">
        SalonNote 바로가기
      </Link>
    </section>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  let category;
  try {
    category = await db.category.findUnique({
      where: { slug },
      include: {
        questions: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          skip: (page - 1) * 12,
          take: 12,
        },
      },
    });
  } catch {
    notFound();
  }
  if (!category || category.questions.length === 0) notFound();

  return (
    <main className="wrap section">
      <div className="eyebrow">Category</div>
      <h1>{category.name}</h1>
      <p className="lead">{category.description}</p>
      {category.slug === "salon-pos" ? <SalonNoteCategoryPromo /> : null}
      <div className="grid">
        {category.questions.map((q) => (
          <Link className="card" href={`/q/${q.slug}`} key={q.id}>
            <h3>{q.title}</h3>
          </Link>
        ))}
      </div>
    </main>
  );
}
