import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Type, Play, Award } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const WORD_LIST = [
  { initial: 'ㅅㄱ', answer: '사과' },
  { initial: 'ㅂㄴㄴ', answer: '바나나' },
  { initial: 'ㅈㅈㄱ', answer: '자전거' },
  { initial: 'ㅎㄱ', answer: '학교' },
  { initial: 'ㅇㅈ', answer: '우주' },
  { initial: 'ㅋㅍㅌ', answer: '컴퓨터' },
  { initial: 'ㅇㅌㄴ', answer: '인터넷' },
  { initial: 'ㅅㅁㅌㅍ', answer: '스마트폰' },
];

export const InitialWordQuiz = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, awardPoints, returnToLobby, room, updateRoomState } = useGame();
  const gameState = room.quizState || 'ready';
  const currentWord = room.quizCurrentWord || null;
  const winners = room.quizWinners || [];
  
  const [isSettled, setIsSettled] = useState(false);
  const [myInput, setMyInput] = useState('');
  const [customInitial, setCustomInitial] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');

  // Host checks answers
  useEffect(() => {
    if (userRole === 'host' && gameState === 'playing' && currentWord) {
      const activeSubmissions = participants.filter(p => {
        const pWord = p.lastInput?.word?.trim().toLowerCase();
        const ansWord = currentWord.answer.trim().toLowerCase();
        return pWord === ansWord;
      });
      
      // Also simulate bots
      const botSubmissions = participants.filter(p => p.isBot && Math.random() > 0.995);
      
      const allWinners = [...activeSubmissions, ...botSubmissions];
      
        if (allWinners.length >= 3) {
          // Top 3 found
          const top3 = allWinners.slice(0, 3);
          updateRoomState({ quizWinners: top3, quizState: 'finished' });
          soundFx.playSuccess();
        
        // Award points
        top3.forEach((w, idx) => {
          const points = idx === 0 ? 300 : idx === 1 ? 200 : 100;
          awardPoints(w.id, points, false);
          if (w.teamId) awardPoints(w.teamId, points, true);
        });
      }
    }
  }, [participants, userRole, gameState, currentWord, awardPoints]);

  const startGame = (isCustom = false) => {
    let wordToUse;
    if (isCustom && customInitial.trim() && customAnswer.trim()) {
      wordToUse = { initial: customInitial.trim(), answer: customAnswer.trim() };
    } else {
      wordToUse = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    }
    // Clear all player inputs for fresh round
    participants.forEach(p => submitPlayerInput(p.id, null));
    updateRoomState({ quizCurrentWord: wordToUse, quizWinners: [], quizState: 'playing' });
    setIsSettled(false);
    soundFx.playTick();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!myInput.trim() || gameState !== 'playing') return;
    submitPlayerInput(myPlayerId, { word: myInput.trim() });
    setMyInput('');
    soundFx.playTick();
  };

  if (userRole === 'participant') {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const mySubmittedWord = myPlayer?.lastInput?.word;
    const isWinner = winners.some(w => w.id === myPlayerId);
    const winnerRank = winners.findIndex(w => w.id === myPlayerId) + 1;

    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>🅰️ 초성 텔레파시</h2>
        {gameState === 'playing' ? (
          <div>
            <div style={{ color: 'var(--text-sub)', marginBottom: '10px' }}>제시된 초성을 보고 정답을 입력하세요!</div>
            <div style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '8px', margin: '15px 0' }}>
              {currentWord?.initial}
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="text"
                value={myInput}
                onChange={(e) => setMyInput(e.target.value)}
                placeholder="정답 단어 입력"
                style={{ padding: '16px', borderRadius: '12px', fontSize: '1.3rem', textAlign: 'center', border: '2px solid var(--primary-color)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '16px', fontSize: '1.2rem' }}>
                🚀 정답 제출!
              </button>
            </form>
            {mySubmittedWord && (
              <div style={{ marginTop: '16px', color: 'var(--text-sub)', fontSize: '1rem' }}>
                최근 제출: <strong style={{ color: '#fff' }}>"{mySubmittedWord}"</strong>
              </div>
            )}
          </div>
        ) : gameState === 'finished' ? (
          <div style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--success-color)', fontSize: '2rem', marginBottom: '10px' }}>
              🎉 정답: {currentWord?.answer}!
            </h3>
            {isWinner ? (
              <div style={{ color: '#ffd700', fontSize: '1.4rem', fontWeight: 900, marginTop: '15px' }}>
                🏆 축하합니다! {winnerRank}등으로 정답을 맞히셨습니다!
              </div>
            ) : (
              <p style={{ color: 'var(--text-sub)', marginTop: '10px', fontSize: '1.1rem' }}>
                이번 라운드가 마감되었습니다. 다음 문제를 준비하세요!
              </p>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-sub)', fontSize: '1.2rem' }}>
            호스트가 문제를 출제하고 있습니다. 잠시만 기다려주세요...
          </div>
        )}
      </div>
    );
  }

  const handleSettlePoints = () => {
    if (isSettled) return;
    if (winners.length > 0) {
      winners.forEach((w, idx) => {
        const points = idx === 0 ? 300 : idx === 1 ? 200 : 100;
        awardPoints(w.id, points, false);
        if (w.teamId) awardPoints(w.teamId, points, true);
      });
    } else {
      // 정답자 없을 시 참가자 전원에게 50점 지급
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
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          🅰️ 실시간 초성 텔레파시 (Initial Word Quiz)
        </h2>
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
            <Type size={80} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
            
            <div style={{ marginBottom: '30px' }}>
              <button onClick={() => startGame(false)} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 30px' }}>
                <Play size={20} /> 랜덤 초성 퀴즈 시작
              </button>
            </div>

            <div className="glass-card" style={{ padding: '20px', display: 'inline-block', textAlign: 'left', marginTop: '10px' }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>📝 직접 출제하기</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="초성 (예: ㅇㅍ)" 
                  value={customInitial} 
                  onChange={(e) => setCustomInitial(e.target.value)}
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
                <input 
                  type="text" 
                  placeholder="정답 (예: 애플)" 
                  value={customAnswer} 
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
              </div>
              <button onClick={() => startGame(true)} className="btn-secondary" style={{ width: '100%', padding: '12px' }}>
                커스텀 문제 출제
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-sub)' }}>가장 먼저 정답을 맞혀라!</h3>
            <div style={{ fontSize: '6rem', fontWeight: 900, color: '#fff', letterSpacing: '10px', margin: '20px 0' }}>
              {currentWord?.initial}
            </div>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        )}

        {gameState === 'finished' && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--success-color)', marginBottom: '10px' }}>정답: {currentWord?.answer}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
              {winners.map((w, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '20px', minWidth: '150px' }}>
                  <Award size={40} color={idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : '#cd7f32'} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '10px' }}>{idx + 1}등</div>
                  <div style={{ color: w.teamColor, fontWeight: 700 }}>{w.name}</div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                participants.forEach(p => submitPlayerInput(p.id, null));
                updateRoomState({ quizState: 'ready', quizCurrentWord: null, quizWinners: [] });
                setIsSettled(false);
              }} 
              className="btn-primary" 
              style={{ marginTop: '40px', fontSize: '1.2rem', padding: '12px 30px' }}
            >
              🔄 다음 문제 준비 (새 라운드)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
