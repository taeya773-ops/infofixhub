import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDatabaseSchema } from "../src/lib/database-url";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured. Copy .env.example to .env and set a PostgreSQL connection string before seeding.",
  );
}

const db = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString },
    { schema: getDatabaseSchema(connectionString) },
  ),
});

type SeedQuestion = {
  keyword: string;
  normalizedKeyword: string;
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  contentMarkdown: string;
  searchVolume: number;
  competitionScore: number;
  trendScore: number;
  opportunityScore: number;
  adOpportunityScore: number;
};

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

const pcQuestions: SeedQuestion[] = [
  {
    keyword: "윈도우",
    normalizedKeyword: "윈도우",
    slug: "windows-practical-guide",
    title: "윈도우 설정에서 먼저 확인해야 할 필수 항목",
    seoTitle: "윈도우 설정 점검 가이드",
    seoDescription:
      "윈도우 업데이트, 저장소, 보안, 시작 앱을 빠르게 점검하는 방법을 정리했습니다.",
    summary:
      "윈도우 기본 설정에서 업데이트, 저장소, 보안, 시작 앱을 먼저 확인하면 대부분의 초기 성능 문제와 오류를 빠르게 줄일 수 있습니다.",
    contentMarkdown:
      "윈도우가 느려지거나 오류가 자주 보인다면 복잡한 작업보다 기본 설정 점검부터 시작하는 것이 좋습니다.\n\n1. Windows Update에서 보류 중인 업데이트를 적용합니다.\n2. 저장소 설정에서 임시 파일과 여유 공간을 확인합니다.\n3. Windows 보안에서 보호 상태를 점검합니다.\n4. 작업 관리자에서 시작 앱을 줄입니다.\n\n이 네 가지를 먼저 확인하면 부팅 지연, 업데이트 실패, 저장 공간 부족 같은 흔한 문제를 빠르게 좁힐 수 있습니다.",
    searchVolume: 12000,
    competitionScore: 42,
    trendScore: 68,
    opportunityScore: 73,
    adOpportunityScore: 58,
  },
  {
    keyword: "윈도우 부팅 오류",
    normalizedKeyword: "윈도우 부팅 오류",
    slug: "windows-boot-error-checklist",
    title: "윈도우 부팅 오류가 날 때 먼저 확인할 것",
    seoTitle: "윈도우 부팅 오류 해결 체크리스트",
    seoDescription:
      "윈도우 부팅 오류가 발생했을 때 전원, 주변기기, 안전 모드, 복구 옵션 순서로 확인하는 방법입니다.",
    summary:
      "윈도우 부팅 오류는 전원 연결, 외부 장치, 최근 업데이트, 디스크 상태를 순서대로 확인하면 원인을 더 빠르게 찾을 수 있습니다.",
    contentMarkdown:
      "윈도우가 부팅되지 않을 때는 바로 포맷을 시도하기보다 원인을 단계별로 분리해야 합니다.\n\n1. 전원 케이블과 노트북 충전 상태를 확인합니다.\n2. USB, 외장하드, 프린터 같은 주변기기를 제거한 뒤 다시 켭니다.\n3. 자동 복구 화면이 뜨면 안전 모드 진입을 시도합니다.\n4. 최근 설치한 드라이버나 업데이트를 제거합니다.\n5. 중요한 파일이 있다면 복구 작업 전에 백업 가능 여부를 먼저 확인합니다.\n\n부팅 오류가 반복되면 디스크 손상이나 시스템 파일 문제일 수 있으므로 복구 옵션을 신중하게 사용하는 것이 좋습니다.",
    searchVolume: 5400,
    competitionScore: 55,
    trendScore: 62,
    opportunityScore: 78,
    adOpportunityScore: 76,
  },
  {
    keyword: "컴퓨터 느려짐",
    normalizedKeyword: "컴퓨터 느려짐",
    slug: "slow-computer-fix-checklist",
    title: "컴퓨터가 느려졌을 때 효과적인 점검 순서",
    seoTitle: "컴퓨터 느려짐 해결 순서",
    seoDescription:
      "컴퓨터가 느려졌을 때 시작 프로그램, 저장 공간, 악성코드, 업데이트를 점검하는 실용 가이드입니다.",
    summary:
      "컴퓨터가 갑자기 느려졌다면 시작 프로그램, 저장 공간, 백그라운드 작업, 악성코드 여부를 순서대로 확인하는 것이 효율적입니다.",
    contentMarkdown:
      "컴퓨터 속도 저하는 한 가지 원인보다 여러 작은 문제가 겹쳐 발생하는 경우가 많습니다.\n\n1. 작업 관리자에서 CPU와 메모리를 많이 쓰는 앱을 확인합니다.\n2. 시작 프로그램을 줄여 부팅 직후 부담을 낮춥니다.\n3. 저장 공간을 확보하고 임시 파일을 정리합니다.\n4. Windows 보안 또는 신뢰할 수 있는 백신으로 악성코드를 검사합니다.\n5. 그래픽 드라이버와 Windows 업데이트 상태를 확인합니다.\n\n정리 후에도 계속 느리다면 저장장치 상태나 메모리 부족을 의심해볼 수 있습니다.",
    searchVolume: 8900,
    competitionScore: 48,
    trendScore: 66,
    opportunityScore: 81,
    adOpportunityScore: 70,
  },
];

