# Recreation App

A recreational game web application.

## Patch Notes

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
