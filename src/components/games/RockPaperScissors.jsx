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
    // Reset all participants to alive survivors
    const allSurvivors = participants.map(p => ({ id: p.id, name: p.name, teamId: p.teamId }));
    // Clear participant inputs for fresh round
    participants.forEach(p => submitPlayerInput(p.id, null));
    updateRoomState({
      rpsState: 'choosing',
      rpsHostChoice: null,
      rpsRound: 1,
      rpsSurvivors: allSurvivors
    });
    setIsSettled(false);
    soundFx.playTick();
  };

  const determineResult = () => {
    const aiChoice = CHOICES[Math.floor(Math.random() * 3)];
    soundFx.playSuccess();
    
    // Determine survivors
    const newSurvivors = survivors.filter(p => {
      // Find latest player input
      const participantObj = participants.find(part => part.id === p.id);
      let playerChoice = participantObj?.lastInput?.rps;
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
    // Clear player inputs for the new round
    participants.forEach(p => submitPlayerInput(p.id, null));
    updateRoomState({ rpsRound: round + 1, rpsState: 'choosing', rpsHostChoice: null });
  };

  const handleSelect = (choice) => {
    submitPlayerInput(myPlayerId, { rps: choice });
    soundFx.playTick();
  };

  const handleSettlePoints = () => {
    if (isSettled) return;
    if (survivors.length > 0) {
      survivors.forEach(s => {
        awardPoints(s.id, 500, false);
        if (s.teamId) awardPoints(s.teamId, 500, true);
      });
    } else {
      // 생존자가 없거나 시작 전 정산 시 전체 참가자에게 100점 분배
      participants.forEach(p => awardPoints(p.id, 100, false));
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

  if (userRole === 'participant') {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const isSurvivor = rpsState === 'ready' ? true : survivors.some(s => s.id === myPlayerId);
    const chosenHand = myPlayer?.lastInput?.rps;
    const hasChosen = !!chosenHand;

    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>✊✌️✋ 대규모 가위바위보 서바이벌</h2>
        
        {rpsState === 'ready' ? (
          <div style={{ color: 'var(--text-sub)', fontSize: '1.2rem' }}>
            🎮 호스트가 게임을 준비 중입니다. 잠시만 기다려주세요!
          </div>
        ) : !isSurvivor ? (
          <div style={{ padding: '20px' }}>
            <div style={{ color: 'var(--danger-color)', fontSize: '2rem', fontWeight: 900, marginBottom: '10px' }}>💀 이번 라운드 탈락!</div>
            <p style={{ color: 'var(--text-sub)', fontSize: '1rem' }}>아쉽게 탈락하셨습니다. 화면에서 다음 승부를 지켜보세요!</p>
          </div>
        ) : rpsState === 'choosing' ? (
          <div>
            <h3 style={{ marginBottom: '10px', fontSize: '1.5rem' }}>라운드 {round}: 하나를 선택하세요!</h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '20px' }}>호스트를 이겨야만 생존합니다! (선택 후 변경 불가)</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              {CHOICES.map(c => (
                <button 
                  key={c} 
                  disabled={hasChosen}
                  onClick={() => handleSelect(c)}
                  className={chosenHand === c ? "btn-primary" : "btn-secondary"}
                  style={{ fontSize: '3rem', padding: '20px', opacity: hasChosen && chosenHand !== c ? 0.4 : 1, cursor: hasChosen ? 'default' : 'pointer' }}
                >
                  {EMOJIS[c]}
                </button>
              ))}
            </div>
            {hasChosen && (
              <div style={{ marginTop: '20px', color: 'var(--success-color)', fontSize: '1.1rem', fontWeight: 800 }}>
                ✅ 선택 완료: [{EMOJIS[chosenHand]} {chosenHand}] 호스트의 발표를 기다리세요!
              </div>
            )}
          </div>
        ) : rpsState === 'result' ? (
          <div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>결과 발표</h3>
            <div style={{ fontSize: '3rem', margin: '15px 0' }}>호스트: {EMOJIS[hostChoice]} vs 나: {chosenHand ? EMOJIS[chosenHand] : '❓'}</div>
            <p style={{ color: isSurvivor ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '1.3rem', fontWeight: 900 }}>
              {isSurvivor ? '🎉 축하합니다! 다음 라운드로 진출합니다!' : '💀 탈락하셨습니다!'}
            </p>
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
            <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={nextRound} className="btn-primary" style={{ fontSize: '1.2rem', padding: '12px 28px' }}>
                다음 라운드 진행
              </button>
              <button onClick={startGame} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                🔄 처음부터 다시 시작 (모두 부활)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
