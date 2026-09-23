import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { soundFx } from '../utils/sound';
import { GameRenderer } from './games/GameRenderer';
import { Smartphone, User, PlayCircle } from 'lucide-react';
import { GAMES_METADATA } from '../utils/constants';

/**
 * ParticipantMobileView 컴포넌트
 * 참가자가 모바일 브라우저로 접속했을 때 보여지는 화면입니다.
 * 게임 대기 중일 때는 내 정보와 점수를 표시하고, 게임이 시작되면 GameRenderer를 띄워 모바일 컨트롤러 역할을 수행합니다.
 */
export const ParticipantMobileView = () => {
  const {
    room,
    participants,
    activeTeams,
    myPlayerId,
    myPlayerName,
    myTeamId
  } = useGame();

  const [isReady, setIsReady] = React.useState(false);
  const [isFull, setIsFull] = React.useState(false);
  React.useEffect(() => {
    const onFullscreenChange = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
      document.exitFullscreen().catch(e => console.log(e));
    }
  };

  // Kick logic & Room destroy logic
  React.useEffect(() => {
    if (room.status === 'destroyed') {
      alert('방이 종료되었습니다.');
      localStorage.clear();
      window.location.reload();
    }
  }, [room.status]);

  React.useEffect(() => {
    if (!roomChannel) return;
    const handleEvents = (payload) => {
      if (payload.event === 'KICK_PLAYER' && payload.payload.targetId === myPlayerId) {
        alert('방에서 강제 퇴장되었습니다.');
        localStorage.clear();
        window.location.reload();
      }
      if (payload.event === 'DESTROY_ROOM') {
        alert('방이 종료되었습니다.');
        localStorage.clear();
        window.location.reload();
      }
    };
    roomChannel.on('broadcast', { event: 'KICK_PLAYER' }, handleEvents);
    roomChannel.on('broadcast', { event: 'DESTROY_ROOM' }, handleEvents);
    return () => {
      // Supabase unsubscribe handle logic if needed, simplified here
    };
  }, [roomChannel, myPlayerId]);

  React.useEffect(() => {
    const meExists = participants.find(p => p.id === myPlayerId);
    if (!meExists && participants.length > 0 && isReady) {
      alert('방에서 추방되었습니다.');
      localStorage.clear();
      window.location.reload();
    }
  }, [participants, myPlayerId, isReady]);


  // 리셋: 방의 상태가 'preview'로 막 진입했을 때 isReady를 false로 초기화
  React.useEffect(() => {
    if (room.status === 'preview') {
      setIsReady(false);
    }
  }, [room.status, room.activeGame]);

  // Find my player object
  const me = participants.find(p => p.id === myPlayerId) || {
    name: myPlayerName || '참가자',
    score: 0,
    teamName: activeTeams.find(t => t.id === myTeamId)?.name || '개인',
    teamColor: activeTeams.find(t => t.id === myTeamId)?.color || '#00f3ff'
  };

  // 미리보기(preview) 또는 카운트다운(countdown) 상태
  if (room.status === 'preview' || room.status === 'countdown') {
    const activeGameMeta = GAMES_METADATA.find(g => g.id === room.activeGame);
    return (
      <div style={{ height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ padding: '30px 20px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '15px' }}>{activeGameMeta?.icon}</span>
          <h2 className="font-heading text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{activeGameMeta?.title}</h2>
          
          {room.status === 'preview' ? (
            !isReady ? (
              <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '12px' }}>
                  게임 규칙 안내
                </div>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', margin: '0 0 20px 0' }}>
                  {activeGameMeta?.desc}
                </p>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                  onClick={() => setIsReady(true)}
                >
                  <PlayCircle size={20} /> 이해했어요 (준비 완료)
                </button>
              </div>
            ) : (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ animation: 'spin 3s linear infinite', fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                  준비 완료!
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-sub)', marginTop: '8px' }}>
                  진행자가 게임을 시작할 때까지 대기해 주세요.
                </div>
              </div>
            )
          ) : (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-sub)' }}>게임이 시작됩니다!</div>
              <div style={{ 
                fontSize: '5rem', fontWeight: 900, color: 'var(--danger-color)', 
                animation: 'pulse-glow 1s infinite'
              }}>
                {room.countdown}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 현재 상태가 'playing' (게임 중)이면 로비 화면을 숨기고 실제 미니 게임 화면으로 전환합니다.
  if (room.status === 'playing') {
    return (
      <div style={{ width: '100%', height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <GameRenderer activeGame={room.activeGame} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100dvh', overflow: 'hidden', padding: '12px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      
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
    </div>
  );
};