const salonQuestions: SeedQuestion[] = [
  {
    keyword: "미용실 무료 포스 프로그램",
    normalizedKeyword: "미용실 무료 포스 프로그램",
    slug: "free-salon-pos-program-guide",
    title: "미용실 무료 포스 프로그램을 고를 때 확인할 것",
    seoTitle: "미용실 무료 포스 프로그램 선택 가이드",
    seoDescription:
      "미용실에서 무료 포스 프로그램을 찾을 때 예약, 고객관리, 시술내역, 매출관리, 데이터 백업을 확인하는 방법입니다.",
    summary:
      "미용실 무료 포스 프로그램은 가격만 보지 말고 예약 관리, 고객 기록, 시술 이력, 매출 집계, 데이터 백업 가능 여부를 함께 확인해야 합니다.",
    contentMarkdown:
      "미용실에서 무료 포스 프로그램을 찾을 때는 단순 계산 기능보다 실제 매장 운영에 필요한 기능이 있는지 먼저 봐야 합니다.\n\n1. 예약 시간, 담당 디자이너, 방문 상태를 한 화면에서 볼 수 있는지 확인합니다.\n2. 고객별 시술 이력, 염색/펌 기록, 특이사항 메모가 가능한지 봅니다.\n3. 일별·월별 매출과 결제수단별 집계가 되는지 확인합니다.\n4. 데이터 백업이나 내보내기 기능이 있는지 확인합니다.\n5. 무료 버전의 제한이 예약 건수, 직원 수, 고객 수 중 어디에 걸리는지 확인합니다.\n\n무료 프로그램은 시작 비용을 줄이는 장점이 있지만, 매장이 성장하면 데이터 이전과 기능 제한이 문제가 될 수 있습니다. 처음부터 고객관리와 예약관리 흐름을 기준으로 고르는 것이 안전합니다.",
    searchVolume: 2600,
    competitionScore: 44,
    trendScore: 61,
    opportunityScore: 77,
    adOpportunityScore: 84,
  },
  {
    keyword: "미용실 고객관리 프로그램 무료",
    normalizedKeyword: "미용실 고객관리 프로그램 무료",
    slug: "free-salon-customer-management-program",
    title: "무료 미용실 고객관리 프로그램은 어떤 기능이 필요할까",
    seoTitle: "무료 미용실 고객관리 프로그램 필수 기능",
    seoDescription:
      "무료 미용실 고객관리 프로그램에서 고객 메모, 방문주기, 시술이력, 예약 알림, 재방문 관리 기능을 확인하는 방법입니다.",
    summary:
      "무료 미용실 고객관리 프로그램은 고객 이름 저장보다 방문주기, 시술 이력, 선호 스타일, 재방문 알림을 관리할 수 있는지가 중요합니다.",
    contentMarkdown:
      "미용실 고객관리는 단순 연락처 저장이 아니라 재방문을 만드는 운영 데이터 관리에 가깝습니다.\n\n무료 프로그램을 고를 때는 다음 기능을 확인하세요.\n\n1. 고객별 시술 이력과 사용 약제 메모\n2. 마지막 방문일과 평균 방문 주기 확인\n3. 담당자별 고객 관리\n4. 예약 변경과 노쇼 기록\n5. 생일, 재방문, 이벤트 안내를 위한 메모 또는 알림 기능\n\n무료 도구로 시작해도 괜찮지만, 엑셀처럼 사람이 계속 수동으로 정리해야 한다면 시간이 지나면서 누락이 많아집니다. 매장 규모가 작을수록 입력이 쉬운 프로그램을 고르는 것이 더 중요합니다.",
    searchVolume: 1900,
    competitionScore: 41,
    trendScore: 58,
    opportunityScore: 74,
    adOpportunityScore: 82,
  },
  {
    keyword: "미용실 예약 프로그램 무료",
    normalizedKeyword: "미용실 예약 프로그램 무료",
    slug: "free-salon-booking-program-checklist",
    title: "무료 미용실 예약 프로그램을 쓸 때 주의할 점",
    seoTitle: "무료 미용실 예약 프로그램 체크리스트",
    seoDescription:
      "무료 미용실 예약 프로그램을 사용할 때 예약표, 직원별 일정, 고객 알림, 노쇼 관리, 매출 연결을 확인하는 체크리스트입니다.",
    summary:
      "무료 미용실 예약 프로그램은 예약표가 보기 쉬운지, 직원별 일정 관리가 되는지, 노쇼와 변경 이력을 남길 수 있는지 확인해야 합니다.",
    contentMarkdown:
      "미용실 예약은 시간표가 조금만 꼬여도 대기 시간, 직원 배정, 고객 불만으로 이어질 수 있습니다.\n\n무료 예약 프로그램을 검토할 때는 다음을 확인하세요.\n\n1. 직원별 예약표를 하루 단위로 보기 쉬운가\n2. 예약 변경과 취소 이력이 남는가\n3. 고객별 이전 시술 내역을 예약 화면에서 볼 수 있는가\n4. 문자나 카카오 알림 연동이 가능한가\n5. 예약 데이터가 매출 통계와 연결되는가\n\n무료 프로그램이 당장 비용은 줄여주지만, 예약 변경이 많은 매장이라면 알림과 이력 관리 기능이 특히 중요합니다.",
    searchVolume: 2100,
    competitionScore: 46,
    trendScore: 63,
    opportunityScore: 76,
    adOpportunityScore: 85,
  },
  {
    keyword: "미용실 매출관리 프로그램",
    normalizedKeyword: "미용실 매출관리 프로그램",
    slug: "salon-sales-management-program-guide",
    title: "미용실 매출관리 프로그램에서 봐야 할 지표",
    seoTitle: "미용실 매출관리 프로그램 핵심 지표",
    seoDescription:
      "미용실 매출관리 프로그램에서 일매출, 객단가, 재방문율, 직원별 매출, 시술별 매출을 확인하는 방법입니다.",
    summary:
      "미용실 매출관리 프로그램은 총매출뿐 아니라 객단가, 재방문율, 직원별 매출, 시술별 매출을 함께 볼 수 있어야 운영 개선에 도움이 됩니다.",
    contentMarkdown:
      "미용실 매출관리는 단순히 하루 매출을 보는 것에서 끝나면 효과가 작습니다. 어떤 서비스가 잘 팔리는지, 어떤 고객이 다시 오는지, 어떤 시간대가 비는지 봐야 합니다.\n\n확인하면 좋은 지표는 다음과 같습니다.\n\n1. 일별·월별 총매출\n2. 고객 1명당 평균 결제금액인 객단가\n3. 신규 고객과 재방문 고객 비율\n4. 직원별 매출과 예약 점유율\n5. 컷, 펌, 염색, 클리닉 등 시술별 매출\n\n이 지표가 쌓이면 할인 이벤트보다 재방문 관리, 예약 배치, 직원별 강점 분석으로 매출을 개선할 수 있습니다.",
    searchVolume: 1700,
    competitionScore: 49,
    trendScore: 57,
    opportunityScore: 72,
    adOpportunityScore: 80,
  },
];

