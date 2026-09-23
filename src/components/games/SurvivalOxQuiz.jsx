import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { HelpCircle, CheckCircle, XCircle, Zap, Eye, Award, RotateCcw, Settings, Trash2, Plus, Edit2, Save } from 'lucide-react';

const OX_QUESTION_BANK = [
  { q: "대한민국의 세종대왕은 훈민정음을 창제할 때 눈 질환을 앓고 있었다?", a: "O", exp: "정답은 O! 세종대왕은 오랜 연구와 독서로 지독한 안질을 겪으셨습니다." },
  { q: "바나나는 나무에서 열리는 열매이다?", a: "X", exp: "정답은 X! 바나나는 나무가 아니라 거대한 여러해살이 '풀'입니다." },
  { q: "펭귄은 남극에만 살고 북극에는 살지 않는다?", a: "O", exp: "정답은 O! 야생 펭귄은 오직 남반구(남극, 갈라파고스 등)에만 존재합니다." },
  { q: "달팽이에게는 이빨이 1만 개 이상 존재한다?", a: "O", exp: "정답은 O! 달팽이는 '설치'라는 수만 개의 돋아난 미세 이빨을 가집니다." },
  { q: "세계에서 가장 빠른 동물은 치타이다?", a: "X", exp: "정답은 X! 순간 최고 속도가 380km/h에 달하는 송골매가 가장 빠릅니다." }
];

/**
 * SurvivalOxQuiz 컴포넌트
 * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.
 * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.
 */
