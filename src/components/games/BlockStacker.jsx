import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Layers, Play, RotateCcw, Zap, Trophy, AlertCircle } from 'lucide-react';

export const BlockStacker = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardPoints, room, simulateBotGameInputs, returnToLobby } = useGame();

  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0); // Height of tower
  const [gameOver, setGameOver] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // Game Engine State
  const gameStateRef = useRef({
    stack: [],
    currentBlock: { x: 0, width: 140, dir: 1, speed: 3 },
    blockHeight: 24,
    canvasWidth: 360,
    canvasHeight: 460
  });

  const animRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setIsSettled(false);
    setScore(0);

    const initialStack = [
      { x: 110, width: 140, color: '#00f3ff' }
    ];

    gameStateRef.current = {
      stack: initialStack,
      currentBlock: { x: 20, width: 140, dir: 1, speed: 3.5 },
      blockHeight: 24,
      canvasWidth: 360,
      canvasHeight: 460
    };

    soundFx.playCountdown(true);
    loop();
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { stack, currentBlock, blockHeight, canvasWidth, canvasHeight } = gameStateRef.current;

    // Move current block
    currentBlock.x += currentBlock.speed * currentBlock.dir;
    if (currentBlock.x + currentBlock.width >= canvasWidth) {
      currentBlock.x = canvasWidth - currentBlock.width;
      currentBlock.dir = -1;
    } else if (currentBlock.x <= 0) {
      currentBlock.x = 0;
      currentBlock.dir = 1;
    }

    // Render
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Render background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvasHeight; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Render Stacked Blocks
    const startY = canvasHeight - 40;
    stack.forEach((b, idx) => {
      const yPos = startY - idx * blockHeight;
      ctx.fillStyle = b.color || '#00f3ff';
      ctx.shadowColor = b.color || '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(b.x, yPos, b.width, blockHeight - 2);

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(b.x, yPos, b.width, 3);
    });

    // Render Active Moving Block
    const currentY = startY - stack.length * blockHeight;
    ctx.fillStyle = '#ff007a';
    ctx.shadowColor = '#ff007a';
    ctx.shadowBlur = 15;
    ctx.fillRect(currentBlock.x, currentY, currentBlock.width, blockHeight - 2);
    ctx.shadowBlur = 0;

    animRef.current = requestAnimationFrame(loop);
  };

  const dropBlock = () => {
    if (!isPlaying || gameOver) return;

    const { stack, currentBlock } = gameStateRef.current;
    const topStackBlock = stack[stack.length - 1];

    const currentX = currentBlock.x;
    const currentW = currentBlock.width;
    const prevX = topStackBlock.x;
    const prevW = topStackBlock.width;

    // Calculate Overhang
    const diff = currentX - prevX;
    let newWidth = currentW - Math.abs(diff);

    if (newWidth <= 0) {
      // Missed completely! Game Over
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
      setGameOver(true);
      const finalHeight = stack.length - 1;
      setScore(finalHeight);
      submitPlayerInput(myPlayerId, { towerHeight: finalHeight });
      soundFx.playError();
      return;
    }

    // Trim block position and width
    let newX = currentX;
    if (diff < 0) {
      newX = prevX;
    }

    // Perfect Drop Bonus!
    if (Math.abs(diff) < 4) {
      newX = prevX;
      newWidth = prevW;
      soundFx.playSuccess();
    } else {
      soundFx.playTick(500 + stack.length * 30);
    }

    // Add to stack
    const colors = ['#00f3ff', '#ff007a', '#ffd700', '#00e676', '#a100ff', '#ff9500'];
    const newColor = colors[stack.length % colors.length];

    stack.push({ x: newX, width: newWidth, color: newColor });

    // Speed up slightly
    const nextSpeed = Math.min(8, 3.5 + stack.length * 0.25);
    gameStateRef.current.currentBlock = {
      x: 0,
      width: newWidth,
      dir: 1,
      speed: nextSpeed
    };

    setScore(stack.length - 1);
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('blockstack');
    soundFx.playSuccess();
  };

  const rankedParticipants = [...participants]
    .filter(p => p.lastInput && p.lastInput.towerHeight !== undefined)
    .sort((a, b) => b.lastInput.towerHeight - a.lastInput.towerHeight);

  const handleSettlePoints = () => {
    if (isSettled) return;
    if (rankedParticipants.length > 0) {
      rankedParticipants.slice(0, 3).forEach((p, rank) => {
        const height = p.lastInput.towerHeight;
        const multiplier = rank === 0 ? 5 : rank === 1 ? 3 : 1;
        awardPoints(room.mode === 'team' ? p.teamId : p.id, Math.max(100, height * multiplier), room.mode === 'team');
      });
    } else {
      // 기록이 없을 때는 참가자 전체에게 100점 분배
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
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.8rem' }}>🧱</div>
          <div>
            <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              초정밀 리듬 블록 탑 쌓기 (Precision Stacker)
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              완벽한 타이밍에 블록을 떨어뜨려 가장 높은 마천루를 건설하세요!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && (
            <>
              <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                <Zap size={16} /> 100인 탑 쌓기 결과 시뮬레이션
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

      {/* Main Gameplay Screen */}
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'host' ? '1fr 1fr' : '1fr', gap: '20px' }}>
        
        {/* Canvas Arcade Frame */}
        <div className="glass-panel glass-panel-glow" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '360px', marginBottom: '10px', fontWeight: 800 }}>
            <span>현재 탑 높이: <strong style={{ color: 'var(--primary-color)', fontSize: '1.3rem' }}>{score}층</strong></span>
            {gameOver && <span style={{ color: 'var(--danger-color)' }}>GAME OVER</span>}
          </div>

          <canvas
            ref={canvasRef}
            width={360}
            height={460}
            style={{
              background: '#040814',
              borderRadius: '16px',
              border: '2px solid var(--card-border)',
              boxShadow: '0 0 25px rgba(0, 0, 0, 0.6)',
              cursor: isPlaying ? 'pointer' : 'default'
            }}
            onClick={dropBlock}
          />

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            {!isPlaying && (
              <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 36px' }}>
                <Play size={20} /> {gameOver ? '다시 도전하기' : '탑 쌓기 게임 시작!'}
              </button>
            )}

            {isPlaying && (
              <button onClick={dropBlock} className="btn-primary" style={{ fontSize: '1.4rem', padding: '16px 50px', background: 'var(--button-gradient)' }}>
                DROP! (블록 가동)
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '10px' }}>
            💡 스마트폰 탭 또는 클릭하여 블록을 멈추세요!
          </p>

        </div>

        {/* Leaderboard */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Trophy size={20} color="var(--primary-color)" />
            실시간 탑 높이 랭킹 (완료: {rankedParticipants.length}/{participants.length}명)
          </h3>

          {rankedParticipants.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
              <AlertCircle size={40} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>아직 쌓인 탑 기록이 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {rankedParticipants.slice(0, 50).map((player, rank) => {
                const height = player.lastInput.towerHeight;
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
                      borderColor: isTop3 ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)'
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
                        justifyContent: 'center'
                      }}>
                        {rank + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{player.name}</div>
                        {player.teamName && <span className={`team-badge ${player.teamColor}`} style={{ fontSize: '0.72rem' }}>{player.teamName}</span>}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-color)' }}>
                        {height} 층
                      </span>
                      {userRole === 'host' && (
                        <div>
                          <button
                            onClick={() => awardPoints(room.mode === 'team' ? player.teamId : player.id, height * 5, room.mode === 'team')}
                            style={{ background: 'none', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', padding: '2px 6px' }}
                          >
                            +점수 지급
                          </button>
                        </div>
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