const travelQuestions: SeedQuestion[] = [
  {
    keyword: "태국 디지털 입국카드 작성방법",
    normalizedKeyword: "태국 디지털 입국카드 작성방법",
    slug: "thailand-digital-arrival-card-guide",
    title: "태국 디지털 입국카드 작성방법과 준비할 정보",
    seoTitle: "태국 디지털 입국카드 작성방법",
    seoDescription:
      "태국 디지털 입국카드 작성 시 여권 정보, 항공편, 숙소 주소, 연락처 등 미리 준비할 항목과 입력 순서를 정리했습니다.",
    summary:
      "태국 디지털 입국카드는 여권 정보, 입국 항공편, 태국 내 숙소 주소, 연락처를 미리 준비하면 어렵지 않게 작성할 수 있습니다.",
    contentMarkdown:
      "태국 여행 전 디지털 입국카드를 작성해야 하는 경우에는 여권과 항공권, 숙소 정보를 옆에 두고 입력하면 실수를 줄일 수 있습니다.\n\n준비할 정보는 다음과 같습니다.\n\n1. 여권번호, 영문 이름, 생년월일, 국적\n2. 입국일과 항공편명\n3. 태국 내 체류 주소 또는 호텔명\n4. 이메일과 연락 가능한 전화번호\n5. 여행 목적과 체류 기간\n\n작성 순서는 보통 개인정보 입력, 여행 정보 입력, 체류지 정보 입력, 최종 확인 순서로 진행됩니다. 제출 전에는 여권번호와 영문 이름, 입국일, 항공편명을 반드시 다시 확인하세요.\n\n호텔 주소를 모를 때는 예약 확인서에 적힌 호텔명과 도시, 도로명 주소를 참고하면 됩니다. 가족이나 동행자가 있어도 각자 별도로 작성해야 하는 경우가 많으므로 출국 전에 여유 있게 확인하는 것이 좋습니다.\n\n입국 규정과 제출 방식은 바뀔 수 있으니 출발 전에는 항공사 안내나 태국 공식 입국 안내 페이지도 함께 확인하는 것이 안전합니다.",
    searchVolume: 3200,
    competitionScore: 38,
    trendScore: 72,
    opportunityScore: 79,
    adOpportunityScore: 35,
  },
  {
    keyword: "태국 입국신고서 온라인 작성",
    normalizedKeyword: "태국 입국신고서 온라인 작성",
    slug: "thailand-online-arrival-form-checklist",
    title: "태국 입국신고서 온라인 작성 전 체크리스트",
    seoTitle: "태국 입국신고서 온라인 작성 체크리스트",
    seoDescription:
      "태국 입국신고서를 온라인으로 작성하기 전 여권, 항공권, 호텔 주소, 이메일을 확인하는 체크리스트입니다.",
    summary:
      "태국 입국신고서를 온라인으로 작성하기 전에는 여권 정보와 항공편, 호텔 주소, 이메일을 정확히 준비해야 입력 오류를 줄일 수 있습니다.",
    contentMarkdown:
      "태국 입국신고서를 온라인으로 작성할 때 가장 많이 틀리는 부분은 여권번호, 영문 이름, 항공편명, 숙소 주소입니다.\n\n작성 전 체크리스트는 다음과 같습니다.\n\n1. 여권 만료일이 충분히 남아 있는지 확인합니다.\n2. 항공권의 편명과 도착일을 확인합니다.\n3. 호텔 예약 확인서에서 영문 주소를 준비합니다.\n4. 제출 확인 메일을 받을 이메일을 정확히 입력합니다.\n5. 저장 또는 제출 후 확인 화면을 캡처해둡니다.\n\n온라인 양식은 빠르게 작성할 수 있지만, 오타가 있으면 입국 심사 과정에서 확인 시간이 길어질 수 있습니다. 특히 여권 정보는 여권에 적힌 그대로 입력하는 것이 중요합니다.",
    searchVolume: 1800,
    competitionScore: 36,
    trendScore: 67,
    opportunityScore: 73,
    adOpportunityScore: 30,
  },
  {
    keyword: "태국 입국카드 작성법",
    normalizedKeyword: "태국 입국카드 작성법",
    slug: "how-to-fill-thailand-arrival-card",
    title: "태국 입국카드 작성법: 처음 가는 사람도 헷갈리지 않게",
    seoTitle: "태국 입국카드 작성법",
    seoDescription:
      "태국 입국카드 작성법을 여권 정보, 항공편, 호텔 주소, 체류 기간 순서로 쉽게 정리했습니다.",
    summary:
      "태국 입국카드는 여권 정보와 항공편, 호텔 주소, 체류 기간만 정확히 준비하면 처음 작성하는 사람도 어렵지 않게 입력할 수 있습니다.",
    contentMarkdown:
      "태국 입국카드 작성법에서 핵심은 여권에 적힌 정보와 항공권, 호텔 예약 정보를 그대로 옮기는 것입니다. 특히 날짜를 잘못 넣는 경우가 많으니, 새벽 도착·새벽 출발 비행기는 반드시 실제 태국 도착일과 실제 출발일 기준으로 확인해야 합니다.\n\n[![SalonNote 미용실 관리 프로그램 바로가기](/images/salonnote/salonnote-api.png)](https://api.salonnote.uk)\n\n![태국 디지털 입국카드 시작 화면](/images/thailand-arrival-card/01-start.png)\n\n## 1. 시작 화면에서 Arrival Card 선택\n\n첫 화면에는 `Arrival Card`와 `Update Arrival Card`가 보입니다.\n\n- 처음 작성하는 경우: `Arrival Card` 선택\n- 이미 제출한 내용을 수정하는 경우: `Update Arrival Card` 선택\n\n화면 안내에 따르면 태국 도착일 기준 3일 전부터 도착 카드 정보를 제출해야 합니다. 여행 직전에 급하게 작성하면 항공편명이나 호텔 주소를 틀리기 쉬우니, 항공권과 호텔 예약이 확정된 뒤 미리 입력하는 것이 좋습니다.\n\n![여권 및 개인정보 입력 화면](/images/thailand-arrival-card/02-personal-info.png)\n\n## 2. 여권 정보와 개인정보 입력\n\n`Personal Information In Passport` 영역은 여권에 적힌 그대로 입력합니다.\n\n- `Family Name`: 성, 예: KIM\n- `First Name`: 이름, 예: SUNGTAE\n- `Middle Name`: 중간 이름이 없으면 비워도 됩니다.\n- `Passport No.`: 여권번호\n- `Nationality/Citizenship`: 국적, 한국인은 `KOR : REPUBLIC OF KOREA` 선택\n\n아래 `Personal Information` 영역에서는 생년월일, 성별, 거주 국가, 직업, 전화번호 등을 입력합니다.\n\n성별은 다음처럼 이해하면 됩니다.\n\n- `MALE`: 남자\n- `FEMALE`: 여자\n- `UNDEFINED`: 성별을 특정하지 않는 경우\n\n남자라면 `MALE`을 선택하면 됩니다. 화면의 `Gender`는 성별 항목입니다.\n\n## 3. 생년월일과 연락처 입력 주의\n\n생년월일은 보통 `yyyy / mm / dd` 순서입니다.\n\n예를 들어 1990년 5월 3일이면:\n\n- yyyy: 1990\n- mm: 05\n- dd: 03\n\n전화번호는 국가번호와 전화번호를 나누어 입력하는 경우가 많습니다. 한국 휴대폰이면 국가번호는 `82`를 사용하고, 전화번호는 앞의 0을 제외해 입력하는 방식이 일반적입니다. 예를 들어 010-1234-5678이면 `82`와 `1012345678`처럼 입력합니다.\n\n![여행 정보 및 숙소 정보 입력 화면](/images/thailand-arrival-card/03-trip-accommodation.png)\n\n## 4. 도착 정보 입력: 새벽 도착이면 날짜를 특히 조심\n\n`Arrival Information`에서는 태국에 들어오는 정보를 입력합니다.\n\n- `Date of Arrival`: 태국에 실제 도착하는 날짜\n- `Country/Territory where you Boarded`: 출발한 국가, 한국 출발이면 Republic of Korea\n- `Purpose of Travel`: 여행 목적, 관광이면 Holiday 또는 Tourism 계열 선택\n- `Mode of Travel`: 이동수단, 비행기면 `AIR`\n- `Mode of Transport`: 보통 상업 항공편이면 Commercial Flight 선택\n- `Flight No./Vehicle No.`: 태국에 도착하는 항공편명\n\n중요한 날짜 주의사항이 있습니다.\n\n한국에서 밤에 출발해서 태국에 새벽에 도착하는 항공편은 도착일이 다음날인 경우가 많습니다. 예를 들어 8월 10일 밤 11시에 한국에서 출발해 8월 11일 새벽 2시에 방콕에 도착한다면 `Date of Arrival`은 8월 11일로 적어야 합니다.\n\n항공권 예매 화면의 출발일만 보고 입력하면 하루 틀릴 수 있습니다. 반드시 태국 현지에 실제로 도착하는 날짜를 기준으로 입력하세요.\n\n## 5. 출발 정보 입력: 돌아오는 새벽 비행기도 다음날 날짜 확인\n\n`Departure Information`은 태국에서 나가는 항공편 정보입니다.\n\n- `Date of Departure`: 태국에서 실제 출발하는 날짜\n- `Mode of Travel`: 비행기면 `AIR`\n- `Mode of Transport`: 상업 항공편이면 Commercial Flight\n- `Flight No./Vehicle No.`: 태국에서 출발하는 귀국 항공편명\n\n태국에서 한국으로 돌아오는 비행기는 밤 늦게 출발하거나 새벽 시간대인 경우가 많습니다. 특히 “밤에 공항에 가서 새벽 비행기를 타는 일정”이면 날짜가 다음날로 넘어가는지 꼭 확인해야 합니다.\n\n예를 들어 8월 15일 밤에 공항으로 이동하지만 항공권 출발 시간이 8월 16일 00:40이라면, `Date of Departure`는 8월 16일로 입력해야 합니다. 호텔 체크아웃 날짜나 공항 가는 날짜가 아니라 항공권에 적힌 실제 출발 날짜를 기준으로 예매하고 입력해야 합니다.\n\n![한국어 번역 화면의 여행 정보 입력 예시](/images/thailand-arrival-card/04-korean-trip-form.png)\n\n## 6. 항공편명 입력 방법\n\n`Flight No./Vehicle No.` 또는 한국어 화면의 `비행기 번호/차량 번호`에는 좌석번호가 아니라 항공편명을 입력합니다.\n\n항공편명은 보통 다음처럼 생겼습니다.\n\n- KE651\n- OZ741\n- TG659\n- LJ001\n\n항공사 앱, 항공권 예약 확인서, 모바일 탑승권에서 확인할 수 있습니다. 경유편이라면 태국에 실제 도착하는 마지막 구간의 항공편명을 도착 정보에 입력하고, 태국에서 실제 출발하는 첫 구간의 항공편명을 출발 정보에 입력하는 것이 일반적입니다.\n\n## 7. 숙소 정보 입력\n\n`Accommodation Information`에는 태국에서 머무는 곳을 입력합니다.\n\n- 호텔이면 호텔 또는 숙박시설 유형을 선택\n- `Province`: 방콕이면 Bangkok 선택\n- `District, Area`: 호텔 주소에 맞는 구역 선택\n- `Sub-District, Sub-Area`: 하위 지역 선택\n- `Post Code`: 우편번호\n- `Address`: 호텔 영문 주소\n\n호텔 주소는 직접 번역하지 말고 예약 확인서에 있는 영문 주소를 복사하는 것이 가장 안전합니다. 숙소가 여러 곳이면 첫날 체크인하는 숙소를 기준으로 작성하세요.\n\n`I am a transit passenger, I don't stay in Thailand.` 또는 한국어 화면의 `저는 환승 승객이고, 태국에 머무르지 않습니다.`는 태국에 입국하지 않고 환승만 하는 경우에 해당합니다. 방콕이나 파타야 등 태국에서 숙박한다면 체크하지 않습니다.\n\n## 8. 제출 전 최종 확인\n\n제출 전에는 아래 항목을 꼭 다시 확인하세요.\n\n1. 여권 영문 이름과 여권번호\n2. 성별 선택: 남자는 MALE, 여자는 FEMALE\n3. 태국 실제 도착 날짜\n4. 태국 실제 출발 날짜\n5. 항공편명\n6. 호텔명과 영문 주소\n7. 이메일과 전화번호\n\n가장 흔한 실수는 날짜입니다. 새벽 비행기는 달력상 날짜가 다음날로 넘어갈 수 있으므로 항공권의 도착·출발 시간을 기준으로 입력해야 합니다. 작성 후 확인 화면이나 제출 완료 화면은 캡처해두면 공항에서 확인할 때 편합니다.\n\n[SalonNote 무료로 시작하기](https://api.salonnote.uk)",
    searchVolume: 4200,
    competitionScore: 42,
    trendScore: 74,
    opportunityScore: 82,
    adOpportunityScore: 34,
  },
  {
    keyword: "태국 TDAC 작성방법",
    normalizedKeyword: "태국 TDAC 작성방법",
    slug: "thailand-tdac-how-to-fill",
    title: "태국 TDAC 작성방법과 입력할 항목 정리",
    seoTitle: "태국 TDAC 작성방법",
    seoDescription:
      "태국 TDAC 작성방법을 여권 정보, 여행 정보, 숙소 정보, 제출 전 확인 항목 중심으로 정리했습니다.",
    summary:
      "태국 TDAC 작성 시에는 여권, 항공편, 숙소 주소, 이메일을 준비하고 입력 후 확인 화면을 저장해두는 것이 좋습니다.",
    contentMarkdown:
      "TDAC는 Thailand Digital Arrival Card를 의미하며, 태국 입국 전 여행자 정보를 온라인으로 제출하는 방식입니다.\n\n작성 전에 준비하면 좋은 정보는 다음과 같습니다.\n\n1. 여권번호와 여권 만료일\n2. 영문 이름과 생년월일\n3. 입국 항공편명과 도착일\n4. 태국 내 숙소명과 주소\n5. 이메일 주소와 연락처\n\n입력할 때는 여권 정보와 항공권 정보가 서로 다르지 않은지 확인해야 합니다. 특히 항공편명은 항공권에 적힌 영문+숫자 조합 그대로 입력하는 것이 좋습니다.\n\n제출 후 확인 화면이나 접수 메일이 있다면 캡처하거나 저장해두세요. 공항에서 별도 확인을 요구받을 때 빠르게 보여줄 수 있습니다.",
    searchVolume: 3600,
    competitionScore: 39,
    trendScore: 78,
    opportunityScore: 84,
    adOpportunityScore: 33,
  },
  {
    keyword: "태국 입국신고서 호텔주소",
    normalizedKeyword: "태국 입국신고서 호텔주소",
    slug: "thailand-arrival-form-hotel-address",
    title: "태국 입국신고서 호텔주소는 어떻게 적어야 할까",
    seoTitle: "태국 입국신고서 호텔주소 쓰는 법",
    seoDescription:
      "태국 입국신고서나 디지털 입국카드에 호텔주소를 입력할 때 호텔명, 도시, 영문 주소를 확인하는 방법입니다.",
    summary:
      "태국 입국신고서의 호텔주소는 예약 확인서에 있는 영문 호텔명과 주소를 그대로 입력하는 것이 가장 안전합니다.",
    contentMarkdown:
      "태국 입국신고서에서 호텔주소를 묻는 칸이 나오면, 예약한 숙소의 영문 주소를 입력하면 됩니다.\n\n확인 방법은 다음과 같습니다.\n\n1. 호텔 예약 사이트의 예약 확인서를 엽니다.\n2. 호텔명, 도로명 주소, 도시명을 확인합니다.\n3. 주소가 길면 호텔명과 도시, 주요 도로명까지만 정확히 입력합니다.\n4. 아직 숙소를 정하지 않았다면 첫날 머물 예정인 숙소 정보를 준비합니다.\n\n예를 들어 방콕 호텔이라면 호텔명, Bangkok, Thailand가 포함되도록 입력하면 됩니다. 가능하면 한글 주소를 번역해 쓰기보다 예약 확인서에 있는 영문 주소를 복사하는 것이 좋습니다.\n\n숙소가 여러 곳이면 첫 번째로 체크인할 숙소를 기준으로 적는 것이 일반적입니다.",
    searchVolume: 1700,
    competitionScore: 34,
    trendScore: 63,
    opportunityScore: 75,
    adOpportunityScore: 29,
  },
  {
    keyword: "태국 입국신고서 항공편명",
    normalizedKeyword: "태국 입국신고서 항공편명",
    slug: "thailand-arrival-form-flight-number",
    title: "태국 입국신고서 항공편명은 어디에 있는 번호를 쓰나",
    seoTitle: "태국 입국신고서 항공편명 입력방법",
    seoDescription:
      "태국 입국신고서 항공편명 입력 시 항공권에 적힌 항공사 코드와 숫자 조합을 확인하는 방법입니다.",
    summary:
      "태국 입국신고서 항공편명은 항공권이나 예약 내역에 적힌 항공사 코드와 숫자 조합을 그대로 입력하면 됩니다.",
    contentMarkdown:
      "태국 입국신고서에서 항공편명을 입력하라고 하면 비행기 좌석번호가 아니라 항공권에 적힌 편명을 입력해야 합니다.\n\n항공편명은 보통 다음처럼 표시됩니다.\n\n1. KE651\n2. OZ741\n3. TG659\n4. LJ001 같은 영문 코드와 숫자 조합\n\n확인 위치는 항공권 예약 확인서, 모바일 탑승권, 항공사 앱의 여정 상세 화면입니다. 출발편과 도착편이 여러 개라면 태국에 도착하는 마지막 항공편명을 입력하는 것이 일반적입니다.\n\n예를 들어 인천에서 방콕으로 바로 가는 항공권이면 인천-방콕 편명을 쓰면 됩니다. 경유편이라면 태국에 실제로 도착하는 구간의 편명을 확인하세요.",
    searchVolume: 1300,
    competitionScore: 31,
    trendScore: 59,
    opportunityScore: 72,
    adOpportunityScore: 27,
  },
  {
    keyword: "태국 입국서류 작성방법",
    normalizedKeyword: "태국 입국서류 작성방법",
    slug: "thailand-entry-documents-guide",
    title: "태국 입국서류 작성방법과 출국 전 준비물",
    seoTitle: "태국 입국서류 작성방법",
    seoDescription:
      "태국 여행 전 입국서류 작성에 필요한 여권, 항공권, 숙소 정보, 연락처, 체류 기간 체크리스트입니다.",
    summary:
      "태국 입국서류는 여권, 항공권, 숙소 주소, 연락처, 체류 기간 정보를 미리 준비하면 작성 시간을 줄일 수 있습니다.",
    contentMarkdown:
      "태국 입국서류를 작성할 때는 복잡하게 생각하기보다 여행자 정보와 체류 정보를 정확히 입력하는 것이 중요합니다.\n\n출국 전에 준비할 것은 다음과 같습니다.\n\n1. 유효한 여권\n2. 왕복 또는 출국 항공권 정보\n3. 태국 내 숙소명과 영문 주소\n4. 이메일과 연락처\n5. 여행 목적과 체류 기간\n\n입력 후에는 이름, 여권번호, 입국일, 항공편명, 숙소 주소를 다시 확인하세요. 이 정보들이 실제 예약 정보와 다르면 공항에서 확인 시간이 길어질 수 있습니다.\n\n규정은 시기에 따라 바뀔 수 있으므로 출발 직전 항공사 안내와 태국 공식 안내를 함께 확인하는 것이 좋습니다.",
    searchVolume: 2400,
    competitionScore: 37,
    trendScore: 68,
    opportunityScore: 78,
    adOpportunityScore: 31,
  },
];

