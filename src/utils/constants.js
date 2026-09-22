// Application Constants & Game Metadata Registry

export const TEAM_PRESETS = [
  { id: 'team-1', name: 'Red', color: '#ff3b30', bgClass: 'team-red' },
  { id: 'team-2', name: 'Blue', color: '#007aff', bgClass: 'team-blue' },
  { id: 'team-3', name: 'Green', color: '#34c759', bgClass: 'team-green' },
  { id: 'team-4', name: 'Yellow', color: '#ffcc00', bgClass: 'team-yellow' },
  { id: 'team-5', name: 'Purple', color: '#af52de', bgClass: 'team-purple' },
  { id: 'team-6', name: 'Orange', color: '#ff9500', bgClass: 'team-orange' },
];

export const BOT_NICKNAMES = [
  '흥겨운사자', '빛나는토끼', '불꽃독수리', '무적의드래곤', '빛의매', '춤추는고양이',
  '바람의늑대', '열정의곰', '슈퍼판다', '질주하는표범', '초음속펭귄', '번개다람쥐',
  '승리의호랑이', '골든치타', '행운의코알라', '스피드돌고래', '최강의샤크', '환상의유니콘'
];

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
