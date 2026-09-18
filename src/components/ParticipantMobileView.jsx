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
    <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Mobile Header Banner */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,243,255,0.15)', color: 'var(--primary-color)', padding: '4px 12px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>
          <Smartphone size={14} /> 모바일 참가자 모드
        </div>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
          {room.title}
        </h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '4px' }}>
          참여 중인 방: <strong style={{ color: '#fff' }}>{room.code}</strong>
        </div>
      </div>

      {/* Joined Dashboard */}
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--button-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 14px auto',
          boxShadow: '0 0 20px var(--primary-glow)'
        }}>
          👤
        </div>

        <h3 className="font-heading" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          {me.name} 님 환영합니다!
        </h3>

        {room.mode === 'team' && (
          <div style={{ marginTop: '12px' }}>
            <span className={`team-badge`} style={{ fontSize: '1rem', padding: '8px 18px', background: `${me.teamColor}25`, border: `1px solid ${me.teamColor}`, color: me.teamColor }}>
              {me.teamName} 소속
            </span>
          </div>
        )}

        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '24px',
          borderRadius: '16px',
          margin: '24px 0',
          border: '1px solid var(--card-border)'
        }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--text-sub)' }}>현재 내 점수</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-color)' }}>
            {me.score} <span style={{ fontSize: '1.2rem' }}>PTS</span>
          </div>
        </div>

        <div style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'rgba(0, 243, 255, 0.08)',
          border: '2px dashed var(--primary-color)',
          color: 'var(--text-sub)',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          boxShadow: 'inset 0 0 20px rgba(0, 243, 255, 0.1)'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ display: 'inline-block', animation: 'spin 3s linear infinite', fontSize: '1.5rem' }}>⏳</span>
          </div>
          <strong style={{ color: '#fff', fontSize: '1.2rem', display: 'block', marginBottom: '8px' }}>
            진행자의 게임 시작을 대기 중입니다!
          </strong>
          곧 게임이 시작되면 이 화면이 컨트롤러로 변합니다.<br/>
          빔프로젝터 메인 화면을 주목해 주세요.
        </div>

      </div>

    </div>
  );
};
