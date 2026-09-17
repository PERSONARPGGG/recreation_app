import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Activity, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export const TugOfWar = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, awardPoints, returnToLobby } = useGame();
  
  const [gameState, setGameState] = useState('ready'); // ready, playing, finished
  const [timeLeft, setTimeLeft] = useState(10);
  const [ropePosition, setRopePosition] = useState(50); // 50 is center, 0 is left win, 100 is right win

  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('finished');
            soundFx.playSuccess();
            // Award winner points
            if (ropePosition < 50) {
              awardPoints('odd', 500, true); // Assuming left is odd teams
            } else if (ropePosition > 50) {
              awardPoints('even', 500, true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [userRole, gameState, ropePosition, awardPoints]);

  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing') {
      // Calculate taps for left vs right
      // Odd team index = left, Even = right. Simple simulation for now.
      const leftForce = participants.reduce((acc, p) => acc + (p.teamId?.includes('1') || p.teamId?.includes('3') || p.teamId?.includes('5') ? (p.lastInput?.taps || 0) : 0), 0);
      const rightForce = participants.reduce((acc, p) => acc + (p.teamId?.includes('2') || p.teamId?.includes('4') || p.teamId?.includes('6') ? (p.lastInput?.taps || 0) : 0), 0);
      
      // Simulate bots tapping
      const botLeftForce = participants.filter(p => p.isBot && (p.teamId?.includes('1') || p.teamId?.includes('3') || p.teamId?.includes('5'))).length * Math.random() * 2;
      const botRightForce = participants.filter(p => p.isBot && (p.teamId?.includes('2') || p.teamId?.includes('4') || p.teamId?.includes('6'))).length * Math.random() * 2;

      const totalLeft = leftForce + botLeftForce;
      const totalRight = rightForce + botRightForce;

      const diff = totalLeft - totalRight;
      // move rope position based on diff
      let newPos = 50 - (diff * 0.1);
      if (newPos < 0) newPos = 0;
      if (newPos > 100) newPos = 100;
      
      setRopePosition(newPos);
    }
  }, [participants, userRole, gameState]);

  const startGame = () => {
    setTimeLeft(10);
    setRopePosition(50);
    setGameState('playing');
    soundFx.playSpookyNight();
  };

  const handlePull = () => {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const currentTaps = myPlayer?.lastInput?.taps || 0;
    submitPlayerInput(myPlayerId, { taps: currentTaps + 1 });
  };

  if (userRole === 'participant') {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>🪢 100인 줄다리기</h2>
        {gameState === 'playing' ? (
          <button onClick={handlePull} className="btn-primary" style={{ padding: '50px 20px', fontSize: '2rem', background: 'var(--primary-color)', color: '#000' }}>
            당겨!! (터치 연타)
          </button>
        ) : gameState === 'finished' ? (
          <div><h3 style={{ color: 'var(--success-color)' }}>게임 종료!</h3><p>화면에서 결과를 확인하세요.</p></div>
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>준비...</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>🪢 영차영차! 100인 줄다리기</h2>
        <button onClick={returnToLobby} className="btn-secondary">로비로 돌아가기</button>
      </div>

      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        {gameState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Activity size={80} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 30px' }}><Play size={20} /> 경기 시작</button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'finished') && (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <h2 style={{ fontSize: '3rem', color: 'var(--danger-color)', marginBottom: '40px' }}>{timeLeft}초</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 50px', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-color)' }}>홀수 팀 진영</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>짝수 팀 진영</div>
            </div>

            <div style={{ width: '80%', height: '20px', background: '#555', margin: '0 auto', position: 'relative', borderRadius: '10px' }}>
              <div style={{ 
                position: 'absolute', 
                top: '-20px', 
                left: `${ropePosition}%`, 
                width: '60px', 
                height: '60px', 
                background: '#ffd700', 
                borderRadius: '50%',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 20px rgba(255,215,0,0.8)'
              }}></div>
            </div>

            {gameState === 'finished' && (
              <h2 style={{ marginTop: '50px', fontSize: '2.5rem', color: 'var(--success-color)' }}>
                {ropePosition < 50 ? '홀수 팀 진영 승리!' : ropePosition > 50 ? '짝수 팀 진영 승리!' : '무승부!'}
              </h2>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
