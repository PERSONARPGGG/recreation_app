import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Flame, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

/**
 * BombPass 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
export const BombPass = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, awardBatchPoints, returnToLobby, room, updateRoomState } = useGame();
  const bombTimeRef = useRef(room.bombTimeLeft || 10);
  
  const gameState = room.bombState || 'ready';
  const timeLeft = room.bombTimeLeft || 0;
  const bombHolder = room.bombHolder || null;
  const [isSettled, setIsSettled] = useState(false);

  // Host simulation for bomb passing
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      bombTimeRef.current = room.bombTimeLeft || 10;
      const interval = setInterval(() => {
        bombTimeRef.current -= 1;
        if (bombTimeRef.current <= 0) {
          updateRoomState({ bombState: 'exploded', bombTimeLeft: 0 });
          soundFx.playError();
          if (room.bombHolder) {
            awardBatchPoints([{ targetId: room.bombHolder.id, points: -50, isTeam: false }]);
          }
          clearInterval(interval);
        } else {
          updateRoomState({ bombTimeLeft: bombTimeRef.current });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userRole, gameState]);

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
          updateRoomState({ bombHolder: next });
          submitPlayerInput(lastInputPlayer.id, null);
          soundFx.playTick();
        }
      }
    }
  }, [participants, userRole, gameState, room.bombHolder]);

  const startGame = () => {
    // Determine explosion time based on host config (default 20, random fuzzing +/- 5)
    const baseTime = room.bombTimeConfig || 20;
    const explosionTime = Math.floor(Math.random() * 10) - 5 + baseTime; 

    let initialHolder = null;
    if (participants.length > 0) {
      initialHolder = participants[Math.floor(Math.random() * participants.length)];
    }
    updateRoomState({ bombState: 'playing', bombTimeLeft: explosionTime, bombHolder: initialHolder });
    setIsSettled(false);
    soundFx.playSpookyNight();
  };

  const handlePassBomb = () => {
    submitPlayerInput(myPlayerId, { passedBomb: Date.now() });
    soundFx.playTick();
  };

  const handleSettlePoints = () => {
    if (isSettled || gameState !== 'exploded') return;
    const awards = [];
    if (bombHolder) {
      awards.push({ targetId: bombHolder.id, points: -50, isTeam: false });
      if (bombHolder.teamId && room.mode === 'team') awards.push({ targetId: bombHolder.teamId, points: -50, isTeam: true });
    }
    const survivors = participants.filter(p => p.id !== bombHolder?.id);
    survivors.forEach(s => {
      awards.push({ targetId: s.id, points: 50, isTeam: false });
      if (s.teamId && room.mode === 'team') awards.push({ targetId: s.teamId, points: 50, isTeam: true });
    });
    awardBatchPoints(awards);
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (gameState === 'exploded' && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  if (userRole === 'participant') {
    const isExplodedHolder = gameState === 'exploded' && bombHolder?.id === myPlayerId;
    const isExplodedSurvivor = gameState === 'exploded' && bombHolder?.id !== myPlayerId;

    return (
      <div className="glass-panel" style={{ padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--danger-color)' }}>💣 시한폭탄 돌리기</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
            {gameState === 'playing' ? '⚠️ 폭탄 활성화' : '대기'}
          </span>
        </div>

        {gameState === 'ready' ? (
          <div style={{ padding: '30px 10px', color: 'var(--text-sub)', fontSize: '1.1rem' }}>🎮 호스트가 게임을 준비 중입니다. 잠시만 기다려주세요...</div>
        ) : gameState === 'playing' ? (
          bombHolder?.id === myPlayerId ? (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>💣🔥</div>
              <button 
                onClick={handlePassBomb} 
                className="btn-primary animate-pulse-glow" 
                style={{ padding: '28px 24px', fontSize: '2rem', fontWeight: 900, background: 'var(--danger-color)', width: '100%', maxWidth: '320px', borderRadius: '24px' }}
              >
                🔥 지금 넘겨!! (터치)
              </button>
            </div>
          ) : (
            <div style={{ padding: '20px 10px' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>🛡️</div>
              <div style={{ fontSize: '1.2rem', color: 'var(--success-color)', fontWeight: 800, marginBottom: '6px' }}>
                휴... 지금은 폭탄이 없습니다!
              </div>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', margin: 0 }}>언제 내게 넘어올지 모릅니다. 긴장하세요!</p>
            </div>
          )
        ) : isExplodedHolder ? (
          <div style={{ padding: '16px 10px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>💥💥💥</div>
            <h3 style={{ color: 'var(--danger-color)', fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>콰광!! 내 손에서 폭발했습니다!!</h3>
            <p style={{ color: 'var(--text-sub)', marginTop: '8px', fontSize: '0.95rem' }}>아쉽게도 폭탄을 제때 넘기지 못했습니다. (-50점)</p>
          </div>
        ) : isExplodedSurvivor ? (
          <div style={{ padding: '16px 10px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>🎉</div>
            <h3 style={{ color: 'var(--success-color)', fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>생존 성공! 보너스 점수 획득!</h3>
            <p style={{ color: 'var(--text-sub)', marginTop: '8px', fontSize: '0.95rem' }}>
              [{bombHolder?.name || '참가자'}]님의 손에서 폭탄이 폭발했습니다!
            </p>
          </div>
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>대기 중...</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
          💣 시한폭탄 돌리기 (Bomb Pass)
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {userRole === 'host' && (
            <button 
              onClick={handleSettlePoints} 
              disabled={isSettled || gameState !== 'exploded'}
              className="btn-primary" 
              style={{ 
                background: isSettled ? '#555' : gameState !== 'exploded' ? '#333' : 'var(--success-color)', 
                cursor: isSettled || gameState !== 'exploded' ? 'not-allowed' : 'pointer',
                opacity: (gameState !== 'exploded' && !isSettled) ? 0.6 : 1,
                padding: '6px 14px', fontSize: '0.85rem'
              }}
            >
              {isSettled ? '✅ 정산 완료' : gameState !== 'exploded' ? '⏳ 폭발 후 정산 가능' : '🏆 포인트 정산하기'}
            </button>
          )}
          <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            🏠 로비로
          </button>
        </div>
      </div>

      <div className="glass-panel glass-panel-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px 16px' }}>
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Flame size={60} color="var(--danger-color)" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '14px' }}>무작위 시간에 폭탄이 터집니다!</h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <label style={{ color: 'var(--text-sub)' }}>평균 터지는 시간(초):</label>
              <input 
                type="number" 
                value={room.bombTimeConfig || 20} 
                onChange={e => updateRoomState({ bombTimeConfig: Math.max(5, parseInt(e.target.value) || 20) })}
                style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid var(--primary-color)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
              />
            </div>

            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.1rem', padding: '12px 28px' }}>
              <Play size={18} /> 폭탄 타이머 시작
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
