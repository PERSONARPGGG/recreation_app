# Recreation App

A recreational game web application.

## Patch Notes

### v1.4.9
* **참가자 화면 폼 깨짐/넘침 완전 해결 및 테마 사이클러 도입:**
  - 상단 헤더의 3개 테마 선택 버튼(MALE, FEMALE, NEON)이 모바일 좁은 화면(360px~412px)에서 여러 줄로 꺾이며 화면 밖으로 넘치던 문제를 해결.
  - 단일 테마 원터치 순환 토글 버튼(`cycleTheme`)으로 전면 교체하여 한 줄로 콤팩트하게 유지되며 절대 깨지지 않도록 개선.
  - 참가자 입장 준비 단계의 팀 선택 폼(`guest_team_select`)에서도 팀이 많아질 경우 화면 밖으로 삐져나오지 않도록 스크롤 래퍼 및 유연한 높이(`minHeight: 100vh`, `maxHeight: 220px`) 적용.
* **스마트폰 모바일 화면 제로 스크롤(Zero-Scroll) 상단 배치:**
  - 게임 플레이 시 상단 중복 브랜드 타이틀 및 장식 배너를 슬림화(34px)하여 메인 게임 인터랙션 요소(스톱워치 정지 버튼, OX 버튼, 터치 연타 버튼, 타워 블록 드롭 버튼 등)가 스마트폰 첫 화면 최상단에 즉시 노출되도록 재배치.
  - `BlockStacker` 캔버스 높이를 260px로 최적화하고 버튼 여백을 슬림화하여 화면을 아래로 스크롤하지 않고도 100% 한 화면에서 즉시 플레이 가능하도록 완성.
* **사회자 화면 대규모 데이터 유입 시 넘침 방지 및 공간 최적화:**
  - 100명의 참가자 또는 봇이 유입될 때 실시간 현황판(`ParticipantMiniBoard`)과 대기실 참가자 목록이 무한정 늘어나 사회자 조작 버튼을 밀어내던 현상을 `maxHeight` 스크롤 바운드 및 접기/펼치기 토글로 완벽 방지.
  - 메인 대기실의 거대한 QR 코드와 불필요한 여백을 슬림화하여 한눈에 게임 아케이드 목록이 들어오도록 레이아웃 재구성.
* **팀 분배 버그 및 교차 표시 문제 완전 수정:**
  - `constants.js`의 `TEAM_PRESETS`를 기존 6개에서 10개(1팀 레드 타이거 ~ 10팀 골드 라이온)로 정규 확장 및 CSS 클래스(`team-cyan`, `team-pink`, `team-emerald`, `team-gold`) 전수 추가.
  - 100인 봇 생성(`populateBots`) 시 번갈아가며 섞여서 생성되던 방식을 팀별 연속 블록 할당 방식으로 변경.
  - 대기실 참가자 목록에서 참가자가 1팀, 2팀, 3팀, 1팀... 번갈아 산만하게 표시되던 것을 팀별 그룹화 카드로 정렬하여 소속 팀원들이 깔끔하게 묶여 보이도록 개선.
  - 줄다리기(`TugOfWar`) 10팀 홀수/짝수 연합 매칭 로직(`teamNum % 2 !== 0`) 보정.
* **전체 12종 미니게임 자연스러운 한국어 현지화 완벽 정제:**
  - `TARGET TIME` -> `목표 시간`, `RACE TIMER` -> `남은 시간`, `참 (TRUE) / 거짓 (FALSE)` -> `그렇다 (O) / 아니다 (X)`, `TAP!` -> `터치!`, `PTS` -> `점`, `QUESTION #` -> `제 1 번 문제` 등 어색하거나 누락된 영문 표현들을 깔끔한 한국어로 정비.