async function upsertCategory(slug: string, name: string, description: string) {
  return db.category.upsert({
    where: { slug },
    update: { name, description, active: true },
    create: { slug, name, description },
  });
}

async function upsertQuestions(categoryId: string, questions: SeedQuestion[]) {
  const questionIds: string[] = [];

  for (const item of questions) {
    const seedTopic = await db.seedTopic.upsert({
      where: {
        categoryId_keyword_country_language: {
          categoryId,
          keyword: item.keyword,
          country: "KR",
          language: "ko",
        },
      },
      update: { active: true },
      create: {
        categoryId,
        keyword: item.keyword,
        country: "KR",
        language: "ko",
      },
    });

    const keyword = await db.keyword.upsert({
      where: {
        normalizedKeyword_country_language: {
          normalizedKeyword: item.normalizedKeyword,
          country: "KR",
          language: "ko",
        },
      },
      update: {
        keyword: item.keyword,
        categoryId,
        status: "PUBLISHED",
        searchVolume: item.searchVolume,
        competitionScore: item.competitionScore,
        trendScore: item.trendScore,
        opportunityScore: item.opportunityScore,
        adOpportunityScore: item.adOpportunityScore,
        metricsUpdatedAt: new Date(),
      },
      create: {
        keyword: seedTopic.keyword,
        normalizedKeyword: item.normalizedKeyword,
        categoryId,
        country: "KR",
        language: "ko",
        status: "PUBLISHED",
        searchVolume: item.searchVolume,
        competitionScore: item.competitionScore,
        trendScore: item.trendScore,
        opportunityScore: item.opportunityScore,
        adOpportunityScore: item.adOpportunityScore,
        sources: { create: { provider: "SEED" } },
        snapshots: {
          create: {
            provider: "SEED",
            searchVolume: item.searchVolume,
            competitionScore: item.competitionScore,
            trendScore: item.trendScore,
          },
        },
      },
    });

    const question = await db.question.upsert({
      where: { slug: item.slug },
      update: {
        primaryKeywordId: keyword.id,
        categoryId,
        title: item.title,
        searchIntent: "informational",
        language: "ko",
        country: "KR",
        status: "PUBLISHED",
        publishedAt: new Date(),
        qualityScore: 82,
      },
      create: {
        primaryKeywordId: keyword.id,
        categoryId,
        title: item.title,
        slug: item.slug,
        searchIntent: "informational",
        language: "ko",
        country: "KR",
        status: "PUBLISHED",
        qualityScore: 82,
        publishedAt: new Date(),
      },
    });

    await db.answer.upsert({
      where: {
        questionId_version: {
          questionId: question.id,
          version: 1,
        },
      },
      update: {
        summary: item.summary,
        contentMarkdown: item.contentMarkdown,
        contentHtml: markdownToHtml(item.contentMarkdown),
        provider: "seed",
        model: "seed",
        promptVersion: "seed-v1",
        confidenceScore: 90,
        qualityScore: 82,
        isActive: true,
      },
      create: {
        questionId: question.id,
        summary: item.summary,
        contentMarkdown: item.contentMarkdown,
        contentHtml: markdownToHtml(item.contentMarkdown),
        provider: "seed",
        model: "seed",
        promptVersion: "seed-v1",
        confidenceScore: 90,
        qualityScore: 82,
      },
    });

    await db.seoMetadata.upsert({
      where: { questionId: question.id },
      update: {
        title: item.seoTitle,
        description: item.seoDescription,
        canonicalUrl: null,
        noIndex: false,
      },
      create: {
        questionId: question.id,
        title: item.seoTitle,
        description: item.seoDescription,
      },
    });

    questionIds.push(question.id);
  }

  return questionIds;
}

