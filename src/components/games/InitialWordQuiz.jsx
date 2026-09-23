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

/**
 * InitialWordQuiz 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
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
      
      // Check if winners found or all active participants answered
      const targetCount = Math.min(Math.max(participants.length, 1), 3);
      if (allWinners.length >= targetCount || (participants.length > 0 && activeSubmissions.length >= participants.length)) {
        // Winners found
        const topWinners = allWinners.slice(0, 3);
        updateRoomState({ quizWinners: topWinners, quizState: 'finished' });
        soundFx.playSuccess();
        
        // Award points
        topWinners.forEach((w, idx) => {
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

  const handleEndRoundManually = () => {
    // Find who got it right so far
    if (!currentWord) return;
    const rightSubmissions = participants.filter(p => {
      const pWord = p.lastInput?.word?.trim().toLowerCase();
      const ansWord = currentWord.answer.trim().toLowerCase();
      return pWord === ansWord;
    });
    updateRoomState({ quizWinners: rightSubmissions.slice(0, 3), quizState: 'finished' });
    soundFx.playSuccess();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!myInput.trim() || gameState !== 'playing') return;
    submitPlayerInput(myPlayerId, { word: myInput.trim() });
    setMyInput('');
    soundFx.playSuccess();
  };

  if (userRole === 'participant') {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const mySubmittedWord = myPlayer?.lastInput?.word;
    const hasSubmitted = !!mySubmittedWord;
    const isWinner = winners.some(w => w.id === myPlayerId);
    const winnerRank = winners.findIndex(w => w.id === myPlayerId) + 1;

    return (
      <div className="glass-panel" style={{ padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-color)' }}>🅰️ 초성 텔레파시</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            {gameState === 'playing' ? '정답 입력 중' : '대기'}
          </span>
        </div>

        {gameState === 'playing' ? (
          <div>
            <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '6px' }}>제시된 초성을 보고 정답을 입력하세요!</div>
            <div style={{ fontSize: '3.6rem', fontWeight: 900, color: 'var(--primary-color)', letterSpacing: '6px', margin: '8px 0' }}>
              {currentWord?.initial}
            </div>

            {hasSubmitted ? (
              <div className="glass-card" style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.12)', border: '2px solid var(--success-color)', borderRadius: '14px', maxWidth: '380px', margin: '10px auto' }}>
                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>✅</div>
                <h3 style={{ color: 'var(--success-color)', fontSize: '1.15rem', fontWeight: 800, marginBottom: '4px' }}>
                  입력을 완료하였습니다.
                </h3>
                <p style={{ color: '#fff', fontSize: '1rem', margin: 0 }}>
                  제출한 단어: <strong style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>"{mySubmittedWord}"</strong>
                </p>
                <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '8px' }}>
                  정답 발표 및 다른 참가자들의 제출을 대기하고 있습니다...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', margin: '0 auto' }}>
                <input
                  type="text"
                  value={myInput}
                  onChange={(e) => setMyInput(e.target.value)}
                  placeholder="정답 단어 입력"
                  autoFocus
                  style={{ padding: '14px', borderRadius: '12px', fontSize: '1.2rem', textAlign: 'center', border: '2px solid var(--primary-color)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '14px', fontSize: '1.1rem' }}>
                  🚀 정답 제출!
                </button>
              </form>
            )}
          </div>
        ) : gameState === 'finished' ? (
          <div style={{ padding: '16px 10px' }}>
            <h3 style={{ color: 'var(--success-color)', fontSize: '1.6rem', marginBottom: '6px' }}>
              🎉 정답: {currentWord?.answer}!
            </h3>
            {isWinner ? (
              <div style={{ color: '#ffd700', fontSize: '1.2rem', fontWeight: 900, marginTop: '10px' }}>
                🏆 축하합니다! {winnerRank}등으로 정답을 맞히셨습니다!
              </div>
            ) : (
              <p style={{ color: 'var(--text-sub)', marginTop: '8px', fontSize: '0.95rem' }}>
                이번 라운드가 마감되었습니다. 다음 문제를 준비하세요!
              </p>
            )}
          </div>
        ) : (
          <div style={{ padding: '24px 10px', color: 'var(--text-sub)', fontSize: '1.05rem' }}>
            호스트가 문제를 출제하고 있습니다. 잠시만 기다려주세요...
          </div>
        )}
      </div>
    );
  }

  const handleSettlePoints = () => {
    if (isSettled || gameState !== 'finished') return;
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
    if (gameState === 'finished' && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
          🅰️ 실시간 초성 텔레파시
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {userRole === 'host' && (
            <button 
              onClick={handleSettlePoints} 
              disabled={isSettled || gameState !== 'finished'}
              className="btn-primary" 
              style={{ 
                background: isSettled ? '#555' : gameState !== 'finished' ? '#333' : 'var(--success-color)', 
                cursor: isSettled || gameState !== 'finished' ? 'not-allowed' : 'pointer',
                opacity: (gameState !== 'finished' && !isSettled) ? 0.6 : 1,
                padding: '6px 14px', fontSize: '0.85rem'
              }}
            >
              {isSettled ? '✅ 정산 완료' : gameState !== 'finished' ? '⏳ 정답 확인 후 정산' : '🏆 포인트 정산하기'}
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
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-sub)' }}>가장 먼저 정답을 맞혀라!</h3>
            <div style={{ fontSize: '5.5rem', fontWeight: 900, color: '#fff', letterSpacing: '10px', margin: '15px 0' }}>
              {currentWord?.initial}
            </div>
            <div style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '20px' }}>
              (사회자 참고 정답: <strong>{currentWord?.answer}</strong>)
            </div>

            {/* Live Submissions */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', textAlign: 'left', maxHeight: '180px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '8px' }}>
                실시간 참가자 입력 현황 ({participants.filter(p => p.lastInput?.word).length}/{participants.length}명 완료):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {participants.map(p => {
                  const hasSub = !!p.lastInput?.word;
                  return (
                    <span 
                      key={p.id} 
                      style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem',
                        background: hasSub ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: hasSub ? '1px solid var(--success-color)' : '1px solid #444',
                        color: hasSub ? '#4ade80' : '#888'
                      }}
                    >
                      {p.name}: {hasSub ? `"${p.lastInput.word}"` : '대기중...'}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button 
                onClick={handleEndRoundManually} 
                className="btn-secondary" 
                style={{ padding: '10px 24px', borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}
              >
                ⏹️ 라운드 마감 & 정답 확인
              </button>
            </div>
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
