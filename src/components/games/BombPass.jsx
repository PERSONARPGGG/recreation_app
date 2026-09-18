import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Flame, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export const BombPass = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, awardPoints, returnToLobby, room, setRoom, broadcast } = useGame();
  
  const gameState = room.bombState || 'ready';
  const timeLeft = room.bombTimeLeft || 0;
  const bombHolder = room.bombHolder || null;

  const updateGameState = (updates) => {
    const nextRoom = { ...room, ...updates };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
  };

  // Host simulation for bomb passing
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      const interval = setInterval(() => {
        if (room.bombTimeLeft <= 1) {
          updateGameState({ bombState: 'exploded', bombTimeLeft: 0 });
          soundFx.playError();
        } else {
          updateGameState({ bombTimeLeft: room.bombTimeLeft - 1 });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userRole, gameState, room.bombTimeLeft]);

  // Read player input to pass bomb
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing' && participants.length > 0) {
      const activePlayers = participants.filter(p => !p.isBot || Math.random() > 0.95);
      
      const lastInputPlayer = activePlayers.find(p => p.lastInput?.passedBomb);
      if (lastInputPlayer) {
        // Find next target
        const others = participants.filter(p => p.id !== lastInputPlayer.id);
        if (others.length > 0) {
          const next = others[Math.floor(Math.random() * others.length)];
          updateGameState({ bombHolder: next });
          submitPlayerInput(lastInputPlayer.id, null);
          soundFx.playTick();
        }
      }
    }
  }, [participants, userRole, gameState, room.bombHolder]);

  const startGame = () => {
    const explosionTime = Math.floor(Math.random() * 20) + 15; // 15 to 35 seconds
    let initialHolder = null;
    if (participants.length > 0) {
      initialHolder = participants[Math.floor(Math.random() * participants.length)];
    }
    updateGameState({ bombState: 'playing', bombTimeLeft: explosionTime, bombHolder: initialHolder });
    soundFx.playSpookyNight();
  };

  const handlePassBomb = () => {
    submitPlayerInput(myPlayerId, { passedBomb: Date.now() });
    soundFx.playTick();
  };

  if (userRole === 'participant') {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>💣 시한폭탄 돌리기</h2>
        {gameState === 'playing' ? (
          bombHolder?.id === myPlayerId ? (
            <button onClick={handlePassBomb} className="btn-primary" style={{ padding: '40px', fontSize: '2rem', background: 'var(--danger-color)', animation: 'pulse 0.5s infinite' }}>
              🔥 폭탄 넘기기!
            </button>
          ) : (
            <div style={{ fontSize: '1.2rem', color: 'var(--text-sub)' }}>
              휴... 지금은 폭탄이 내게 없습니다. 대기하세요!
            </div>
          )
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>대기 중...</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          💣 시한폭탄 돌리기 (Bomb Pass)
        </h2>
        <button onClick={returnToLobby} className="btn-secondary">
          로비로 돌아가기
        </button>
      </div>

      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Flame size={80} color="var(--danger-color)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>무작위 시간에 폭탄이 터집니다!</h3>
            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 30px' }}>
              <Play size={20} /> 폭탄 타이머 시작
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '4rem',
              fontWeight: 900,
              color: 'var(--danger-color)',
              animation: timeLeft < 5 ? 'pulse 0.2s infinite' : 'pulse 1s infinite'
            }}>
              {timeLeft}초
            </div>
            <div style={{ marginTop: '30px', fontSize: '1.5rem' }}>
              현재 폭탄 소유자: 
              <strong style={{ color: bombHolder?.teamColor || '#fff', fontSize: '2rem', display: 'block', marginTop: '10px' }}>
                {bombHolder?.name || '아무도 없음'}
              </strong>
            </div>
          </div>
        )}

        {gameState === 'exploded' && (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', color: 'var(--danger-color)', marginBottom: '10px' }}>💥 펑! 💥</h1>
            <h2 style={{ fontSize: '2rem' }}>{bombHolder?.name} 님이 폭발했습니다!</h2>
            <button onClick={startGame} className="btn-primary" style={{ marginTop: '30px' }}>다시 하기</button>
          </div>
        )}
      </div>
    </div>
  );
};
