import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Eye, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export const NunchiGame = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, returnToLobby, room, updateRoomState, awardPoints } = useGame();
  
  const [isSettled, setIsSettled] = useState(false);
  const gameState = room.nunchiState || 'ready';
  const currentNumber = room.nunchiNumber || 0;
  const eliminated = room.nunchiEliminated || [];
  const passed = room.nunchiPassed || [];

  const processedSubmissionsRef = useRef(new Set());

  useEffect(() => {
    if (gameState === 'ready') {
      processedSubmissionsRef.current.clear();
    }
  }, [gameState]);

  useEffect(() => {
    if (userRole !== 'host' || gameState !== 'playing') return;

    // Collect pending new submissions
    const pending = participants
      .filter(p => p.lastInput?.nunchiNum && !processedSubmissionsRef.current.has(`${p.id}-${p.lastInput.time}`))
      .map(p => ({
        id: p.id,
        name: p.name,
        num: p.lastInput.nunchiNum,
        time: p.lastInput.time || Date.now()
      }))
      .filter(p => !eliminated.some(e => e.id === p.id) && !passed.includes(p.id));

    if (pending.length === 0) return;

    // Mark as processed immediately
    pending.forEach(p => processedSubmissionsRef.current.add(`${p.id}-${p.time}`));

    // Sort by time
    pending.sort((a, b) => a.time - b.time);

    const nums = pending.map(s => s.num);
    const duplicates = nums.filter((item, index) => nums.indexOf(item) !== index);

    if (duplicates.length > 0) {
      // Duplicate clash
      const clashPlayers = pending.filter(s => duplicates.includes(s.num));
      updateRoomState({ nunchiEliminated: [...eliminated, ...clashPlayers] });
      soundFx.playError();
    } else {
      // Check sequential
      for (const item of pending) {
        if (item.num === currentNumber + 1) {
          updateRoomState({ nunchiNumber: item.num, nunchiPassed: [...passed, item.id] });
          soundFx.playSuccess();
        } else {
          // Wrong number out of order -> eliminated
          updateRoomState({ nunchiEliminated: [...eliminated, item] });
          soundFx.playError();
        }
      }
    }
  }, [participants, userRole, gameState, currentNumber, eliminated, passed, updateRoomState]);

  const startGame = () => {
    // Clear all player inputs for fresh round
    participants.forEach(p => submitPlayerInput(p.id, null));
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
    if (myPlayer?.lastInput?.nunchiNum) return; // already picked

    submitPlayerInput(myPlayerId, { nunchiNum: currentNumber + 1, time: Date.now() });
    soundFx.playTick();
  };

  if (userRole === 'participant') {
    const isEliminated = gameState !== 'ready' && eliminated.some(e => e.id === myPlayerId);
    const isPassed = gameState !== 'ready' && passed.includes(myPlayerId);

    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', minHeight: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>🙈 눈치게임</h2>
        {gameState === 'ready' ? (
          <div style={{ color: 'var(--text-sub)', fontSize: '1.2rem' }}>🎮 호스트의 게임 시작을 기다리고 있습니다...</div>
        ) : isEliminated ? (
          <div style={{ color: 'var(--danger-color)', fontSize: '1.5rem', fontWeight: 800 }}>💀 동시 클릭 탈락!</div>
        ) : isPassed ? (
          <div style={{ color: 'var(--success-color)', fontSize: '1.5rem', fontWeight: 800 }}>✅ 생존 (통과)!</div>
        ) : gameState === 'playing' ? (
          <button onClick={handlePickNumber} className="btn-primary" style={{ padding: '50px 20px', fontSize: '3rem', background: '#af52de' }}>
            {currentNumber + 1}!
          </button>
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>대기 중...</div>
        )}
      </div>
    );
  }

  const handleSettlePoints = () => {
    if (isSettled) return;
    if (passed.length > 0) {
      passed.forEach(id => {
        const p = participants.find(part => part.id === id);
        awardPoints(id, 200, false);
        if (p?.teamId) awardPoints(p.teamId, 200, true);
      });
    } else {
      // 통과자 없을 경우 참가자 전원 50점
      participants.forEach(p => awardPoints(p.id, 50, false));
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
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>🙈 아슬아슬 1부터 눈치게임</h2>
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

      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Eye size={80} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 30px' }}><Play size={20} /> 게임 시작</button>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-sub)' }}>현재 숫자</h3>
            <div style={{ fontSize: '8rem', fontWeight: 900, color: '#fff', margin: '20px 0' }}>{currentNumber}</div>
            
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
              <div className="glass-card" style={{ padding: '15px', minWidth: '200px' }}>
                <h4 style={{ color: 'var(--success-color)', marginBottom: '10px' }}>✅ 통과 ({passed.length}명)</h4>
                {passed.map(id => {
                  const p = participants.find(part => part.id === id);
                  return <div key={id} style={{ fontSize: '1.1rem' }}>{p?.name}</div>;
                })}
              </div>
              <div className="glass-card" style={{ padding: '15px', minWidth: '200px' }}>
                <h4 style={{ color: 'var(--danger-color)', marginBottom: '10px' }}>💀 탈락 ({eliminated.length}명)</h4>
                {eliminated.map(e => <div key={e.id} style={{ fontSize: '1.1rem' }}>{e.name}</div>)}
              </div>
            </div>
            
            <button onClick={startGame} className="btn-secondary" style={{ marginTop: '30px' }}>
              🔄 라운드 재시작
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
