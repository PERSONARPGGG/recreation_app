import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Activity, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const GAME_DURATION = 10;

export const TugOfWar = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, awardPoints, returnToLobby, room, updateRoomState, simulateBotGameInputs } = useGame();
  
  const [isSettled, setIsSettled] = useState(false);

  const gameState = room.tugState || 'ready';
  const timeLeft = room.tugTimeLeft || GAME_DURATION;
  const ropePosition = room.tugRopePos || 50;

  const timeLeftRef = useRef(GAME_DURATION);

  // Independent 1s Countdown Timer for Host
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      timeLeftRef.current = GAME_DURATION;
      const interval = setInterval(() => {
        timeLeftRef.current -= 1;
        if (timeLeftRef.current <= 0) {
          clearInterval(interval);
          updateRoomState({ tugState: 'finished', tugTimeLeft: 0 });
          soundFx.playSuccess();
        } else {
          updateRoomState({ tugTimeLeft: timeLeftRef.current });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userRole, gameState]); // DO NOT include ropePosition or room.tugTimeLeft

  // Rope Position Calculation based on Real & Bot Taps
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      // Determine side for each player: Odd teams/IDs = Left (Red), Even teams/IDs = Right (Blue)
      let leftTaps = 0;
      let rightTaps = 0;

      participants.forEach((p, index) => {
        const taps = p.lastInput?.taps || 0;
        let isLeft = false;
        if (p.teamId) {
          isLeft = p.teamId === 'team-1' || p.teamId === 'team-3' || p.teamId === 'team-5';
        } else {
          // Solo mode: assign by index/id
          const numId = parseInt(p.id.replace(/\D/g, '') || index, 10);
          isLeft = numId % 2 !== 0;
        }

        if (isLeft) {
          leftTaps += taps;
        } else {
          rightTaps += taps;
        }
      });

      const diff = leftTaps - rightTaps;
      // Each net tap moves rope by 1.8%, capped between 5% and 95%
      const newPos = Math.min(95, Math.max(5, 50 - (diff * 1.8)));
      
      if (Math.abs(newPos - ropePosition) >= 0.5) {
        updateRoomState({ tugRopePos: Math.round(newPos) });
      }
    }
  }, [participants, userRole, gameState, ropePosition, updateRoomState]);

  const startGameLogic = () => {
    // Reset all participants taps
    participants.forEach(p => submitPlayerInput(p.id, { taps: 0 }));
    timeLeftRef.current = GAME_DURATION;
    updateRoomState({ tugState: 'playing', tugTimeLeft: GAME_DURATION, tugRopePos: 50 });
    setIsSettled(false);
    soundFx.playSpookyNight();
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('tug');
    soundFx.playTick(700);
  };

  const handlePull = () => {
    if (gameState !== 'playing') return;
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const currentTaps = myPlayer?.lastInput?.taps || 0;
    submitPlayerInput(myPlayerId, { taps: currentTaps + 1, lastTapTime: Date.now() });
    soundFx.playTick(500 + ((currentTaps % 10) * 40));
  };

  const handleSettlePoints = () => {
    if (isSettled) return;
    if (ropePosition < 50) {
      awardPoints('team-1', 500, true);
      awardPoints('team-3', 500, true);
      awardPoints('team-5', 500, true);
    } else if (ropePosition > 50) {
      awardPoints('team-2', 500, true);
      awardPoints('team-4', 500, true);
      awardPoints('team-6', 500, true);
    } else {
      // 무승부 또는 경기 전 강제 정산: 참가한 전 팀에 200점 지급
      activeTeams.forEach(t => awardPoints(t.id, 200, true));
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
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', minHeight: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>🪢 100인 줄다리기</h2>
        {gameState === 'playing' ? (
          <button 
            onPointerDown={handlePull} 
            className="btn-primary" 
            style={{ 
              padding: '50px 20px', 
              fontSize: '2rem', 
              background: 'var(--primary-color)', 
              color: '#000',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          >
            당겨!! (터치 연타)
          </button>
        ) : gameState === 'finished' ? (
          <div><h3 style={{ color: 'var(--success-color)' }}>게임 종료!</h3><p>화면에서 결과를 확인하세요.</p></div>
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>준비...</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>🪢 영차영차! 100인 줄다리기</h2>
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

      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Activity size={80} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
            <button onClick={startGameLogic} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 30px' }}><Play size={20} /> 경기 시작</button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'finished') && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)', marginBottom: '40px' }}>{timeLeft}초</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 50px', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-color)' }}>홀수 팀 진영</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>짝수 팀 진영</div>
            </div>

            <div style={{ width: '80%', height: '20px', background: '#555', margin: '0 auto', position: 'relative', borderRadius: '10px' }}>
              <div style={{ 
                position: 'absolute', 
                top: '-20px', 
                left: `${ropePosition}%`, 
                width: '60px', 
                height: '60px', 
                background: '#ffd700', 
                borderRadius: '50%',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 20px rgba(255,215,0,0.8)'
              }}></div>
            </div>

            {gameState === 'finished' && (
              <h2 style={{ marginTop: '50px', fontSize: '2.5rem', color: 'var(--success-color)' }}>
                {ropePosition < 50 ? '홀수 팀 진영 승리!' : ropePosition > 50 ? '짝수 팀 진영 승리!' : '무승부!'}
              </h2>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
