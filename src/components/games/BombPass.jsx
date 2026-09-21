import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Flame, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export const BombPass = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, awardPoints, returnToLobby, room, updateRoomState } = useGame();
  
  const gameState = room.bombState || 'ready';
  const timeLeft = room.bombTimeLeft || 0;
  const bombHolder = room.bombHolder || null;
  const [isSettled, setIsSettled] = useState(false);

  // Host simulation for bomb passing
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      const interval = setInterval(() => {
        if (room.bombTimeLeft <= 1) {
          updateRoomState({ bombState: 'exploded', bombTimeLeft: 0 });
          soundFx.playError();
          if (room.bombHolder) {
            awardPoints(room.bombHolder.id, -100, false);
          }
        } else {
          updateRoomState({ bombTimeLeft: room.bombTimeLeft - 1 });
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
          updateRoomState({ bombHolder: next });
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
    updateRoomState({ bombState: 'playing', bombTimeLeft: explosionTime, bombHolder: initialHolder });
    setIsSettled(false);
    soundFx.playSpookyNight();
  };

  const handlePassBomb = () => {
    submitPlayerInput(myPlayerId, { passedBomb: Date.now() });
    soundFx.playTick();
  };

  const handleSettlePoints = () => {
    if (isSettled) return;
    if (bombHolder) {
      // 폭탄 소지자는 200점 감점, 나머지 생존자는 300점 지급
      awardPoints(bombHolder.id, -200, false);
      const survivors = participants.filter(p => p.id !== bombHolder.id);
      survivors.forEach(s => {
        awardPoints(s.id, 300, false);
        if (s.teamId) awardPoints(s.teamId, 100, true);
      });
    } else {
      // 폭발 전 임의 정산: 전체 참가자에게 100점 지급
      participants.forEach(p => awardPoints(p.id, 100, false));
    }
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (!isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  if (userRole === 'participant') {
    const isExplodedHolder = gameState === 'exploded' && bombHolder?.id === myPlayerId;
    const isExplodedSurvivor = gameState === 'exploded' && bombHolder?.id !== myPlayerId;

    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>💣 시한폭탄 돌리기</h2>
        {gameState === 'ready' ? (
          <div style={{ color: 'var(--text-sub)', fontSize: '1.2rem' }}>🎮 호스트가 게임을 준비 중입니다. 잠시만 기다려주세요...</div>
        ) : gameState === 'playing' ? (
          bombHolder?.id === myPlayerId ? (
            <div>
              <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>💣🔥</div>
              <button 
                onClick={handlePassBomb} 
                className="btn-primary" 
                style={{ padding: '36px 30px', fontSize: '2.2rem', fontWeight: 900, background: 'var(--danger-color)', animation: 'pulse 0.4s infinite', width: '100%', maxWidth: '340px' }}
              >
                🔥 지금 넘겨!! (터치)
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🛡️</div>
              <div style={{ fontSize: '1.3rem', color: 'var(--success-color)', fontWeight: 800, marginBottom: '10px' }}>
                휴... 지금은 폭탄이 없습니다!
              </div>
              <p style={{ color: 'var(--text-sub)' }}>언제 내게 넘어올지 모릅니다. 긴장하세요!</p>
            </div>
          )
        ) : isExplodedHolder ? (
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>💥💥💥</div>
            <h3 style={{ color: 'var(--danger-color)', fontSize: '2.2rem', fontWeight: 900 }}>콰광!! 내 손에서 폭발했습니다!!</h3>
            <p style={{ color: 'var(--text-sub)', marginTop: '10px', fontSize: '1.1rem' }}>아쉽게도 폭탄을 제때 넘기지 못했습니다. (-200점)</p>
          </div>
        ) : isExplodedSurvivor ? (
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎉</div>
            <h3 style={{ color: 'var(--success-color)', fontSize: '2rem', fontWeight: 900 }}>생존 성공! 보너스 점수 획득!</h3>
            <p style={{ color: 'var(--text-sub)', marginTop: '10px', fontSize: '1.1rem' }}>
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
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          💣 시한폭탄 돌리기 (Bomb Pass)
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && (
            <button 
              onClick={handleSettlePoints} 
              disabled={isSettled}
              className="btn-primary" 
              style={{ background: isSettled ? '#555' : 'var(--success-color)', cursor: isSettled ? 'default' : 'pointer' }}
            >
              {isSettled ? '✅ 정산 완료' : '🏆 포인트 정산하기'}
            </button>
          )}
          <button onClick={handleReturnToLobby} className="btn-secondary">
            🏠 로비로 돌아가기
          </button>
        </div>
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
