import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Timer, Award, Play, RotateCcw, EyeOff, Trophy, Zap, AlertCircle } from 'lucide-react';

/**
 * StopwatchChallenge 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
export const StopwatchChallenge = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardBatchPoints, awardPoints, room, simulateBotGameInputs, returnToLobby, startRound, startGame, updateRoomState } = useGame();

  const TARGET_TIME = room.targetTime || 10.000;
  const HIDE_TIME = TARGET_TIME / 2; // Hide at halfway

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
    if (room.gameState !== 'playing') return;
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
    if (isSettled || rankedParticipants.length === 0) return;
    if (rankedParticipants.length > 0) {
      const awards = rankedParticipants.slice(0, 10).map((player, rank) => {
        const points = rank === 0 ? 100 : rank === 1 ? 80 : rank === 2 ? 60 : 30;
        return {
          targetId: room.mode === 'team' ? player.teamId : player.id,
          points,
          isTeam: room.mode === 'team'
        };
      });
      awardBatchPoints(awards);
    }
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
      
      {/* Game Header Toolbar (Host has full controls, Participant has sleek minimal tag) */}
      {userRole === 'host' ? (
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '1.4rem' }}>⏱️</div>
            <div>
              <h2 className="font-heading text-gradient" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                0.000초 칼타이밍 스톱워치 타겟 ({TARGET_TIME.toFixed(1)}초)
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)', padding: '6px 12px', fontSize: '0.85rem' }}>
              <Zap size={14} /> 100인 봇 즉시 측정
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
              {isSettled ? '✅ 정산 완료' : rankedParticipants.length === 0 ? '⏳ 스톱 측정 후 정산' : '🏆 포인트 정산하기'}
            </button>
            <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              🏠 로비로
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 6px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary-color)' }}>
            ⏱️ 10초 스톱워치
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
            목표: <strong>{TARGET_TIME.toFixed(3)}초</strong> (5초 뒤 숨김)
          </span>
        </div>
      )}

      {/* Main Game Interface (Split Screen if Host / Large Display) */}
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'host' ? '1fr 1fr' : '1fr', gap: '10px' }}>
        
        {/* Stopwatch Controller Box */}
        <div className="glass-panel glass-panel-glow" style={{ padding: userRole === 'participant' ? '12px 10px' : '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {userRole === 'host' && room.gameState === 'ready' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>목표 초(s) 설정:</label>
              <input 
                type="number" 
                value={room.targetTime || 10} 
                onChange={(e) => updateRoomState({ targetTime: parseFloat(e.target.value) || 10 })}
                style={{ width: '70px', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--primary-color)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
              />
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '4px', fontWeight: 700 }}>
              목표 시간: <strong style={{ color: 'var(--primary-color)' }}>{TARGET_TIME.toFixed(3)}초</strong> ({HIDE_TIME}초 후 타이머 숨김)
            </div>
          )}

          {/* Large Digital Timer Display */}
          <div style={{
            fontSize: userRole === 'participant' ? '3rem' : '4rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: isRunning && elapsed > HIDE_TIME ? 'var(--text-sub)' : 'var(--primary-color)',
            textShadow: isRunning && elapsed > HIDE_TIME ? 'none' : '0 0 20px var(--primary-glow)',
            margin: userRole === 'participant' ? '8px 0' : '12px 0',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: userRole === 'participant' ? '8px 20px' : '12px 28px',
            borderRadius: '16px',
            border: '2px solid var(--card-border)',
            letterSpacing: '2px',
            minWidth: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {isRunning && elapsed > HIDE_TIME ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '2rem', color: '#888' }}>
                <EyeOff size={26} /> ??.???
              </div>
            ) : (
              stoppedTime !== null ? stoppedTime.toFixed(3) : elapsed.toFixed(3)
            )}
          </div>

          {/* Result Tag if stopped */}
          {stoppedTime !== null && (
            <div style={{
              fontSize: '1rem',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '12px',
              marginBottom: '10px',
              background: Math.abs(stoppedTime - TARGET_TIME) <= 0.05 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 85, 0.2)',
              color: Math.abs(stoppedTime - TARGET_TIME) <= 0.05 ? 'var(--success-color)' : 'var(--danger-color)',
              border: '1px solid currentColor'
            }}>
              오차: {stoppedTime >= TARGET_TIME ? '+' : ''}{(stoppedTime - TARGET_TIME).toFixed(3)}초 (차이: {Math.abs(stoppedTime - TARGET_TIME).toFixed(3)}초)
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            {userRole === 'host' ? (
              <>
                {room.gameState === 'ready' && (
                  <button onClick={handleHostStart} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 36px' }}>
                    <Play size={20} /> 참가자 전체 시작!
                  </button>
                )}
                {room.gameState !== 'ready' && (
                  <button onClick={handleHostReset} className="btn-secondary" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                    <RotateCcw size={18} /> 게임 초기화 (다시 시작)
                  </button>
                )}
              </>
            ) : (
              // Participant View
              <>
                {room.gameState === 'ready' && (
                  <div style={{ padding: '12px', color: 'var(--text-sub)', fontSize: '1.05rem', fontWeight: 800 }}>
                    ⏳ 진행자의 시작 신호를 기다리고 있습니다...
                  </div>
                )}
                {room.gameState === 'playing' && isRunning && (
                  <button onClick={handleStop} className="btn-primary" style={{ fontSize: '1.6rem', padding: '18px 48px', borderRadius: '20px', background: 'linear-gradient(135deg, #ff0055 0%, #ff5e00 100%)', boxShadow: '0 0 30px rgba(255, 0, 85, 0.6)' }}>
                    STOP (멈춤!)
                  </button>
                )}
                {room.gameState === 'playing' && !isRunning && stoppedTime !== null && (
                  <div style={{ padding: '12px', color: 'var(--success-color)', fontSize: '1.05rem', fontWeight: 800 }}>
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
