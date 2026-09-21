import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Scale, Zap, Eye, Trophy, RefreshCw } from 'lucide-react';

export const MindSyncBalance = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardPoints, room, simulateBotGameInputs, returnToLobby, updateRoomState } = useGame();

  const isRevealed = !!room.mindsyncRevealed;
  const isLocked = !!room.mindsyncLocked || isRevealed;
  const timeLeft = room.mindsyncTimeLeft ?? null;

  const myPlayer = participants.find(p => p.id === myPlayerId);
  const [selectedNum, setSelectedNum] = useState(myPlayer?.lastInput?.choiceNum ?? 50);
  const [isSettled, setIsSettled] = useState(false);

  // Sync selectedNum if participant has already submitted
  useEffect(() => {
    if (myPlayer?.lastInput?.choiceNum !== undefined) {
      setSelectedNum(myPlayer.lastInput.choiceNum);
    }
  }, [myPlayer?.lastInput?.choiceNum]);

  // Host timer countdown effect
  useEffect(() => {
    let timer;
    if (userRole === 'host' && timeLeft !== null && timeLeft > 0 && !isLocked) {
      timer = setInterval(() => {
        if (room.mindsyncTimeLeft <= 1) {
          updateRoomState({ mindsyncTimeLeft: 0, mindsyncLocked: true });
          soundFx.playSuccess();
        } else {
          updateRoomState({ mindsyncTimeLeft: room.mindsyncTimeLeft - 1 });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [userRole, timeLeft, isLocked, room.mindsyncTimeLeft, updateRoomState]);

  const handleSelectNumber = (num) => {
    if (isLocked) return;
    setSelectedNum(num);
    submitPlayerInput(myPlayerId, { choiceNum: num });
    soundFx.playTick();
  };

  const handleStartTimer = (seconds = 15) => {
    updateRoomState({ mindsyncTimeLeft: seconds, mindsyncLocked: false, mindsyncRevealed: false });
    soundFx.playCountdown(true);
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('mindsync');
    soundFx.playSuccess();
  };

  const submittedPlayers = participants.filter(p => p.lastInput?.choiceNum !== undefined);
  const totalSubmitted = submittedPlayers.length;

  const averageValue = totalSubmitted > 0
    ? submittedPlayers.reduce((sum, p) => sum + p.lastInput.choiceNum, 0) / totalSubmitted
    : 50;

  const targetValue = +(averageValue * (2 / 3)).toFixed(2);

  // Winner calculation
  const rankedWinners = [...submittedPlayers].sort((a, b) => {
    const diffA = Math.abs(a.lastInput.choiceNum - targetValue);
    const diffB = Math.abs(b.lastInput.choiceNum - targetValue);
    return diffA - diffB;
  });

  const handleRevealResult = () => {
    soundFx.playDrumroll(2);
    setTimeout(() => {
      updateRoomState({ mindsyncRevealed: true, mindsyncLocked: true, mindsyncTimeLeft: 0 });
      soundFx.playSuccess();
    }, 2000);
  };

  const handleResetRound = () => {
    updateRoomState({
      mindsyncRevealed: false,
      mindsyncLocked: false,
      mindsyncTimeLeft: null
    });
    setIsSettled(false);
    soundFx.playTick();
  };

  const handleSettlePoints = () => {
    if (isSettled) return;
    updateRoomState({ mindsyncRevealed: true, mindsyncLocked: true, mindsyncTimeLeft: 0 });
    if (rankedWinners.length > 0) {
      rankedWinners.slice(0, 3).forEach((player, rank) => {
        const points = rank === 0 ? 500 : rank === 1 ? 300 : 150;
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
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.8rem' }}>⚖️</div>
          <div>
            <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              심리 밸런스 & 황금비율 타겟 게임 (2/3 Average)
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              1~100 중 하나의 숫자를 고르세요! 목표는 <strong>전체 평균의 2/3에 가장 가까운 숫자</strong>입니다.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && (
            <>
              <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                <Zap size={16} /> 100인 수치 입력 시뮬레이션
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

      {/* Main Game Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'host' ? '1fr 1fr' : '1fr', gap: '20px' }}>
        
        {/* Number Selector Dial */}
        <div className="glass-panel glass-panel-glow" style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '1.1rem', color: 'var(--text-sub)', fontWeight: 800 }}>
              내가 선택한 숫자
            </div>
            {timeLeft !== null && timeLeft > 0 && (
              <div style={{ color: 'var(--danger-color)', fontWeight: 900, fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>
                ⏱️ 마감까지 {timeLeft}초
              </div>
            )}
            {isLocked && (
              <div style={{ color: 'var(--danger-color)', fontWeight: 900, fontSize: '1rem', background: 'rgba(255, 59, 48, 0.15)', padding: '4px 10px', borderRadius: '8px' }}>
                🔒 입력 마감됨
              </div>
            )}
          </div>

          <div style={{ fontSize: '5rem', fontWeight: 900, color: isLocked ? 'var(--text-sub)' : 'var(--primary-color)', margin: '10px 0' }}>
            {selectedNum}
          </div>

          <input
            type="range"
            min="1"
            max="100"
            value={selectedNum}
            disabled={isLocked}
            onChange={(e) => handleSelectNumber(parseInt(e.target.value))}
            style={{ width: '80%', margin: '20px 0', accentColor: 'var(--primary-color)', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1 }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {[10, 25, 33, 50, 66, 75, 100].map(val => (
              <button
                key={val}
                disabled={isLocked}
                onClick={() => handleSelectNumber(val)}
                className="btn-secondary"
                style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', opacity: isLocked ? 0.4 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
              >
                {val}
              </button>
            ))}
          </div>

          {isLocked && (
            <div style={{ marginTop: '20px', color: 'var(--warning-color)', fontWeight: 700, fontSize: '0.95rem' }}>
              ⚠️ 타겟 계산이 진행 중이거나 마감되어 숫자를 변경할 수 없습니다.
            </div>
          )}

          {userRole === 'host' && (
            <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!isLocked && (
                <button onClick={() => handleStartTimer(15)} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                  ⏱️ 15초 마감 타이머 가동
                </button>
              )}
              {!isRevealed ? (
                <button onClick={handleRevealResult} className="btn-primary" style={{ fontSize: '1.1rem', padding: '12px 28px' }}>
                  <Eye size={20} /> 황금비율 타겟 계산 및 공개!
                </button>
              ) : (
                <button onClick={handleResetRound} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                  <RefreshCw size={16} /> 다시 입력받기 (새 라운드)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Distribution & Winner Banner */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
            실시간 제출 현황 ({totalSubmitted}/{participants.length}명 완료)
          </h3>

          {/* Distribution Histogram & Winner Banner */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '8px' }}>
              1~100 수치 분포도 히스토그램 (실시간 시각화)
            </div>
            <div style={{
              height: '80px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              padding: '8px 12px',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
              position: 'relative'
            }}>
              {Array.from({ length: 20 }, (_, i) => {
                const rangeMin = i * 5 + 1;
                const rangeMax = (i + 1) * 5;
                const count = submittedPlayers.filter(p => p.lastInput.choiceNum >= rangeMin && p.lastInput.choiceNum <= rangeMax).length;
                const maxCount = Math.max(...Array.from({ length: 20 }, (_, k) => submittedPlayers.filter(p => p.lastInput.choiceNum >= (k*5+1) && p.lastInput.choiceNum <= (k+1)*5).length), 1);
                const heightPct = Math.round((count / maxCount) * 100);
                const isTargetBucket = targetValue >= rangeMin && targetValue <= rangeMax;

                return (
                  <div
                    key={i}
                    title={`${rangeMin}~${rangeMax}: ${count}명`}
                    style={{
                      flex: 1,
                      height: `${Math.max(8, heightPct)}%`,
                      background: isTargetBucket ? 'linear-gradient(to top, #ff007a, #ffd700)' : 'var(--button-gradient)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'all 0.3s ease',
                      opacity: count > 0 ? 1 : 0.25
                    }}
                  />
                );
              })}

              {isRevealed && (
                <div style={{
                  position: 'absolute',
                  left: `${targetValue}%`,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: '#ff0055',
                  boxShadow: '0 0 10px #ff0055',
                  zIndex: 2
                }}>
                  <span style={{ position: 'absolute', top: '-20px', left: '-15px', background: '#ff0055', color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '1px 4px', borderRadius: '4px' }}>
                    🎯{targetValue}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>
              <span>1</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {isRevealed && (
            <div style={{ background: 'rgba(0, 243, 255, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid var(--primary-color)', marginBottom: '20px' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-sub)' }}>전체 제출 평균값: {averageValue.toFixed(2)}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-color)', margin: '6px 0' }}>
                🎯 최종 타겟 수치 (평균 × 2/3): {targetValue}
              </div>

              {rankedWinners.length > 0 && (
                <div style={{ marginTop: '14px', color: 'var(--success-color)', fontWeight: 800, fontSize: '1.1rem' }}>
                  🏆 최고 명사수 우승: {rankedWinners[0].name} (선택: {rankedWinners[0].lastInput.choiceNum}, 오차: {Math.abs(rankedWinners[0].lastInput.choiceNum - targetValue).toFixed(2)})
                </div>
              )}
            </div>
          )}

          {/* Top Rankings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {rankedWinners.slice(0, 20).map((player, rank) => (
              <div key={player.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                <span>#{rank + 1} {player.name}</span>
                <strong style={{ color: 'var(--primary-color)' }}>선택: {player.lastInput.choiceNum}</strong>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
