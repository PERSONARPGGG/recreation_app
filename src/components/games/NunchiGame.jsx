import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Eye, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export const NunchiGame = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, returnToLobby, room, updateRoomState } = useGame();
  
  const gameState = room.nunchiState || 'ready';
  const currentNumber = room.nunchiNumber || 0;
  const eliminated = room.nunchiEliminated || [];
  const passed = room.nunchiPassed || [];

  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      const allSubmissions = participants.map(p => ({
        id: p.id,
        name: p.name,
        num: p.lastInput?.nunchiNum,
        time: p.lastInput?.time
      })).filter(p => p.num && !eliminated.some(e => e.id === p.id) && !passed.includes(p.id));

      // Sort by time
      allSubmissions.sort((a, b) => a.time - b.time);

      if (allSubmissions.length > 0) {
        // Check for duplicates
        const nums = allSubmissions.map(s => s.num);
        const duplicates = nums.filter((item, index) => nums.indexOf(item) !== index);
        
          if (duplicates.length > 0) {
            // Anyone who picked a duplicate is eliminated
            const newlyEliminated = allSubmissions.filter(s => duplicates.includes(s.num));
            updateRoomState({ nunchiEliminated: [...eliminated, ...newlyEliminated] });
            soundFx.playError();
          } else {
            // Valid sequence
            const latest = allSubmissions[allSubmissions.length - 1];
            if (latest.num === currentNumber + 1) {
              updateRoomState({ nunchiNumber: latest.num, nunchiPassed: [...passed, latest.id] });
              submitPlayerInput(latest.id, null);
              soundFx.playSuccess();
            }
          }
        }
      }
  }, [participants, userRole, gameState, currentNumber, eliminated, room]);

  const startGame = () => {
    updateRoomState({
      nunchiState: 'playing',
      nunchiNumber: 0,
      nunchiEliminated: [],
      nunchiPassed: []
    });
    soundFx.playTick();
  };

  const handlePickNumber = () => {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    if (myPlayer?.lastInput?.nunchiNum) return; // already picked

    submitPlayerInput(myPlayerId, { nunchiNum: currentNumber + 1, time: Date.now() });
    soundFx.playTick();
  };

  if (userRole === 'participant') {
    const isEliminated = eliminated.some(e => e.id === myPlayerId);
    const isPassed = passed.includes(myPlayerId);

    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', minHeight: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>🙈 눈치게임</h2>
        {isEliminated ? (
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

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>🙈 아슬아슬 1부터 눈치게임</h2>
        <button onClick={returnToLobby} className="btn-secondary">로비로 돌아가기</button>
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
            
            <div style={{ marginTop: '20px', fontSize: '1.2rem', color: 'var(--danger-color)' }}>
              탈락자: {eliminated.length}명
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
