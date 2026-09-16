import React from 'react';
import { useGame } from '../context/GameContext';
import { soundFx } from '../utils/sound';
import { StopwatchChallenge } from './games/StopwatchChallenge';
import { BlockStacker } from './games/BlockStacker';
import { SurvivalOxQuiz } from './games/SurvivalOxQuiz';
import { RapidTapSprint } from './games/RapidTapSprint';
import { MindSyncBalance } from './games/MindSyncBalance';
import { MafiaRefereeModule } from './mafia/MafiaRefereeModule';
import { Users, Trophy, Play, Zap, RefreshCw, Settings, Award, Shield, Sparkles, Monitor } from 'lucide-react';

export const HostDashboard = () => {
  const {
    room,
    setRoom,
    participants,
    activeTeams,
    populateBots,
    clearBots,
    startGame,
    awardPoints
  } = useGame();

  // If a game is active
  if (room.status === 'playing') {
    switch (room.activeGame) {
      case 'stopwatch': return <StopwatchChallenge />;
      case 'blockstack': return <BlockStacker />;
      case 'oxquiz': return <SurvivalOxQuiz />;
      case 'sprint': return <RapidTapSprint />;
      case 'mindsync': return <MindSyncBalance />;
      case 'mafia': return <MafiaRefereeModule />;
      default: break;
    }
  }

  // Calculate team scores
  const teamRankings = activeTeams.map(t => {
    const teamMembers = participants.filter(p => p.teamId === t.id);
    const totalScore = teamMembers.reduce((sum, p) => sum + p.score, 0);
    return { ...t, memberCount: teamMembers.length, totalScore };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const GAMES_LIST = [
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Host Banner & Room Control Bar */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'var(--primary-color)', color: '#000', padding: '4px 12px', borderRadius: '20px', fontWeight: 900, fontSize: '0.8rem' }}>
              MAIN PROJECTOR HOST
            </span>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>접속 방 코드: <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{room.code}</strong></span>
          </div>

          <h1 className="font-heading text-gradient" style={{ fontSize: '2rem', fontWeight: 900, marginTop: '6px' }}>
            {room.title}
          </h1>
        </div>

        {/* Quick Room Setup Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => setRoom({ ...room, mode: 'team' })}
              className={room.mode === 'team' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              🏆 팀전 ({room.teamCount}팀)
            </button>
            <button
              onClick={() => setRoom({ ...room, mode: 'solo' })}
              className={room.mode === 'solo' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              👤 개인전
            </button>
          </div>

          {/* 100-Bot Simulation Controls */}
          <button
            onClick={() => populateBots(100)}
            className="btn-primary"
            style={{ fontSize: '0.9rem', padding: '10px 18px', background: 'linear-gradient(135deg, #00f3ff 0%, #0077ff 100%)' }}
          >
            <Zap size={16} /> 100인 시뮬레이션 봇 참여!
          </button>

          <button
            onClick={clearBots}
            className="btn-secondary"
            style={{ padding: '10px 14px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} /> 초기화
          </button>

        </div>

      </div>

      {/* Team Score Leaderboard Banner (if Team Mode) */}
      {room.mode === 'team' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeTeams.length}, 1fr)`, gap: '14px' }}>
          {teamRankings.map((team, idx) => (
            <div
              key={team.id}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                borderColor: team.color,
                background: `linear-gradient(135deg, ${team.color}15 0%, rgba(0,0,0,0.4) 100%)`,
                position: 'relative'
              }}
            >
              {idx === 0 && (
                <div style={{ position: 'absolute', top: '-10px', right: '12px', background: '#ffd700', color: '#000', fontSize: '0.7rem', fontWeight: 900, padding: '2px 8px', borderRadius: '10px' }}>
                  👑 1위 선두
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: team.color, fontWeight: 800 }}>
                {team.name} ({team.memberCount}명)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '4px', color: '#fff' }}>
                {team.totalScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>PTS</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Game Selector Arcade Grid */}
      <h2 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '10px' }}>
        🎮 5대 이벤트 메인 게임 & 마피아 심판 모드
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {GAMES_LIST.map((g) => (
          <div
            key={g.id}
            className="glass-panel glass-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
            onClick={() => {
              soundFx.playSuccess();
              startGame(g.id);
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '2.5rem' }}>{g.icon}</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: 'rgba(0, 243, 255, 0.15)',
                  color: 'var(--primary-color)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid var(--primary-color)'
                }}>
                  {g.tag}
                </span>
              </div>

              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px', color: '#fff' }}>
                {g.title}
              </h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                {g.desc}
              </p>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ fontSize: '0.95rem', padding: '10px 20px' }}>
                <Play size={16} /> 게임 시작하기 ➔
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