### v1.4.8
* **모바일 및 사회자 화면 최적화 (Zero-Scroll 100vh Layout):**
  - 모바일 환경에서 상단 거대 배너 및 중복 설명문으로 인해 게임 조작 버튼이 화면 아래로 밀려 스크롤해야 하던 불편함을 완벽 해결.
  - 참가자 화면에서 불필요한 상단 설명과 여백을 제거하고, 핵심 게임 컨트롤(O/X 버튼, 10초 연타 버튼, 스톱워치 STOP, 줄다리기 당기기 버튼, 초성 입력 폼 등)을 **최상단 단일 뷰포트**에 즉시 배치.
  - 사회자 화면에서도 툴바를 슬림화하여 메인 게임 스테이지를 최상단에 올리고 실시간 참가자 현황 및 순위표를 그 아래로 안정적으로 배치.
  - 전역 CSS에서 강제 줄바꿈 및 버튼 100% 폭을 강제하던 비정상 스타일 규칙을 정리하여 폼 깨짐 방지.
* **초정밀 10초 리듬 블록 탑 쌓기 (`BlockStacker`) 전체 동기화 타이머:**
  - 사회자가 `[▶️ 전 참가자 10초 동시 시작!]` 버튼을 누르면 100명 전체 화면에서 10초 동기화 카운트다운 타이머가 작동하며 일제히 게임 개시.
  - 10초 타임아웃 시 쌓은 타워 높이가 자동 제출되며 붕괴되거나 타임아웃된 경우에도 최종 층수로 순위 집계.
  - 10초 경기 완료 전에는 조기 정산 버튼이 비활성화되며 경기 종료 후 `[🏆 포인트 정산하기]` 활성화.
* **전체 미니게임 콘솔 에러 및 런타임 버그 수정:**
  - `MindSyncBalance.jsx`: 누락되었던 React `useEffect` 훅 import 복구.
  - `MafiaRefereeModule.jsx`: 생존자 판정 프로퍼티(`p.alive` -> `p.isAlive !== false`) 정정.
  - `soundFx`: 오디오 자동재생 차단 정책 관련 콘솔 경고 로그 억제.
  - `NunchiGame.jsx`: 참가자 목록 매핑 key 프로퍼티 유니크 ID 보정.

### v1.4.7
* **서바이벌 OX 퀴즈 (`SurvivalOxQuiz`):** 문제 번호(`qIndex`) 바인딩 및 `resetAllPlayerInputs` 원자적 초기화 적용으로 다음 문제 진행 시 이전 문제의 선택값이 유지되어 버튼이 잠기던 버그를 완벽 해결.
* **눈치게임 (`NunchiGame`) 프리징 및 브라우저 응답 없음 완전 박멸:** 타임스탬프 불일치로 인한 무한 렌더 루프를 제거하고 `processedPlayerInputsRef (Map)` 기반 단일 평가 시스템으로 전면 재구축.
* **전체 12종 미니게임 조기 정산 방지 가드 (Premature Settlement Guard):**
  - 폭탄 돌리기(`BombPass`), 가위바위보(`RockPaperScissors`), 줄다리기(`TugOfWar`), OX 퀴즈, 룰렛, 스톱워치, 블록쌓기, 100m 달리기, 심리 밸런스 등 모든 게임에서 결과가 확정되기 전에는 포인트 정산 버튼을 원천 비활성화(`disabled`)하고 실시간 상태 라벨(`⏳ 결과 확인 후 정산`)을 표시.
  - 사회자가 실수로 로비로 돌아가도 결과가 없는 상태에서는 포인트가 오지급되지 않도록 완벽 차단.
* **가위바위보 서바이벌 (`RockPaperScissors`) 완전 탈락 룰 및 라운드별 차등 포인트 지급:**
  - 패배 또는 무승부 시 즉시 완전 탈락 처리되어 다음 라운드 참여가 차단되며, 실시간 남은 생존자 관전 화면으로 전환.
  - 라운드 승리 시마다 차등 보너스 포인트(1R: +100점, 2R: +200점, 3R: +300점, 4R+: +400점~)를 즉시 지급하고 참가자 화면에 축하 배지 렌더링.
* **100인 영차영차 줄다리기 (`TugOfWar`) 팀 대항전 시각화 및 승리 진영 일괄 정산:**
  - 🔴 홍군 연합(홀수팀) vs 🔵 청군 연합(짝수팀) 또는 1:1 팀 단판 매치업 대진표와 실시간 팀별 참가자 수 및 연타 현황을 양 진영에 시각화.
  - 경기 종료 시 승리 진영에 속한 모든 팀과 참가자에게 일괄 +300점 승리 포인트를 정산하는 로직 구축.