async function upsertSalonNoteCampaign(categoryId: string) {
  const landingUrl = "https://api.salonnote.uk";
  const advertiser = await db.advertiser.upsert({
    where: { id: "salonnote-advertiser" },
    update: { name: "SalonNote", active: true },
    create: { id: "salonnote-advertiser", name: "SalonNote", active: true },
  });

  const product = await db.product.upsert({
    where: { id: "salonnote-product" },
    update: {
      advertiserId: advertiser.id,
      name: "SalonNote",
      description: "미용실 고객관리, 예약, 시술차트, 매출·정산 관리 서비스",
      baseUrl: landingUrl,
      active: true,
    },
    create: {
      id: "salonnote-product",
      advertiserId: advertiser.id,
      name: "SalonNote",
      description: "미용실 고객관리, 예약, 시술차트, 매출·정산 관리 서비스",
      baseUrl: landingUrl,
      active: true,
    },
  });

  const campaign = await db.campaign.upsert({
    where: { id: "salonnote-main-campaign" },
    update: {
      productId: product.id,
      name: "SalonNote CTA",
      landingUrl,
      status: "ACTIVE",
      priority: 20,
      startAt: null,
      endAt: null,
    },
    create: {
      id: "salonnote-main-campaign",
      productId: product.id,
      name: "SalonNote CTA",
      landingUrl,
      status: "ACTIVE",
      priority: 20,
    },
  });

  await db.adCreative.upsert({
    where: { id: "salonnote-main-creative" },
    update: {
      campaignId: campaign.id,
      title: "SalonNote",
      description:
        "미용실 고객관리부터 예약, 시술차트, 매출·정산까지 한 번에 관리하세요.",
      buttonText: "무료로 시작하기",
      placement: "CARD",
      active: true,
    },
    create: {
      id: "salonnote-main-creative",
      campaignId: campaign.id,
      title: "SalonNote",
      description:
        "미용실 고객관리부터 예약, 시술차트, 매출·정산까지 한 번에 관리하세요.",
      buttonText: "무료로 시작하기",
      placement: "CARD",
      active: true,
    },
  });

  const targetKeywords = [
    "미용실,고객관리,예약,시술,매출,정산,포스,SalonNote,살롱노트",
  ];

  for (const keyword of targetKeywords) {
    const existingTarget = await db.campaignTarget.findFirst({
      where: {
        campaignId: campaign.id,
        keyword,
        country: "KR",
        language: "ko",
      },
    });

    if (existingTarget) {
      await db.campaignTarget.update({
        where: { id: existingTarget.id },
        data: { categoryId, intent: "informational", weight: 1.3 },
      });
    } else {
      await db.campaignTarget.create({
        data: {
          campaignId: campaign.id,
          categoryId,
          keyword,
          intent: "informational",
          country: "KR",
          language: "ko",
          weight: 1.3,
        },
      });
    }
  }

  return campaign.id;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  const guides = await upsertCategory(
    "guides",
    "실용 가이드",
    "검색 질문에 직접 답하는 검수된 실용 가이드",
  );
  const salon = await upsertCategory(
    "salon-pos",
    "미용실 포스·예약 관리",
    "미용실 운영자를 위한 포스, 예약, 고객관리, 매출관리 가이드",
  );
  const travel = await upsertCategory(
    "travel",
    "여행 준비 가이드",
    "해외여행 준비, 입국 서류, 체크리스트를 정리한 실용 가이드",
  );

  const pcQuestionIds = await upsertQuestions(guides.id, pcQuestions);
  const salonQuestionIds = await upsertQuestions(salon.id, salonQuestions);
  const travelQuestionIds = await upsertQuestions(travel.id, travelQuestions);
  const salonCampaignId = await upsertSalonNoteCampaign(salon.id);

  console.log(
    `Seed complete: categories=3, pcQuestions=${pcQuestionIds.length}, salonQuestions=${salonQuestionIds.length}, travelQuestions=${travelQuestionIds.length}, salonCampaign=${salonCampaignId}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
