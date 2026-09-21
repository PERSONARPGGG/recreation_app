import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Hand, Play, Users, Shuffle, RotateCcw } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const CHOICES = ['가위', '바위', '보'];
const EMOJIS = { '가위': '✌️', '바위': '✊', '보': '✋' };

// Differentiated points awarded per round survived
const getRoundPoints = (roundNum) => {
  if (roundNum === 1) return 100;
  if (roundNum === 2) return 200;
  if (roundNum === 3) return 300;
  if (roundNum === 4) return 400;
  return 500;
};

export const RockPaperScissors = () => {
  const { userRole, participants, myPlayerId, submitPlayerInput, resetAllPlayerInputs, returnToLobby, room, updateRoomState, awardPoints } = useGame();
  
  const [isSettled, setIsSettled] = useState(false);
  const [slotDisplayIndex, setSlotDisplayIndex] = useState(0);

  // Room state
  const rpsState = room.rpsState || 'ready'; // 'ready' | 'choosing' | 'rolling' | 'result'
  const round = room.rpsRound || 1;
  const hostChoice = room.rpsHostChoice || null;
  const survivors = room.rpsSurvivors || [];
  const eliminatedPlayers = room.rpsEliminated || [];
  const lastRoundPoints = room.rpsLastPoints || 100;

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

  // Calculate live player choices for CURRENT round survivors
  const choiceStats = {
    '가위': 0,
    '바위': 0,
    '보': 0,
    '미제출': 0,
  };

  const activeSurvivorList = rpsState === 'ready' ? participants : survivors;

  activeSurvivorList.forEach(s => {
    const participantObj = participants.find(p => p.id === s.id);
    const choice = participantObj?.lastInput?.rps;
    if (choice && choiceStats[choice] !== undefined) {
      choiceStats[choice]++;
    } else {
      choiceStats['미제출']++;
    }
  });

  const startGame = () => {
    // Reset all current participants to alive survivors
    const allSurvivors = participants.map(p => ({ id: p.id, name: p.name, teamId: p.teamId, isBot: !!p.isBot }));
    resetAllPlayerInputs();
    updateRoomState({
      rpsState: 'choosing',
      rpsHostChoice: null,
      rpsRound: 1,
      rpsSurvivors: allSurvivors,
      rpsEliminated: [],
      rpsLastPoints: 100,
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
    });

    // 2.2-second high-tension slot shuffle before reveal
    setTimeout(() => {
      const currentPoints = getRoundPoints(round);
      const newlyEliminated = [];
      const newSurvivors = [];

      survivors.forEach(s => {
        const participantObj = participants.find(part => part.id === s.id);
        let playerChoice = participantObj?.lastInput?.rps;
        if (s.isBot || participantObj?.isBot) {
          playerChoice = CHOICES[Math.floor(Math.random() * 3)];
        }

        // Win check against host
        const isWin = (
          (playerChoice === '가위' && honestAiChoice === '보') ||
          (playerChoice === '바위' && honestAiChoice === '가위') ||
          (playerChoice === '보' && honestAiChoice === '바위')
        );

        if (isWin) {
          newSurvivors.push(s);
          // Award round points to this survivor immediately!
          awardPoints(s.id, currentPoints, false);
          if (s.teamId) awardPoints(s.teamId, currentPoints, true);
        } else {
          newlyEliminated.push({ ...s, roundEliminated: round, choice: playerChoice || '미제출' });
        }
      });

      soundFx.playSuccess();
      updateRoomState({
        rpsState: 'result',
        rpsHostChoice: honestAiChoice,
        rpsSurvivors: newSurvivors,
        rpsEliminated: [...eliminatedPlayers, ...newlyEliminated],
        rpsLastPoints: currentPoints,
      });
    }, 2200);
  };

  const nextRound = () => {
    if (survivors.length === 0) return;
    resetAllPlayerInputs();
    updateRoomState({
      rpsRound: round + 1,
      rpsState: 'choosing',
      rpsHostChoice: null,
    });
    soundFx.playTick();
  };

  const handleSelect = (choice) => {
    submitPlayerInput(myPlayerId, { rps: choice });
    soundFx.playTick();
  };

  const handleSettlePoints = () => {
    if (isSettled || rpsState !== 'result') return;
    // Final settlement bonus for survivors
    if (survivors.length > 0) {
      survivors.forEach(s => {
        awardPoints(s.id, 300, false);
        if (s.teamId) awardPoints(s.teamId, 300, true);
      });
    }
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (rpsState === 'result' && !isSettled) {
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

    // Check if player won this specific round
    let didWinThisRound = false;
    if (rpsState === 'result' && hostChoice && chosenHand) {
      if (
        (chosenHand === '가위' && hostChoice === '보') ||
        (chosenHand === '바위' && hostChoice === '가위') ||
        (chosenHand === '보' && hostChoice === '바위')
      ) {
        didWinThisRound = true;
      }
    }

    return (
      <div className="glass-panel" style={{ padding: '14px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-color)' }}>✊✌️✋ 가위바위보</span>
          <span style={{ fontSize: '0.85rem', color: '#ffd700', fontWeight: 800 }}>
            ROUND {round} (생존 {survivors.length}명)
          </span>
        </div>
        
        {rpsState === 'ready' ? (
          <div style={{ padding: '24px 10px', color: 'var(--text-sub)', fontSize: '1.1rem' }}>
            🎮 호스트가 서바이벌 게임을 준비 중입니다. 잠시만 기다려주세요!
          </div>
        ) : !isSurvivor ? (
          /* Strictly ELIMINATED participant screen - CANNOT CHOOSE AGAIN */
          <div style={{ padding: '16px 10px' }}>
            <div style={{ color: 'var(--danger-color)', fontSize: '2rem', fontWeight: 900, marginBottom: '6px' }}>💀 탈락하셨습니다</div>
            <div className="glass-card" style={{ maxWidth: '380px', margin: '10px auto', padding: '14px', border: '1px solid #ff3b30', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '12px' }}>
              <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                현재 생존자: <strong style={{ color: 'var(--primary-color)' }}>{survivors.length}명</strong>
              </p>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '6px', margin: '6px 0 0 0' }}>
                아쉽게도 탈락하셨습니다. 남은 생존자들의 치열한 서바이벌을 관전해주세요!
              </p>
            </div>
          </div>
        ) : rpsState === 'choosing' ? (
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 800, marginBottom: '8px' }}>
              🎯 승리 시 점수: +{getRoundPoints(round)}점 (비기거나 패배 시 탈락)
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', maxWidth: '380px', margin: '0 auto' }}>
              {CHOICES.map(c => (
                <button 
                  key={c} 
                  disabled={hasChosen}
                  onClick={() => handleSelect(c)}
                  className={chosenHand === c ? "btn-primary" : "btn-secondary"}
                  style={{
                    fontSize: '2rem',
                    padding: '16px 10px',
                    borderRadius: '16px',
                    opacity: hasChosen && chosenHand !== c ? 0.35 : 1,
                    transform: chosenHand === c ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: chosenHand === c ? '0 0 20px rgba(0, 243, 255, 0.6)' : 'none',
                    cursor: hasChosen ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div>{EMOJIS[c]}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{c}</div>
                </button>
              ))}
            </div>

            {hasChosen && (
              <div className="glass-card" style={{ padding: '10px 16px', maxWidth: '340px', margin: '14px auto 0', border: '1px solid var(--success-color)', background: 'rgba(34, 197, 94, 0.12)', borderRadius: '12px' }}>
                <div style={{ color: 'var(--success-color)', fontSize: '1rem', fontWeight: 800 }}>
                  ✅ 선택 완료: [{EMOJIS[chosenHand]} {chosenHand}]
                </div>
                <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '3px' }}>
                  호스트의 1/3 랜덤 추첨을 기다리고 있습니다...
                </div>
              </div>
            )}
          </div>
        ) : rpsState === 'rolling' ? (
          <div style={{ padding: '16px 10px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '8px' }}>
              🎰 호스트 추첨 중! 🎰
            </h3>
            <div style={{ fontSize: '4.5rem', margin: '10px 0', animation: 'slotRoll 0.2s infinite ease-in-out' }}>
              {EMOJIS[CHOICES[slotDisplayIndex]]}
            </div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>완전 무작위 공정 셔플 중...</p>
          </div>
        ) : rpsState === 'result' ? (
          <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '12px 0' }}>
              <div className="glass-card" style={{ padding: '10px 16px', textAlign: 'center', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '2px' }}>호스트</div>
                <div style={{ fontSize: '2.8rem' }}>{EMOJIS[hostChoice]}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{hostChoice}</div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-color)' }}>VS</div>
              <div className="glass-card" style={{ padding: '10px 16px', textAlign: 'center', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '2px' }}>나</div>
                <div style={{ fontSize: '2.8rem' }}>{chosenHand ? EMOJIS[chosenHand] : '❓'}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{chosenHand || '미제출'}</div>
              </div>
            </div>

            {didWinThisRound ? (
              <div>
                <div style={{ color: 'var(--success-color)', fontSize: '1.3rem', fontWeight: 900 }}>
                  🎉 승리! 다음 라운드 진출!
                </div>
                <div className="glass-card" style={{ marginTop: '8px', padding: '8px 18px', display: 'inline-block', border: '1px solid #ffd700', background: 'rgba(255, 215, 0, 0.15)', borderRadius: '10px' }}>
                  💰 보너스: <strong style={{ color: '#ffd700', fontSize: '1.1rem' }}>+{lastRoundPoints}점</strong>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ color: 'var(--danger-color)', fontSize: '1.3rem', fontWeight: 900 }}>
                  💀 패배 / 무승부! 탈락하셨습니다.
                </div>
                <p style={{ color: 'var(--text-sub)', marginTop: '4px', fontSize: '0.85rem' }}>
                  남은 생존자: {survivors.length}명
                </p>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
          ✊✌️✋ 대규모 가위바위보 서바이벌
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {userRole === 'host' && (
            <button 
              onClick={handleSettlePoints} 
              disabled={isSettled || rpsState !== 'result'}
              className="btn-primary" 
              style={{ 
                background: isSettled ? '#555' : rpsState !== 'result' ? '#333' : 'var(--success-color)', 
                cursor: isSettled || rpsState !== 'result' ? 'not-allowed' : 'pointer',
                opacity: (rpsState !== 'result' && !isSettled) ? 0.6 : 1,
                padding: '6px 14px', fontSize: '0.85rem'
              }}
            >
              {isSettled ? '✅ 정산 완료' : rpsState !== 'result' ? '⏳ 결과 공개 후 정산' : '🏆 포인트 정산하기'}
            </button>
          )}
          <button onClick={handleReturnToLobby} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            🏠 로비로
          </button>
        </div>
      </div>
      
      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
        {rpsState === 'ready' && (
          <div style={{ textAlign: 'center' }}>
            <Hand size={80} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>공정 100% 랜덤 가위바위보 서바이벌</h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '15px', maxWidth: '500px' }}>
              조작 없는 <strong>순수 1/3 수학적 완전 무작위 룰렛</strong>으로 호스트의 패가 결정됩니다.<br />
              라운드를 승리할 때마다 차등 보너스 점수가 즉시 지급됩니다!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>1R: +100점</span>
              <span className="badge" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>2R: +200점</span>
              <span className="badge" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>3R: +300점</span>
              <span className="badge" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>4R+: +400점~</span>
            </div>
            <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.3rem', padding: '16px 40px', borderRadius: '50px' }}>
              <Play size={22} /> 서바이벌 시작하기 (참가자 {participants.length}명)
            </button>
          </div>
        )}

        {rpsState === 'choosing' && (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '700px' }}>
            <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '25px', background: 'rgba(0, 243, 255, 0.15)', color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.2rem', marginBottom: '15px' }}>
              ROUND {round} • 생존자 {survivors.length}명 • 💰 생존 시 +{getRoundPoints(round)}점 지급
            </div>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>실시간 참가자 선택 현황 (투명 공개)</h3>
            
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

            <div className="glass-card" style={{ padding: '18px', border: '2px solid var(--success-color)', background: 'rgba(34, 197, 94, 0.12)', margin: '20px auto' }}>
              <h4 style={{ color: 'var(--success-color)', fontSize: '1.4rem', fontWeight: 900 }}>
                🎉 생존자: {survivors.length}명 (각 +{lastRoundPoints}점 자동 지급 완료)
              </h4>
              {survivors.length === 0 ? (
                <div style={{ color: 'var(--danger-color)', fontSize: '1.2rem', fontWeight: 800, marginTop: '10px' }}>
                  💀 모든 생존자가 탈락하여 게임이 종료되었습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                  {survivors.map(s => (
                    <span key={s.id} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.9rem', color: '#fff' }}>
                      👑 {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {survivors.length > 0 && (
                <button onClick={nextRound} className="btn-primary" style={{ fontSize: '1.2rem', padding: '14px 32px' }}>
                  <Play size={20} /> 라운드 {round + 1} 진행 ({survivors.length}명)
                </button>
              )}
              <button onClick={startGame} className="btn-secondary" style={{ border: '1px solid var(--primary-color)', padding: '14px 28px' }}>
                <RotateCcw size={20} /> 🔄 처음부터 다시 시작 (전원 부활)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