### v1.4.6
* **눈치게임 (`NunchiGame`) 진입 시 빈 화면/크래시 및 브라우저 프리징(무한루프) 완전 해결:**
  - `useEffect`의 의존성 배열에 `room` 상태가 포함되어 `updateRoomState` 호출 시 무한 리렌더링(Maximum update depth exceeded) 및 브라우저 응답 없음(Freezing)을 유발하던 버그를 `useRef(new Set())` 기반 중복 처리 필터로 전면 리팩토링.
* **100인 영차영차 줄다리기 (`TugOfWar`) 타이머 멈춤 및 줄 미동 버그 수정:**
  - 줄다리기 타이머와 줄 위치 갱신 로직이 한 `useEffect`에 묶여 참가자 연타 시 타이머 인터벌이 계속 재할당·초기화되던 문제를 분리.
  - 솔로 모드 및 팀 모드 참가자 판정 로직을 보완하고 클릭당 1.8%의 역동적인 줄 이동 텐션과 봇 연타 시뮬레이션을 적용.
* **실시간 초성 퀴즈 (`InitialWordQuiz`) 입력 단일 잠금:**
  - 참가자가 정답 단어를 제출하면 즉시 폼을 비활성화하고 `✅ 입력을 완료하였습니다.` 완료 배지를 표시하여 중복 입력 및 스팸 입력 방지.
  - 사회자 화면에서 실시간 참가자 제출 현황 및 단어를 바로 모니터링하고 조기 마감할 수 있는 기능 추가.
* **럭키 룰렛 대박 뽑기 (`LuckyRoulette`) 긴장감 넘치는 물리 회전 애니메이션 탑재:**
  - 정적인 원형 화면 대신 6개 섹터 SVG 룰렛 휠, 🔻 상단 포인터 바운스 애니메이션, 3.5초 감속 물리 회전(`cubic-bezier`) 및 회전 틱 사운드 연동.
  - 참가자 모바일 화면에서도 실시간 룰렛 회전 상태와 최종 당첨 결과를 완벽 동기화.
* **대규모 가위바위보 서바이벌 (`RockPaperScissors`) 공정 1/3 완전 무작위 슬롯 추첨:**
  - 참가자 선택 비율에 따라 확률이 조작된다는 의혹을 불식하기 위해 사회자 화면에 투명한 실시간 참가자 선택 현황(가위/바위/보/미제출 수) 표시.
  - 결과 공개 시 2.2초 동안 ✌️✊✋가 고속 회전하는 슬롯 머신 애니메이션 후 순수 1/3 수학적 완전 무작위로 패가 결정되도록 구현.
  - 전원 탈락/무승부 시 게임이 강제 종료되지 않고 전원 부활하여 재경기를 치르는 룰 추가.
* **서바이벌 OX 퀴즈 (`SurvivalOxQuiz`):** 미정의 함수 호출 오류(`setRevealed`)를 수정하고 참가자 선택 완료 후 정답 변경 잠금 배지 적용.

### v1.4.5
* **타이머/결과 마감 후 입력 변경 취약점 원천 차단 (Input Freeze):**
  - **심리 밸런스 (`MindSyncBalance`):** 15초 카운트다운 타이머 추가 및 호스트 결과 발표/마감 시 슬라이더 및 퀵 버튼을 즉시 비활성화(`disabled`)하여 타겟 수치 확인 후 숫자를 바꾸는 치팅 원천 차단.
  - **서바이벌 OX 퀴즈 (`SurvivalOxQuiz`):** 정답 공개(`oxRevealed`) 및 퀴즈 인덱스를 `room` 상태로 실시간 동기화하고 정답 공개 후 O/X 변경을 잠금 처리.
  - **가위바위보 서바이벌 (`RockPaperScissors`):** 선택 완료 시 버튼 즉시 잠금 및 결과 발표 전까지 선택 변경 불가 처리.
* **전 게임 재진입 및 새로고침 상태 꼬임 버그 수정 (State Cleanup):**
  - `GameContext`의 `startGame` 및 `returnToLobby` 실행 시 이전 게임의 라운드 결과, 탈락자 명단, 이전 선택값 등 잔여 세션 데이터(`rpsSurvivors`, `nunchiEliminated`, `bombHolder` 등)를 일괄 클리어하도록 개선.
  - 가위바위보, 눈치게임 등에서 탈락 후 새로고침하거나 호스트가 게임을 다시 들어갔을 때 영구 탈락 화면에 갇히던 버그 해결.
