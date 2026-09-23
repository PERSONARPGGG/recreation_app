import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Layers, Play, RotateCcw, Zap, Trophy, AlertCircle } from 'lucide-react';

const GAME_DURATION = 10;

/**
 * BlockStacker 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
export const BlockStacker = () => {
  const { userRole, participants, submitPlayerInput, resetAllPlayerInputs, myPlayerId, awardPoints, awardBatchPoints, room, simulateBotGameInputs, returnToLobby, updateRoomState } = useGame();

  const canvasRef = useRef(null);
  const [score, setScore] = useState(0); // Height of tower
  const [isSettled, setIsSettled] = useState(false);
  const [localGameOver, setLocalGameOver] = useState(false);

  // Synced room state
  const blockstackState = room.blockstackState || 'ready'; // 'ready' | 'playing' | 'finished'
  const timeLeft = room.blockstackTimeLeft !== undefined ? room.blockstackTimeLeft : GAME_DURATION;

  const timeLeftRef = useRef(GAME_DURATION);
  const timerIntervalRef = useRef(null);

  // Game Engine State
  const gameStateRef = useRef({
    stack: [],
    currentBlock: { x: 20, width: 140, dir: 1, speed: 3.5 },
    blockHeight: 22,
    canvasWidth: 320,
    canvasHeight: 400
  });

  const animRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Host runs the 10-second synchronized countdown timer
  useEffect(() => {
    if (userRole === 'host' && blockstackState === 'playing') {
      timeLeftRef.current = GAME_DURATION;
      timerIntervalRef.current = setInterval(() => {
        timeLeftRef.current -= 1;
        if (timeLeftRef.current <= 0) {
          clearInterval(timerIntervalRef.current);
          updateRoomState({ blockstackState: 'finished', blockstackTimeLeft: 0 });
          soundFx.playSuccess();
        } else {
          updateRoomState({ blockstackTimeLeft: timeLeftRef.current });
        }
      }, 1000);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [userRole, blockstackState]);

  // Synchronized Game Engine Start / Stop based on room.blockstackState
  useEffect(() => {
    if (blockstackState === 'playing') {
      initGameEngine();
    } else if (blockstackState === 'finished') {
      stopGameEngine();
    } else if (blockstackState === 'ready') {
      stopGameEngine();
      setScore(0);
      setLocalGameOver(false);
    }
  }, [blockstackState]);

  useEffect(() => {
    return () => {
      stopGameEngine();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const stopGameEngine = () => {
    isPlayingRef.current = false;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };

  const initGameEngine = () => {
    stopGameEngine();
    setScore(0);
    setLocalGameOver(false);
    setIsSettled(false);
    isPlayingRef.current = true;

    const initialStack = [
      { x: 90, width: 140, color: '#00f3ff' }
    ];

    gameStateRef.current = {
      stack: initialStack,
      currentBlock: { x: 20, width: 140, dir: 1, speed: 3.5 },
      blockHeight: 22,
      canvasWidth: 320,
      canvasHeight: 400
    };

    soundFx.playCountdown(true);
    // Slight delay to ensure canvas is mounted
    setTimeout(() => {
      if (isPlayingRef.current) {
        loop();
      }
    }, 50);
  };

  const loop = () => {
    if (!isPlayingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      animRef.current = requestAnimationFrame(loop);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    gameStateRef.current.canvasWidth = canvasWidth;
    gameStateRef.current.canvasHeight = canvasHeight;

    const { stack, currentBlock, blockHeight } = gameStateRef.current;

    // Move current block
    currentBlock.x += currentBlock.speed * currentBlock.dir;
    if (currentBlock.x + currentBlock.width >= canvasWidth) {
      currentBlock.x = canvasWidth - currentBlock.width;
      currentBlock.dir = -1;
    } else if (currentBlock.x <= 0) {
      currentBlock.x = 0;
      currentBlock.dir = 1;
    }

    // Clear
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvasHeight; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Render Stacked Blocks
    const startY = canvasHeight - 35;
    stack.forEach((b, idx) => {
      const yPos = startY - idx * blockHeight;
      ctx.fillStyle = b.color || '#00f3ff';
      ctx.shadowColor = b.color || '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(b.x, yPos, b.width, blockHeight - 2);

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(b.x, yPos, b.width, 3);
    });

    // Render Active Moving Block
    const currentY = startY - stack.length * blockHeight;
    ctx.fillStyle = '#ff007a';
    ctx.shadowColor = '#ff007a';
    ctx.shadowBlur = 12;
    ctx.fillRect(currentBlock.x, currentY, currentBlock.width, blockHeight - 2);
    ctx.shadowBlur = 0;

    animRef.current = requestAnimationFrame(loop);
  };

  const dropBlock = () => {
    if (!isPlayingRef.current || localGameOver || blockstackState !== 'playing') return;

    const { stack, currentBlock } = gameStateRef.current;
    const topStackBlock = stack[stack.length - 1];

    const currentX = currentBlock.x;
    const currentW = currentBlock.width;
    const prevX = topStackBlock.x;
    const prevW = topStackBlock.width;

    const diff = currentX - prevX;
    let newWidth = currentW - Math.abs(diff);

    if (newWidth <= 0) {
      // Missed - game over for this player
      stopGameEngine();
      setLocalGameOver(true);
      const finalHeight = stack.length - 1;
      setScore(finalHeight);
      submitPlayerInput(myPlayerId, { towerHeight: finalHeight });
      soundFx.playError();
      return;
    }

    let newX = currentX;
    if (diff < 0) {
      newX = prevX;
    }

    // Perfect drop bonus
    if (Math.abs(diff) < 4) {
      newX = prevX;
      newWidth = prevW;
      soundFx.playSuccess();
    } else {
      soundFx.playTick(500 + stack.length * 30);
    }

    const colors = ['#00f3ff', '#ff007a', '#ffd700', '#00e676', '#a100ff', '#ff9500'];
    const newColor = colors[stack.length % colors.length];

    stack.push({ x: newX, width: newWidth, color: newColor });
    const currentHeight = stack.length - 1;
    setScore(currentHeight);
    submitPlayerInput(myPlayerId, { towerHeight: currentHeight });

    // Speed up slightly
    const nextSpeed = Math.min(7.5, 3.5 + stack.length * 0.25);
    gameStateRef.current.currentBlock = {
      x: 0,
      width: newWidth,
      dir: 1,
      speed: nextSpeed
    };
  };

  const handleHostStartGame = () => {
    resetAllPlayerInputs();
    updateRoomState({
      blockstackState: 'playing',
      blockstackTimeLeft: GAME_DURATION
    });
    setIsSettled(false);
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('blockstack');
    soundFx.playSuccess();
  };

  const rankedParticipants = [...participants]
    .filter(p => p.lastInput && p.lastInput.towerHeight !== undefined)
    .sort((a, b) => b.lastInput.towerHeight - a.lastInput.towerHeight);

  const handleSettlePoints = () => {
    if (isSettled || blockstackState !== 'finished' || rankedParticipants.length === 0) return;
    const awards = rankedParticipants.slice(0, 3).map((p, rank) => {
      const height = p.lastInput.towerHeight;
      const multiplier = rank === 0 ? 5 : rank === 1 ? 3 : 1;
      return {
        targetId: room.mode === 'team' ? p.teamId : p.id,
        points: Math.max(50, height * multiplier * 2),
        isTeam: room.mode === 'team'
      };
    });
    awardBatchPoints(awards);
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (blockstackState === 'finished' && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  // Participant View
  if (userRole === 'participant') {
    return (
      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        
        {/* Compact Header with 10s Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)' }}>
            🧱 리듬 블록 타워
          </div>
          {blockstackState === 'playing' ? (
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: timeLeft <= 3 ? 'var(--danger-color)' : '#ffd700' }}>
              ⏱️ {timeLeft}초
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>10초 타임어택</div>
          )}
        </div>

        {blockstackState === 'ready' && (
          <div style={{ padding: '30px 10px' }}>
            <Layers size={50} color="var(--primary-color)" style={{ marginBottom: '15px' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>호스트의 시작을 기다리는 중...</h3>
            <p style={{ color: 'var(--text-sub)', marginTop: '8px', fontSize: '0.95rem' }}>
              10초 동안 가장 높이 블록을 쌓으세요!
            </p>
          </div>
        )}

        {blockstackState === 'playing' && (
          <div>
            <div style={{ position: 'relative', width: '300px', height: '260px', margin: '0 auto', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <canvas ref={canvasRef} width={300} height={260} style={{ display: 'block', width: '100%', height: '100%' }} />
              
              <div style={{ position: 'absolute', top: '8px', left: '10px', fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
                타워: <span style={{ color: '#00f3ff' }}>{score}층</span>
              </div>
            </div>

            <button
              onClick={dropBlock}
              disabled={localGameOver}
              className="btn-primary"
              style={{
                marginTop: '10px',
                width: '100%',
                maxWidth: '300px',
                padding: '16px 20px',
                fontSize: '1.4rem',
                fontWeight: 900,
                borderRadius: '16px',
                background: localGameOver ? '#444' : 'linear-gradient(135deg, #00f3ff 0%, #0066ff 100%)',
                cursor: localGameOver ? 'not-allowed' : 'pointer'
              }}
            >
              {localGameOver ? '💥 타워 붕괴 (기록 완료)' : '⚡ 쌓기! (터치)'}
            </button>
          </div>
        )}

        {blockstackState === 'finished' && (
          <div className="glass-card" style={{ padding: '25px', marginTop: '10px', border: '2px solid #ffd700', background: 'rgba(255,215,0,0.1)' }}>
            <Trophy size={45} color="#ffd700" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffd700' }}>⏱️ 10초 타임 종료!</h3>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
              나의 최종 기록: <span style={{ color: 'var(--primary-color)', fontSize: '1.8rem' }}>{score}층</span>
            </div>
            <p style={{ color: 'var(--text-sub)', marginTop: '8px', fontSize: '0.9rem' }}>
              사회자의 최종 순위 발표 및 포인트 정산을 확인하세요!
            </p>
          </div>
        )}
      </div>
    );
  }

  // Host View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.5rem' }}>🧱</div>
          <div>
            <h2 className="font-heading text-gradient" style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
              초정밀 10초 리듬 블록 탑 쌓기
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)', padding: '8px 14px', fontSize: '0.85rem' }}>
            <Zap size={14} /> 100인 봇 시뮬레이션
          </button>
          <button 
            onClick={handleSettlePoints} 
            disabled={isSettled || blockstackState !== 'finished' || rankedParticipants.length === 0}
            className="btn-primary" 
            style={{ 
              background: isSettled ? '#555' : blockstackState !== 'finished' ? '#333' : 'var(--success-color)', 
              cursor: isSettled || blockstackState !== 'finished' ? 'not-allowed' : 'pointer',
              opacity: (blockstackState !== 'finished' && !isSettled) ? 0.6 : 1,
              padding: '8px 16px', fontSize: '0.9rem'
            }}
          >
            {isSettled ? '✅ 정산 완료' : blockstackState !== 'finished' ? '⏳ 10초 종료 후 정산' : '🏆 포인트 정산하기'}
          </button>
          <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            🏠 로비로
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '15px', alignItems: 'start' }}>
        
        {/* Left: Canvas Game Console */}
        <div className="glass-panel glass-panel-glow" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>사회자 화면</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: timeLeft <= 3 ? 'var(--danger-color)' : '#ffd700' }}>
              ⏱️ {timeLeft}초
            </span>
          </div>

          <div style={{ position: 'relative', width: '308px', height: '350px', margin: '0 auto', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <canvas ref={canvasRef} width={308} height={350} style={{ display: 'block', width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', top: '8px', left: '10px', fontSize: '1.1rem', fontWeight: 900, color: '#00f3ff' }}>
              {score}층
            </div>
          </div>

          {blockstackState === 'ready' && (
            <button onClick={handleHostStartGame} className="btn-primary" style={{ marginTop: '12px', width: '100%', padding: '14px', fontSize: '1.2rem' }}>
              <Play size={18} /> ▶️ 전 참가자 10초 동시 시작!
            </button>
          )}

          {blockstackState === 'playing' && (
            <button onClick={dropBlock} disabled={localGameOver} className="btn-primary" style={{ marginTop: '12px', width: '100%', padding: '14px', fontSize: '1.2rem', background: 'linear-gradient(135deg, #00f3ff 0%, #0066ff 100%)' }}>
              ⚡ 블록 드롭 (스페이스바)
            </button>
          )}

          {blockstackState === 'finished' && (
            <button onClick={handleHostStartGame} className="btn-secondary" style={{ marginTop: '12px', width: '100%', padding: '12px' }}>
              <RotateCcw size={16} /> 🔄 10초 재경기 시작
            </button>
          )}
        </div>

        {/* Right: Live Leaderboard below/beside game */}
        <div className="glass-panel" style={{ padding: '16px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="#ffd700" /> 실시간 타워 순위 ({rankedParticipants.length}명 기록)
            </h3>
            {rankedParticipants.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 700 }}>
                최고: {rankedParticipants[0].lastInput.towerHeight}층 ({rankedParticipants[0].name})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
            {rankedParticipants.slice(0, 15).map((p, idx) => (
              <div 
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: idx === 0 ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: idx === 0 ? '1px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 900, color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--text-sub)' }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  {p.teamName && (
                    <span style={{ fontSize: '0.75rem', color: p.teamColor || '#aaa' }}>[{p.teamName}]</span>
                  )}
                </div>
                <div style={{ fontWeight: 900, color: 'var(--primary-color)' }}>
                  {p.lastInput.towerHeight}층
                </div>
              </div>
            ))}

            {rankedParticipants.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-sub)', marginTop: '40px' }}>
                아직 완료된 기록이 없습니다. 게임을 시작하세요!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
