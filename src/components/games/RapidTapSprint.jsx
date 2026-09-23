import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Flame, Play, RotateCcw, Zap, Trophy, Flag } from 'lucide-react';

/**
 * RapidTapSprint 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
export const RapidTapSprint = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardPoints, awardBatchPoints, room, simulateBotGameInputs, returnToLobby, activeTeams, startRound, startGame, updateRoomState } = useGame();

  const GAME_DURATION = 10; // 10 seconds race
  
  const myPlayer = participants.find(p => p.id === myPlayerId);
  const hasSubmitted = !!myPlayer?.lastInput?.tapCount;

  
  const [tapCount, setTapCount] = useState(hasSubmitted ? myPlayer.lastInput.tapCount : 0);
  const [isSettled, setIsSettled] = useState(false);
  const [clientRacing, setClientRacing] = useState(false);

  const tapCountRef = useRef(tapCount);
  const lastSyncedTapCountRef = useRef(tapCount);
  const sprintTimeRef = useRef(GAME_DURATION);

  useEffect(() => {
    tapCountRef.current = tapCount;
  }, [tapCount]);

  useEffect(() => {
    let interval;
    if (userRole === 'host' && room.gameState === 'playing') {
      sprintTimeRef.current = GAME_DURATION;
      updateRoomState({ sprintTimeLeft: GAME_DURATION });
      soundFx.playCountdown(true);
      
      interval = setInterval(() => {
        sprintTimeRef.current -= 1;
        if (sprintTimeRef.current <= 0) {
          updateRoomState({ sprintTimeLeft: 0, gameState: 'finished' });
          soundFx.playSuccess();
          clearInterval(interval);
        } else {
          updateRoomState({ sprintTimeLeft: sprintTimeRef.current });
        }
      }, 1000);
    } else if (userRole === 'host' && room.gameState === 'ready') {
      updateRoomState({ sprintTimeLeft: GAME_DURATION });
    }
    return () => { if (interval) clearInterval(interval); };
  }, [userRole, room.gameState]);

  const timeLeft = room.sprintTimeLeft !== undefined ? room.sprintTimeLeft : GAME_DURATION;
  const isRacing = room.gameState === 'playing' && timeLeft > 0 && clientRacing;

  useEffect(() => {
    if (room.gameState === 'playing' && room.sprintTimeLeft > 0 && room.sprintTimeLeft < GAME_DURATION) {
      soundFx.playCountdown(false);
    } else if (room.gameState === 'finished' && userRole === 'participant') {
      soundFx.playSuccess();
    }
  }, [room.sprintTimeLeft, room.gameState, userRole]);

  useEffect(() => {
    if (room.gameState === 'ready') {
      setTapCount(0);
      setIsSettled(false);
      setClientRacing(false);
    } else if (room.gameState === 'playing') {
      setClientRacing(true);
      // Fallback: forcefully stop racing after 10.5 seconds on client
      const timer = setTimeout(() => {
        setClientRacing(false);
      }, 10500);
      return () => clearTimeout(timer);
    }
  }, [room.gameState]);

  const handleHostStart = () => {
    startRound();
  };

  const handleHostReset = () => {
    startGame('sprint');
  };

  const handleTap = () => {
    if (!isRacing) return;
    const nextTap = tapCount + 1;
    setTapCount(nextTap);
    soundFx.playTick(600 + (nextTap % 10) * 30);
  };

  // Participant syncs tapCount optimally (every 500ms, only if changed)
  useEffect(() => {
    if (userRole === 'participant' && isRacing) {
      const syncInterval = setInterval(() => {
        if (tapCountRef.current !== lastSyncedTapCountRef.current) {
          submitPlayerInput(myPlayerId, { tapCount: tapCountRef.current });
          lastSyncedTapCountRef.current = tapCountRef.current;
        }
      }, 500);
      return () => {
        clearInterval(syncInterval);
        if (tapCountRef.current !== lastSyncedTapCountRef.current) {
          submitPlayerInput(myPlayerId, { tapCount: tapCountRef.current });
          lastSyncedTapCountRef.current = tapCountRef.current;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, isRacing, myPlayerId]);

  const handleSimulateBots = () => {
    simulateBotGameInputs('sprint');
    soundFx.playSuccess();
  };

  // Ranking calculation
  const rankedParticipants = [...participants]
    .filter(p => p.lastInput && p.lastInput.tapCount !== undefined)
    .sort((a, b) => b.lastInput.tapCount - a.lastInput.tapCount);

  // Team Total Taps calculation
  const teamScores = activeTeams.map(t => {
    const teamMembers = participants.filter(p => p.teamId === t.id);
    const totalTaps = teamMembers.reduce((sum, p) => sum + (p.lastInput?.tapCount || 0), 0);
    return { ...t, totalTaps };
  }).sort((a, b) => b.totalTaps - a.totalTaps);

  const handleSettlePoints = () => {
    if (isSettled || rankedParticipants.length === 0) return;
    const awards = [];
    if (room.mode === 'team') {
      // 상위 3팀 정산
      if (teamScores.some(t => t.totalTaps > 0)) {
        teamScores.slice(0, 3).forEach((t, idx) => {
          const points = idx === 0 ? 100 : idx === 1 ? 80 : 50;
          awards.push({ targetId: t.id, points, isTeam: true });
        });
      }
    } else {
      // 개인전 상위 10명
      if (rankedParticipants.length > 0) {
        rankedParticipants.slice(0, 10).forEach((p, idx) => {
          const points = idx === 0 ? 100 : idx < 3 ? 80 : 50;
          awards.push({ targetId: p.id, points, isTeam: false });
        });
      }
    }
    awardBatchPoints(awards);
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (rankedParticipants.length > 0 && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: userRole === 'participant' ? '6px' : '12px' }}>
      
      {/* Game Header Toolbar */}
      {userRole === 'host' ? (
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '1.4rem' }}>⚡</div>
            <div>
              <h2 className="font-heading text-gradient" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                10초 파워 탭 스프린트
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)', padding: '6px 12px', fontSize: '0.85rem' }}>
              <Zap size={14} /> 100인 탭 시뮬레이션
            </button>
            <button 
              onClick={handleSettlePoints} 
              disabled={isSettled || rankedParticipants.length === 0}
              className="btn-primary" 
              style={{ 
                background: isSettled ? '#555' : rankedParticipants.length === 0 ? '#333' : 'var(--success-color)', 
                cursor: isSettled || rankedParticipants.length === 0 ? 'not-allowed' : 'pointer',
                opacity: (rankedParticipants.length === 0 && !isSettled) ? 0.6 : 1,
                padding: '6px 14px', fontSize: '0.85rem'
              }}
            >
              {isSettled ? '✅ 정산 완료' : rankedParticipants.length === 0 ? '⏳ 경기 종료 후 정산' : '🏆 포인트 정산하기'}
            </button>
            <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              🏠 로비로
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 6px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary-color)' }}>
            ⚡ 10초 파워 터치 달리기
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: timeLeft <= 3 ? 'var(--danger-color)' : '#ffd700' }}>
            ⏱️ {timeLeft}초
          </span>
        </div>
      )}

      {/* Gameplay & Track */}
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'host' ? '1fr 1fr' : '1fr', gap: '10px' }}>
        
        {/* Sprint Controller / Mobile Tap Area */}
        <div className="glass-panel glass-panel-glow" style={{ padding: userRole === 'participant' ? '12px 10px' : '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '300px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 800 }}>남은 시간</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: timeLeft <= 3 ? 'var(--danger-color)' : 'var(--primary-color)' }}>
              ⏱️ {timeLeft}초
            </span>
          </div>

          <div style={{ fontSize: '1rem', color: '#fff', marginBottom: '8px', fontWeight: 800 }}>
            내 터치 횟수: <strong style={{ fontSize: '2.2rem', color: '#ff007a' }}>{tapCount}</strong> 회
          </div>

          {/* Action Buttons & Tap Button */}
          {userRole === 'host' ? (
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              {room.gameState === 'ready' && (
                <button onClick={handleHostStart} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 36px' }}>
                  <Play size={22} /> 스프린트 레이스 시작!
                </button>
              )}
              {room.gameState !== 'ready' && (
                <button onClick={handleHostReset} className="btn-secondary" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                  <RotateCcw size={18} /> 레이스 초기화
                </button>
              )}
            </div>
          ) : (
            <>
              {room.gameState === 'ready' && (
                <div style={{ padding: '16px', color: 'var(--text-sub)', fontSize: '1.05rem', fontWeight: 800 }}>
                  ⏳ 대기 중... 사회자의 시작 신호를 기다려주세요!
                </div>
              )}
              {room.gameState === 'playing' && isRacing && (
                <button
                  onPointerDown={handleTap}
                  className="btn-primary animate-pulse-glow"
                  style={{
                    width: '190px',
                    height: '190px',
                    borderRadius: '50%',
                    fontSize: '1.7rem',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #ff0055 0%, #ff00e5 100%)',
                    boxShadow: '0 0 45px rgba(255, 0, 85, 0.8)',
                    cursor: 'pointer',
                    margin: '8px 0',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                >
                  🔥 터치! (연타!)
                </button>
              )}
              {(room.gameState === 'finished') && (
                <div style={{ padding: '16px', color: 'var(--success-color)', fontSize: '1.2rem', fontWeight: 800, marginTop: '10px' }}>
                  🏁 레이스 종료! 최종 기록: {tapCount}회
                </div>
              )}
            </>
          )}
        </div>

        {/* Live Race Track Visualizer */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Flag size={20} color="var(--primary-color)" />
            {room.mode === 'team' ? '팀별 트랙 레이스 현황' : '개인별 탭 랭킹'}
          </h3>

          {room.mode === 'team' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {teamScores.map((t, idx) => {
                const maxTaps = Math.max(...teamScores.map(ts => ts.totalTaps), 1);
                const progressPct = Math.min(100, Math.round((t.totalTaps / (maxTaps * 1.1)) * 100));
                return (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 800 }}>
                      <span style={{ color: t.color }}>{t.name}</span>
                      <span>총 {t.totalTaps} 탭</span>
                    </div>
                    <div style={{ height: '20px', background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: t.color, transition: 'width 0.2s ease', borderRadius: '10px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
              {rankedParticipants.slice(0, 30).map((player, rank) => (
                <div key={player.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                  <span>#{rank + 1} {player.name}</span>
                  <strong style={{ color: 'var(--primary-color)' }}>{player.lastInput.tapCount} 탭</strong>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
