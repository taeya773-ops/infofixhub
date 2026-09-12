import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { env } from "@/lib/env";
import { SocialLoginButtons } from "@/components/social-login-buttons";

export const metadata: Metadata = {
  title: "로그인/회원가입",
  description: "Google, Kakao, Naver 계정으로 InfoFixHub에 로그인하거나 회원가입합니다.",
};

const socialProviders = [
  {
    id: "google",
    label: "Google로 계속하기",
    enabled: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  },
  {
    id: "kakao",
    label: "카카오톡으로 계속하기",
    enabled: Boolean(env.AUTH_KAKAO_ID && env.AUTH_KAKAO_SECRET),
  },
  {
    id: "naver",
    label: "네이버로 계속하기",
    enabled: Boolean(env.AUTH_NAVER_ID && env.AUTH_NAVER_SECRET),
  },
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <main className="wrap auth-page">
      <section className="auth-card">
        <div className="eyebrow">Member access</div>
        <h1>로그인 / 회원가입</h1>
        <p className="lead">
          일반 사용자는 Google, 카카오톡, 네이버 계정으로 바로 가입하고 로그인할 수 있습니다.
          처음 로그인하면 InfoFixHub 회원 계정이 자동으로 만들어집니다.
        </p>

        <SocialLoginButtons providers={socialProviders} />

        <p className="muted">
          관리자 화면은 기존처럼 별도 보호됩니다. 일반 사용자 로그인 정보와 관리자 Basic Auth는
          서로 분리되어 있습니다.
        </p>

        <Link className="button" href="/">
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
