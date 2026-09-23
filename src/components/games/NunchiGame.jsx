import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Eye, Play, RotateCcw } from 'lucide-react';
import { soundFx } from '../../utils/sound';

/**
 * NunchiGame 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
export const NunchiGame = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, resetAllPlayerInputs, returnToLobby, room, updateRoomState, awardPoints, awardBatchPoints } = useGame();
  
  const [isSettled, setIsSettled] = useState(false);
  const gameState = room.nunchiState || 'ready';
  const currentNumber = room.nunchiNumber || 0;
  const eliminated = room.nunchiEliminated || [];
  const passed = room.nunchiPassed || [];
  
  const tabooNumber = room.nunchiTabooNumber || 0;
  const timeoutSec = room.nunchiTimeout || 0;
  const lastCallTime = room.nunchiLastCallTime || Date.now();

  // Track the last number processed for each player to prevent infinite loop re-processing
  const processedPlayerInputsRef = useRef(new Map());

  useEffect(() => {
    if (gameState === 'ready') {
      processedPlayerInputsRef.current.clear();
    }
  }, [gameState]);

  // Host evaluates incoming participant inputs safely without looping
  useEffect(() => {
    if (userRole !== 'host' || gameState !== 'playing') return;

    // Timeout logic
    if (timeoutSec > 0 && currentNumber < participants.length && passed.length + eliminated.length < participants.length) {
      if (Date.now() - lastCallTime > timeoutSec * 1000) {
        // Eliminate everyone who hasn't passed!
        const nextElim = [...eliminated];
        participants.forEach(p => {
          if (!passed.includes(p.id) && !nextElim.some(e => e.id === p.id)) {
            nextElim.push({ id: p.id, name: p.name, reason: '시간 초과 전멸' });
          }
        });
        updateRoomState({ nunchiEliminated: nextElim });
        soundFx.playError();
        return; // wait for next state
      }
    }

    // Find players who submitted a new input that hasn't been evaluated yet
    const newSubmissions = [];
    participants.forEach(p => {
      const num = p.lastInput?.nunchiNum;
      if (typeof num === 'number') {
        const lastProcessed = processedPlayerInputsRef.current.get(p.id);
        if (lastProcessed !== num) {
          // Record as processed immediately before state updates
          processedPlayerInputsRef.current.set(p.id, num);
          
          // Only evaluate if not already eliminated or passed
          const isAlreadyElim = eliminated.some(e => e.id === p.id);
          const isAlreadyPassed = passed.includes(p.id);
          if (!isAlreadyElim && !isAlreadyPassed) {
            newSubmissions.push({
              id: p.id,
              name: p.name,
              num: num,
              time: p.lastInput?.time || Date.now()
            });
          }
        }
      }
    });

    if (newSubmissions.length === 0) return;

    // Sort by timestamp
    newSubmissions.sort((a, b) => a.time - b.time);

    let nextNumber = currentNumber;
    let nextPassed = [...passed];
    let nextEliminated = [...eliminated];

    // Check for duplicate number clashes within this batch
    const counts = {};
    newSubmissions.forEach(s => {
      counts[s.num] = (counts[s.num] || 0) + 1;
    });

    newSubmissions.forEach(sub => {
      if (tabooNumber > 0 && sub.num === tabooNumber) {
        // Taboo number!
        if (!nextEliminated.some(e => e.id === sub.id)) {
          nextEliminated.push({ id: sub.id, name: sub.name, reason: `금기 숫자(${tabooNumber}) 아웃!` });
        }
        soundFx.playError();
      } else if (counts[sub.num] > 1) {
        // Clash elimination
        if (!nextEliminated.some(e => e.id === sub.id)) {
          nextEliminated.push({ id: sub.id, name: sub.name, reason: `${sub.num} 동시 외침` });
        }
        soundFx.playError();
      } else if (sub.num === nextNumber + 1) {
        // Successful call in order!
        nextNumber = sub.num;
        if (!nextPassed.includes(sub.id)) {
          nextPassed.push(sub.id);
        }
        soundFx.playSuccess();
      } else {
        // Out of order call -> eliminate
        if (!nextEliminated.some(e => e.id === sub.id)) {
          nextEliminated.push({ id: sub.id, name: sub.name, reason: `잘못된 숫자 (${sub.num})` });
        }
        soundFx.playError();
      }
    });

    // Single atomic update to room state
    updateRoomState({
      nunchiNumber: nextNumber,
      nunchiPassed: nextPassed,
      nunchiEliminated: nextEliminated,
      nunchiLastCallTime: Date.now()
    });
  }, [participants, userRole, gameState, currentNumber, eliminated, passed]);

  const startGame = () => {
    processedPlayerInputsRef.current.clear();
    resetAllPlayerInputs();
    updateRoomState({
      nunchiState: 'playing',
      nunchiNumber: 0,
      nunchiEliminated: [],
      nunchiPassed: []
    });
    setIsSettled(false);
    soundFx.playTick();
  };

  const handlePickNumber = () => {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const nextNumToCall = currentNumber + 1;
    if (myPlayer?.lastInput?.nunchiNum === nextNumToCall) return; // already called this number

    submitPlayerInput(myPlayerId, { nunchiNum: nextNumToCall, time: Date.now() });
    soundFx.playTick();
  };

  const hasGameActivity = passed.length > 0 || eliminated.length > 0;

  const handleSettlePoints = () => {
    if (isSettled || !hasGameActivity) return;
    const awards = [];
    if (passed.length > 0) {
      passed.forEach(id => {
        const p = participants.find(part => part.id === id);
        awards.push({ targetId: id, points: 50, isTeam: false });
        if (p?.teamId && room.mode === 'team') awards.push({ targetId: p.teamId, points: 50, isTeam: true });
      });
    } else {
      participants.forEach(p => awards.push({ targetId: p.id, points: 20, isTeam: false }));
    }
    awardBatchPoints(awards);
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (hasGameActivity && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  // Participant View
  if (userRole === 'participant') {
    const isEliminated = gameState !== 'ready' && eliminated.some(e => e.id === myPlayerId);
    const isPassed = gameState !== 'ready' && passed.includes(myPlayerId);

    return (
      <div className="glass-panel" style={{ padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-color)' }}>🙈 눈치게임</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
            현재: <strong style={{ color: '#fff' }}>{currentNumber}</strong> (외칠 번호: {currentNumber + 1})
          </span>
        </div>

        {gameState === 'ready' ? (
          <div style={{ padding: '30px 10px', color: 'var(--text-sub)', fontSize: '1.1rem' }}>
            🎮 호스트의 게임 시작을 기다리고 있습니다...
          </div>
        ) : isEliminated ? (
          <div style={{ padding: '20px 10px' }}>
            <div style={{ color: 'var(--danger-color)', fontSize: '2.2rem', fontWeight: 900, marginBottom: '6px' }}>💀 탈락!</div>
            <p style={{ color: 'var(--text-sub)', fontSize: '1rem', margin: 0 }}>동시에 외쳤거나 순서가 틀려 탈락하셨습니다.</p>
          </div>
        ) : isPassed ? (
          <div style={{ padding: '20px 10px' }}>
            <div style={{ color: 'var(--success-color)', fontSize: '2.2rem', fontWeight: 900, marginBottom: '6px' }}>✅ 생존 성공!</div>
            <p style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>성공적으로 숫자를 외쳤습니다! 남은 승부를 지켜보세요.</p>
          </div>
        ) : gameState === 'playing' ? (
          <div style={{ marginTop: '8px' }}>
            <p style={{ color: 'var(--text-sub)', marginBottom: '14px', fontSize: '0.95rem' }}>다른 사람과 겹치지 않게 타이밍을 노려 누르세요!</p>
            <button 
              onClick={handlePickNumber} 
              className="btn-primary animate-pulse-glow" 
              style={{ 
                padding: '28px 48px', 
                fontSize: '3.2rem', 
                fontWeight: 900, 
                borderRadius: '26px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                boxShadow: '0 0 35px rgba(168, 85, 247, 0.6)',
                touchAction: 'manipulation',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              {currentNumber + 1}!
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>대기 중...</div>
        )}
      </div>
    );
  }

  // Host View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
          🙈 1부터 눈치게임
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {userRole === 'host' && (
            <button 
              onClick={handleSettlePoints} 
              disabled={isSettled || !hasGameActivity}
              className="btn-primary" 
              style={{ 
                background: isSettled ? '#555' : !hasGameActivity ? '#333' : 'var(--success-color)', 
                cursor: isSettled || !hasGameActivity ? 'not-allowed' : 'pointer',
                opacity: (!hasGameActivity && !isSettled) ? 0.6 : 1,
                padding: '6px 14px', fontSize: '0.85rem'
              }}
            >
              {isSettled ? '✅ 정산 완료' : !hasGameActivity ? '⏳ 게임 진행 후 정산' : '🏆 포인트 정산하기'}
            </button>
          )}
          <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            🏠 로비로
          </button>
        </div>
      </div>

      <div className="glass-panel glass-panel-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px 16px' }}>
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Eye size={60} color="var(--primary-color)" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>아슬아슬 눈치게임</h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '20px', fontSize: '0.95rem' }}>참가자들과 겹치지 않게 순서대로 1부터 숫자를 부르는 심리 스릴 게임!</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ color: 'var(--text-sub)' }}>금기 숫자 (0은 사용안함):</label>
                <input 
                  type="number" 
                  value={room.nunchiTabooNumber || 0} 
                  onChange={e => updateRoomState({ nunchiTabooNumber: parseInt(e.target.value) || 0 })}
                  style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid var(--danger-color)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ color: 'var(--text-sub)' }}>제한 시간 (초, 0은 사용안함):</label>
                <input 
                  type="number" 
                  value={room.nunchiTimeout || 0} 
                  onChange={e => updateRoomState({ nunchiTimeout: parseInt(e.target.value) || 0 })}
                  style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid #ffd700', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                />
              </div>
            </div>

            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 36px', borderRadius: '50px' }}>
              <Play size={20} /> 게임 시작하기
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{ width: '100%', textAlign: 'center', maxWidth: '700px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-sub)', margin: 0 }}>현재 진행 숫자</h3>
            <div style={{ fontSize: '5.5rem', fontWeight: 900, color: '#fff', margin: '8px 0' }}>{currentNumber}</div>
            <div style={{ color: 'var(--primary-color)', fontSize: '1.1rem', marginBottom: '18px', fontWeight: 800 }}>
              다음 외칠 숫자: <strong>{currentNumber + 1}</strong>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '14px 0' }}>
              <div className="glass-card" style={{ padding: '14px', border: '1px solid var(--success-color)', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--success-color)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>
                  ✅ 통과 ({passed.length}명)
                </h4>
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {passed.map(id => {
                    const p = participants.find(part => part.id === id);
                    return <div key={id} style={{ fontSize: '0.95rem', color: '#fff' }}>👑 {p?.name || id}</div>;
                  })}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '14px', border: '1px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--danger-color)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>
                  💀 탈락 ({eliminated.length}명)
                </h4>
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {eliminated.map((e, idx) => (
                    <div key={e.id || idx} style={{ fontSize: '0.9rem', color: '#ff8080' }}>
                      ❌ {e.name} <span style={{ fontSize: '0.75rem', color: '#aaa' }}>({e.reason})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '25px' }}>
              <button onClick={startGame} className="btn-secondary" style={{ padding: '12px 28px', border: '1px solid var(--primary-color)' }}>
                <RotateCcw size={18} /> 🔄 1부터 라운드 재시작
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
