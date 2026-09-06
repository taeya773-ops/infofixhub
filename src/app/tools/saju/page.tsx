import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "사주 분석 · SAJUONE",
  description: "원국부터 대운별 종합보고서까지. SAJUONE의 웹 사주 서비스를 준비하고 있습니다.",
  alternates: { canonical: "/tools/saju" },
  robots: { index: false, follow: true },
};

const features = [
  ["01", "나의 사주 원국", "생년월일과 출생시간을 바탕으로 원국·오행·십성·12운성을 살펴봅니다."],
  ["02", "대운별 종합보고서", "실제 대운 시작 나이와 간지를 대입해 각 시기의 일·관계·생활 흐름을 읽습니다."],
  ["03", "한 해와 열두 달", "원국·대운·연운·월운을 함께 대조하고, 해석의 계산 근거를 확인합니다."],
  ["04", "용신과 균형", "용신·희신·기신을 단순한 길흉 표시로 끝내지 않고, 작용 조건을 함께 살펴봅니다."],
];

export default function SajuPage() {
  return (
    <main className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <Link href="/" className="muted">홈 / 생활 도구</Link>
      <section style={{ padding: "40px 0 32px", maxWidth: 760 }}>
        <div className="eyebrow">SAJUONE · 사주를 읽는 또 하나의 방법</div>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 52px)", lineHeight: 1.2, margin: "16px 0" }}>나의 원국에서 시작하는<br />평생의 흐름 이야기</h1>
        <p className="lead">우리가 만든 사주 앱을 이제 InfoFixHub에서도 만날 수 있도록 준비하고 있습니다. 원국과 시기별 운의 관계를 근거와 함께 보여드립니다.</p>
        <a className="pill" href="#service-status" style={{ display: "inline-block", marginTop: 12, padding: "12px 18px" }}>서비스 준비 현황 보기 ↓</a>
      </section>
      <section aria-labelledby="features-heading">
        <h2 id="features-heading">이곳에서 만나게 될 사주 분석</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 18 }}>
          {features.map(([number, title, body]) => (
            <article className="card" key={number}>
              <span className="eyebrow">{number} · 제공 예정</span>
              <h3>{title}</h3><p className="muted">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="service-status" className="panel" style={{ marginTop: 28 }} aria-labelledby="status-heading">
        <span className="pill">웹 계산 연결 준비 중</span>
        <h2 id="status-heading">사주 서비스 공간이 마련되었습니다</h2>
        <p>현재는 소개 페이지입니다. 생년월일 입력, 사주 계산, 결과 저장 기능은 아직 연결되지 않았습니다. 기존 Android 앱의 계산 엔진을 웹에 연결한 뒤 이 자리에서 분석을 시작할 수 있습니다.</p>
        <p className="muted">지금 이 페이지에서는 생년월일이나 출생시간을 입력받지 않습니다.</p>
      </section>
      <section className="card" style={{ marginTop: 20 }} aria-labelledby="app-heading">
        <h2 id="app-heading">안드로이드에서도 SAJUONE</h2>
        <p>SAJUONE 3.3.3 공개 테스트판 · Android 7.0 이상 · 약 12MB</p>
        <a className="pill" href="/downloads/SAJUONE-3.3.3-preview-20260907.apk" download style={{ display: "inline-block", padding: "14px 20px" }}>안드로이드 APK 다운로드</a>
        <p className="muted">테스트용 서명 버전입니다. 정식 배포판과 서명이 달라 추후 업데이트 시 별도 설치나 자료 이전이 필요할 수 있습니다. 설치 전 저장된 사주 정보를 별도로 보관하세요.</p>
        <p className="muted">다운로드한 APK를 Android 휴대전화에서 여세요. 기기에서 요청하면 해당 브라우저의 ‘이 출처의 앱 설치’를 허용해야 합니다. 설치 후에는 해당 권한을 다시 꺼두세요. AI 풀이 연결은 아직 점검 중입니다.</p>
      </section>
      <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>사주 풀이는 전통 명리의 참고 해석입니다. 미래의 사건이나 성과를 보장하지 않으며, 중요한 결정은 실제 상황과 확인 가능한 정보를 바탕으로 내려주세요.</p>
    </main>
  );
}
