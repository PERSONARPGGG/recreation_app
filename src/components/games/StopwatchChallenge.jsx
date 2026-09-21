import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Timer, Award, Play, RotateCcw, EyeOff, Trophy, Zap, AlertCircle } from 'lucide-react';

export const StopwatchChallenge = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardPoints, room, simulateBotGameInputs, returnToLobby, startRound, startGame } = useGame();

  const TARGET_TIME = 10.000; // 10.000s
  const HIDE_TIME = 5.000;    // Hide display after 5s

  const myPlayer = participants.find(p => p.id === myPlayerId);
  const hasSubmitted = !!myPlayer?.lastInput?.stopTime;

  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isSettled, setIsSettled] = useState(false);
  // Initialize stoppedTime from lastInput to prevent retry on refresh
  const [stoppedTime, setStoppedTime] = useState(hasSubmitted ? myPlayer.lastInput.stopTime : null);
  const startTimeRef = useRef(null);
  const animFrameRef = useRef(null);

  // Player controls
  const handleStart = () => {
    setIsRunning(true);
    setStoppedTime(null);
    setElapsed(0);
    startTimeRef.current = performance.now();
    soundFx.playCountdown(true);

    const updateTimer = () => {
      const now = performance.now();
      const currentElapsed = (now - startTimeRef.current) / 1000;
      setElapsed(currentElapsed);
      animFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animFrameRef.current = requestAnimationFrame(updateTimer);
  };

  // Sync game start with Host's broadcasted state
  useEffect(() => {
    if (room.gameState === 'playing' && !isRunning && stoppedTime === null && !hasSubmitted) {
      handleStart();
    } else if (room.gameState === 'ready') {
      setIsRunning(false);
      setStoppedTime(null);
      setElapsed(0);
      cancelAnimationFrame(animFrameRef.current);
    }
  }, [room.gameState, hasSubmitted]);

  const handleHostStart = () => {
    startRound();
  };

  const handleHostReset = () => {
    startGame('stopwatch');
  };

  const handleStop = () => {
    if (!isRunning) return;
    cancelAnimationFrame(animFrameRef.current);
    const finalNow = performance.now();
    const finalElapsed = +((finalNow - startTimeRef.current) / 1000).toFixed(3);

    setIsRunning(false);
    setStoppedTime(finalElapsed);
    setElapsed(finalElapsed);

    const diffAbs = +Math.abs(finalElapsed - TARGET_TIME).toFixed(3);
    submitPlayerInput(myPlayerId, { stopTime: finalElapsed, diffAbs });

    if (diffAbs <= 0.05) {
      soundFx.playSuccess();
    } else {
      soundFx.playTick(400);
    }
  };

  // Host Bot Simulation Trigger
  const handleSimulateBots = () => {
    simulateBotGameInputs('stopwatch', TARGET_TIME);
    soundFx.playSuccess();
  };

  // Ranking calculation
  const rankedParticipants = [...participants]
    .filter(p => p.lastInput && p.lastInput.stopTime !== undefined)
    .sort((a, b) => a.lastInput.diffAbs - b.lastInput.diffAbs);

  const handleSettlePoints = () => {
    if (isSettled) return;
    if (rankedParticipants.length > 0) {
      rankedParticipants.slice(0, 10).forEach((player, rank) => {
        const points = rank === 0 ? 500 : rank === 1 ? 300 : rank === 2 ? 200 : 100;
        awardPoints(room.mode === 'team' ? player.teamId : player.id, points, room.mode === 'team');
      });
    } else {
      participants.forEach(p => awardPoints(room.mode === 'team' ? p.teamId : p.id, 100, room.mode === 'team'));
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
      
      {/* Game Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '1.8rem' }}>⏱️</div>
            <div>
              <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
                0.000초 정밀 스톱워치 타겟 챌린지
              </h2>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
                정확히 <strong style={{ color: 'var(--primary-color)' }}>{TARGET_TIME.toFixed(3)}초</strong>에 맞춰 스톱 버튼을 누르세요! ({HIDE_TIME}초 이후 숫자가 가려집니다)
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && (
            <>
              <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                <Zap size={16} /> 100인 봇 즉시 측정 시뮬레이션
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

      {/* Main Game Interface (Split Screen if Host / Large Display) */}
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'host' ? '1fr 1fr' : '1fr', gap: '20px' }}>
        
        {/* Stopwatch Controller Box */}
        <div className="glass-panel glass-panel-glow" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
          
          <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
            TARGET TIME: {TARGET_TIME.toFixed(3)} SECONDS
          </div>

          {/* Large Digital Timer Display */}
          <div style={{
            fontSize: '4.2rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: isRunning && elapsed > HIDE_TIME ? 'var(--text-sub)' : 'var(--primary-color)',
            textShadow: isRunning && elapsed > HIDE_TIME ? 'none' : '0 0 20px var(--primary-glow)',
            margin: '20px 0',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '20px 40px',
            borderRadius: '24px',
            border: '2px solid var(--card-border)',
            letterSpacing: '2px',
            minWidth: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            {isRunning && elapsed > HIDE_TIME ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2.5rem', color: '#888' }}>
                <EyeOff size={36} /> ??.???
              </div>
            ) : (
              stoppedTime !== null ? stoppedTime.toFixed(3) : elapsed.toFixed(3)
            )}
          </div>

          {/* Result Tag if stopped */}
          {stoppedTime !== null && (
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              padding: '8px 20px',
              borderRadius: '20px',
              marginBottom: '20px',
              background: Math.abs(stoppedTime - TARGET_TIME) <= 0.05 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 85, 0.2)',
              color: Math.abs(stoppedTime - TARGET_TIME) <= 0.05 ? 'var(--success-color)' : 'var(--danger-color)',
              border: '1px solid currentColor'
            }}>
              오차: {stoppedTime >= TARGET_TIME ? '+' : ''}{(stoppedTime - TARGET_TIME).toFixed(3)}초 (차이: {Math.abs(stoppedTime - TARGET_TIME).toFixed(3)}s)
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '14px' }}>
            {userRole === 'host' ? (
              <>
                {room.gameState === 'ready' && (
                  <button onClick={handleHostStart} className="btn-primary" style={{ fontSize: '1.3rem', padding: '16px 40px' }}>
                    <Play size={24} /> 참가자 전체 시작!
                  </button>
                )}
                {room.gameState !== 'ready' && (
                  <button onClick={handleHostReset} className="btn-secondary" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
                    <RotateCcw size={20} /> 게임 초기화 (다시 시작)
                  </button>
                )}
              </>
            ) : (
              // Participant View
              <>
                {room.gameState === 'ready' && (
                  <div style={{ padding: '20px', color: 'var(--text-sub)', fontSize: '1.2rem', fontWeight: 800 }}>
                    ⏳ 진행자의 시작 신호를 기다리고 있습니다...
                  </div>
                )}
                {room.gameState === 'playing' && isRunning && (
                  <button onClick={handleStop} className="btn-primary" style={{ fontSize: '1.4rem', padding: '20px 50px', background: 'linear-gradient(135deg, #ff0055 0%, #ff5e00 100%)', boxShadow: '0 0 30px rgba(255, 0, 85, 0.6)' }}>
                    STOP (멈춤!)
                  </button>
                )}
                {room.gameState === 'playing' && !isRunning && stoppedTime !== null && (
                  <div style={{ padding: '20px', color: 'var(--success-color)', fontSize: '1.2rem', fontWeight: 800 }}>
                    ✅ 기록 제출 완료! 다른 참가자들의 종료를 기다려주세요.
                  </div>
                )}
              </>
            )}
          </div>

        </div>

        {/* Live Leaderboard / Results Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="var(--primary-color)" />
              실시간 정밀 순위표 (완료: {rankedParticipants.length}/{participants.length}명)
            </h3>
          </div>

          {rankedParticipants.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
              <AlertCircle size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>아직 기록이 등록되지 않았습니다.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>참가자들이 스톱워치를 누르면 밀리초 단위로 집계됩니다!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {rankedParticipants.slice(0, 50).map((player, rank) => {
                const diff = player.lastInput.diffAbs;
                const isTop3 = rank < 3;
                return (
                  <div
                    key={player.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderColor: isTop3 ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)',
                      background: isTop3 ? 'rgba(0, 243, 255, 0.08)' : 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: rank === 0 ? '#ffd700' : rank === 1 ? '#c0c0c0' : rank === 2 ? '#cd7f32' : 'rgba(255,255,255,0.1)',
                        color: rank < 3 ? '#000' : '#fff',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem'
                      }}>
                        {rank + 1}
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {player.name}
                          {player.teamName && (
                            <span className={`team-badge ${player.teamColor}`} style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                              {player.teamName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                          측정 시간: {player.lastInput.stopTime.toFixed(3)}초
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: isTop3 ? 'var(--primary-color)' : 'var(--text-main)', fontFamily: 'monospace' }}>
                        오차 {diff.toFixed(3)}s
                      </div>
                      {userRole === 'host' && (
                        <button
                          onClick={() => awardPoints(room.mode === 'team' ? player.teamId : player.id, rank === 0 ? 100 : rank < 3 ? 50 : 20, room.mode === 'team')}
                          style={{
                            background: 'none',
                            border: '1px solid var(--primary-color)',
                            color: 'var(--primary-color)',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            marginTop: '2px'
                          }}
                        >
                          +포인트 지급
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
