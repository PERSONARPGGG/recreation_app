import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { HelpCircle, CheckCircle, XCircle, Zap, Eye, Award, RotateCcw } from 'lucide-react';

const OX_QUESTION_BANK = [
  { q: "대한민국의 세종대왕은 훈민정음을 창제할 때 눈 질환을 앓고 있었다?", a: "O", exp: "정답은 O! 세종대왕은 오랜 연구와 독서로 지독한 안질을 겪으셨습니다." },
  { q: "바나나는 나무에서 열리는 열매이다?", a: "X", exp: "정답은 X! 바나나는 나무가 아니라 거대한 여러해살이 '풀'입니다." },
  { q: "펭귄은 남극에만 살고 북극에는 살지 않는다?", a: "O", exp: "정답은 O! 야생 펭귄은 오직 남반구(남극, 갈라파고스 등)에만 존재합니다." },
  { q: "달팽이에게는 이빨이 1만 개 이상 존재한다?", a: "O", exp: "정답은 O! 달팽이는 '설치'라는 수만 개의 돋아난 미세 이빨을 가집니다." },
  { q: "세계에서 가장 빠른 동물은 치타이다?", a: "X", exp: "정답은 X! 순간 최고 속도가 380km/h에 달하는 송골매가 가장 빠릅니다." }
];

export const SurvivalOxQuiz = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardPoints, room, simulateBotGameInputs, returnToLobby } = useGame();

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState('O');
  const [myChoice, setMyChoice] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const questionObj = OX_QUESTION_BANK[currentQIndex];

  const handleSelectAnswer = (choice) => {
    setMyChoice(choice);
    submitPlayerInput(myPlayerId, { choice });
    soundFx.playTick();
  };

  const handleRevealAnswer = () => {
    soundFx.playDrumroll(1.5);
    setTimeout(() => {
      setRevealed(true);
      soundFx.playSuccess();
      
      // Auto-award points to survivors
      const currentSurvivors = participants.filter(p => p.lastInput?.choice === questionObj.a);
      currentSurvivors.forEach(s => {
        awardPoints(s.id, 100, false);
      });
    }, 1500);
  };

  const handleNextQuestion = () => {
    setRevealed(false);
    setMyChoice(null);
    setCurrentQIndex((prev) => (prev + 1) % OX_QUESTION_BANK.length);
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('oxquiz');
    soundFx.playSuccess();
  };

  // Vote counting
  const oCount = participants.filter(p => p.lastInput?.choice === 'O').length;
  const xCount = participants.filter(p => p.lastInput?.choice === 'X').length;
  const totalVotes = oCount + xCount || 1;
  const oPercent = Math.round((oCount / totalVotes) * 100);
  const xPercent = Math.round((xCount / totalVotes) * 100);

  // Survivors
  const survivors = participants.filter(p => p.lastInput?.choice === questionObj.a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.8rem' }}>🧠</div>
          <div>
            <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              100인 서바이벌 OX 퀴즈
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              100명의 참가자가 선택한 O/X 실시간 현황과 서바이벌 라이브 매치!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && (
            <>
              <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                <Zap size={16} /> 100인 투표 시뮬레이션
              </button>
              <button onClick={returnToLobby} className="btn-secondary">
                로비로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '30px', textAlign: 'center' }}>
        
        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          QUESTION #{currentQIndex + 1}
        </div>

        <h1 className="font-heading" style={{ fontSize: '2.1rem', fontWeight: 900, margin: '15px 0 30px 0', lineHeight: 1.4 }}>
          "{questionObj.q}"
        </h1>

        {/* O vs X Touch Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '600px', margin: '0 auto 30px auto' }}>
          
          <button
            onClick={() => handleSelectAnswer('O')}
            style={{
              background: myChoice === 'O' ? 'rgba(0, 243, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: myChoice === 'O' ? '3px solid var(--primary-color)' : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '30px',
              color: 'var(--primary-color)',
              fontSize: '4.5rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: myChoice === 'O' ? '0 0 30px var(--primary-glow)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>⭕ O</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700 }}>참 (TRUE)</span>
          </button>

          <button
            onClick={() => handleSelectAnswer('X')}
            style={{
              background: myChoice === 'X' ? 'rgba(255, 0, 122, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: myChoice === 'X' ? '3px solid #ff007a' : '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '30px',
              color: '#ff007a',
              fontSize: '4.5rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: myChoice === 'X' ? '0 0 30px rgba(255,0,122,0.6)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>❌ X</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700 }}>거짓 (FALSE)</span>
          </button>

        </div>

        {/* Live Voting Distribution Bar */}
        <div style={{ maxWidth: '700px', margin: '0 auto 30px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, marginBottom: '8px' }}>
            <span style={{ color: 'var(--primary-color)' }}>⭕ O 선택: {oCount}명 ({oPercent}%)</span>
            <span style={{ color: '#ff007a' }}>❌ X 선택: {xCount}명 ({xPercent}%)</span>
          </div>

          <div style={{ height: '24px', borderRadius: '12px', background: '#111', overflow: 'hidden', display: 'flex', border: '1px solid var(--card-border)' }}>
            <div style={{ width: `${oPercent}%`, background: 'var(--primary-color)', transition: 'width 0.4s ease' }} />
            <div style={{ width: `${xPercent}%`, background: '#ff007a', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Host Controls for Reveal */}
        {userRole === 'host' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
            {!revealed ? (
              <button onClick={handleRevealAnswer} className="btn-primary" style={{ fontSize: '1.2rem', padding: '16px 40px' }}>
                <Eye size={20} /> 정답 공개 및 수집!
              </button>
            ) : (
              <button onClick={handleNextQuestion} className="btn-secondary" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
                <RotateCcw size={18} /> 다음 퀴즈 진행
              </button>
            )}
          </div>
        )}

        {/* Answer Banner */}
        {revealed && (
          <div style={{
            marginTop: '30px',
            padding: '24px',
            borderRadius: '20px',
            background: 'rgba(0, 255, 136, 0.15)',
            border: '2px solid var(--success-color)',
            animation: 'pulse-glow 2s infinite ease-in-out'
          }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--success-color)' }}>
              🎉 정답: {questionObj.a}!
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#fff', marginTop: '8px' }}>{questionObj.exp}</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginTop: '12px', fontWeight: 800 }}>
              생존자: {survivors.length}명! (+생존 점수 부여)
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
