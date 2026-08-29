import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
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
        <header>
          <div className="wrap nav">
            <Link className="brand" href="/">
              Info<i>FixHub</i>
            </Link>
            <nav className="links">
              <Link href="/">홈</Link>
              <Link href="/category/salon-pos">살롱노트</Link>
              <Link href="/admin">관리자</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
