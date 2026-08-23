import Link from "next/link";
import { notFound } from "next/navigation";
import { assertDatabaseConfigured, db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminQuestionDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  assertDatabaseConfigured();
  const { id } = await params;
  const question = await db.question.findUnique({
    where: { id },
    include: {
      answers: {
        where: { isActive: true },
        orderBy: { version: "desc" },
        take: 1,
      },
      seo: true,
      sources: { orderBy: { retrievedAt: "desc" } },
    },
  });

  if (!question) notFound();
  const answer = question.answers[0];

  return (
    <main className="admin-document-shell">
      <Link href="/admin">← 관리자 화면으로</Link>
      <div className="admin-document-header">
        <div>
          <div className="eyebrow">답변 문서 검수</div>
          <h1>{question.title}</h1>
        </div>
        <span className="pill">{question.status}</span>
      </div>

      {!answer ? (
        <section className="panel"><p>아직 생성된 답변 문서가 없습니다.</p></section>
      ) : (
        <>
          <section className="panel">
            <h2>요약</h2>
            <p>{answer.summary}</p>
          </section>
          <article className="panel admin-document-body">
            <h2>본문</h2>
            <div>{answer.contentMarkdown}</div>
          </article>
          <section className="panel">
            <h2>SEO</h2>
            <p><b>제목:</b> {question.seo?.title ?? "-"}</p>
            <p><b>설명:</b> {question.seo?.description ?? "-"}</p>
            <p><b>Slug:</b> {question.slug}</p>
          </section>
          <section className="panel">
            <h2>참고 자료</h2>
            {question.sources.length === 0 ? <p className="muted">저장된 출처가 없습니다.</p> : (
              <ul>{question.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> <span className="muted">({source.domain})</span></li>)}</ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
