import React from 'react';
import { useGame } from '../context/GameContext';
import { soundFx } from '../utils/sound';
import { GAMES_METADATA } from '../utils/constants';
import { GameRenderer } from './games/GameRenderer';
import { Zap, RefreshCw, Play } from 'lucide-react';

export const HostDashboard = () => {
  const {
    room,
    setRoom,
    participants,
    activeTeams,
    populateBots,
    clearBots,
    startGame
  } = useGame();

  // Render current active game if in playing state
  if (room.status === 'playing') {
    return <GameRenderer activeGame={room.activeGame} />;
  }

  // Calculate team scores for lobby view
  const teamRankings = activeTeams.map(t => {
    const teamMembers = participants.filter(p => p.teamId === t.id);
    const totalScore = teamMembers.reduce((sum, p) => sum + p.score, 0);
    return { ...t, memberCount: teamMembers.length, totalScore };
  }).sort((a, b) => b.totalScore - a.totalScore);

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
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: '14px' }}>
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
        {GAMES_METADATA.map((g) => (
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
