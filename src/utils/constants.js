// Application Constants & Game Metadata Registry

export const TEAM_PRESETS = [
  { id: 'team-1', name: '레드 타이거 (1팀)', color: '#ff3b30', bgClass: 'team-red' },
  { id: 'team-2', name: '블루 파이어 (2팀)', color: '#007aff', bgClass: 'team-blue' },
  { id: 'team-3', name: '그린 스톰 (3팀)', color: '#34c759', bgClass: 'team-green' },
  { id: 'team-4', name: '옐로우 썬 (4팀)', color: '#ffcc00', bgClass: 'team-yellow' },
  { id: 'team-5', name: '퍼플 갤럭시 (5팀)', color: '#af52de', bgClass: 'team-purple' },
  { id: 'team-6', name: '오렌지 스파크 (6팀)', color: '#ff9500', bgClass: 'team-orange' },
];

export const BOT_NICKNAMES = [
  '흥겨운사자', '빛나는토끼', '불꽃독수리', '무적의드래곤', '빛의매', '춤추는고양이',
  '바람의늑대', '열정의곰', '슈퍼판다', '질주하는표범', '초음속펭귄', '번개다람쥐',
  '승리의호랑이', '골든치타', '행운의코알라', '스피드돌고래', '최강의샤크', '환상의유니콘'
];

export const GAMES_METADATA = [
  {
    id: 'stopwatch',
    title: '⏱️ 0.000초 정밀 스톱워치 타겟 챌린지',
    desc: '10.000초에 0.001초 단위로 가장 가깝게 멈추는 타임어택 (5초 후 숫자가 숨겨집니다)',
    icon: '⏱️',
    tag: '초정밀 순위'
  },
  {
    id: 'blockstack',
    title: '🧱 초정밀 리듬 블록 탑 쌓기 (Precision Stacker)',
    desc: '움직이는 블록을 완벽한 타이밍에 떨어뜨려 100인 중 가장 높은 탑을 건설!',
    icon: '🧱',
    tag: '아케이드 리듬'
  },
  {
    id: 'oxquiz',
    title: '🧠 100인 서바이벌 OX 퀴즈',
    desc: '실시간 O/X 비율 그래프, 서바이벌 탈락 및 생존자 축하 연출',
    icon: '🧠',
    tag: '서바이벌 라이브'
  },
  {
    id: 'sprint',
    title: '⚡ 100인 실시간 탭 대격돌 100m 파워 스프린트',
    desc: '10초 동안 미친 듯이 연타하여 빔프로젝터 대형 트랙에서 펼쳐지는 레이싱 배틀',
    icon: '⚡',
    tag: '10초 피지컬'
  },
  {
    id: 'mindsync',
    title: '⚖️ 심리 밸런스 & 황금비율 타겟 게임 (2/3 Average)',
    desc: '1~100 수치 선택! 전체 평균의 2/3에 가장 가까운 명사수를 가리는 심리전',
    icon: '⚖️',
    tag: '뇌섹 심리'
  },
  {
    id: 'mafia',
    title: '🕵️ 보너스: 마피아 AI 심판 & 사회자 진행 보조',
    desc: '직업 자동 배분, 무드 BGM, 낮/밤 사회자 가이드 스크립트',
    icon: '🕵️',
    tag: '사회자 보조 모드'
  }
];
