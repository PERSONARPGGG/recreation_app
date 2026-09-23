import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Activity, Play, Swords, RotateCcw, Zap } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const GAME_DURATION = 10;

/**
 * TugOfWar 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
export const TugOfWar = () => {
  const { userRole, activeTeams, participants, myPlayerId, submitPlayerInput, resetAllPlayerInputs, awardBatchPoints, returnToLobby, room, updateRoomState, simulateBotGameInputs } = useGame();
  
  const [isSettled, setIsSettled] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapCountRef = useRef(tapCount);
  const lastSyncedTapCountRef = useRef(tapCount);
  
  useEffect(() => {
    tapCountRef.current = tapCount;
  }, [tapCount]);

  const gameState = room.tugState || 'ready'; // 'ready' | 'playing' | 'finished'
  const timeLeft = room.tugTimeLeft !== undefined ? room.tugTimeLeft : GAME_DURATION;
  const ropePosition = room.tugRopePos !== undefined ? room.tugRopePos : 50;

  // Selected teams for the matchup (default: Team 1 vs Team 2, or Red Alliance vs Blue Alliance)
  const leftTeamId = room.tugLeftTeamId || activeTeams[0]?.id || 'team-1';
  const rightTeamId = room.tugRightTeamId || activeTeams[1]?.id || 'team-2';
  const matchupMode = room.tugMatchupMode || 'alliance'; // 'alliance' (홍군 연합 vs 청군 연합) or 'direct' (특정 2팀 1:1)

  const leftTeamObj = activeTeams.find(t => t.id === leftTeamId) || activeTeams[0] || { name: '홍군 연합', color: '#ff3b30' };
  const rightTeamObj = activeTeams.find(t => t.id === rightTeamId) || activeTeams[1] || { name: '청군 연합', color: '#007aff' };

  const timeLeftRef = useRef(GAME_DURATION);

  // Helper to determine if a player belongs to the Left side
  const isPlayerOnLeftSide = (p, index = 0) => {
    if (matchupMode === 'direct') {
      return p?.teamId === leftTeamId;
    }
    // Alliance mode: Odd teams or odd index = Left, Even teams or even index = Right
    if (p?.teamId && typeof p.teamId === 'string') {
      const teamNum = parseInt(p.teamId.replace('team-', ''), 10);
      if (!isNaN(teamNum)) return teamNum % 2 !== 0;
    }
    const idStr = String(p?.id || index);
    const numId = parseInt(idStr.replace(/\D/g, '') || index, 10);
    return numId % 2 !== 0;
  };

  // Calculate live tap stats
  let leftTaps = 0;
  let rightTaps = 0;
  let leftCount = 0;
  let rightCount = 0;

  participants.forEach((p, index) => {
    const isLeft = isPlayerOnLeftSide(p, index);
    const taps = p.lastInput?.taps || 0;
    if (isLeft) {
      leftCount++;
      leftTaps += taps;
    } else {
      rightCount++;
      rightTaps += taps;
    }
  });

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
  }, [userRole, gameState]);

  // Rope Position Calculation based on Real & Bot Taps
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      const diff = leftTaps - rightTaps;
      // Each net tap pulls rope by 1.8%, capped between 5% and 95%
      const newPos = Math.min(95, Math.max(5, 50 - (diff * 1.8)));

      // Early Knockout win if pulled to end zones
      if (newPos <= 10 || newPos >= 90) {
        updateRoomState({ tugRopePos: Math.round(newPos), tugState: 'finished', tugTimeLeft: 0 });
        soundFx.playSuccess();
        return;
      }

      if (Math.abs(newPos - ropePosition) >= 0.5) {
        updateRoomState({ tugRopePos: Math.round(newPos) });
      }
    }
  }, [participants, userRole, gameState, ropePosition, leftTaps, rightTaps]);

  const startGameLogic = () => {
    resetAllPlayerInputs();
    timeLeftRef.current = GAME_DURATION;
    updateRoomState({
      tugState: 'playing',
      tugTimeLeft: GAME_DURATION,
      tugRopePos: 50,
      tugLeftTeamId: leftTeamId,
      tugRightTeamId: rightTeamId,
      tugMatchupMode: matchupMode,
    });
    setIsSettled(false);
    soundFx.playSpookyNight();
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('tug');
    soundFx.playTick(700);
  };

  const handlePull = () => {
    if (gameState !== 'playing') return;
    const nextTap = tapCount + 1;
    setTapCount(nextTap);
    soundFx.playTick(500 + ((nextTap % 10) * 40));
  };

  // Sync tapCount to Host every 250ms to prevent freezing
  useEffect(() => {
    if (userRole === 'participant' && gameState === 'playing') {
      const syncInterval = setInterval(() => {
        if (tapCountRef.current !== lastSyncedTapCountRef.current) {
          submitPlayerInput(myPlayerId, { taps: tapCountRef.current, lastTapTime: Date.now() });
          lastSyncedTapCountRef.current = tapCountRef.current;
        }
      }, 500);
      return () => {
        clearInterval(syncInterval);
        if (tapCountRef.current !== lastSyncedTapCountRef.current) {
          submitPlayerInput(myPlayerId, { taps: tapCountRef.current, lastTapTime: Date.now() });
        }
      };
    }
  }, [userRole, gameState, submitPlayerInput, myPlayerId]);

  // Determine winner
  const winnerSide = ropePosition < 50 ? 'left' : ropePosition > 50 ? 'right' : 'draw';
  const leftLabel = matchupMode === 'direct' ? leftTeamObj.name : '🔴 홍군 연합 (1·3·5팀)';
  const rightLabel = matchupMode === 'direct' ? rightTeamObj.name : '🔵 청군 연합 (2·4·6팀)';
  const winnerTitle = winnerSide === 'left' ? `${leftLabel} 승리!` : winnerSide === 'right' ? `${rightLabel} 승리!` : '무승부 (DRAW)!';

  const handleSettlePoints = () => {
    if (isSettled || gameState !== 'finished') return;

    const awards = [];
    participants.forEach((p, idx) => {
      const isLeft = isPlayerOnLeftSide(p, idx);
      const isWin = (winnerSide === 'left' && isLeft) || (winnerSide === 'right' && !isLeft);
      const points = isWin ? 100 : winnerSide === 'draw' ? 50 : 20;

      awards.push({ targetId: p.id, points, isTeam: false });
      if (p.teamId && room.mode === 'team') awards.push({ targetId: p.teamId, points, isTeam: true });
    });
    awardBatchPoints(awards);

    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (gameState === 'finished' && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  const myPlayer = participants.find(p => p.id === myPlayerId);
  const myIndex = participants.findIndex(p => p.id === myPlayerId);
  const myIsLeft = isPlayerOnLeftSide(myPlayer || {}, myIndex >= 0 ? myIndex : 0);
  const mySideLabel = myIsLeft ? leftLabel : rightLabel;
  const mySideColor = myIsLeft ? '#ff3b30' : '#007aff';
  const myTaps = myPlayer?.lastInput?.taps || 0;

  // Participant View
  if (userRole === 'participant') {
    return (
      <div className="glass-panel" style={{ padding: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-color)' }}>🪢 줄다리기</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffd700' }}>⏱️ {timeLeft}초</span>
        </div>
        
        {/* Matchup & Affiliation Tag */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <span style={{ color: '#ff3b30', fontWeight: 800 }}>{leftLabel}</span>
          <span style={{ color: '#ffd700', fontWeight: 900 }}>VS</span>
          <span style={{ color: '#007aff', fontWeight: 800 }}>{rightLabel}</span>
        </div>

        {/* Player Team Affiliation Banner */}
        <div className="glass-card" style={{ padding: '8px 14px', maxWidth: '380px', margin: '0 auto', border: `2px solid ${mySideColor}`, background: `${mySideColor}20`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>소속: </span>
            <strong style={{ fontSize: '1.05rem', color: mySideColor }}>{mySideLabel}</strong>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#fff' }}>
            내 기여: <strong style={{ color: '#ffd700' }}>{myTaps}회</strong>
          </div>
        </div>

        {/* Rope Progress Bar */}
        <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, marginBottom: '4px' }}>
            <span style={{ color: '#ff3b30' }}>🔴 홍군 {leftTaps}회</span>
            <span style={{ color: '#007aff' }}>🔵 청군 {rightTaps}회</span>
          </div>

          <div style={{ height: '20px', borderRadius: '10px', background: '#1a1a2e', position: 'relative', overflow: 'hidden', border: '2px solid #555' }}>
            {/* Center line marker */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: '#ffd700', zIndex: 2 }} />
            {/* Rope marker */}
            <div style={{
              position: 'absolute',
              top: '2px',
              bottom: '2px',
              left: `${100 - ropePosition}%`,
              transform: 'translateX(-50%)',
              width: '18px',
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 0 10px #fff',
              zIndex: 3,
              transition: 'left 0.15s ease-out'
            }} />
          </div>
        </div>

        {gameState === 'ready' ? (
          <div style={{ padding: '20px 10px', color: 'var(--text-sub)', fontSize: '1.1rem' }}>
            🎮 호스트의 게임 시작 신호를 기다리고 있습니다...
          </div>
        ) : gameState === 'playing' ? (
          <div style={{ marginTop: '6px' }}>
            <button 
              onClick={handlePull} 
              className="btn-primary animate-pulse-glow" 
              style={{ 
                padding: '24px 20px', 
                fontSize: '2rem', 
                fontWeight: 900, 
                borderRadius: '24px',
                width: '100%', 
                maxWidth: '320px', 
                background: mySideColor,
                boxShadow: `0 0 30px ${mySideColor}80`,
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              🔥 영차!! 당겨라!!
            </button>
            <p style={{ marginTop: '8px', color: 'var(--text-sub)', fontSize: '0.85rem' }}>화면을 미친듯이 연타하세요!!</p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '16px', maxWidth: '380px', margin: '0 auto', border: '2px solid #ffd700', background: 'rgba(255,215,0,0.1)', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffd700', margin: 0 }}>🏆 경기 종료!</h3>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
              {winnerTitle}
            </div>
            <p style={{ color: 'var(--text-sub)', marginTop: '6px', fontSize: '0.85rem', margin: 0 }}>
              승리 팀 전원 +300점 지급 완료!
            </p>
          </div>
        )}
      </div>
    );
  }

  // Host View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
          🪢 100인 영차영차 줄다리기
        </h2>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {userRole === 'host' && (
            <>
              <button onClick={handleSimulateBots} disabled={gameState !== 'playing'} className="btn-secondary" style={{ border: '1px solid var(--primary-color)', padding: '6px 12px', fontSize: '0.85rem' }}>
                <Zap size={14} /> 봇 연타 시뮬레이션
              </button>
              <button 
                onClick={handleSettlePoints} 
                disabled={isSettled || gameState !== 'finished'}
                className="btn-primary" 
                style={{ 
                  background: isSettled ? '#555' : gameState !== 'finished' ? '#333' : 'var(--success-color)', 
                  cursor: isSettled || gameState !== 'finished' ? 'not-allowed' : 'pointer',
                  opacity: (gameState !== 'finished' && !isSettled) ? 0.6 : 1,
                  padding: '6px 14px', fontSize: '0.85rem'
                }}
              >
                {isSettled ? '✅ 정산 완료' : gameState !== 'finished' ? '⏳ 경기 종료 후 정산' : '🏆 포인트 정산하기'}
              </button>
              <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                🏠 로비로
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
        
        {/* Matchup Selection / Info Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          
          {/* Left Team Card */}
          <div className="glass-card" style={{ flex: 1, minWidth: '220px', padding: '16px', border: '2px solid #ff3b30', background: 'rgba(255, 59, 48, 0.1)', textAlign: 'center' }}>
            <div style={{ color: '#ff8080', fontSize: '0.9rem', fontWeight: 700 }}>좌측 진영 (RED)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff3b30', marginTop: '4px' }}>{leftLabel}</div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', fontSize: '0.95rem' }}>
              <span>참가: <strong>{leftCount}명</strong></span>
              <span>누적 연타: <strong style={{ color: '#ffd700' }}>{leftTaps}회</strong></span>
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffd700', padding: '0 10px' }}>VS</div>

          {/* Right Team Card */}
          <div className="glass-card" style={{ flex: 1, minWidth: '220px', padding: '16px', border: '2px solid #007aff', background: 'rgba(0, 122, 255, 0.1)', textAlign: 'center' }}>
            <div style={{ color: '#80bfff', fontSize: '0.9rem', fontWeight: 700 }}>우측 진영 (BLUE)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#007aff', marginTop: '4px' }}>{rightLabel}</div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', fontSize: '0.95rem' }}>
              <span>참가: <strong>{rightCount}명</strong></span>
              <span>누적 연타: <strong style={{ color: '#ffd700' }}>{rightTaps}회</strong></span>
            </div>
          </div>
        </div>

        {/* Rope Stadium Display */}
        <div style={{ width: '100%', maxWidth: '800px', margin: '20px 0', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#ff3b30', fontWeight: 800 }}>◀ 🔴 홍군 구역</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: timeLeft <= 3 ? 'var(--danger-color)' : '#fff', animation: timeLeft <= 3 ? 'pulse 0.5s infinite' : 'none' }}>
              ⏱️ {timeLeft}s
            </span>
            <span style={{ color: '#007aff', fontWeight: 800 }}>🔵 청군 구역 ▶</span>
          </div>

          {/* Rope Track */}
          <div style={{
            position: 'relative',
            height: '40px',
            background: 'linear-gradient(to right, rgba(255,59,48,0.3) 0%, rgba(0,0,0,0.6) 50%, rgba(0,122,255,0.3) 100%)',
            borderRadius: '20px',
            border: '3px solid #555',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
          }}>
            {/* Center Deadzone line */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '4px', background: '#ffd700', zIndex: 2 }} />

            {/* Moving Rope */}
            <div style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: `${100 - ropePosition}%`,
              transform: 'translateX(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ffd700',
              border: '3px solid #fff',
              boxShadow: '0 0 20px #ffd700',
              zIndex: 5,
              transition: 'left 0.2s ease-out'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '6px' }}>
            <span>홍군 넉아웃 (10%)</span>
            <span>중앙 (50%)</span>
            <span>청군 넉아웃 (90%)</span>
          </div>
        </div>

        {/* Action Controls */}
        {gameState === 'ready' && (
          <button onClick={startGameLogic} className="btn-primary" style={{ marginTop: '20px', padding: '16px 45px', fontSize: '1.4rem', borderRadius: '50px' }}>
            <Play size={24} /> 줄다리기 경기 시작! (10초 카운트)
          </button>
        )}

        {gameState === 'finished' && (
          <div className="glass-card" style={{ marginTop: '20px', padding: '20px 40px', textAlign: 'center', border: '2px solid #ffd700', background: 'rgba(255,215,0,0.1)' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffd700' }}>🏆 {winnerTitle}</h3>
            <p style={{ color: '#fff', fontSize: '1.1rem', marginTop: '8px' }}>
              승리한 진영의 모든 팀 및 참가자에게 각 +300점이 정산됩니다.
            </p>
            <div style={{ marginTop: '15px' }}>
              <button onClick={startGameLogic} className="btn-secondary" style={{ padding: '12px 28px', border: '1px solid var(--primary-color)' }}>
                <RotateCcw size={18} /> 🔄 줄다리기 재경기 시작
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
