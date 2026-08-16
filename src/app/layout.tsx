import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "PC AutoCare Answers",
    template: "%s | PC AutoCare Answers",
  },
  description:
    "검색 질문에 바로 답하고 관련 PC 관리 서비스 CTA를 연결하는 답변형 웹서비스입니다.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header>
          <div className="wrap nav">
            <Link className="brand" href="/">
              PC Auto<i>Care</i>
            </Link>
            <nav className="links">
              <Link href="/">홈</Link>
              <Link href="/category/guides">가이드</Link>
              <Link href="/admin">관리자</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