* **모바일 참가자 실시간 피드백 개선:**
  - 초성 퀴즈: 모바일 참가자 화면에 출제된 초성 실시간 표시 및 제출 답안 확인 UI 제공.
  - 시한폭탄: 폭탄 폭발 시 생존/폭발 여부 및 감점/보너스 피드백을 모바일 화면에 명확히 렌더링.

### v1.4.4
* **전체 미니게임 상시 `[🏆 포인트 정산하기]` 버튼 구축:** 12종 전 게임(줄다리기, 가위바위보, 블록 쌓기, 서바이벌 OX 퀴즈, 100m 스프린트, 시한폭탄, 눈치게임, 초성 퀴즈, 심리 밸런스, 럭키 룰렛, 정밀 스톱워치, 마피아 심판)의 사회자 헤더 `[🏠 로비로 돌아가기]` 바로 왼쪽에 `[🏆 포인트 정산하기]` 버튼을 상시 노출 및 정산 시 `[✅ 정산 완료]`로 시각적 전환.
* **로비 복귀 시 미정산 점수 자동 정산 로직:** 사회자가 정산 버튼을 깜빡하고 `[🏠 로비로 돌아가기]`를 누르더라도 점수가 유실되지 않고 자동으로 승자/생존자/참가팀에게 일괄 정산 후 복귀하도록 보완.
* **100인 대규모 동시 정산 성능 최적화:** `GameContext`에 `awardBatchPoints` 일괄 배치 정산 함수를 추가하여 100명 점수 동시 가산 시 렌더링 지연 및 중복 네트워크 패킷 발행 문제 원천 방지.

### v1.4.3
* **새로고침 팀 이탈 및 꼼수 방지 (Anti-Cheat):** `sessionStorage` 세션 저장소를 연동하여 플레이어가 게임 도중 새로고침을 해도 기존 팀/닉네임/점수를 자동 복원하여 팀 몰아주기나 재진입 꼼수를 원천 차단.
* **통합 일괄 정산 시스템:** 전 미니게임에 대해 `[🏆 일괄 정산하기]`와 `[🏠 로비로 돌아가기]` 버튼을 명확히 분리. 100명 대규모 인원 대상 원클릭 일괄 점수 반영 지원.
* **버전 정보 표시 통일:** 메인 Landing 페이지 및 Host 대시보드 버전 표기를 `v1.4.3`으로 일괄 동기화.

### v1.4.2
* **터치 반응성 및 연타 랙 개선:** 줄다리기(`TugOfWar`), 달리기(`RapidTapSprint`) 등 모바일 연타 게임에 `onPointerDown`, `touch-action: manipulation`, `user-select: none` 적용하여 누르고 있을 시 카운팅 멈춤 및 줌/스크롤 딜레이 해결.
* **서바이벌 OX 퀴즈 자동 정산:** 퀴즈 종료 시 최후 생존자 전원에게 설정 점수를 1인당 일괄 분배/가산하도록 개선.
* **폭탄 돌리기 점수 차감/보상 세분화:** 폭탄 폭발 시 소지자 감점 및 생존자 보너스 점수 분배 로직 적용.

### v1.4.1
* **미니게임 점수 미반영 오류 수정:** 줄다리기, 가위바위보, 블록 쌓기 등에서 게임 종료 후 점수 부여가 정상 처리되도록 로직 수정.

### v1.4.0
* **눈치게임 (Nunchi Game):** 사회자 화면에 생존자/탈락자 실시간 명단 추가 및 라운드 초기화 기능 추가.
* **초성 퀴즈 (Initial Word Quiz):** 사회자 직접 단어 출제 기능 추가 및 정답 공백/대소문자 처리 개선.

### v0.01
* Initial project setup.
* Added basic UI components and game structure (Header, Survival OX Quiz).
* Security patch: Configured `.gitignore` to prevent environment variables and API keys from being committed.
* Prepared repository for GitHub integration and initial deployment build.

