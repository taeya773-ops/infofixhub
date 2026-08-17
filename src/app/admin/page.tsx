import Link from "next/link";
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
import {
  generateContentForKeyword,
  publishQuestion,
} from "@/services/content";
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
}

async function runDiscovery(formData: FormData) {
  "use server";
  await discoverKeywords(String(formData.get("seedTopicId") ?? ""));
  revalidatePath("/admin");
}

async function runGeneration(formData: FormData) {
  "use server";
  await generateContentForKeyword(String(formData.get("keywordId") ?? ""));
  revalidatePath("/admin");
}

async function runPublish(formData: FormData) {
  "use server";
  await publishQuestion(String(formData.get("questionId") ?? ""));
  revalidatePath("/admin");
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

export default async function Admin() {
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
        take: 12,
      }),
      db.question.findMany({
        include: { analytics: true },
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
          "Dashboard",
          "내 웹서비스",
          "Keywords",
          "Seed Topics",
          "Review Queue",
          "Analytics",
          "Growth",
          "Providers",
        ].map((item) => (
          <a key={item}>{item}</a>
        ))}
      </aside>
      <main className="main">
        <div className="eyebrow">Operational growth dashboard</div>
        <h2>검색 성장 관제실</h2>

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
          <section className="panel">
            <h3>내 웹서비스 등록</h3>
            <p className="muted">
              서비스명, 타깃 키워드, CTA 문구를 저장하면 공개 답변의 문맥과 자동 매칭되어 관련 CTA가 노출됩니다.
            </p>
            <form action={registerWebService} className="campaign-form">
              <label>서비스명<input name="serviceName" defaultValue="PC AutoCare" required /></label>
              <label>랜딩 URL<input name="landingUrl" defaultValue="https://example.com/pc-autocare" required /></label>
              <label>타깃 키워드<input name="targetKeywords" defaultValue="윈도우, 오류, 부팅, 느림, 설치" required /></label>
              <label>검색 의도<input name="intent" defaultValue="informational" required /></label>
              <label>카테고리<select name="categoryId"><option value="">전체 카테고리</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label>국가<input name="country" defaultValue="KR" minLength={2} maxLength={2} /></label>
              <label>언어<input name="language" defaultValue="ko" minLength={2} maxLength={5} /></label>
              <label>CTA 제목<input name="title" defaultValue="PC AutoCare" required /></label>
              <label className="wide">설명<input name="description" defaultValue="윈도우 오류, 부팅 문제, 느려짐을 빠르게 점검하는 PC 관리 서비스입니다." required /></label>
              <label>버튼 문구<input name="buttonText" defaultValue="PC 점검하기" required /></label>
              <button type="submit">웹서비스 등록</button>
            </form>
          </section>
        ) : null}

        {!errorMessage ? (
          <section className="panel">
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

        <section className="panel">
          <h3>Seed topics</h3>
          <table className="table">
            <thead><tr><th>Keyword</th><th>Category</th><th>Locale</th><th>Last discovery</th><th>Action</th></tr></thead>
            <tbody>{seedTopics.map((topic) => <tr key={topic.id}><td>{topic.keyword}</td><td>{topic.category.name}</td><td>{topic.country}/{topic.language}</td><td>{topic.lastDiscoveryAt?.toISOString() ?? "NEVER"}</td><td><form action={runDiscovery}><input type="hidden" name="seedTopicId" value={topic.id} /><button className="mini-button" type="submit">Discover</button></form></td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel">
          <h3>키워드 기회</h3>
          <table className="table">
            <thead><tr><th>Keyword</th><th>Volume</th><th>Trend</th><th>Competition</th><th>SEO</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{keywords.map((keyword) => <tr key={keyword.id}><td>{keyword.keyword}</td><td>{keyword.searchVolume ?? "UNKNOWN"}</td><td>{keyword.trendScore ?? "UNKNOWN"}</td><td>{keyword.competitionScore ?? "UNKNOWN"}</td><td>{keyword.opportunityScore ?? "-"}</td><td><span className="pill">{keyword.status}</span></td><td><form action={runGeneration}><input type="hidden" name="keywordId" value={keyword.id} /><button className="mini-button" type="submit">Generate</button></form></td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Content Performance</h3>
          <table className="table">
            <thead><tr><th>Title</th><th>Status</th><th>Quality</th><th>Views</th><th>CTA Impr.</th><th>CTA Clicks</th><th>CTR</th><th>Action</th></tr></thead>
            <tbody>{questions.map((question) => {
              const metric = totals(question);
              return <tr key={question.id}><td>{question.status === "PUBLISHED" ? <Link href={`/q/${question.slug}`}>{question.title}</Link> : question.title}</td><td><span className="pill">{question.status}</span></td><td>{question.qualityScore ?? "-"}</td><td>{metric.pageViews}</td><td>{metric.adImpressions}</td><td>{metric.adClicks}</td><td>{metric.ctr}</td><td>{question.status === "REVIEW" ? <form action={runPublish}><input type="hidden" name="questionId" value={question.id} /><button className="mini-button" type="submit">Publish</button></form> : <span className="muted">-</span>}</td></tr>;
            })}</tbody>
          </table>
        </section>

        <section className="panel">
          <h3>등록된 웹서비스 CTA</h3>
          <table className="table">
            <thead><tr><th>Service</th><th>Status</th><th>Targets</th><th>CTA</th><th>Landing</th><th>Impressions</th><th>Clicks</th></tr></thead>
            <tbody>{campaigns.map((campaign) => <tr key={campaign.id}><td>{campaign.product.name}</td><td><span className="pill">{campaign.status}</span></td><td>{campaign.targets.map((target) => target.keyword ?? target.intent ?? "ANY").join(", ")}</td><td>{campaign.creatives.map((creative) => `${creative.title} / ${creative.buttonText}`).join(", ")}</td><td><a href={campaign.landingUrl} target="_blank" rel="noreferrer">열기</a></td><td>{campaign._count.impressions}</td><td>{campaign._count.clicks}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Growth Recommendations</h3>
          <form action={runGrowthRefresh}><button className="mini-button" type="submit">Refresh recommendations</button></form>
          <table className="table">
            <thead><tr><th>Recommendation</th><th>Type</th><th>Score</th><th>Question</th></tr></thead>
            <tbody>{recommendations.map((rec) => <tr key={rec.id}><td>{rec.title}</td><td><span className="pill">{rec.type}</span></td><td>{rec.score}</td><td>{rec.question ? <Link href={`/q/${rec.question.slug}`}>{rec.question.title}</Link> : "-"}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="section">
          <h3>Provider 상태</h3>
          <div className="grid">{providerStates().map((provider) => <div className="card" key={provider.name}><b>{provider.name}</b><p className="muted">{provider.connected ? "CONNECTED" : "NOT CONNECTED"}</p></div>)}</div>
        </section>
      </main>
    </div>
  );
}
