import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import { AuthNav } from "@/components/auth-nav";
import "./globals.css";

const siteName = "InfoFixHub";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description:
    "실제 운영 경험과 화면 캡처를 바탕으로 웹 배포, DB/API 연결, 여행·생활 문제 해결 가이드를 제공하는 정보 허브입니다.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">본문으로 이동</a>
        <header className="site-header">
          <div className="wrap nav">
            <Link className="brand" href="/">
              Info<i>Fix</i>Hub<span className="brand-mark" aria-hidden="true">✦</span>
            </Link>
            <nav className="links">
              <Link href="/">홈</Link>
              <Link href="/search">SEARCH</Link>
              <Link href="/tools/saju">infofix사주</Link>
              <Link href="/category/salon-pos">살롱노트</Link>
              <Link href="/tools/pc-care">PC Care</Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        <div id="main-content" tabIndex={-1}>{children}</div>
      </body>
    </html>
  );
}
