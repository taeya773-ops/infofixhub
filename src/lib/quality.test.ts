import { describe, expect, it } from "vitest";
import { evaluateQuality } from "./quality";
import type { GeneratedContent } from "./validation";

const detailedContent: GeneratedContent = {
  searchIntent: "HOW_TO",
  title: "윈도우 업데이트 후 인터넷 안됨 해결방법",
  summary:
    "업데이트 직후 인터넷이 끊겼다면 공유기보다 네트워크 어댑터, 드라이버, DNS 설정을 순서대로 확인해야 합니다.",
  directAnswer:
    "먼저 다른 기기의 인터넷 연결과 PC의 Wi-Fi/랜 아이콘 상태를 확인하세요. 그다음 장치 관리자에서 네트워크 어댑터 오류를 보고, DNS/Winsock 초기화를 진행합니다.",
  answer: "구체적인 원인 설명과 실행 방법입니다. ".repeat(140),
  causes: [
    {
      title: "드라이버 충돌",
      explanation: "업데이트 후 네트워크 어댑터 드라이버가 정상 로드되지 않을 수 있습니다.",
      likelihood: "높음",
    },
  ],
  quickChecks: [{ title: "공유기 확인", instruction: "휴대폰 Wi-Fi가 되는지 확인합니다." }],
  steps: [
    {
      title: "네트워크 상태 확인",
      description: "아이콘과 오류 메시지를 확인합니다.",
      instructions: ["설정을 엽니다.", "네트워크 상태를 확인합니다."],
      expectedResult: "연결 상태가 표시됩니다.",
      ifFailed: "어댑터 상태를 확인합니다.",
    },
    {
      title: "장치 관리자 확인",
      description: "네트워크 어댑터 오류를 확인합니다.",
      instructions: ["장치 관리자를 엽니다."],
      expectedResult: "경고 아이콘이 없습니다.",
      ifFailed: "드라이버를 다시 설치합니다.",
    },
    {
      title: "DNS 초기화",
      description: "DNS 캐시를 정리합니다.",
      instructions: ["명령 프롬프트를 관리자 권한으로 실행합니다."],
      expectedResult: "DNS 오류가 줄어듭니다.",
      ifFailed: "Winsock 초기화를 진행합니다.",
    },
    {
      title: "Winsock 초기화",
      description: "네트워크 스택을 초기화합니다.",
      instructions: ["netsh winsock reset을 실행합니다."],
      expectedResult: "재부팅 후 연결됩니다.",
      ifFailed: "업데이트 롤백을 검토합니다.",
    },
  ],
  advancedSteps: [],
  warnings: ["명령어 실행 전 관리자 권한을 확인하세요."],
  commonMistakes: ["공유기 문제로 단정하고 PC 어댑터 오류를 건너뜁니다."],
  relatedQuestions: ["윈도우 업데이트 후 와이파이 사라짐"],
  faq: [
    { question: "초기화하면 데이터가 지워지나요?", answer: "개인 파일은 지워지지 않습니다." },
    { question: "언제 롤백해야 하나요?", answer: "드라이버 재설치 후에도 실패하면 검토합니다." },
  ],
  topics: ["windows", "network"],
  adContext: { categories: ["pc"], keywords: ["인터넷 안됨"], intent: "repair" },
  seo: { title: "윈도우 업데이트 후 인터넷 안됨", description: "해결 순서 정리" },
  confidenceScore: 90,
};

describe("quality", () => {
  it("passes detailed actionable content", () => {
    expect(evaluateQuality(detailedContent).decision).toBe("PASS");
  });

  it("rejects thin content", () => {
    expect(
      evaluateQuality({
        ...detailedContent,
        answer: "인터넷 설정을 확인하세요.",
        steps: detailedContent.steps.slice(0, 1),
      }).issues,
    ).toContain("THIN_CONTENT: 답변 분량과 문제 해결 정보가 부족합니다.");
  });
});