### v1.2.0
* Added participant score syncing and host mini-board integration for real-time tracking.
* Restrict access directly to Landing; require host-generated room codes.
* Improved UI on Participant Mobile View.
* Added QR code capability to Host Dashboard.

### v1.3.0
* **Host Control & Sync:** Enforced team settings. When Host changes between Team and Solo mode, all active participants are forced back to the lobby form to re-enter.
* **Game Bugs Fixed:** Fixed infinite loops in Bomb Pass (clear passedBomb status) and Nunchi Game (added Safe/Passed state to prevent duplicate hits).
* **Lobby Enhancements:** Significantly enlarged QR code in Lobby and added an active, real-time connected users list to the Host Dashboard.

### v1.3.1
* **Sync Stability:** Refactored `GameContext.jsx` to use functional state updates (`updateRoomState`), resolving a closure stale-state bug where participant screens would hang indefinitely on 'Waiting...' despite the host starting games like Bomb Pass or Nunchi.
* **Host UI Improvement:** Added the active participant list directly to the room setup lobby, allowing the host to monitor incoming connections before finalizing the room.

### v1.3.2
* **Joining Flow Refactor:** Split the participant joining flow into two stages. Participants now connect and verify the room state before being presented with team selection, preventing cases where participants select obsolete teams while the host is still in the setup phase.
* **Participant Mobile UI Optimization:** Compacted the "Joined Dashboard" in the participant's waiting screen to reduce unnecessary scrolling. Prominently positioned the actual game/waiting status at the top of the mobile screen. Reduced excess vertical padding across all mobile mini-game views.

### v1.4.0 - v1.4.9
* **Game Enhancements & Bug Fixes:** Fixed infinite loops/freezes in Nunchi Game, Timer stall in TugOfWar, Input lock in Initial Word Quiz. Added strict elimination to RPS, team vs team matchups in TugOfWar, and physics animations to Lucky Roulette.
* **UI/UX Zero-Scroll & Theme Optimization:** Mobile and Host dashboard zero-scroll layout to minimize scrolling. Improved theme selector.
* **Anti-Cheat & Unified Settlement:** Added sessionStorage-based anti-cheat, post-timer input exploits fix, and an always-visible point settlement button across all 12 games.

### v1.5.0
* **Host Dashboard Optimization:** Removed unnecessary TMI text from the host header (e.g., QR instructions) to streamline the UI. Changed "메인 레크레이션 게임 모드" to "게임 리스트" and "현재 접속 중인 참가자" to "참가자(X명)".
* **Team Settings Simplification:** Reduced max team limit from 10 to 6 for better mobile and host UI. Simplified default team names (e.g., Red, Blue, Green, Yellow) and enabled the host to manually edit team names and scores directly from the dashboard.
* **Themes Overhaul:** Revamped the themes into 4 distinct colors: Blue, Pink, Green, and Yellow.
* **Logic Fixes:** Re-evaluated and fixed the mode toggle (Team ↔ Solo) transition logic to properly clear participant statuses without sync issues.

### v1.6.0 - v1.6.4
* **Host Controller Updates:** Added forced kick function (`KICK_PLAYER`) and Destroy Room (`DESTROY_ROOM`) functions.
* **Point Rebalancing:** Adjusted max possible points to 100 for all games.
* **LBTO Theme Addition:** Added LBTO Quiz questions mapping and settings.

### v1.7.0 - v1.7.2
* **Footer Cleanup & Team Bugs:** Removed footer on participant mobile screens. Fixed bug where solo mode showed team text.
* **Game Logic:** Fixed OX Quiz point logic (removed 50 pity points). Fixed Tug Of War points mismatch.

### v1.7.3
* **Critical Stability & Network Optimization:** Fixed massive bug where `destroyRoom` was exported from GameContext without being declared, crashing the app on initialization.
* **Anti-Freeze Logic:** Fixed `RapidTapSprint` participant timer freezing at 1 second. Fixed `NunchiGame` infinite loops on timeouts. Fixed `BombPass` duplicate explode triggers.
* **Caching Fix:** Updated `vercel.json` with UTF-8 `no-cache` directives to fix aggressive Vercel/Browser caching of broken builds.
