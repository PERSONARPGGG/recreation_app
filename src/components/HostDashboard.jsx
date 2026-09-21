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
            style={{ width: '100%', fontSize: '1.5rem', padding: '20px', animation: 'pulse-glow 2s infinite', marginBottom: '30px' }}
          >
            ✅ 팀 확정 및 방 개설하기
          </button>

          {/* Active Users List in Setup */}
          <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-sub)' }}>
              <Users size={18} /> 현재 대기 중인 접속자 ({participants.length}명)
            </h3>
            {participants.length === 0 ? (
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                아직 접속한 참가자가 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {participants.map(p => (
                  <div key={p.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
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
      <div className="glass-panel glass-panel-glow" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', padding: '8px', borderRadius: '12px', flexShrink: 0 }}>
            <QRCodeSVG value={`${window.location.origin}/?code=${room.code}`} size={90} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: 'var(--primary-color)', color: '#000', padding: '3px 10px', borderRadius: '20px', fontWeight: 900, fontSize: '0.75rem' }}>
                MAIN PROJECTOR HOST
              </span>
              <span style={{ color: 'var(--text-sub)', fontSize: '0.82rem' }}>접속 방 코드: <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{room.code}</strong></span>
            </div>

            <h1 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '4px', marginBottom: '4px' }}>
              {room.title}
            </h1>
            
            <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
              스마트폰 카메라로 QR을 스캔하여 즉시 입장할 수 있습니다.
            </div>
          </div>
        </div>

        {/* Quick Room Setup Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px' }}>
            <button
              onClick={() => {
                setRoom({ ...room, mode: 'team' });
                broadcast('CONFIG_CHANGE');
              }}
              className={room.mode === 'team' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            >
              🏆 팀전 ({room.teamCount}팀)
            </button>
            <button
              onClick={() => {
                setRoom({ ...room, mode: 'solo' });
                broadcast('CONFIG_CHANGE');
              }}
              className={room.mode === 'solo' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            >
              👤 개인전
            </button>
          </div>

          {/* 100-Bot Simulation Controls */}
          <button
            onClick={() => populateBots(100)}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'linear-gradient(135deg, #00f3ff 0%, #0077ff 100%)' }}
          >
            <Zap size={15} /> 100인 시뮬레이션 봇 참여!
          </button>

          <button
            onClick={clearBots}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={15} /> 초기화
          </button>

        </div>

      </div>

      {/* Team Score Leaderboard Banner (if Team Mode) */}
      {room.mode === 'team' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`, gap: '10px' }}>
          {teamRankings.map((team, idx) => (
            <div
              key={team.id}
              className="glass-panel"
              style={{
                padding: '12px 16px',
                borderColor: team.color,
                background: `linear-gradient(135deg, ${team.color}15 0%, rgba(0,0,0,0.4) 100%)`,
                position: 'relative'
              }}
            >
              {idx === 0 && (
                <div style={{ position: 'absolute', top: '-8px', right: '10px', background: '#ffd700', color: '#000', fontSize: '0.65rem', fontWeight: 900, padding: '2px 6px', borderRadius: '8px' }}>
                  👑 1위 선두
                </div>
              )}
              <div style={{ fontSize: '0.82rem', color: team.color, fontWeight: 800 }}>
                {team.name} ({team.memberCount}명)
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '2px', color: '#fff' }}>
                {team.totalScore}<span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>점</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Users Lobby List - Clean Grouping in Team Mode */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <h2 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--primary-color)" /> 현재 접속 중인 참가자 ({participants.length}명)
        </h2>
        {participants.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            아직 접속한 참가자가 없습니다. 메인 화면의 QR 코드를 스캔하도록 안내해 주세요.
          </div>
        ) : room.mode === 'team' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {activeTeams.map(team => {
              const members = participants.filter(p => p.teamId === team.id);
              return (
                <div key={team.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', border: `1px solid ${team.color}40` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: team.color, fontWeight: 800, fontSize: '0.85rem' }}>{team.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{members.length}명</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '80px', overflowY: 'auto', paddingRight: '2px' }}>
                    {members.map(m => (
                      <span key={m.id} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#fff' }}>
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '6px' }}>
            {participants.map(p => (
              <div key={p.id} className="glass-card" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>{p.score}점</span>
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

