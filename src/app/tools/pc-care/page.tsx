import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PC Care · PC 진단 서비스",
  description: "PC Care 웹서비스와 Windows용 PC Care Local을 소개합니다. 서비스 주소와 현재 이용 안내를 확인하세요.",
  alternates: { canonical: "/tools/pc-care" },
  robots: { index: false, follow: true },
};

export default function PcCarePage() {
  return (
    <main className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <Link href="/" className="muted">홈 / PC Care</Link>
      <section style={{ padding: "40px 0 32px", maxWidth: 760 }}>
        <div className="eyebrow">PC CARE · PC 상태를 이해하는 첫걸음</div>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 52px)", lineHeight: 1.2, margin: "16px 0" }}>내 컴퓨터를 위한<br />PC 진단 서비스</h1>
        <p className="lead">PC Care는 컴퓨터의 상태를 확인하고 점검 결과를 살펴보기 위한 프로젝트입니다. 이곳에서 웹서비스 주소와 Windows용 PC Care Local의 개발 내용을 안내합니다.</p>
      </section>
      <section className="panel" aria-labelledby="web-heading">
        <span className="pill">웹서비스 연결 점검 중</span>
        <h2 id="web-heading">PC Care 웹서비스</h2>
        <p>서비스 주소: <strong>pcautoscare.uk</strong></p>
        <p>2026년 9월 14일 확인 시 서버의 SSL 연결 오류(525)가 표시되었습니다. 현재 정상 이용 여부를 확인하지 못했으며, 아래 링크에서도 오류 화면이 나타날 수 있습니다.</p>
        <a className="pill" href="https://pcautoscare.uk" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "12px 18px" }}>서비스 주소 열기 ↗ (새 창)</a>
        <p className="muted">이 페이지는 서비스 소개와 연결 안내입니다. 브라우저에서 PC를 검사하거나 파일을 변경하지 않습니다.</p>
      </section>
      <section className="card" style={{ marginTop: 24 }} aria-labelledby="local-heading">
        <h2 id="local-heading">Windows용 PC Care Local도 개발하고 있습니다</h2>
        <p>웹서비스와 별도로, 사용자 PC에서 실행하는 설치형 프로그램을 개발하고 있습니다. 공유된 개발 기록에는 시스템·디스크 상태 점검, 규칙 기반 분석, 점검 결과와 권장 사항 표시가 포함되어 있습니다.</p>
        <p className="muted">실제 AI 분석과 Windows 자동 수리는 해당 기록에서 미연결 상태로 안내되었습니다. 웹서비스에서 같은 기능을 이용할 수 있다는 의미는 아니며, 여기서는 아직 설치 파일을 배포하지 않습니다.</p>
      </section>
      <p className="muted" style={{ marginTop: 24 }}>점검 결과는 참고 정보입니다. 중요한 파일을 변경하거나 복구 작업을 하기 전에는 먼저 백업하세요.</p>
    </main>
  );
}
