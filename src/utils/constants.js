/**
 * Application Constants & Game Metadata Registry
 * 앱 전반에 걸쳐 사용되는 고정값(상수)과 게임 메타데이터를 관리하는 파일입니다.
 * 팀 색상, 봇 닉네임, 제공되는 게임 목록 등을 이 곳에서 수정하여 쉽게 커스텀할 수 있습니다.
 */

/**
 * 참가자 팀 분류를 위한 프리셋 데이터.
 * 팀 이름, 색상(HEX), UI 적용을 위한 CSS 클래스를 포함합니다.
 * @type {Array<{id: string, name: string, color: string, bgClass: string}>}
 */
export const TEAM_PRESETS = [
  { id: 'team-1', name: 'Red', color: '#ff3b30', bgClass: 'team-red' },
  { id: 'team-2', name: 'Blue', color: '#007aff', bgClass: 'team-blue' },
  { id: 'team-3', name: 'Green', color: '#34c759', bgClass: 'team-green' },
  { id: 'team-4', name: 'Yellow', color: '#ffcc00', bgClass: 'team-yellow' },
  { id: 'team-5', name: 'Purple', color: '#af52de', bgClass: 'team-purple' },
  { id: 'team-6', name: 'Orange', color: '#ff9500', bgClass: 'team-orange' },
];

/**
 * 봇(가짜 유저) 추가 기능 사용 시 랜덤으로 부여될 닉네임 목록입니다.
 * @type {string[]}
 */
export const BOT_NICKNAMES = [
  '흥겨운사자', '빛나는토끼', '불꽃독수리', '무적의드래곤', '빛의매', '춤추는고양이',
  '바람의늑대', '열정의곰', '슈퍼판다', '질주하는표범', '초음속펭귄', '번개다람쥐',
  '승리의호랑이', '골든치타', '행운의코알라', '스피드돌고래', '최강의샤크', '환상의유니콘'
];

/**
 * 미니 게임들의 설정 정보 및 UI 표시 데이터를 담고 있는 배열입니다.
 * 새로운 게임을 추가하려면 컴포넌트를 만든 후 이 배열에 항목을 추가하면 됩니다.
 * 
 * id: 게임 컴포넌트를 매핑하기 위한 고유 식별자
 * title: 사용자에게 보여질 게임 이름
 * desc: 게임 규칙 및 설명
 * icon: 게임 아이콘(이모지)
 * tag: 성향/장르 태그
 * 
 * @type {Array<{id: string, title: string, desc: string, icon: string, tag: string}>}
 */
export const GAMES_METADATA = [
  {
    id: 'stopwatch',
    title: '⏱️ 정확히 10초 맞추기',
    desc: '10초에 가장 가깝게 멈추면 승리! (5초 뒤 타이머 블라인드)',
    icon: '⏱️',
    tag: '초정밀 순위'
  },
  {
    id: 'blockstack',
    title: '🧱 블록 높이 쌓기',
    desc: '좌우로 움직이는 블록을 타이밍 맞춰 눌러 가장 높이 쌓아보세요!',
    icon: '🧱',
    tag: '아케이드 리듬'
  },
  {
    id: 'oxquiz',
    title: '⭕❌ OX 퀴즈',
    desc: '살아남는 자가 승리한다! 실시간 투표 반영 OX 퀴즈.',
    icon: '🧠',
    tag: '서바이벌 라이브'
  },
  {
    id: 'sprint',
    title: '⚡ 미친듯이 연타하기 (100m 달리기)',
    desc: '10초 동안 스마트폰을 미친 듯이 터치해서 가장 먼저 결승선을 통과하세요!',
    icon: '⚡',
    tag: '10초 피지컬'
  },
  {
    id: 'mindsync',
    title: '⚖️ 텔레파시! 평균의 2/3 맞추기',
    desc: '1~100 중 숫자를 골라, 모두가 고른 숫자 평균의 2/3에 가장 가까운 사람이 승리!',
    icon: '⚖️',
    tag: '뇌섹 심리'
  },
  {
    id: 'bombpass',
    title: '💣 시한폭탄 돌리기',
    desc: '무작위 시간 뒤에 터지는 폭탄을 화면 탭으로 다른 팀에게 넘기는 서바이벌 폭탄 게임!',
    icon: '💣',
    tag: '긴장감 100%'
  },
  {
    id: 'initialword',
    title: '🅰️ 초성 맞추기 텔레파시',
    desc: '화면에 제시된 초성을 보고 가장 먼저 정답을 맞히는 팀이 점수를 가져가는 스피드 퀴즈.',
    icon: '🅰️',
    tag: '두뇌 풀가동'
  },
  {
    id: 'luckyroulette',
    title: '🎡 럭키 룰렛 점수 대박',
    desc: '게임 마지막 역전을 위한 룰렛! 점수를 뻥튀기하거나 벌칙을 부여하는 룰렛.',
    icon: '🎡',
    tag: '운수 대통'
  },
  {
    id: 'rockpaperscissors',
    title: '✊✌️✋ 다함께 가위바위보',
    desc: '100명이 동시에 호스트(AI)와 가위바위보 대결! 지거나 비기면 탈락합니다.',
    icon: '✊',
    tag: '최후의 1인'
  },
  {
    id: 'tugofwar',
    title: '🪢 영차영차! 100인 줄다리기',
    desc: '홀수 팀 vs 짝수 팀! 10초간 스마트폰을 가장 많이 터치한 진영이 승리!',
    icon: '🪢',
    tag: '팀워크 연타'
  },
  {
    id: 'nunchi',
    title: '🙈 눈치게임 (1부터 외치기)',
    desc: '타이밍을 재서 숫자를 누릅니다. 동시에 누르거나 끝까지 남으면 탈락!',
    icon: '🙈',
    tag: '스릴 만점'
  },
  {
    id: 'mafia',
    title: '🕵️ 마피아 게임 (사회자용)',
    desc: '복잡한 마피아 게임 직업 분배 및 밤/낮 진행을 자동으로 도와줍니다.',
    icon: '🕵️',
    tag: '사회자 보조 모드'
  }
];
