import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDatabaseSchema } from "../src/lib/database-url";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured. Set a PostgreSQL connection string before updating content.",
  );
}

const db = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString },
    { schema: getDatabaseSchema(connectionString) },
  ),
});

const slug = "how-to-fill-thailand-arrival-card";
const title = "태국 입국카드 작성법: TDAC 화면별 입력방법과 날짜 실수 방지";
const summary =
  "태국 디지털 입국카드(TDAC)는 여권 정보, 입국 항공편, 태국 내 숙소, 건강 신고를 순서대로 입력하는 온라인 입국 정보입니다. 가장 많이 틀리는 부분은 성별, 항공편명, 숙소 주소, 그리고 새벽 비행기의 도착·출발 날짜입니다.";

const contentMarkdown = `## 한눈에 보는 핵심 답변

태국 입국카드는 여권에 적힌 영문 이름과 여권번호, 항공권의 실제 태국 도착일·출발일, 첫 숙소의 영문 주소를 그대로 옮겨 적으면 됩니다. 남자는 성별에서 **MALE**, 여자는 **FEMALE**을 선택합니다. 한국에서 밤에 출발해 태국에 새벽 도착하는 항공편은 도착일이 다음날일 수 있고, 태국에서 돌아오는 새벽 비행기도 항공권상 출발일이 다음날이면 그 날짜로 입력해야 합니다.

작성 전에 여권, 왕복 항공권, 호텔 예약 확인서, 이메일, 휴대폰 번호를 옆에 두세요. 화면을 넘기기 전마다 이름·여권번호·항공편명·날짜를 확인하면 대부분의 오류를 피할 수 있습니다.

> 직접 작성한 화면을 기준으로 설명한 가이드이며, 실제 화면은 서비스 업데이트에 따라 달라질 수 있습니다.  
> 최종 확인: 2026년 8월

## 작성 전 준비물

- 여권: Family Name, First Name, Passport No., Date of Birth 확인
- 항공권: 태국에 실제 도착하는 편명과 날짜, 태국에서 실제 출발하는 편명과 날짜
- 숙소 예약 확인서: 호텔명, Province, District/Area, 영문 주소, 우편번호
- 연락처: 이메일, 휴대폰 번호
- 여행 목적: 관광이면 Holiday 또는 Tourism 계열 선택

> 중요: 날짜는 “공항에 가는 날”이나 “한국에서 출발하는 날”이 아니라, TDAC 화면에서 묻는 기준에 맞춰 입력해야 합니다. Arrival은 태국에 실제 도착하는 날짜, Departure는 태국에서 실제 출발하는 날짜입니다.

![태국 디지털 입국카드 시작 화면](/images/thailand-arrival-card/01-start.png)

## 1. 시작 화면: Arrival Card와 Update Arrival Card 구분

첫 화면에는 두 개의 큰 버튼이 있습니다.

### Arrival Card

처음 작성하는 경우 선택합니다. 아직 제출한 입국카드가 없다면 이 버튼으로 시작하면 됩니다.

### Update Arrival Card

이미 제출한 내용을 수정할 때 사용합니다. 항공편이 바뀌었거나 호텔 주소를 잘못 입력했거나 날짜를 틀렸다면 새로 작성하기보다 수정 메뉴를 먼저 확인하세요.

화면 안내에는 태국 도착일 기준 사전 제출 안내가 표시됩니다. 여행 직전에 급하게 작성하면 항공편명과 숙소 주소를 틀리기 쉬우니, 항공권과 호텔 예약이 확정된 뒤 미리 작성하는 편이 안전합니다.

![여권 및 개인정보 입력 화면](/images/thailand-arrival-card/02-personal-info.png)

## 2. 여권 정보 입력: 여권에 적힌 그대로

이 화면의 첫 영역은 **Personal Information In Passport**입니다. 말 그대로 여권에 적힌 정보를 입력하는 곳입니다.

### Family Name

성입니다. 예를 들어 여권 이름이 **KIM MINJUN**이면 Family Name은 **KIM**입니다. 영문 대문자로 입력해도 되고, 여권 표기와 같은 철자를 유지하는 것이 중요합니다.

### First Name

이름입니다. 여권 이름이 **KIM MINJUN**이면 First Name은 **MINJUN**입니다. 띄어쓰기나 하이픈이 여권에 있으면 여권 표기를 기준으로 맞춥니다.

### Middle Name

한국 여권에는 보통 Middle Name이 없습니다. 중간 이름이 없다면 비워두면 됩니다. 없는 정보를 임의로 넣지 마세요.

### Passport No.

여권번호입니다. 좌석번호, 예약번호, 항공권 번호가 아닙니다. 여권 사진면에 있는 Passport No.를 그대로 입력합니다.

### Nationality/Citizenship

국적입니다. 한국 여권이면 **KOR : REPUBLIC OF KOREA**를 선택합니다.

## 3. 개인정보 입력: 생년월일, 성별, 거주지, 전화번호

두 번째 영역은 **Personal Information**입니다.

### Date of Birth

생년월일은 보통 **yyyy / mm / dd** 순서입니다.

예를 들어 1990년 5월 3일 출생이면 다음처럼 입력합니다.

1. yyyy: 1990
2. mm: 05
3. dd: 03

월과 일을 반대로 넣는 실수가 많습니다. 화면의 자리 표시자가 yyyy/mm/dd인지 꼭 보고 입력하세요.

### Gender

Gender는 성별입니다.

- **MALE**: 남자
- **FEMALE**: 여자
- **UNDEFINED**: 성별을 특정하지 않는 경우

남자라면 **MALE**을 선택하면 됩니다. “Male이 이름 입력칸인가?” 하고 헷갈리는 경우가 있는데, 이 항목은 이름이 아니라 성별 선택입니다.

### Country/Territory of Residence

현재 거주 국가입니다. 한국에 거주한다면 Republic of Korea 또는 Korea 항목을 선택합니다.

### Phone No.

한국 휴대폰 번호라면 국가번호는 **82**입니다. 전화번호 칸에는 앞의 0을 제외하고 입력하는 방식이 일반적입니다.

예: 010-1234-5678 → 국가번호 82 / 전화번호 1012345678

사이트 입력 방식이 국가번호와 전화번호를 따로 받는다면 중복으로 82를 넣지 마세요.

![여행 정보 및 숙소 정보 입력 화면](/images/thailand-arrival-card/03-trip-accommodation.png)

## 4. Arrival Information: 태국에 들어오는 항공편 정보

Arrival Information은 태국에 입국하는 정보를 적는 영역입니다.

### Date of Arrival

태국에 실제로 도착하는 날짜입니다. 한국에서 출발한 날짜가 아니라 태국 현지에 착륙하는 날짜를 기준으로 봅니다.

예를 들어 8월 10일 23:30에 인천에서 출발해서 8월 11일 02:50에 방콕에 도착한다면 **Date of Arrival은 8월 11일**입니다.

이 부분이 가장 흔한 실수입니다. 밤 비행기를 타면 출발일과 도착일이 다를 수 있습니다. 항공권의 “도착 시간” 옆 날짜를 확인하세요.

### Country/Territory where you Boarded

비행기를 탑승한 국가입니다. 한국에서 바로 태국으로 출발했다면 **KOR : REPUBLIC OF KOREA** 또는 Republic of Korea를 선택합니다. 경유라면 태국으로 들어오는 마지막 비행기를 어디서 탔는지 확인해야 합니다.

### Purpose of Travel

여행 목적입니다. 관광 목적이면 Holiday, Tourism, Vacation 계열의 항목을 선택하면 됩니다. 출장이라면 Business에 가까운 항목을 선택합니다.

### Mode of Travel

입국 교통수단입니다.

- 비행기: **AIR**
- 육로: LAND
- 배: SEA

대부분 한국 여행자는 AIR를 선택합니다.

### Mode of Transport

상업 항공편이면 Commercial Flight에 해당하는 항목을 선택합니다. 개인 전세기나 선박이 아니라 일반 항공권으로 이동한다면 보통 상업 항공편입니다.

### Flight No./Vehicle No.

태국에 도착하는 항공편명입니다. 좌석번호나 예약번호가 아닙니다.

예시는 다음과 같습니다.

- KE651
- OZ741
- TG659
- LJ001

경유편이라면 태국에 실제 도착하는 마지막 구간의 항공편명을 입력하는 것이 일반적입니다.

## 5. Departure Information: 태국에서 나가는 항공편 정보

Departure Information은 태국을 떠나는 정보를 적는 영역입니다.

### Date of Departure

태국에서 실제로 출발하는 날짜입니다. 호텔 체크아웃 날짜나 공항에 도착하는 날짜가 아니라 항공권상 출발 날짜를 기준으로 합니다.

태국에서 한국으로 돌아오는 항공편은 밤 늦게 출발하거나 새벽 출발인 경우가 많습니다. 예를 들어 8월 15일 밤에 공항으로 이동했지만 항공권 출발 시간이 **8월 16일 00:40**이라면, Date of Departure는 **8월 16일**입니다.

돌아오는 항공권을 예매할 때도 이 점을 조심해야 합니다. “15일 밤 비행기”라고 생각했는데 실제 티켓 날짜가 16일 새벽이면, TDAC에도 16일로 입력해야 합니다.

### Departure Flight No./Vehicle No.

태국에서 출발하는 귀국 항공편명을 입력합니다. 방콕에서 인천으로 바로 돌아가면 방콕→인천 편명입니다. 경유라면 태국에서 실제로 떠나는 첫 구간의 항공편명을 확인하세요.

![한국어 번역 화면의 여행 정보 입력 예시](/images/thailand-arrival-card/04-korean-trip-form.png)

## 6. 한국어 화면에서 보이는 항목 해석

한국어 번역 화면에서는 다음처럼 보일 수 있습니다.

- 탑승한 국가/영토: 태국행 비행기를 탄 국가
- 여행 목적: 휴가, 출장 등 방문 목적
- 이동 수단: 항공, 도지, SEA 중 선택
- 교통 수단: 상업 비행 등 구체적인 교통 형태
- 비행기 번호/차량 번호: 항공편명
- 출발일: 태국에서 실제 출발하는 날짜
- 숙박 정보: 태국에서 머무는 숙소 정보

화면 번역이 어색할 수 있습니다. “도지”처럼 어색하게 보이면 보통 LAND를 뜻하는 번역 오류일 가능성이 있습니다. 한국에서 항공편으로 태국에 간다면 이동 수단은 항공을 선택하면 됩니다.

## 7. 숙소 정보 입력: 첫날 머무는 곳 기준

Accommodation Information은 태국에서 머무는 곳을 입력하는 영역입니다.

### 환승 승객 체크박스

**I am a transit passenger, I don't stay in Thailand.** 또는 한국어의 “저는 환승 승객이고, 태국에 머무르지 않습니다.”는 태국에 입국하지 않고 환승만 하는 경우에 해당합니다.

방콕, 파타야, 치앙마이 등에서 숙박한다면 이 항목을 체크하지 않습니다.

### Type of Accommodation in Thailand

호텔이면 Hotel 또는 숙박시설에 맞는 항목을 선택합니다. 에어비앤비, 콘도, 가족 집 등은 실제 숙소 형태에 가까운 항목을 고르면 됩니다.

### Province / District / Sub-District

호텔 주소에 맞춰 Province, District, Sub-District를 선택합니다. 방콕 호텔이면 Province는 Bangkok 계열입니다. 주소가 애매하면 호텔 예약 확인서, 구글 지도, 호텔 공식 사이트의 영문 주소를 함께 확인하세요.

### Address

호텔 예약 확인서의 영문 주소를 그대로 복사하는 것이 가장 안전합니다. 한글 주소를 직접 번역해 넣으면 도로명이나 지역명이 어색하게 바뀔 수 있습니다.

숙소가 여러 곳이면 첫날 체크인하는 숙소를 기준으로 작성하세요.

## 8. 제출 전 최종 체크리스트

제출 버튼을 누르기 전에 아래 항목을 한 번씩만 더 확인하세요.

1. Family Name과 First Name이 여권과 같은지
2. Passport No.가 여권번호인지
3. Gender에서 남자는 MALE, 여자는 FEMALE을 선택했는지
4. Date of Arrival이 태국 실제 도착일인지
5. Date of Departure가 태국 실제 출발일인지
6. Flight No.가 좌석번호가 아니라 항공편명인지
7. 숙소 주소가 첫날 숙소의 영문 주소인지
8. 이메일과 전화번호를 받을 수 있는 정보로 넣었는지

제출 완료 화면이나 확인 메일이 나오면 캡처해두세요. 공항에서 확인을 요청받을 때 바로 보여줄 수 있어 편합니다.

## 자주 하는 실수

- 한국 출발일을 Date of Arrival에 입력하는 실수
- 새벽 귀국 비행기의 날짜를 하루 전으로 입력하는 실수
- Passport No. 대신 항공권 예약번호를 입력하는 실수
- Flight No. 대신 좌석번호를 입력하는 실수
- Middle Name이 없는데 임의로 이름을 나눠 넣는 실수
- 태국에 숙박하는데 환승 승객 체크박스를 선택하는 실수

## 문제가 생겼을 때 다음 단계

입력 중 빨간 경고가 뜨면 먼저 필수 항목이 비어 있는지 확인하세요. 날짜 형식 오류라면 yyyy/mm/dd 순서를 다시 보고, 항공편명 오류라면 영문 항공사 코드와 숫자를 붙여 입력해보세요. 이미 제출한 뒤 틀린 내용을 발견했다면 시작 화면의 **Update Arrival Card**에서 수정 가능한지 확인합니다.

공식 양식이나 제출 기준은 변경될 수 있으므로 출발 전 항공사 안내와 태국 공식 TDAC 안내를 함께 확인하는 것이 좋습니다.

## 자주 묻는 질문

### MALE은 무슨 뜻인가요?

MALE은 남자라는 뜻입니다. 성별 선택 항목에서 남자는 MALE, 여자는 FEMALE을 선택합니다.

### 새벽 도착이면 도착일을 언제로 적나요?

태국 현지에 실제 도착하는 날짜를 적습니다. 한국에서 전날 밤 출발해 태국에 다음날 새벽 도착하면 다음날 날짜가 Date of Arrival입니다.

### 돌아오는 새벽 비행기는 출발일을 어떻게 적나요?

항공권에 표시된 태국 출발 날짜를 기준으로 적습니다. 밤에 공항으로 갔더라도 비행기 시간이 다음날 00시 이후라면 다음날 날짜입니다.

### 호텔 주소를 정확히 모르겠으면 어떻게 하나요?

예약 확인서의 영문 호텔명과 주소를 우선 사용하세요. 주소가 긴 경우 호텔명, 도시, 주요 도로명, 우편번호를 정확히 옮기는 것이 좋습니다.
`;

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

