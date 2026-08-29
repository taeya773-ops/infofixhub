[CRITICAL: 최소 수정 / 크레딧 보호 규칙]

이 프로젝트에서는 기존 정상 동작 구조를 보존하는 것이 최우선이다.

1. 오류가 발생해도 전체 시스템, 전체 워크플로, 전체 파일을 다시 작성하지 않는다.
2. 반드시 오류의 직접 원인을 먼저 특정한다.
3. 수정은 오류와 직접 관련된 최소 파일, 최소 함수, 최소 라인만 변경한다.
4. 이미 정상 동작이 확인된 코드와 단계는 수정하지 않는다.
5. 리팩터링, 구조개편, 파일 재작성, 아키텍처 변경은 사용자가 명시적으로 요청하지 않는 한 금지한다.
6. 기존 파일 전체를 새 내용으로 덮어쓰지 않는다. 가능한 경우 patch/diff 방식으로 수정한다.
7. 한 오류를 고치기 위해 관련 없는 코드를 함께 정리하거나 개선하지 않는다.

[워크플로 실행 제한]

8. 운영 Workflow 전체 실행은 한 사용자 작업당 최대 1회다.
9. 운영 실행이 실패하면:
   - 원인 분석
   - 최소 코드 수정
   - 로컬 타입체크
   - 로컬 테스트
   - 로컬 빌드
   까지만 수행하고 중단한다.
10. 수정 후 운영 Workflow 재실행은 반드시 사용자 승인을 받은 후 진행한다.
11. 동일 questionId에 대한 전체 Workflow 자동 재실행은 금지한다.
12. 실패한 단계만 다시 테스트한다. 성공한 단계는 재실행하지 않는다.

[AI/API 비용 제한]

13. Gemini/OpenAI 등 유료 API 호출을 디버깅 목적으로 반복하지 않는다.
14. 이미지 문제를 테스트할 때 전체 글 생성 Workflow를 다시 실행하지 않는다.
15. 이미지 생성 테스트는 기본 1장만 수행한다.
16. 이미지 생성 retry는 최대 1회다.
17. 동일 입력에 대한 AI 호출 결과가 이미 저장되어 있으면 반드시 재사용한다.
18. API 오류가 발생하면 먼저 코드/로그/요청 형식을 검토하고 API 재호출부터 하지 않는다.

[수정 전 필수 절차]

19. 수정 전에 다음을 먼저 보고한다:
   - 정확한 오류 원인
   - 수정할 파일
   - 수정할 함수
   - 예상 변경 범위
20. 수정 범위가 3개 파일을 초과하면 즉시 중단하고 사용자에게 이유를 설명한다.
21. 한 오류 수정에서 100라인 이상 변경이 필요하면 자동 진행하지 말고 사용자 승인을 받는다.
22. 기존 기능 삭제 또는 동작 변경 가능성이 있으면 자동 진행하지 않는다.

[반복 방지]

23. 같은 오류에 대해 자동 수정 시도는 최대 2회다.
24. 2회 수정 후에도 해결되지 않으면 추가 수정/배포/실행을 중단하고 현재 상태와 원인을 사용자에게 보고한다.
25. "다시 한번 실행해보겠습니다", "끝까지 확인하겠습니다"라는 이유로 운영 API를 반복 호출하지 않는다.
26. 실패를 발견했다고 해서 자동으로 수정 -> 배포 -> 재실행 사이클을 계속하지 않는다.

[최우선 원칙]

DO NOT REBUILD WHAT ALREADY WORKS.
DO NOT RE-RUN SUCCESSFUL STEPS.
PATCH THE FAILURE, NOT THE WHOLE SYSTEM.
STOP BEFORE SPENDING MORE API CREDITS.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
