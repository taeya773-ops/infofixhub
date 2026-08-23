import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertDatabaseConfigured, db } from "@/lib/db";
import { analyzeScreenshot, screenshotStatusFromReview } from "@/services/screenshot-review";

export const dynamic = "force-dynamic";

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

async function uploadScreenshot(formData: FormData) {
  "use server";
  assertDatabaseConfigured();
  const screenshotId = String(formData.get("screenshotId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const file = formData.get("image");
  if (!screenshotId || !questionId || !(file instanceof File) || file.size === 0) throw new Error("스크린샷 파일이 필요합니다.");
  if (!allowedImageTypes.has(file.type)) throw new Error("PNG, JPEG, WebP 이미지만 업로드할 수 있습니다.");
  if (file.size > 5 * 1024 * 1024) throw new Error("스크린샷은 5MB 이하여야 합니다.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const shot = await db.contentScreenshot.findFirstOrThrow({ where: { id: screenshotId, questionId }, include: { question: true } });
  const review = await analyzeScreenshot(bytes, file.type, {
    questionTitle: shot.question.title, requiredScreen: shot.requiredScreen, insertAfter: shot.insertAfter,
    caption: shot.caption, highlightDescription: shot.highlightDescription,
  });
  await db.contentScreenshot.update({
    where: { id: screenshotId, questionId },
    data: {
      imageData: bytes,
      imageSize: file.size,
      mimeType: file.type,
      fileName: file.name,
      sourceType: "USER_UPLOAD",
      status: screenshotStatusFromReview(review),
      matchScore: review.matchScore,
      matchesContent: review.matchesContent,
      detectedScreen: review.detectedScreen,
      matchNotes: review.containsSensitiveData ? `${review.matchNotes} 민감정보: ${review.sensitiveFindings.join(", ")}` : review.matchNotes,
      recommendedAction: review.recommendedAction,
      containsSensitiveData: review.containsSensitiveData,
      analyzedAt: new Date(),
    },
  });
  revalidatePath(`/admin/questions/${questionId}`);
}

async function captureScreenshot(formData: FormData) {
  "use server";
  assertDatabaseConfigured();
  const screenshotId = String(formData.get("screenshotId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const plan = await db.contentScreenshot.findFirstOrThrow({ where: { id: screenshotId, questionId } });
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  if (!accessKey) throw new Error("Render에 SCREENSHOTONE_ACCESS_KEY를 먼저 설정하세요.");
  if (!plan.targetUrl || plan.captureType !== "AUTO_PUBLIC_WEB") throw new Error("자동 캡처 가능한 공개 URL이 아닙니다.");

  const response = await fetch("https://api.screenshotone.com/take", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      url: plan.targetUrl,
      format: "png",
      full_page: !plan.targetSelector,
      selector: plan.targetSelector || undefined,
      viewport_width: 1440,
      viewport_height: 1024,
      block_cookie_banners: true,
      block_ads: true,
      reduced_motion: true,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`자동 캡처 실패 (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("자동 캡처 이미지가 8MB를 초과했습니다.");

  const review = await analyzeScreenshot(bytes, response.headers.get("content-type") || "image/png", {
    questionTitle: (await db.question.findUniqueOrThrow({ where: { id: questionId }, select: { title: true } })).title,
    requiredScreen: plan.requiredScreen, insertAfter: plan.insertAfter, caption: plan.caption, highlightDescription: plan.highlightDescription,
  });
  await db.contentScreenshot.update({
    where: { id: screenshotId },
    data: { imageData: bytes, imageSize: bytes.byteLength, mimeType: response.headers.get("content-type") || "image/png", fileName: `${screenshotId}.png`, sourceType: "SCREENSHOTONE", status: screenshotStatusFromReview(review), matchScore: review.matchScore, matchesContent: review.matchesContent, detectedScreen: review.detectedScreen, matchNotes: review.containsSensitiveData ? `${review.matchNotes} 민감정보: ${review.sensitiveFindings.join(", ")}` : review.matchNotes, recommendedAction: review.recommendedAction, containsSensitiveData: review.containsSensitiveData, analyzedAt: new Date() },
  });
  revalidatePath(`/admin/questions/${questionId}`);
}

async function reviewScreenshot(formData: FormData) {
  "use server";
  assertDatabaseConfigured();
  const screenshotId = String(formData.get("screenshotId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!screenshotId || !questionId || !["APPROVED", "REJECTED", "SENSITIVE"].includes(status)) throw new Error("잘못된 이미지 검수 요청입니다.");
  if (status === "APPROVED") {
    const shot = await db.contentScreenshot.findFirstOrThrow({ where: { id: screenshotId, questionId } });
    if (!shot.matchesContent || (shot.matchScore ?? 0) < 80 || shot.containsSensitiveData) throw new Error("내용 일치 점수 80점 이상이며 민감정보가 없는 이미지만 승인할 수 있습니다.");
  }
  await db.contentScreenshot.update({ where: { id: screenshotId, questionId }, data: { status, containsSensitiveData: status === "SENSITIVE" } });
  revalidatePath(`/admin/questions/${questionId}`);
}

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
      screenshots: { orderBy: { stepNumber: "asc" } },
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
            <h2>스크린샷 콘티 및 검수</h2>
            <p className="muted">업로드 즉시 AI가 본문 단계와 이미지의 일치도 및 민감정보를 검사합니다. 80점 이상 일치한 뒤 사람이 승인한 이미지만 공개 글에 삽입됩니다.</p>
            {question.screenshots.length === 0 ? <p>이 초안에는 아직 스크린샷 계획이 없습니다. 스크린샷 콘티가 포함된 워크플로로 다시 생성해야 합니다.</p> : (
              <div className="screenshot-review-list">{question.screenshots.map((shot) => (
                <article className="screenshot-review-card" key={shot.id}>
                  <div><span className="pill">단계 {shot.stepNumber}</span> <span className="pill">{shot.captureType}</span> <span className="pill">{shot.status}</span></div>
                  <h3>{shot.requiredScreen}</h3>
                  <p><b>삽입 위치:</b> {shot.insertAfter}</p>
                  <p><b>강조:</b> {shot.highlightDescription ?? "별도 강조 없음"}</p>
                  <p><b>캡션:</b> {shot.caption}</p>
                  {shot.reason ? <p className="muted">{shot.reason}</p> : null}
                  {shot.imageData ? <img className="screenshot-preview" src={`/api/screenshots/${shot.id}`} alt={shot.altText} /> : null}
                  {shot.analyzedAt ? <div className="panel"><p><b>내용 일치 점수:</b> {Math.round(shot.matchScore ?? 0)} / 100 · {shot.matchesContent ? "일치" : "불일치"}</p><p><b>실제 감지 화면:</b> {shot.detectedScreen ?? "-"}</p><p><b>AI 검수 의견:</b> {shot.matchNotes ?? "-"}</p>{shot.containsSensitiveData ? <p><b>경고:</b> 민감정보가 감지되어 승인할 수 없습니다.</p> : null}</div> : shot.imageData ? <p className="muted">AI 내용 일치 검사가 필요합니다.</p> : null}
                  <div className="inline-actions">
                    {shot.captureType === "AUTO_PUBLIC_WEB" && !shot.imageData ? <form action={captureScreenshot}><input type="hidden" name="screenshotId" value={shot.id} /><input type="hidden" name="questionId" value={question.id} /><button className="mini-button" type="submit">자동 캡처</button></form> : null}
                    <form action={uploadScreenshot}><input type="hidden" name="screenshotId" value={shot.id} /><input type="hidden" name="questionId" value={question.id} /><input type="file" name="image" accept="image/png,image/jpeg,image/webp" required /><button className="mini-button" type="submit">직접 업로드</button></form>
                    {shot.imageData ? <>{shot.matchesContent && (shot.matchScore ?? 0) >= 80 && !shot.containsSensitiveData ? <form action={reviewScreenshot}><input type="hidden" name="screenshotId" value={shot.id} /><input type="hidden" name="questionId" value={question.id} /><input type="hidden" name="status" value="APPROVED" /><button className="mini-button" type="submit">이미지 승인</button></form> : null}<form action={reviewScreenshot}><input type="hidden" name="screenshotId" value={shot.id} /><input type="hidden" name="questionId" value={question.id} /><input type="hidden" name="status" value="SENSITIVE" /><button className="mini-button" type="submit">민감정보 있음</button></form></> : null}
                  </div>
                </article>
              ))}</div>
            )}
          </section>
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
