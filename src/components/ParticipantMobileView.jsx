import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { soundFx } from '../utils/sound';
import { GameRenderer } from './games/GameRenderer';
import { Smartphone, User } from 'lucide-react';

export const ParticipantMobileView = () => {
  const {
    room,
    participants,
    activeTeams,
    myPlayerId,
    myPlayerName,
    myTeamId
  } = useGame();

  // Find my player object
  const me = participants.find(p => p.id === myPlayerId) || {
    name: myPlayerName || '참가자',
    score: 0,
    teamName: activeTeams.find(t => t.id === myTeamId)?.name || '개인',
    teamColor: activeTeams.find(t => t.id === myTeamId)?.color || '#00f3ff'
  };

  // Render current active game if in playing state
  if (room.status === 'playing') {
    return <GameRenderer activeGame={room.activeGame} />;
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Compact Mobile Header Banner */}
      <div className="glass-panel" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
          {room.title}
        </h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
          <strong style={{ color: '#fff' }}>{room.code}</strong>
        </div>
      </div>

      {/* Main Status Area - Prominent and at the top */}
      <div style={{
        padding: '20px 16px', borderRadius: '16px', background: 'rgba(0, 243, 255, 0.08)',
        border: '2px dashed var(--primary-color)', color: 'var(--text-sub)',
        textAlign: 'center', fontSize: '1rem', lineHeight: '1.5',
        boxShadow: 'inset 0 0 20px rgba(0, 243, 255, 0.1)',
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        <div style={{ animation: 'spin 3s linear infinite', fontSize: '1.8rem' }}>⏳</div>
        <strong style={{ color: '#fff', fontSize: '1.2rem', display: 'block' }}>
          진행자의 게임 시작을 대기 중입니다!
        </strong>
        <p style={{ fontSize: '0.9rem', margin: 0 }}>
          게임이 시작되면 즉시 모바일 컨트롤러로 변합니다.<br/>
          메인 스크린을 주목해 주세요.
        </p>
      </div>

      {/* Compact Joined Dashboard */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: 'var(--button-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
            boxShadow: '0 0 10px var(--primary-glow)'
          }}>👤</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{me.name}</div>
            {room.mode === 'team' && (
              <div style={{ fontSize: '0.8rem', color: me.teamColor, fontWeight: 700 }}>{me.teamName} 소속</div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>내 점수</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-color)' }}>{me.score} <span style={{ fontSize: '0.8rem' }}>PTS</span></div>
        </div>
      </div>

    </div>
  );
};
