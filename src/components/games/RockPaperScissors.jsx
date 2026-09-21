import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Hand, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const CHOICES = ['가위', '바위', '보'];
const EMOJIS = { '가위': '✌️', '바위': '✊', '보': '✋' };

export const RockPaperScissors = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, returnToLobby, room, updateRoomState, awardPoints } = useGame();
  
  const [isSettled, setIsSettled] = useState(false);

  // Use room state instead of local state for sync
  const rpsState = room.rpsState || 'ready';
  const round = room.rpsRound || 1;
  const hostChoice = room.rpsHostChoice || null;
  const survivors = room.rpsSurvivors || participants;

  const startGame = () => {
    updateRoomState({ rpsState: 'choosing', rpsHostChoice: null, rpsRound: 1, rpsSurvivors: participants });
    setIsSettled(false);
    soundFx.playTick();
  };

  const determineResult = () => {
    const aiChoice = CHOICES[Math.floor(Math.random() * 3)];
    soundFx.playSuccess();
    
    // Determine survivors
    const newSurvivors = survivors.filter(p => {
      // Simulate bots
      let playerChoice = p.lastInput?.rps;
      if (p.isBot) {
        playerChoice = CHOICES[Math.floor(Math.random() * 3)];
      }

      if (!playerChoice) return false;
      
      // Check win against host
      if (playerChoice === '가위' && aiChoice === '보') return true;
      if (playerChoice === '바위' && aiChoice === '가위') return true;
      if (playerChoice === '보' && aiChoice === '바위') return true;
      
      return false; // lose or tie means elimination
    });
    
    updateRoomState({ rpsState: 'result', rpsHostChoice: aiChoice, rpsSurvivors: newSurvivors });
  };

  const nextRound = () => {
    updateRoomState({ rpsRound: round + 1, rpsState: 'choosing', rpsHostChoice: null });
  };

  const handleSelect = (choice) => {
    submitPlayerInput(myPlayerId, { rps: choice });
    soundFx.playTick();
  };

  const handleSettlePoints = () => {
    if (isSettled || rpsState === 'ready' || survivors.length === 0) return;
    survivors.forEach(s => awardPoints(s.id, 500, false));
    setIsSettled(true);
    soundFx.playSuccess();
  };

  if (userRole === 'participant') {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const isSurvivor = survivors.some(s => s.id === myPlayerId);
    const hasChosen = !!myPlayer?.lastInput?.rps;

    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', minHeight: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>✊✌️✋ 가위바위보 생존게임</h2>
        {!isSurvivor && rpsState !== 'ready' ? (
          <div style={{ color: 'var(--danger-color)', fontSize: '1.5rem', fontWeight: 800 }}>💀 탈락하셨습니다</div>
        ) : rpsState === 'choosing' ? (
          <div>
            <h3 style={{ marginBottom: '20px' }}>선택하세요!</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              {CHOICES.map(c => (
                <button 
                  key={c} 
                  onClick={() => handleSelect(c)}
                  className={myPlayer?.lastInput?.rps === c ? "btn-primary" : "btn-secondary"}
                  style={{ fontSize: '3rem', padding: '20px' }}
                >
                  {EMOJIS[c]}
                </button>
              ))}
            </div>
            {hasChosen && <div style={{ marginTop: '20px', color: 'var(--success-color)' }}>선택 완료! 호스트의 결과를 기다리세요.</div>}
          </div>
        ) : rpsState === 'result' ? (
          <div>
            <h3 style={{ fontSize: '1.5rem' }}>호스트의 선택: {EMOJIS[hostChoice]}</h3>
            <p>결과를 메인 화면에서 확인하세요!</p>
          </div>
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>게임 시작을 기다려주세요...</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          ✊✌️✋ 대규모 가위바위보 서바이벌
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && rpsState !== 'ready' && !isSettled && (
            <button onClick={handleSettlePoints} className="btn-primary" style={{ background: 'var(--success-color)' }}>
              🏆 생존자 500점 정산
            </button>
          )}
          <button onClick={returnToLobby} className="btn-secondary">
            🏠 로비로 돌아가기
          </button>
        </div>
      </div>
      
      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {rpsState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Hand size={80} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 30px' }}>
              <Play size={20} /> 서바이벌 시작
            </button>
          </div>
        )}

        {rpsState === 'choosing' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '20px' }}>라운드 {round}</h3>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-sub)' }}>참가자들이 가위바위보를 선택 중입니다...</p>
            <div style={{ fontSize: '3rem', margin: '30px 0' }}>❓</div>
            <button onClick={determineResult} className="btn-primary" style={{ padding: '15px 30px', fontSize: '1.5rem', background: 'var(--danger-color)' }}>
              가위 바위 보! (결과 공개)
            </button>
          </div>
        )}

        {rpsState === 'result' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-sub)' }}>호스트의 선택</h3>
            <div style={{ fontSize: '6rem', margin: '20px 0' }}>{EMOJIS[hostChoice]}</div>
            <h2 style={{ fontSize: '2rem', color: 'var(--success-color)' }}>생존자: {survivors.length}명</h2>
            <button onClick={nextRound} className="btn-primary" style={{ marginTop: '30px' }}>다음 라운드 진행</button>
          </div>
        )}
      </div>
    </div>
  );
};
