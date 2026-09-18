import React from 'react';
import { useGame } from '../context/GameContext';
import { soundFx } from '../utils/sound';
import { GAMES_METADATA } from '../utils/constants';
import { GameRenderer } from './games/GameRenderer';
import { HostControls } from './HostControls';
import { ParticipantMiniBoard } from './ParticipantMiniBoard';
import { Zap, RefreshCw, Play, QrCode, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const HostDashboard = () => {
  const {
    room,
    setRoom,
    participants,
    activeTeams,
    populateBots,
    clearBots,
    startGame,
    confirmRoomSetup,
    broadcast
  } = useGame();

  // Render current active game if in playing state
  if (room.status === 'playing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <GameRenderer activeGame={room.activeGame} />
        </div>
        <ParticipantMiniBoard />
        <HostControls />
      </div>
    );
  }

  if (room.status === 'setup') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          <h2 className="font-heading text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>방 개설 기본 설정</h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: '30px' }}>게임 모드와 팀 갯수를 먼저 설정한 뒤 방을 개방합니다.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
            <button
              onClick={() => setRoom({ ...room, mode: 'team' })}
              className={room.mode === 'team' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '1.2rem', padding: '15px 30px' }}
            >
              🏆 팀전 모드
            </button>
            <button
              onClick={() => setRoom({ ...room, mode: 'solo' })}
              className={room.mode === 'solo' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '1.2rem', padding: '15px 30px' }}
            >
              👤 개인전 모드
            </button>
          </div>

          {room.mode === 'team' && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>몇 개의 팀으로 진행할까요?</h3>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                <button 
                  onClick={() => setRoom({ ...room, teamCount: Math.max(2, room.teamCount - 1) })}
                  className="btn-secondary" style={{ width: '50px', height: '50px', fontSize: '1.5rem', padding: 0 }}
                >-</button>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-color)' }}>{room.teamCount}</span>
                <button 
                  onClick={() => setRoom({ ...room, teamCount: Math.min(10, room.teamCount + 1) })}
                  className="btn-secondary" style={{ width: '50px', height: '50px', fontSize: '1.5rem', padding: 0 }}
                >+</button>
              </div>
            </div>
          )}

          <button 
            onClick={() => confirmRoomSetup()}
            className="btn-primary" 
            style={{ width: '100%', fontSize: '1.5rem', padding: '20px', animation: 'pulse-glow 2s infinite' }}
          >
            ✅ 팀 확정 및 방 개설하기
          </button>
        </div>
      </div>
    );
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
          
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: '16px' }}>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '12px' }}>
              <QRCodeSVG value={`${window.location.origin}/?code=${room.code}`} size={120} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', color: 'var(--text-sub)', marginBottom: '8px' }}>스마트폰 카메라로 스캔하여 즉시 입장하세요!</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-color)' }}>대규모 라이브 서버 접속용 QR</div>
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>참여자는 이 QR을 통해 자동 로그인됩니다.</div>
            </div>
          </div>
        </div>

        {/* Quick Room Setup Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => {
                setRoom({ ...room, mode: 'team' });
                broadcast('CONFIG_CHANGE');
              }}
              className={room.mode === 'team' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            >
              🏆 팀전 ({room.teamCount}팀)
            </button>
            <button
              onClick={() => {
                setRoom({ ...room, mode: 'solo' });
                broadcast('CONFIG_CHANGE');
              }}
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

      {/* Active Users Lobby List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 className="font-heading" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--primary-color)" /> 현재 접속 중인 참가자 ({participants.length}명)
        </h2>
        {participants.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-sub)' }}>
            아직 접속한 참가자가 없습니다. 메인 화면의 QR 코드를 스캔하도록 안내해 주세요.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
            {participants.map(p => (
              <div key={p.id} className="glass-card" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                {room.mode === 'team' && (
                  <span style={{ fontSize: '0.75rem', color: p.teamColor, fontWeight: 700 }}>
                    {p.teamName}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Selector Arcade Grid */}
      <h2 className="font-heading" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '10px' }}>
        🎮 메인 레크레이션 게임 모드
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {GAMES_METADATA.map((g) => (
          <div
            key={g.id}
            className="glass-panel glass-card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
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

      <HostControls />
    </div>
  );
};

