import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Flame, Play, RotateCcw, Zap, Trophy, Flag } from 'lucide-react';

export const RapidTapSprint = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardPoints, room, simulateBotGameInputs, returnToLobby, activeTeams, startRound, startGame } = useGame();

  const GAME_DURATION = 10; // 10 seconds race
  
  const myPlayer = participants.find(p => p.id === myPlayerId);
  const hasSubmitted = !!myPlayer?.lastInput?.tapCount;

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isRacing, setIsRacing] = useState(false);
  const [tapCount, setTapCount] = useState(hasSubmitted ? myPlayer.lastInput.tapCount : 0);
  const [raceFinished, setRaceFinished] = useState(hasSubmitted);
  const [isSettled, setIsSettled] = useState(false);

  const timerRef = useRef(null);

  const startRace = () => {
    setIsRacing(true);
    setRaceFinished(false);
    setIsSettled(false);
    setTapCount(0);
    setTimeLeft(GAME_DURATION);
    soundFx.playCountdown(true);

    let currentSeconds = GAME_DURATION;
    timerRef.current = setInterval(() => {
      currentSeconds -= 1;
      setTimeLeft(currentSeconds);
      soundFx.playCountdown(false);

      if (currentSeconds <= 0) {
        clearInterval(timerRef.current);
        setIsRacing(false);
        setRaceFinished(true);
        soundFx.playSuccess();
      }
    }, 1000);
  };

  useEffect(() => {
    if (room.gameState === 'playing' && !isRacing && !raceFinished && !hasSubmitted) {
      startRace();
    } else if (room.gameState === 'ready') {
      setIsRacing(false);
      setRaceFinished(false);
      setIsSettled(false);
      setTapCount(0);
      setTimeLeft(GAME_DURATION);
      clearInterval(timerRef.current);
    }
  }, [room.gameState, hasSubmitted]);

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
    submitPlayerInput(myPlayerId, { tapCount: nextTap });
    soundFx.playTick(600 + (nextTap % 10) * 30);
  };

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
    if (isSettled) return;
    if (room.mode === 'team') {
      // 상위 3팀 정산 (기록 없으면 전 팀 200점)
      if (teamScores.some(t => t.totalTaps > 0)) {
        teamScores.slice(0, 3).forEach((t, idx) => {
          const points = idx === 0 ? 1000 : idx === 1 ? 500 : 300;
          awardPoints(t.id, points, true);
        });
      } else {
        activeTeams.forEach(t => awardPoints(t.id, 200, true));
      }
    } else {
      // 개인전 상위 10명 (기록 없으면 참가자 전원 100점)
      if (rankedParticipants.length > 0) {
        rankedParticipants.slice(0, 10).forEach((p, idx) => {
          const points = idx === 0 ? 500 : idx < 3 ? 300 : 100;
          awardPoints(p.id, points, false);
        });
      } else {
        participants.forEach(p => awardPoints(p.id, 100, false));
      }
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.8rem' }}>⚡</div>
          <div>
            <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              100인 실시간 탭 대격돌 100m 파워 스프린트
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              10초 동안 미친 듯이 연타하여 승리를 쟁취하세요!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && (
            <>
              <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                <Zap size={16} /> 100인 탭 시뮬레이션
              </button>
              <button 
                onClick={handleSettlePoints} 
                disabled={isSettled}
                className="btn-primary" 
                style={{ background: isSettled ? '#555' : 'var(--success-color)', cursor: isSettled ? 'default' : 'pointer' }}
              >
                {isSettled ? '✅ 정산 완료' : '🏆 포인트 정산하기'}
              </button>
              <button onClick={handleReturnToLobby} className="btn-secondary">
                🏠 로비로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>

      {/* Gameplay & Track */}
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'host' ? '1fr 1fr' : '1fr', gap: '20px' }}>
        
        {/* Sprint Controller / Mobile Tap Area */}
        <div className="glass-panel glass-panel-glow" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ fontSize: '1rem', color: 'var(--text-sub)', fontWeight: 800 }}>
            RACE TIMER
          </div>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary-color)', margin: '10px 0' }}>
            {timeLeft}s
          </div>

          <div style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px', fontWeight: 800 }}>
            내 탭 횟수: <strong style={{ fontSize: '2.5rem', color: '#ff007a' }}>{tapCount}</strong> 회
          </div>

          {/* Action Buttons & Tap Button */}
          {userRole === 'host' ? (
            <div style={{ display: 'flex', gap: '14px', marginTop: '20px' }}>
              {room.gameState === 'ready' && (
                <button onClick={handleHostStart} className="btn-primary" style={{ fontSize: '1.3rem', padding: '16px 40px' }}>
                  <Play size={24} /> 스프린트 레이스 시작!
                </button>
              )}
              {room.gameState !== 'ready' && (
                <button onClick={handleHostReset} className="btn-secondary" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
                  <RotateCcw size={20} /> 레이스 초기화
                </button>
              )}
            </div>
          ) : (
            <>
              {room.gameState === 'ready' && (
                <div style={{ padding: '20px', color: 'var(--text-sub)', fontSize: '1.2rem', fontWeight: 800 }}>
                  ⏳ 대기 중... 사회자의 시작 신호를 기다려주세요!
                </div>
              )}
              {room.gameState === 'playing' && isRacing && (
                <button
                  onPointerDown={handleTap}
                  className="btn-primary animate-pulse-glow"
                  style={{
                    width: '220px',
                    height: '220px',
                    borderRadius: '50%',
                    fontSize: '2rem',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #ff0055 0%, #ff00e5 100%)',
                    boxShadow: '0 0 50px rgba(255, 0, 85, 0.8)',
                    cursor: 'pointer',
                    marginTop: '20px',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                >
                  🔥 TAP! (연타)
                </button>
              )}
              {raceFinished && (
                <div style={{ padding: '20px', color: 'var(--success-color)', fontSize: '1.2rem', fontWeight: 800, marginTop: '20px' }}>
                  🏁 레이스 종료! 당신의 기록: {tapCount}회
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
