import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import {
  assertDatabaseConfigured,
  db,
  formatDatabaseError,
} from "@/lib/db";
import { providerStates } from "@/lib/providers/optional";
import { seedInputSchema } from "@/lib/validation";
import { discoverKeywords } from "@/services/discovery";
import { publishQuestion } from "@/services/content";
import { refreshGrowthRecommendations } from "@/services/analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

async function createSeedTopic(formData: FormData) {
  "use server";
  assertDatabaseConfigured();

  const input = seedInputSchema.parse({
    categoryId: String(formData.get("categoryId") ?? ""),
    keyword: String(formData.get("keyword") ?? ""),
    country: String(formData.get("country") || "KR"),
    language: String(formData.get("language") || "ko"),
  });

  await db.seedTopic.upsert({
    where: {
      categoryId_keyword_country_language: {
        categoryId: input.categoryId,
        keyword: input.keyword,
        country: input.country,
        language: input.language,
      },
    },
    update: { active: true },
    create: input,
  });

  revalidatePath("/admin");
  redirect("/admin?registered=1#cta");
}

async function runDiscovery(formData: FormData) {
  "use server";
  await discoverKeywords(String(formData.get("seedTopicId") ?? ""));
  revalidatePath("/admin");
}

async function runPublish(formData: FormData) {
  "use server";
  await publishQuestion(String(formData.get("questionId") ?? ""));
  revalidatePath("/admin");
}