export const SurvivalOxQuiz = () => {
  const { userRole, participants, submitPlayerInput, resetAllPlayerInputs, myPlayerId, awardPoints, room, simulateBotGameInputs, returnToLobby, updateRoomState } = useGame();


  const [showSettings, setShowSettings] = useState(false);
  const customQuestions = room.oxQuestions || OX_QUESTION_BANK;
  
  // Game End Condition
  const isGameFinished = room.oxQIndex >= customQuestions.length;

  const currentQIndex = room.oxQIndex || 0;
  const revealed = !!room.oxRevealed;
  const [isSettled, setIsSettled] = useState(false);

  const myPlayer = participants.find(p => p.id === myPlayerId);
  // Match by question index so previous question input never locks the new question!
  const myChoice = (myPlayer?.lastInput?.qIndex === currentQIndex) ? myPlayer.lastInput.choice : null;
  const hasChosen = !!myChoice;

  const questionObj = customQuestions[currentQIndex] || customQuestions[0];

  const handleSelectAnswer = (choice) => {
    if (revealed || hasChosen) return; // Disallow picking after reveal or once chosen
    submitPlayerInput(myPlayerId, { choice, qIndex: currentQIndex });
    soundFx.playTick();
  };

  const handleRevealAnswer = () => {
    soundFx.playDrumroll(1.5);
    setTimeout(() => {
      updateRoomState({ oxRevealed: true });
      setIsSettled(false);
      soundFx.playSuccess();
    }, 1500);
  };

  const handleNextQuestion = () => {
    // Clear all player inputs atomically across all participants
    resetAllPlayerInputs();
    const nextIdx = currentQIndex + 1;
    if (nextIdx >= customQuestions.length) {
      updateRoomState({ oxQIndex: nextIdx, oxRevealed: true, oxFinished: true });
    } else {
      updateRoomState({ oxQIndex: nextIdx, oxRevealed: false });
    }
    setIsSettled(false);
    soundFx.playTick();
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('oxquiz');
    soundFx.playSuccess();
  };

  // Vote counting (only count current question votes)
  const oCount = participants.filter(p => p.lastInput?.qIndex === currentQIndex && p.lastInput?.choice === 'O').length;
  const xCount = participants.filter(p => p.lastInput?.qIndex === currentQIndex && p.lastInput?.choice === 'X').length;
  const totalVotes = oCount + xCount || 1;
  const oPercent = Math.round((oCount / totalVotes) * 100);
  const xPercent = Math.round((xCount / totalVotes) * 100);

  // Survivors
  const survivors = participants.filter(p => p.lastInput?.qIndex === currentQIndex && p.lastInput?.choice === questionObj.a);

  const handleSettlePoints = () => {
    if (isSettled || !revealed) return;
    if (survivors.length > 0) {
      survivors.forEach(s => {
        awardPoints(s.id, 100, false);
        if (s.teamId && room.mode === 'team') awardPoints(s.teamId, 100, true);
      });
    } else {
      participants.forEach(p => awardPoints(p.id, 50, false));
    }
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (revealed && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: userRole === 'participant' ? '6px' : '12px' }}>

      {showSettings && userRole === 'host' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Settings /> OX 문제 설정</h2>
              <button onClick={() => setShowSettings(false)} className="btn-secondary" style={{ padding: '6px 12px' }}><XCircle size={18} /> 닫기</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {customQuestions.map((q, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 900, color: 'var(--primary-color)' }}>Q{idx + 1}</span>
                    <input 
                      type="text" 
                      value={q.q} 
                      onChange={(e) => {
                        const newQ = [...customQuestions];
                        newQ[idx].q = e.target.value;
                        updateRoomState({ oxQuestions: newQ });
                      }}
                      style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 12px', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                      value={q.a}
                      onChange={(e) => {
                        const newQ = [...customQuestions];
                        newQ[idx].a = e.target.value;
                        updateRoomState({ oxQuestions: newQ });
                      }}
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                    >
                      <option value="O">정답: O</option>
                      <option value="X">정답: X</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="해설 (예: 정답은 O입니다!)"
                      value={q.exp} 
                      onChange={(e) => {
                        const newQ = [...customQuestions];
                        newQ[idx].exp = e.target.value;
                        updateRoomState({ oxQuestions: newQ });
                      }}
                      style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 12px', borderRadius: '6px' }}
                    />
                    <button 
                      onClick={() => {
                        const newQ = customQuestions.filter((_, i) => i !== idx);
                        updateRoomState({ oxQuestions: newQ.length ? newQ : OX_QUESTION_BANK });
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => {
                const newQ = [...customQuestions, { q: '새로운 문제입니다.', a: 'O', exp: '해설을 입력하세요.' }];
                updateRoomState({ oxQuestions: newQ });
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={18} /> 문제 추가하기
            </button>
          </div>
        </div>
      )}

      
      {/* Header Toolbar */}
      {userRole === 'host' ? (
        <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '1.4rem' }}>🧠</div>
            <div>
              <h2 className="font-heading text-gradient" style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
                100인 서바이벌 OX 퀴즈
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowSettings(true)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <Settings size={14} /> 문제 설정
            </button>
            <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)', padding: '6px 12px', fontSize: '0.85rem' }}>
              <Zap size={14} /> 100인 투표 시뮬레이션
            </button>
            <button 
              onClick={handleSettlePoints} 
              disabled={isSettled || !revealed}
              className="btn-primary" 
              style={{ 
                background: isSettled ? '#555' : !revealed ? '#333' : 'var(--success-color)', 
                cursor: isSettled || !revealed ? 'not-allowed' : 'pointer',
                opacity: (!revealed && !isSettled) ? 0.6 : 1,
                padding: '6px 14px', fontSize: '0.85rem'
              }}
            >
              {isSettled ? '✅ 정산 완료' : !revealed ? '⏳ 정답 공개 후 정산' : '🏆 포인트 정산하기'}
            </button>
            <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              🏠 로비로
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 6px' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--primary-color)' }}>
            🧠 서바이벌 OX 퀴즈
          </span>
          <span style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 800 }}>
            제 {currentQIndex + 1}번 문제
          </span>
        </div>
      )}

      
      {/* Game Finished Screen */}
      {isGameFinished ? (
        <div className="glass-panel glass-panel-glow" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '16px' }}>🎉 퀴즈 종료! 🎉</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '24px' }}>모든 준비된 OX 퀴즈 문제가 끝났습니다.</p>
          {userRole === 'host' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => { resetAllPlayerInputs(); updateRoomState({ oxQIndex: 0, oxRevealed: false, oxFinished: false }); }} className="btn-secondary">
                <RotateCcw size={16} /> 처음부터 다시하기
              </button>
            </div>
          )}
        </div>
      ) : (
      <div className="glass-panel glass-panel-glow" style={{ padding: userRole === 'participant' ? '12px 10px' : '24px 20px', textAlign: 'center' }}>

        
        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '1px', marginBottom: '4px' }}>
          제 {currentQIndex + 1} 번 퀴즈
        </div>

        <h1 className="font-heading" style={{ fontSize: userRole === 'participant' ? '1.25rem' : '1.8rem', fontWeight: 900, margin: userRole === 'participant' ? '4px 0 12px 0' : '8px 0 16px 0', lineHeight: 1.35 }}>
          "{questionObj.q}"
        </h1>

        {/* O vs X Touch Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: userRole === 'participant' ? '10px' : '14px', maxWidth: '520px', margin: '0 auto 12px auto' }}>
          
          <button
            onClick={() => handleSelectAnswer('O')}
            disabled={revealed || (userRole === 'participant' && hasChosen)}
            style={{
              background: myChoice === 'O' ? 'rgba(0, 243, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: myChoice === 'O' ? '3px solid var(--primary-color)' : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: userRole === 'participant' ? '14px 8px' : '24px 16px',
              color: 'var(--primary-color)',
              fontSize: userRole === 'participant' ? '2.8rem' : '4rem',
              fontWeight: 900,
              cursor: (revealed || (userRole === 'participant' && hasChosen)) ? 'not-allowed' : 'pointer',
              opacity: (revealed || hasChosen) && myChoice !== 'O' ? 0.35 : 1,
              boxShadow: myChoice === 'O' ? '0 0 25px var(--primary-glow)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⭕ O</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>그렇다 (O)</span>
          </button>

          <button
            onClick={() => handleSelectAnswer('X')}
            disabled={revealed || (userRole === 'participant' && hasChosen)}
            style={{
              background: myChoice === 'X' ? 'rgba(255, 0, 122, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: myChoice === 'X' ? '3px solid #ff007a' : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: userRole === 'participant' ? '14px 8px' : '24px 16px',
              color: '#ff007a',
              fontSize: userRole === 'participant' ? '2.8rem' : '4rem',
              fontWeight: 900,
              cursor: (revealed || (userRole === 'participant' && hasChosen)) ? 'not-allowed' : 'pointer',
              opacity: (revealed || hasChosen) && myChoice !== 'X' ? 0.35 : 1,
              boxShadow: myChoice === 'X' ? '0 0 25px rgba(255,0,122,0.6)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>❌ X</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>아니다 (X)</span>
          </button>

        </div>

        {userRole === 'participant' && hasChosen && !revealed && (
          <div className="glass-card" style={{ maxWidth: '400px', margin: '-4px auto 16px auto', padding: '10px 16px', textAlign: 'center', border: '1px solid var(--success-color)', background: 'rgba(34, 197, 94, 0.12)', borderRadius: '12px' }}>
            <div style={{ color: 'var(--success-color)', fontWeight: 800, fontSize: '0.95rem' }}>
              ✅ 입력을 완료하였습니다. (선택: {myChoice === 'O' ? '⭕ O' : '❌ X'})
            </div>
            <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '2px' }}>
              사회자의 정답 공개를 기다리는 중입니다...
            </div>
          </div>
        )}

        {/* Live Voting Distribution Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 16px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px' }}>
            <span style={{ color: 'var(--primary-color)' }}>⭕ O: {oCount}명 ({oPercent}%)</span>
            <span style={{ color: '#ff007a' }}>❌ X: {xCount}명 ({xPercent}%)</span>
          </div>

          <div style={{ height: '18px', borderRadius: '10px', background: '#111', overflow: 'hidden', display: 'flex', border: '1px solid var(--card-border)' }}>
            <div style={{ width: `${oPercent}%`, background: 'var(--primary-color)', transition: 'width 0.4s ease' }} />
            <div style={{ width: `${xPercent}%`, background: '#ff007a', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Host Controls for Reveal */}
        {userRole === 'host' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
            {!revealed ? (
              <button onClick={handleRevealAnswer} className="btn-primary" style={{ fontSize: '1.1rem', padding: '12px 32px' }}>
                <Eye size={18} /> 정답 공개 및 수집!
              </button>
            ) : (
              <button onClick={handleNextQuestion} className="btn-secondary" style={{ fontSize: '1rem', padding: '10px 24px' }}>
                <RotateCcw size={16} /> {currentQIndex + 1 >= customQuestions.length ? "게임 종료" : "다음 퀴즈 진행"}
              </button>
            )}
          </div>
        )}

        {/* Answer Banner */}
        {revealed && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(0, 255, 136, 0.15)',
            border: '2px solid var(--success-color)',
            animation: 'pulse-glow 2s infinite ease-in-out'
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success-color)', margin: 0 }}>
              🎉 정답: {questionObj.a}!
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#fff', marginTop: '6px', marginBottom: 0 }}>{questionObj.exp}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--primary-color)', marginTop: '8px', marginBottom: 0, fontWeight: 800 }}>
              생존자: {survivors.length}명! (+생존 점수 부여)
            </p>
            {userRole === 'participant' && myChoice && (
              <div style={{ marginTop: '10px', fontSize: '1.05rem', fontWeight: 900, color: myChoice === questionObj.a ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {myChoice === questionObj.a ? '🎉 축하합니다! 정답을 맞혀 생존하셨습니다!' : '💀 아쉽게 오답입니다! 다음 문제를 기대하세요.'}
              </div>
            )}
          </div>
        )}

            </div>
      )}
    </div>
  );
};
