import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Hand, Play, Users, Shuffle, RotateCcw } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const CHOICES = ['가위', '바위', '보'];
const EMOJIS = { '가위': '✌️', '바위': '✊', '보': '✋' };

export const RockPaperScissors = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, returnToLobby, room, updateRoomState, awardPoints } = useGame();
  
  const [isSettled, setIsSettled] = useState(false);
  const [slotDisplayIndex, setSlotDisplayIndex] = useState(0);

  // Room state
  const rpsState = room.rpsState || 'ready'; // 'ready' | 'choosing' | 'rolling' | 'result'
  const round = room.rpsRound || 1;
  const hostChoice = room.rpsHostChoice || null;
  const survivors = room.rpsSurvivors || [];
  const roundOutcome = room.rpsRoundOutcome || null; // 'survived' | 'draw_replay'

  // Slot machine roll effect
  useEffect(() => {
    let rollInterval;
    if (rpsState === 'rolling') {
      rollInterval = setInterval(() => {
        setSlotDisplayIndex(prev => (prev + 1) % 3);
        soundFx.playTick();
      }, 100);
    }
    return () => {
      if (rollInterval) clearInterval(rollInterval);
    };
  }, [rpsState]);

  // Calculate live player choices
  const choiceStats = {
    '가위': 0,
    '바위': 0,
    '보': 0,
    '미제출': 0,
  };

  participants.forEach(p => {
    // Only count active survivors
    const isSurv = survivors.some(s => s.id === p.id);
    if (!isSurv && rpsState !== 'ready') return;

    const choice = p.lastInput?.rps;
    if (choice && choiceStats[choice] !== undefined) {
      choiceStats[choice]++;
    } else {
      choiceStats['미제출']++;
    }
  });

  const activeSurvivorCount = rpsState === 'ready' ? participants.length : survivors.length;

  const startGame = () => {
    // Reset all current participants to alive survivors
    const allSurvivors = participants.map(p => ({ id: p.id, name: p.name, teamId: p.teamId }));
    participants.forEach(p => submitPlayerInput(p.id, null));
    updateRoomState({
      rpsState: 'choosing',
      rpsHostChoice: null,
      rpsRound: 1,
      rpsSurvivors: allSurvivors,
      rpsRoundOutcome: null,
    });
    setIsSettled(false);
    soundFx.playTick();
  };

  // Honest, completely unmanipulated 1/3 random spin
  const startRollAndDetermine = () => {
    if (rpsState === 'rolling') return;

    // Pick fair honest 1/3 random choice upfront
    const honestAiChoice = CHOICES[Math.floor(Math.random() * 3)];

    updateRoomState({
      rpsState: 'rolling',
      rpsHostChoice: null,
      rpsRoundOutcome: null,
    });

    // 2.2-second high-tension slot shuffle before reveal
    setTimeout(() => {
      // Determine survivors against honestAiChoice
      let newSurvivors = survivors.filter(p => {
        const participantObj = participants.find(part => part.id === p.id);
        let playerChoice = participantObj?.lastInput?.rps;
        if (p.isBot) {
          playerChoice = CHOICES[Math.floor(Math.random() * 3)];
        }
        if (!playerChoice) return false;

        // Player wins against host
        if (playerChoice === '가위' && honestAiChoice === '보') return true;
        if (playerChoice === '바위' && honestAiChoice === '가위') return true;
        if (playerChoice === '보' && honestAiChoice === '바위') return true;

        return false;
      });

      let outcome = 'survived';
      // If nobody won (e.g. all lost or tied), give everyone a re-match so it doesn't abruptly wipe out 100 people!
      if (newSurvivors.length === 0 && survivors.length > 0) {
        newSurvivors = survivors; // Keep existing survivors for draw replay
        outcome = 'draw_replay';
      }

      soundFx.playSuccess();
      updateRoomState({
        rpsState: 'result',
        rpsHostChoice: honestAiChoice,
        rpsSurvivors: newSurvivors,
        rpsRoundOutcome: outcome,
      });
    }, 2200);
  };

  const nextRound = () => {
    participants.forEach(p => submitPlayerInput(p.id, null));
    updateRoomState({
      rpsRound: round + 1,
      rpsState: 'choosing',
      rpsHostChoice: null,
      rpsRoundOutcome: null,
    });
    soundFx.playTick();
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

  // Participant View
  if (userRole === 'participant') {
    const myPlayer = participants.find(p => p.id === myPlayerId);
    const isSurvivor = rpsState === 'ready' ? true : survivors.some(s => s.id === myPlayerId);
    const chosenHand = myPlayer?.lastInput?.rps;
    const hasChosen = !!chosenHand;

    // Check if player won this round
    let didWinRound = false;
    if (rpsState === 'result' && hostChoice && chosenHand) {
      if (
        (chosenHand === '가위' && hostChoice === '보') ||
        (chosenHand === '바위' && hostChoice === '가위') ||
        (chosenHand === '보' && hostChoice === '바위')
      ) {
        didWinRound = true;
      }
    }

    return (
      <div className="glass-panel" style={{ padding: '25px', textAlign: 'center', minHeight: '55vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>✊✌️✋ 대규모 가위바위보 서바이벌</h2>
        
        {rpsState === 'ready' ? (
          <div style={{ color: 'var(--text-sub)', fontSize: '1.2rem' }}>
            🎮 호스트가 서바이벌 게임을 준비 중입니다. 잠시만 기다려주세요!
          </div>
        ) : !isSurvivor ? (
          <div style={{ padding: '20px' }}>
            <div style={{ color: 'var(--danger-color)', fontSize: '2.4rem', fontWeight: 900, marginBottom: '10px' }}>💀 탈락!</div>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem' }}>아쉽게도 이번 서바이벌에서 탈락하셨습니다.<br />남은 생존자들의 대결을 관전하세요!</p>
          </div>
        ) : rpsState === 'choosing' ? (
          <div>
            <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0, 243, 255, 0.15)', color: 'var(--primary-color)', fontWeight: 800, marginBottom: '15px' }}>
              ROUND {round} • 생존자 {survivors.length}명
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '1.6rem' }}>하나를 선택하세요!</h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '25px' }}>호스트를 상대로 <strong>승리</strong>해야만 살아남습니다!</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
              {CHOICES.map(c => (
                <button 
                  key={c} 
                  disabled={hasChosen}
                  onClick={() => handleSelect(c)}
                  className={chosenHand === c ? "btn-primary" : "btn-secondary"}
                  style={{
                    fontSize: '2.5rem',
                    padding: '20px 28px',
                    borderRadius: '18px',
                    opacity: hasChosen && chosenHand !== c ? 0.35 : 1,
                    transform: chosenHand === c ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: chosenHand === c ? '0 0 20px rgba(0, 243, 255, 0.6)' : 'none',
                    cursor: hasChosen ? 'default' : 'pointer'
                  }}
                >
                  <div>{EMOJIS[c]}</div>
                  <div style={{ fontSize: '1.1rem', marginTop: '6px', fontWeight: 800 }}>{c}</div>
                </button>
              ))}
            </div>

            {hasChosen && (
              <div className="glass-card" style={{ marginTop: '25px', padding: '15px 20px', maxWidth: '380px', margin: '25px auto 0', border: '2px solid var(--success-color)', background: 'rgba(34, 197, 94, 0.12)' }}>
                <div style={{ color: 'var(--success-color)', fontSize: '1.2rem', fontWeight: 800 }}>
                  ✅ 선택 완료: [{EMOJIS[chosenHand]} {chosenHand}]
                </div>
                <div style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '6px' }}>
                  호스트의 랜덤 추첨을 기다리고 있습니다...
                </div>
              </div>
            )}
          </div>
        ) : rpsState === 'rolling' ? (
          <div>
            <h3 style={{ fontSize: '1.6rem', color: '#ffd700', marginBottom: '15px' }}>
              🎰 호스트의 가위바위보 추첨 중! 🎰
            </h3>
            <div style={{ fontSize: '6rem', margin: '20px 0', animation: 'slotRoll 0.2s infinite ease-in-out' }}>
              {EMOJIS[CHOICES[slotDisplayIndex]]}
            </div>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem' }}>과연 무엇이 나올까요?!</p>
          </div>
        ) : rpsState === 'result' ? (
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>결과 발표</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', margin: '25px 0' }}>
              <div className="glass-card" style={{ padding: '15px 25px', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', color: 'var(--text-sub)', marginBottom: '5px' }}>호스트의 패</div>
                <div style={{ fontSize: '4rem' }}>{EMOJIS[hostChoice]}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{hostChoice}</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-color)' }}>VS</div>
              <div className="glass-card" style={{ padding: '15px 25px', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', color: 'var(--text-sub)', marginBottom: '5px' }}>나의 패</div>
                <div style={{ fontSize: '4rem' }}>{chosenHand ? EMOJIS[chosenHand] : '❓'}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{chosenHand || '미제출'}</div>
              </div>
            </div>

            {roundOutcome === 'draw_replay' ? (
              <div style={{ padding: '15px', background: 'rgba(234, 179, 8, 0.15)', border: '2px solid #eab308', borderRadius: '12px', maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ color: '#facc15', fontSize: '1.4rem', fontWeight: 900 }}>⚠️ 무승부 / 전원 패배!</div>
                <div style={{ color: '#fff', fontSize: '1rem', marginTop: '4px' }}>호스트를 이긴 사람이 없어 전원 생존으로 재경기합니다!</div>
              </div>
            ) : didWinRound ? (
              <div style={{ color: 'var(--success-color)', fontSize: '1.5rem', fontWeight: 900 }}>
                🎉 승리! 다음 라운드로 진출합니다!
              </div>
            ) : (
              <div style={{ color: 'var(--danger-color)', fontSize: '1.5rem', fontWeight: 900 }}>
                💀 패배! 이번 라운드에서 탈락하셨습니다.
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--text-sub)' }}>게임 시작을 기다려주세요...</div>
        )}
      </div>
    );
  }

  // Host View
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          ✊✌️✋ 대규모 가위바위보 서바이벌
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSettlePoints} 
            disabled={isSettled}
            className="btn-primary" 
            style={{ background: isSettled ? '#555' : 'var(--success-color)', cursor: isSettled ? 'default' : 'pointer' }}
          >
            {isSettled ? '✅ 정산 완료' : '🏆 포인트 정산하기'}
          </button>
          <button onClick={handleReturnToLobby} className="btn-secondary">
            🏠 로비로 돌아가기
          </button>
        </div>
      </div>
      
      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
        {rpsState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Hand size={80} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>공정 100% 랜덤 가위바위보 서바이벌</h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '30px', maxWidth: '500px' }}>
              참가자 투표와 무관하게 <strong>순수 1/3 수학적 완전 무작위 룰렛</strong>으로 호스트의 패가 결정됩니다.<br />
              현재 참가자: {participants.length}명
            </p>
            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.3rem', padding: '16px 40px', borderRadius: '50px' }}>
              <Play size={22} /> 서바이벌 시작하기
            </button>
          </div>
        )}

        {rpsState === 'choosing' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '700px' }}>
            <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '25px', background: 'rgba(0, 243, 255, 0.15)', color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.2rem', marginBottom: '15px' }}>
              ROUND {round} • 생존자 {survivors.length}명
            </div>
            
            <h3 style={{ fontSize: '1.6rem', marginBottom: '15px' }}>실시간 참가자 선택 현황 (투명 공개)</h3>
            
            {/* Live Distribution Card */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '2rem' }}>✌️</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '4px' }}>가위</div>
                  <div style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 900, marginTop: '2px' }}>{choiceStats['가위']}명</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '2rem' }}>✊</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '4px' }}>바위</div>
                  <div style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 900, marginTop: '2px' }}>{choiceStats['바위']}명</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '2rem' }}>✋</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '4px' }}>보</div>
                  <div style={{ color: 'var(--primary-color)', fontSize: '1.4rem', fontWeight: 900, marginTop: '2px' }}>{choiceStats['보']}명</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '2rem' }}>⏳</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '4px' }}>미제출</div>
                  <div style={{ color: '#888', fontSize: '1.4rem', fontWeight: 900, marginTop: '2px' }}>{choiceStats['미제출']}명</div>
                </div>
              </div>
            </div>

            <button 
              onClick={startRollAndDetermine} 
              className="btn-primary" 
              style={{ padding: '18px 45px', fontSize: '1.5rem', fontWeight: 900, borderRadius: '50px', background: 'linear-gradient(135deg, #ff0055 0%, #ff5500 100%)', boxShadow: '0 0 25px rgba(255, 0, 85, 0.5)' }}
            >
              🎲 정직한 1/3 완전 랜덤 추첨 시작!
            </button>
          </div>
        )}

        {rpsState === 'rolling' && (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#ffd700', marginBottom: '20px' }}>
              🎰 조작 없는 1/3 완전 랜덤 추첨 진행 중... 🎰
            </h3>
            <div style={{ fontSize: '7rem', margin: '20px 0', animation: 'slotRoll 0.15s infinite ease-in-out' }}>
              {EMOJIS[CHOICES[slotDisplayIndex]]}
            </div>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.2rem' }}>
              화면에서 투명하게 돌아가는 중입니다!
            </p>
          </div>
        )}

        {rpsState === 'result' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '650px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-sub)' }}>호스트 추첨 결과</div>
            <div style={{ fontSize: '6rem', margin: '15px 0' }}>{EMOJIS[hostChoice]} {hostChoice}</div>

            {roundOutcome === 'draw_replay' ? (
              <div className="glass-card" style={{ padding: '18px', background: 'rgba(234, 179, 8, 0.15)', border: '2px solid #eab308', borderRadius: '16px', margin: '20px auto' }}>
                <h4 style={{ color: '#facc15', fontSize: '1.4rem', fontWeight: 900 }}>⚠️ 아무도 이기지 못했습니다!</h4>
                <p style={{ color: '#fff', fontSize: '1rem', marginTop: '6px', margin: 0 }}>
                  생존자 전원 부활하여 같은 인원으로 재경기를 치릅니다! (생존: {survivors.length}명)
                </p>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '18px', border: '2px solid var(--success-color)', background: 'rgba(34, 197, 94, 0.12)', margin: '20px auto' }}>
                <h4 style={{ color: 'var(--success-color)', fontSize: '1.4rem', fontWeight: 900 }}>
                  🎉 생존자: {survivors.length}명 / 탈락: {activeSurvivorCount - survivors.length}명
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                  {survivors.map(s => (
                    <span key={s.id} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.9rem', color: '#fff' }}>
                      👑 {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {survivors.length > 0 && (
                <button onClick={nextRound} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 32px' }}>
                  <Play size={20} /> 다음 라운드 진행 (남은 생존자)
                </button>
              )}
              <button onClick={startGame} className="btn-secondary" style={{ border: '1px solid var(--primary-color)', padding: '14px 28px' }}>
                <RotateCcw size={20} /> 🔄 전원 부활 새 게임
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
