import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "내 계정",
  description: "InfoFixHub 사용자 계정 정보를 확인합니다.",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="wrap auth-page">
      <section className="auth-card">
        <div className="eyebrow">My account</div>
        <h1>내 계정</h1>
        <div className="account-summary">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={session.user.image} />
          ) : null}
          <div>
            <b>{session.user.name ?? "InfoFixHub 사용자"}</b>
            <p className="muted">{session.user.email}</p>
          </div>
        </div>
        <p className="muted">
          앞으로 저장한 글, 관심 주제, 사주 프로그램 결과 같은 사용자 기능을 이 계정에 연결할 수
          있습니다.
        </p>
      </section>
    </main>
  );
}
