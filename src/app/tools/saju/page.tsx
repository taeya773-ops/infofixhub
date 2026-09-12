import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "infofix사주",
  description: "infofix사주 Windows 오프라인 설치판과 Android 앱 다운로드. 원국부터 대운·연운·월별 풀이까지 살펴보세요.",
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
    <main className="wrap saju-page" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <Link href="/" className="muted">홈 / 생활 도구</Link>
      <section style={{ padding: "40px 0 32px", maxWidth: 760 }}>
        <div className="eyebrow">infofix사주 · 사주를 읽는 또 하나의 방법</div>
        <h1 style={{ fontSize: "clamp(30px, 6vw, 52px)", lineHeight: 1.2, margin: "16px 0" }}>나의 원국에서 시작하는<br />평생의 흐름 이야기</h1>
        <p className="lead">infofix사주를 내 기기에 설치해서 사용하세요. Windows판은 서버에 생년월일을 보내지 않고 컴퓨터 안에서 원국과 시기별 운을 계산합니다.</p>
        <a className="pill" href="#windows-download" style={{ display: "inline-block", marginTop: 12, padding: "12px 18px" }}>Windows 설치판 다운로드 보기 ↓</a>
      </section>
      <section aria-labelledby="features-heading">
        <h2 id="features-heading">이곳에서 만나게 될 사주 분석</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 18 }}>
          {features.map(([number, title, body]) => (
            <article className="card" key={number}>
              <span className="eyebrow">{number} · 앱 분석 기능</span>
              <h3>{title}</h3><p className="muted">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="service-status" className="panel" style={{ marginTop: 28 }} aria-labelledby="status-heading">
        <span className="pill">설치형 프로그램 제공</span>
        <h2 id="status-heading">계산은 내 컴퓨터에서, 다운로드는 이곳에서</h2>
        <p>이 사이트는 프로그램 소개와 다운로드를 제공합니다. 웹 브라우저 안에서 계산하는 서비스는 아닙니다. Windows 프로그램은 기존 Android 앱의 계산 코드를 재사용하며, 설치 후 인터넷 없이 분석할 수 있습니다. 외부 AI 풀이 연결은 포함하지 않습니다.</p>
        <p className="muted">지금 이 페이지에서는 생년월일이나 출생시간을 입력받지 않습니다.</p>
      </section>
      <section id="windows-download" className="card" style={{ marginTop: 20 }} aria-labelledby="windows-heading">
        <h2 id="windows-heading">infofix사주 Windows 프로그램</h2>
        <p>1.0.0 공개 테스트판 · Windows 10/11 64비트 · 약 30MB</p>
        <a className="pill" href="/downloads/InfofixSaju-1.0.0.exe" download style={{ display: "inline-block", padding: "14px 20px" }}>Windows 설치 파일 다운로드 (.exe)</a>
        <p>PC에서 파일을 실행해 설치한 뒤 시작 메뉴의 InfofixSaju를 여세요. Java 실행 환경이 포함되어 별도 설치가 필요 없습니다. 휴대전화에서는 이 Windows 파일을 실행할 수 없습니다.</p>
        <p>원국·용신 검토·전체 대운 보고서·연운·12개월 풀이를 확인하고, 입력 정보를 저장하거나 보고서를 텍스트로 내보낼 수 있습니다.</p>
        <p className="muted">코드서명이 없는 테스트판으로 Windows에서 게시자 확인 경고가 표시될 수 있습니다. 보안 프로그램을 끄지 말고, 출처를 확인한 경우에만 설치하세요.</p>
        <p className="muted">‘입력 저장’을 누른 정보는 PC의 %LOCALAPPDATA%\InfofixSaju\people.json에 암호화되지 않은 파일로 보관됩니다. 공용 PC에서는 저장을 피하세요. 프로그램을 제거해도 저장 정보는 남습니다.</p>
        <p className="muted" style={{ fontSize: 12, overflowWrap: "anywhere" }}>설치 파일 SHA-256: CD2357B09B584E2D0BE9627FD743F06439BE1350B9041854819A87F895A8AA05</p>
      </section>
      <section className="card" style={{ marginTop: 20 }} aria-labelledby="app-heading">
        <h2 id="app-heading">infofix사주 안드로이드 앱</h2>
        <p>3.3.3 공개 테스트판 · Android 7.0 이상 · 약 12MB</p>
        <p className="muted">현재 배포된 APK의 설치 이름은 SAJUONE입니다.</p>
        <a className="pill" href="/downloads/SAJUONE-3.3.3-preview-20260907.apk" download style={{ display: "inline-block", padding: "14px 20px" }}>안드로이드 APK 다운로드</a>
        <p className="muted">테스트용 서명 버전입니다. 정식 배포판과 서명이 달라 추후 업데이트 시 별도 설치나 자료 이전이 필요할 수 있습니다. 설치 전 저장된 사주 정보를 별도로 보관하세요.</p>
        <p className="muted">다운로드한 APK를 Android 휴대전화에서 여세요. 기기에서 요청하면 해당 브라우저의 ‘이 출처의 앱 설치’를 허용해야 합니다. 설치 후에는 해당 권한을 다시 꺼두세요. AI 풀이 연결은 아직 점검 중입니다.</p>
      </section>
      <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>사주 풀이는 전통 명리의 참고 해석입니다. 미래의 사건이나 성과를 보장하지 않으며, 중요한 결정은 실제 상황과 확인 가능한 정보를 바탕으로 내려주세요.</p>
    </main>
  );
}
