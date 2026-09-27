import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { HeroSearch } from "@/components/home/hero-search";
import styles from "./home.module.css";
import { CategoryExplorer, type ExploreCategory } from "@/components/home/category-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const guides = [
  { topic: "DEVELOPMENT / 배포 · DB · API", title: "아이디어를 웹으로. 배포의 모든 연결.", description: "도메인부터 Supabase, Render, API 연결까지. 실제 운영 순서로 정리한 바이브코딩 웹 배포 가이드.", href: "/q/vibe-coding-web-domain-api-deploy-guide", short: "웹 배포 가이드" },
  { topic: "TRAVEL / 태국 · TDAC", title: "태국 입국 준비, 한 화면씩 차근차근.", description: "성별, 항공편명, 숙소 주소까지. 실제 화면을 기준으로 정리한 태국 디지털 입국카드 작성법.", href: "/q/how-to-fill-thailand-arrival-card", short: "태국 디지털 입국카드" },
];

const featuredGuides = [
  { ...guides[0], description: "도메인, 호스팅, 배포, API. 처음부터 운영까지 한곳에서.", image: "/images/guide-laptop-v1.png", symbol: "✦", label: "IDEA & CONNECTION" },
  { ...guides[1], description: "입국카드 작성과 숙소 입력. 실제 화면으로 차근차근.", image: "/images/guide-thailand-v1.png", symbol: "✈", label: "TRAVEL GUIDE" },
  { title: "미국 주식, 궁금한 정보 찾기.", description: "미국 주식 관련 공개 글을 검색해 보세요.", href: "/search?q=미국 주식", image: "/images/guide-stocks-v1.png", symbol: "▥", label: "STOCKS & INVESTING" },
  { title: "디아블로2, 아이템 가이드.", description: "소켓 큐빙과 아이템 업그레이드. 필요한 정보를 한눈에.", href: "/search?q=디아블로2", image: "/images/guide-game-v1.png", symbol: "Ⅱ", label: "DIABLO II GUIDE" },
  { title: "내 PC 관리, 필요한 도구부터.", description: "PC Care 서비스 소개와 이용 안내를 확인하세요.", href: "/tools/pc-care", image: "/images/guide-pc-v1.png", symbol: "PC", label: "PC & SOFTWARE" },
  { title: "사주와 운세, 나를 알아가는 시간.", description: "infofix사주 서비스와 프로그램 이용 안내.", href: "/tools/saju", image: "/images/guide-saju-v1.png", symbol: "☯", label: "SAJU & FORTUNE" },
];