async function updateQuestionStatus(formData: FormData) {
  "use server";
  assertDatabaseConfigured();
  const questionId = String(formData.get("questionId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!questionId || !["SELECTED", "APPROVED", "REJECTED"].includes(status)) {
    throw new Error("Invalid question status update");
  }
  if (status === "APPROVED") {
    const activeAnswer = await db.answer.findFirst({ where: { questionId, isActive: true }, orderBy: { version: "desc" } });
    if (activeAnswer?.evaluationStatus === "BLOCK") throw new Error("Gemini 검수에서 BLOCK된 답변은 승인할 수 없습니다. 검수 사유를 반영해 다시 생성하세요.");
  }
  await db.question.update({
    where: { id: questionId },
    data: { status: status as "SELECTED" | "APPROVED" | "REJECTED" },
  });
  revalidatePath("/admin");
  redirect("/admin#review-queue");
}

async function runGrowthRefresh() {
  "use server";
  await refreshGrowthRecommendations();
  revalidatePath("/admin");
}

async function registerWebService(formData: FormData) {
  "use server";
  assertDatabaseConfigured();

  const serviceName = String(formData.get("serviceName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const landingUrl = String(formData.get("landingUrl") ?? "").trim();
  const targetKeywords = String(formData.get("targetKeywords") ?? "")
    .split(",")
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);
  const title = String(formData.get("title") || serviceName).trim();
  const buttonText = String(formData.get("buttonText") || "자세히 보기").trim();
  const intent = String(formData.get("intent") || "informational").trim();
  const country = String(formData.get("country") || "KR").trim();
  const language = String(formData.get("language") || "ko").trim();
  const categoryId = String(formData.get("categoryId") || "").trim() || null;

  if (!serviceName || !description || !landingUrl || targetKeywords.length === 0) {
    throw new Error("서비스명, 설명, URL, 타깃 키워드는 필수입니다.");
  }

  const url = new URL(landingUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("랜딩 URL은 http 또는 https만 허용됩니다.");
  }

  const advertiser =
    (await db.advertiser.findFirst({ where: { name: "My Web Services" } })) ??
    (await db.advertiser.create({ data: { name: "My Web Services" } }));

  await db.advertiser.update({
    where: { id: advertiser.id },
    data: { active: true },
  });

  const product =
    (await db.product.findFirst({
      where: { advertiserId: advertiser.id, name: serviceName },
    })) ??
    (await db.product.create({
      data: {
        advertiserId: advertiser.id,
        name: serviceName,
        description,
        baseUrl: url.origin,
      },
    }));

  await db.product.update({
    where: { id: product.id },
    data: { description, baseUrl: url.origin, active: true },
  });

  await db.campaign.create({
    data: {
      productId: product.id,
      name: `${serviceName} CTA`,
      landingUrl: url.toString(),
      status: "ACTIVE",
      priority: 5,
      targets: {
        create: targetKeywords.map((keyword) => ({
          categoryId,
          keyword,
          intent,
          country,
          language,
          weight: 1,
        })),
      },
      creatives: {
        create: {
          title,
          description,
          buttonText,
          placement: "INLINE",
          active: true,
        },
      },
    },
  });

  revalidatePath("/admin");
}

type QuestionRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  qualityScore: number | null;
  answers: Array<{ id: string }>;
  analytics: Array<{
    pageViews: number;
    adImpressions: number;
    adClicks: number;
  }>;
};

function totals(question: QuestionRow) {
  const pageViews = question.analytics.reduce((sum, row) => sum + row.pageViews, 0);
  const adImpressions = question.analytics.reduce(
    (sum, row) => sum + row.adImpressions,
    0,
  );
  const adClicks = question.analytics.reduce((sum, row) => sum + row.adClicks, 0);
  const ctr = adImpressions
    ? `${((adClicks / adImpressions) * 100).toFixed(1)}%`
    : "-";
  return { pageViews, adImpressions, adClicks, ctr };
}

function metricLabel(value: number | null, fallback = "수집 대기") {
  return value ?? fallback;
}

export default async function Admin({
  searchParams,
}: {
  searchParams?: Promise<{ registered?: string }>;
}) {
  const registered = (await searchParams)?.registered === "1";
  let errorMessage: string | null = null;
  let counts = {
    seedTopics: 0,
    keywords: 0,
    review: 0,
    published: 0,
    pageViews: 0,
    impressions: 0,
    clicks: 0,
    campaigns: 0,
  };
  let categories: Array<{ id: string; name: string; slug: string }> = [];
  let seedTopics: Array<{
    id: string;
    keyword: string;
    country: string;
    language: string;
    lastDiscoveryAt: Date | null;
    category: { name: string };
  }> = [];
  let keywords: Array<{
    id: string;
    keyword: string;
    searchVolume: number | null;
    trendScore: number | null;
    competitionScore: number | null;
    opportunityScore: number | null;
    status: string;
  }> = [];
  let questions: QuestionRow[] = [];
  let campaigns: Array<{
    id: string;
    name: string;
    landingUrl: string;
    status: string;
    product: { name: string };
    creatives: Array<{ title: string; buttonText: string }>;
    targets: Array<{ keyword: string | null; intent: string | null }>;
    _count: { impressions: number; clicks: number };
  }> = [];
  let recommendations: Array<{
    id: string;
    title: string;
    type: string;
    score: number;
    question: { title: string; slug: string } | null;
  }> = [];

  try {
    assertDatabaseConfigured();

    const [
      categoryRows,
      seedRows,
      keywordRows,
      questionRows,
      review,
      published,
      campaignRows,
      recommendationRows,
      analyticsRows,
      activeCampaigns,
    ] = await Promise.all([
      db.category.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      db.seedTopic.findMany({
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.keyword.findMany({
        orderBy: [{ opportunityScore: "desc" }, { updatedAt: "desc" }],
        take: 50,
      }),
      db.question.findMany({
        include: {
          analytics: true,
          answers: {
            where: { isActive: true },
            select: { id: true },
            orderBy: { version: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
      db.question.count({ where: { status: "REVIEW" } }),
      db.question.count({ where: { status: "PUBLISHED" } }),
      db.campaign.findMany({
        include: {
          product: { select: { name: true } },
          creatives: { select: { title: true, buttonText: true } },
          targets: { select: { keyword: true, intent: true } },
          _count: { select: { impressions: true, clicks: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
      db.growthRecommendation.findMany({
        where: { status: "OPEN" },
        include: { question: { select: { title: true, slug: true } } },
        orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
        take: 8,
      }),
      db.pageAnalytics.findMany(),
      db.campaign.count({ where: { status: "ACTIVE" } }),
    ]);

    categories = categoryRows;
    seedTopics = seedRows;
    keywords = keywordRows;
    questions = questionRows;
    campaigns = campaignRows;
    recommendations = recommendationRows;
    counts = {
      seedTopics: seedRows.length,
      keywords: keywordRows.length,
      review,
      published,
      pageViews: analyticsRows.reduce((sum, row) => sum + row.pageViews, 0),
      impressions: analyticsRows.reduce((sum, row) => sum + row.adImpressions, 0),
      clicks: analyticsRows.reduce((sum, row) => sum + row.adClicks, 0),
      campaigns: activeCampaigns,
    };
  } catch (error) {
    errorMessage = formatDatabaseError(error);
  }

  return (
    <div className="admin-shell">
      <aside>
        <b>CONTROL ROOM</b>
        {[
          ["#dashboard", "Dashboard"],
          ["#services", "내 웹서비스"],
          ["#seed-topics-create", "SeedTopic 생성"],
          ["#seed-topics", "Seed Topics"],
          ["#keywords", "Keywords"],
          ["#review-queue", "Review Queue"],
          ["#cta", "CTA"],
          ["#growth", "Growth"],
          ["#providers", "Providers"],
        ].map(([href, label]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </aside>
      <main className="main">
        <div id="dashboard" className="eyebrow">Operational growth dashboard</div>
        <h2>검색 성장 관제실</h2>

        {registered ? (
          <section className="panel">
            <p><b>광고 CTA가 등록되었습니다.</b></p>
            <p className="muted">아래 “등록된 웹서비스 CTA” 목록에서 방금 저장한 서비스와 버튼 문구를 확인하세요.</p>
          </section>
        ) : null}

        {errorMessage ? (
          <section className="panel">
            <h3>DB 연결 실패</h3>
            <p className="muted">{errorMessage}</p>
          </section>
        ) : null}

        <div className="kpis">
          <div className="card"><span className="stat">{counts.pageViews}</span><br /><span className="muted">Page views</span></div>
          <div className="card"><span className="stat">{counts.impressions}</span><br /><span className="muted">CTA impressions</span></div>
          <div className="card"><span className="stat">{counts.clicks}</span><br /><span className="muted">CTA clicks</span></div>
          <div className="card"><span className="stat">{counts.campaigns}</span><br /><span className="muted">Active services</span></div>
        </div>

        {!errorMessage ? (
          <section id="services" className="panel">
            <h3>내 웹서비스 광고 CTA 등록</h3>
            <p className="muted">
              내 서비스 주소와 타깃 키워드, 버튼 문구를 저장합니다. 공개 답변의 문맥과 맞을 때만 관련 CTA 광고가 노출됩니다.
            </p>
            <form action={registerWebService} className="campaign-form">
              <label>서비스명<input name="serviceName" defaultValue="SalonNote" required /></label>
              <label>랜딩 URL<input name="landingUrl" defaultValue="https://app.salonnote.uk" required /></label>
              <label>타깃 키워드<input name="targetKeywords" defaultValue="미용실, 고객관리, 예약, 시술, 매출, 정산, 포스, 살롱노트, SalonNote" required /></label>
              <label>검색 의도<input name="intent" defaultValue="informational" required /></label>
              <label>카테고리<select name="categoryId"><option value="">전체 카테고리</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label>국가<input name="country" defaultValue="KR" minLength={2} maxLength={2} /></label>
              <label>언어<input name="language" defaultValue="ko" minLength={2} maxLength={5} /></label>
              <label>CTA 제목<input name="title" defaultValue="SalonNote" required /></label>
              <label className="wide">설명<input name="description" defaultValue="미용실 고객관리, 예약, 시술차트, 매출·정산까지 한 번에 관리하는 운영 서비스입니다." required /></label>
              <label>버튼 문구<input name="buttonText" defaultValue="SalonNote 바로가기" required /></label>
              <button type="submit">광고 CTA 등록</button>
            </form>
          </section>
        ) : null}

        {!errorMessage ? (
          <section id="seed-topics-create" className="panel">
            <h3>SeedTopic 생성</h3>
            <form action={createSeedTopic} className="form-grid">
              <label>Category<select name="categoryId" required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} / {category.slug}</option>)}</select></label>
              <label>Keyword<input name="keyword" minLength={2} maxLength={160} required /></label>
              <label>Country<input name="country" defaultValue="KR" minLength={2} maxLength={2} /></label>
              <label>Language<input name="language" defaultValue="ko" minLength={2} maxLength={5} /></label>
              <button type="submit">Create</button>
            </form>
          </section>
        ) : null}

        <section id="seed-topics" className="panel">
          <h3>Seed topics</h3>
          <table className="table">
            <thead><tr><th>Keyword</th><th>Category</th><th>Locale</th><th>Last discovery</th><th>Action</th></tr></thead>
            <tbody>{seedTopics.map((topic) => <tr key={topic.id}><td>{topic.keyword}</td><td>{topic.category.name}</td><td>{topic.country}/{topic.language}</td><td>{topic.lastDiscoveryAt?.toISOString() ?? "NEVER"}</td><td><form action={runDiscovery}><input type="hidden" name="seedTopicId" value={topic.id} /><button className="mini-button" type="submit">Discover</button></form></td></tr>)}</tbody>
          </table>
        </section>

        <section id="keywords" className="panel">
          <h3>키워드 기회</h3>
          <p className="muted">키워드는 질문 후보를 발굴하는 입력값입니다. 여기서 바로 답변을 생성하지 않습니다.</p>
          <table className="table">
            <thead><tr><th>Keyword</th><th>Volume</th><th>Trend</th><th>Competition</th><th>SEO</th><th>Status</th><th>다음 단계</th></tr></thead>
            <tbody>{keywords.map((keyword) => <tr key={keyword.id}><td>{keyword.keyword}</td><td>{metricLabel(keyword.searchVolume)}</td><td>{metricLabel(keyword.trendScore)}</td><td>{metricLabel(keyword.competitionScore)}</td><td>{metricLabel(keyword.opportunityScore, "계산 대기")}</td><td><span className="pill">{keyword.status}</span></td><td><span className="muted">질문 후보 확인</span></td></tr>)}</tbody>
          </table>
        </section>

        <section id="review-queue" className="panel">
          <h3>질문·답변 검수</h3>
          <p className="muted">NEW 질문은 “답변 만들 질문으로 선택”을 누른 뒤, 표시된 questionId로 answer-generation Workflow를 실행합니다.</p>
          <div className="review-card-list">{questions.map((question) => {
              const metric = totals(question);
              return <article className="review-card" key={question.id}>
                <div>
                  <div className="review-card-title">{question.status === "PUBLISHED" ? <Link href={`/q/${question.slug}`}>{question.title}</Link> : question.title}</div>
                  <div className="review-card-meta">
                    <span className="pill">{question.status}</span>
                    <span>품질 {question.qualityScore ?? "-"}</span>
                    <span>조회 {metric.pageViews}</span>
                    <span>CTA {metric.adClicks}/{metric.adImpressions}</span>
                    <span>CTR {metric.ctr}</span>
                  </div>
                  <code className="question-id">questionId: {question.id}</code>
                  {question.answers.length > 0 ? <Link className="admin-document-link" href={`/admin/questions/${question.id}`}>생성된 답변 문서 보기</Link> : null}
                </div>
                <div className="inline-actions">
                  {question.status === "NEW" ? <>
                    <form action={updateQuestionStatus}><input type="hidden" name="questionId" value={question.id} /><input type="hidden" name="status" value="SELECTED" /><button className="mini-button" type="submit">답변 만들 질문으로 선택</button></form>
                    <form action={updateQuestionStatus}><input type="hidden" name="questionId" value={question.id} /><input type="hidden" name="status" value="REJECTED" /><button className="mini-button secondary" type="submit">제외</button></form>
                  </> : null}
                  {question.status === "DRAFT" || question.status === "REVIEW" ? <>
                    <Link className="mini-button" href={`/admin/questions/${question.id}`}>문서 검토</Link>
                    <form action={updateQuestionStatus}><input type="hidden" name="questionId" value={question.id} /><input type="hidden" name="status" value="APPROVED" /><button className="mini-button" type="submit">승인</button></form>
                    <form action={updateQuestionStatus}><input type="hidden" name="questionId" value={question.id} /><input type="hidden" name="status" value="REJECTED" /><button className="mini-button secondary" type="submit">반려</button></form>
                  </> : null}
                  {question.status === "APPROVED" ? <form action={runPublish}><input type="hidden" name="questionId" value={question.id} /><button className="mini-button" type="submit">공개 게시</button></form> : null}
                  {question.status === "SELECTED" ? <span className="muted">선택됨 · 위 questionId로 answer-generation 실행</span> : null}
                  {["RESEARCHING", "GENERATING"].includes(question.status) ? <span className="muted">자동화 실행 중</span> : null}
                  {["PUBLISHED", "REJECTED", "ARCHIVED"].includes(question.status) ? <span className="muted">완료/제외</span> : null}
                </div>
              </article>;
            })}</div>
        </section>

        <section id="cta" className="panel">
          <h3>등록된 웹서비스 CTA</h3>
          <table className="table">
            <thead><tr><th>Service</th><th>Status</th><th>Targets</th><th>CTA</th><th>Landing</th><th>Impressions</th><th>Clicks</th></tr></thead>
            <tbody>{campaigns.map((campaign) => <tr key={campaign.id}><td>{campaign.product.name}</td><td><span className="pill">{campaign.status}</span></td><td>{campaign.targets.map((target) => target.keyword ?? target.intent ?? "ANY").join(", ")}</td><td>{campaign.creatives.map((creative) => `${creative.title} / ${creative.buttonText}`).join(", ")}</td><td><a href={campaign.landingUrl} target="_blank" rel="noreferrer">열기</a></td><td>{campaign._count.impressions}</td><td>{campaign._count.clicks}</td></tr>)}</tbody>
          </table>
        </section>

        <section id="growth" className="panel">
          <h3>Growth Recommendations</h3>
          <form action={runGrowthRefresh}><button className="mini-button" type="submit">Refresh recommendations</button></form>
          <table className="table">
            <thead><tr><th>Recommendation</th><th>Type</th><th>Score</th><th>Question</th></tr></thead>
            <tbody>{recommendations.map((rec) => <tr key={rec.id}><td>{rec.title}</td><td><span className="pill">{rec.type}</span></td><td>{rec.score}</td><td>{rec.question ? <Link href={`/q/${rec.question.slug}`}>{rec.question.title}</Link> : "-"}</td></tr>)}</tbody>
          </table>
        </section>

        <section id="providers" className="section">
          <h3>Provider 상태</h3>
          <div className="grid">{providerStates().map((provider) => <div className="card" key={provider.name}><b>{provider.name}</b><p className="muted">{provider.connected ? "CONNECTED" : "NOT CONNECTED"}</p></div>)}</div>
        </section>
      </main>
    </div>
  );
}