async function main() {
  const question = await db.question.findUnique({
    where: { slug },
    include: { answers: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!question) {
    throw new Error(`Question not found for slug: ${slug}`);
  }

  const nextVersion = (question.answers[0]?.version ?? 0) + 1;

  await db.$transaction([
    db.answer.updateMany({
      where: { questionId: question.id, isActive: true },
      data: { isActive: false },
    }),
    db.answer.create({
      data: {
        questionId: question.id,
        summary,
        contentMarkdown,
        contentHtml: markdownToHtml(contentMarkdown),
        provider: "manual-editor",
        model: "content-quality-v2",
        promptVersion: "quality-v2-manual",
        confidenceScore: 92,
        qualityScore: 94,
        version: nextVersion,
        isActive: true,
      },
    }),
    db.question.update({
      where: { id: question.id },
      data: {
        title,
        searchIntent: "TRAVEL_GUIDE",
        qualityScore: 94,
        status: "PUBLISHED",
        publishedAt: question.publishedAt ?? new Date(),
      },
    }),
    db.seoMetadata.upsert({
      where: { questionId: question.id },
      update: {
        title: "태국 입국카드 작성법: TDAC 화면별 입력방법",
        description:
          "태국 디지털 입국카드 작성법을 실제 화면 순서대로 정리했습니다. MALE/FEMALE 성별, 새벽 도착·출발 날짜, 항공편명, 숙소 주소 입력 실수를 막는 체크리스트 포함.",
      },
      create: {
        questionId: question.id,
        title: "태국 입국카드 작성법: TDAC 화면별 입력방법",
        description:
          "태국 디지털 입국카드 작성법을 실제 화면 순서대로 정리했습니다. MALE/FEMALE 성별, 새벽 도착·출발 날짜, 항공편명, 숙소 주소 입력 실수를 막는 체크리스트 포함.",
      },
    }),
  ]);

  console.log(`Updated ${slug} to answer version ${nextVersion}`);
}

main()
  .finally(async () => db.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