export default async function Home() {
  let questions: Array<{ id: string; slug: string; title: string; qualityScore: number | null; publishedAt: Date | null; category: { name: string } | null }> = [];
  let unavailable = false;
  try {
    questions = await db.question.findMany({ where: { status: "PUBLISHED" }, include: { category: true }, orderBy: { publishedAt: "desc" }, take: 12 });
  } catch { unavailable = true; }
  let categories: ExploreCategory[] = [];
  let categoriesUnavailable = false;
  try {
    const rows = await db.category.findMany({
      where: { active: true, questions: { some: { status: "PUBLISHED" } } },
      select: { name: true, slug: true, _count: { select: { questions: { where: { status: "PUBLISHED" } } } }, questions: { where: { status: "PUBLISHED" }, select: { title: true, slug: true }, orderBy: { publishedAt: "desc" }, take: 1 } },
      orderBy: { name: "asc" },
    });
    categories = rows.map((category) => ({ name: category.name, slug: category.slug, count: category._count.questions, article: category.questions[0] }));
  } catch { categoriesUnavailable = true; }
  return (
    <main className={`editorial-home ${styles.home}`}>
      <div className="editorial-wrap">
        <section className={`editorial-hero ${styles.searchHero}`} aria-labelledby="hero-heading">
          <Image className="editorial-hero-art" src="/images/knowledge-study-v1.png" alt="" width={1536} height={1024} sizes="100vw" preload />
          <span className={styles.eyebrow}>INFOFIXHUB / KNOWLEDGE CENTER</span>
          <h1 id="hero-heading">무엇이<br /><em>궁금</em>하세요?</h1>
          <p className={styles.intro}>실용적인 지식을 한곳에 정리했습니다.<br />필요한 정보를 빠르고 정확하게 찾아보세요.</p>
          <div className="editorial-product-search"><HeroSearch suggestions={questions.slice(0, 5).map(({ title, slug }) => ({ title, slug }))} suggestionsUnavailable={unavailable} /></div>
          <div className="editorial-topics"><span className="editorial-label">추천 주제</span>{["태국 입국카드", "Windows", "Supabase", "여행", "PC"].map((topic) => <Link key={topic} href={`/search?q=${encodeURIComponent(topic)}`}>{topic}</Link>)}</div>
          <div className="editorial-start"><span className="editorial-label">START HERE / 추천 가이드</span><div>{guides.map((guide, index) => <Link href={guide.href} key={guide.href}><span className="editorial-number">0{index + 1}</span>{guide.short}</Link>)}</div></div>
        </section>

        <section className="editorial-section" aria-labelledby="guides-heading">
          <div className="editorial-section-head"><span className="editorial-label">SELECTED GUIDES / 01</span><p>직접 경험하고,<br />다시 꺼내 볼 수 있도록.</p></div>
          <h2 id="guides-heading" className="editorial-heading">실용적인 지식.<br /><span>제대로 정리한 가이드.</span></h2>
          <div className="editorial-guides">{featuredGuides.map((guide, index) => <Link href={guide.href} className="editorial-guide" key={guide.href}>
            <Image className={styles.guideImage} src={guide.image} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
            <div className="editorial-guide-top"><span className="editorial-number">0{index + 1}</span><span className={styles.guideSymbol} aria-hidden="true">{guide.symbol}</span></div>
            <span className="editorial-label">{guide.label}</span>
            <h3>{guide.title}</h3><p>{guide.description}</p><span className="editorial-text-link">바로가기</span>
          </Link>)}</div>
        </section>

        <section id="discover" className="editorial-section" aria-labelledby="answers-heading">
          <div className={styles.answersHeader}>
            <span className="editorial-label">Q &amp; A</span>
            <h2 id="answers-heading">질문은 구체적으로. 답변은 쓸모 있게.</h2>
            <p>실제 질문을 기반으로, 꼭 필요한 답변만 정리했습니다.</p>
            <span className={styles.sectionNumber} aria-hidden="true">02<small>REAL QUESTIONS<br />REAL ANSWERS</small></span>
          </div>
          <div className="editorial-list">{questions.map((question, index) => <Link href={`/q/${question.slug}`} className="editorial-row" key={question.id}>
            <span className="editorial-number" aria-hidden="true">{index === 0 ? "Q" : (question.category?.name ?? "질문").slice(0, 1)}</span>
            <div><span className="editorial-label">{question.category?.name ?? "인사이트"}</span><h3>{question.title}</h3></div>
            {question.publishedAt ? <time className="editorial-date" dateTime={question.publishedAt.toISOString()}>{new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(question.publishedAt)}</time> : <span />}
          </Link>)}</div>
          <Link href="/search" className={`editorial-text-link ${styles.allAnswers}`}>답변 전체 보기</Link>
          {!questions.length && <div className="editorial-empty"><p>{unavailable ? "최근 답변을 불러오지 못했습니다." : "새로운 답변을 준비하고 있습니다."}</p><span>{unavailable ? "잠시 후 다시 방문해 주세요. 위의 추천 가이드는 계속 이용할 수 있습니다." : "공개된 글이 생기면 이곳에 최신순으로 표시됩니다."}</span></div>}
        </section>

        <CategoryExplorer categories={categories} unavailable={categoriesUnavailable} />
        <section className="editorial-tools" aria-labelledby="tools-heading">
          <div><span className="editorial-label">BEYOND THE ANSWER / 03</span><h2 id="tools-heading">읽는 것에서<br />쓰는 것으로.</h2><p>InfoFixHub와 함께하는 도구와 서비스.</p></div>
          <div className="editorial-tool-list">
            <Link href="/tools/saju"><span><small>01 / PERSONAL</small>infofix사주</span></Link>
            <Link href="/category/salon-pos"><span><small>02 / BUSINESS</small>살롱노트 · 실용노트</span></Link>
            <Link href="/tools/pc-care"><span><small>03 / COMPUTER</small>PC Care</span></Link>
          </div>
        </section>
        <footer className="editorial-footer"><span className="editorial-label">INFOFIXHUB / LESS NOISE. MORE ANSWERS.</span><a className="editorial-text-link" href="#hero-heading">맨 위로</a></footer>
      </div>
    </main>
  );
}
