import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { HeroSearch } from "@/components/home/hero-search";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const guides = [
  { topic: "DEVELOPMENT / 배포 · DB · API", title: "아이디어를 웹으로. 배포의 모든 연결.", description: "도메인부터 Supabase, Render, API 연결까지. 실제 운영 순서로 정리한 바이브코딩 웹 배포 가이드.", href: "/q/vibe-coding-web-domain-api-deploy-guide", short: "웹 배포 가이드" },
  { topic: "TRAVEL / 태국 · TDAC", title: "태국 입국 준비, 한 화면씩 차근차근.", description: "성별, 항공편명, 숙소 주소까지. 실제 화면을 기준으로 정리한 태국 디지털 입국카드 작성법.", href: "/q/how-to-fill-thailand-arrival-card", short: "태국 디지털 입국카드" },
];

export default async function Home() {
  let questions: Array<{ id: string; slug: string; title: string; qualityScore: number | null; publishedAt: Date | null; category: { name: string } | null }> = [];
  let unavailable = false;
  try {
    questions = await db.question.findMany({ where: { status: "PUBLISHED" }, include: { category: true }, orderBy: { publishedAt: "desc" }, take: 12 });
  } catch { unavailable = true; }
  return (
    <main className={`editorial-home ${styles.home}`}>
      <div className="editorial-wrap">
        <section className="editorial-hero" aria-labelledby="hero-heading">
          <div className="editorial-hero-top"><span className="editorial-label">INDEPENDENT KNOWLEDGE INDEX</span><span className="editorial-label">질문에서 시작하는 실용 지식</span></div>
          <div className="editorial-hero-grid">
            <h1 id="hero-heading">FIND<br />WHAT<br />MATTERS<span className="editorial-dot">.</span></h1>
            <div className="editorial-hero-note">
              <span className="editorial-star" aria-hidden="true">✳</span>
              <p>찾고.<br />이해하고.<br />해결하다.</p>
              <div className="editorial-note-caption">사람들이 실제로 찾는 질문과<br />검증된 답변을 연결합니다.</div>
              <a href="#discover" className="editorial-text-link">답변 둘러보기 <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <HeroSearch />
          <div className="editorial-start"><span className="editorial-label">START HERE / 추천 가이드</span><div>{guides.map((guide, index) => <Link href={guide.href} key={guide.href}><span className="editorial-number">0{index + 1}</span>{guide.short}<span aria-hidden="true">↗</span></Link>)}</div></div>
        </section>

        <section className="editorial-section" aria-labelledby="guides-heading">
          <div className="editorial-section-head"><span className="editorial-label">SELECTED GUIDES / 01</span><p>직접 경험하고,<br />다시 꺼내 볼 수 있도록.</p></div>
          <h2 id="guides-heading" className="editorial-heading">실용적인 지식.<br /><span>제대로 정리한 가이드.</span></h2>
          <div className="editorial-guides">{guides.map((guide, index) => <Link href={guide.href} className="editorial-guide" key={guide.href}>
            <div className="editorial-guide-top"><span className="editorial-number">0{index + 1}</span><span className="editorial-label">{guide.topic}</span></div>
            <h3>{guide.title}</h3><p>{guide.description}</p><span className="editorial-text-link">가이드 읽기 <span className="editorial-arrow" aria-hidden="true">↗</span></span>
          </Link>)}</div>
        </section>

        <section id="discover" className="editorial-section" aria-labelledby="answers-heading">
          <div className="editorial-section-head"><span className="editorial-label">LATEST ANSWERS / 02</span><span className="editorial-label">최신 게시순 · 공개된 답변</span></div>
          <div className="editorial-answer-heading"><h2 id="answers-heading" className="editorial-heading">질문은 구체적으로.<br /><span>답변은 쓸모 있게.</span></h2><Link href="/search" className="editorial-text-link">답변 검색하기 ↗</Link></div>
          <div className="editorial-list">{questions.map((question, index) => <Link href={`/q/${question.slug}`} className="editorial-row" key={question.id}>
            <span className="editorial-number">{String(index + 1).padStart(2, "0")}</span>
            <div><span className="editorial-label">{question.category?.name ?? "인사이트"}</span><h3>{question.title}</h3></div>
            {question.publishedAt ? <time className="editorial-date" dateTime={question.publishedAt.toISOString()}>{new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(question.publishedAt)}</time> : <span />}
            <span className="editorial-arrow" aria-hidden="true">↗</span>
          </Link>)}</div>
          {!questions.length && <div className="editorial-empty"><p>{unavailable ? "최근 답변을 불러오지 못했습니다." : "새로운 답변을 준비하고 있습니다."}</p><span>{unavailable ? "잠시 후 다시 방문해 주세요. 위의 추천 가이드는 계속 이용할 수 있습니다." : "공개된 글이 생기면 이곳에 최신순으로 표시됩니다."}</span></div>}
        </section>

        <section className="editorial-tools" aria-labelledby="tools-heading">
          <div><span className="editorial-label">BEYOND THE ANSWER / 03</span><h2 id="tools-heading">읽는 것에서<br />쓰는 것으로.</h2><p>InfoFixHub와 함께하는 도구와 서비스.</p></div>
          <div className="editorial-tool-list">
            <Link href="/tools/saju"><span><small>01 / PERSONAL</small>infofix사주</span><span aria-hidden="true">↗</span></Link>
            <Link href="/category/salon-pos"><span><small>02 / BUSINESS</small>살롱노트 · 실용노트</span><span aria-hidden="true">↗</span></Link>
            <Link href="/tools/pc-care"><span><small>03 / COMPUTER</small>PC Care</span><span aria-hidden="true">↗</span></Link>
          </div>
        </section>
        <footer className="editorial-footer"><span className="editorial-label">INFOFIXHUB / LESS NOISE. MORE ANSWERS.</span><a className="editorial-text-link" href="#hero-heading">맨 위로 ↑</a></footer>
      </div>
    </main>
  );
}
