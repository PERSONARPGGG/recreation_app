import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Moon, Sun, Shield, UserCheck, Skull, Play, RotateCcw, Volume2, HelpCircle } from 'lucide-react';

export const MafiaRefereeModule = () => {
  const { participants, returnToLobby, awardPoints, room, userRole } = useGame();

  const [isSettled, setIsSettled] = useState(false);
  const [mafiaState, setMafiaState] = useState({
    phase: 'setup', // 'setup', 'night', 'day', 'vote'
    step: 0,
    rolesAssigned: false,
    players: [],
    nightVictimId: null,
    doctorSaveId: null,
    policeCheckId: null,
    dayLog: []
  });

  // Assign roles
  const handleAssignRoles = () => {
    const total = participants.length > 0 ? participants : Array.from({ length: 8 }, (_, i) => ({ id: `p-${i}`, name: `참가자 #${i+1}` }));
    
    let mafiaCount = Math.max(1, Math.floor(total.length / 4));
    let doctorCount = 1;
    let policeCount = 1;

    let roles = [
      ...Array(mafiaCount).fill('마피아 🕵️‍♂️'),
      ...Array(doctorCount).fill('의사 🩺'),
      ...Array(policeCount).fill('경찰 🚓'),
    ];

    while (roles.length < total.length) {
      roles.push('시민 👤');
    }

    // Shuffle
    roles.sort(() => Math.random() - 0.5);

    const assigned = total.map((p, idx) => ({
      ...p,
      role: roles[idx],
      isAlive: true
    }));

    setMafiaState({
      ...mafiaState,
      rolesAssigned: true,
      phase: 'night',
      step: 1,
      players: assigned,
      dayLog: ['게임이 시작되었습니다. 모든 플레이어에게 비밀 직업이 배분되었습니다.']
    });

    soundFx.playSpookyNight();
  };

  const NIGHT_STEPS = [
    { title: "🌙 밤이 찾아왔습니다", text: "모든 플레이어는 눈을 감아주세요. (사회자는 야간 BGM을 켭니다)", sfx: () => soundFx.playSpookyNight() },
    { title: "🕵️‍♂️ 마피아의 시간", text: "마피아는 조용히 눈을 뜨고 처단할 대상을 지목해 주세요.", sfx: () => soundFx.playTick(300) },
    { title: "🩺 의사의 시간", text: "의사는 조용히 눈을 뜨고 살릴 대상을 지목해 주세요.", sfx: () => soundFx.playTick(500) },
    { title: "🚓 경찰의 시간", text: "경찰은 조용히 눈을 뜨고 마피아인지 확인할 대상을 지목해 주세요.", sfx: () => soundFx.playTick(700) },
    { title: "☀️ 아침이 밝았습니다", text: "모든 플레이어는 눈을 떠주세요! 지난밤의 사건을 발표합니다.", sfx: () => soundFx.playSuccess() }
  ];

  const handleNextStep = () => {
    const nextStep = mafiaState.step + 1;
    if (nextStep < NIGHT_STEPS.length) {
      NIGHT_STEPS[nextStep].sfx();
      setMafiaState({ ...mafiaState, step: nextStep });
    } else {
      // Transition to Day Phase
      setMafiaState({ ...mafiaState, phase: 'day', step: 0 });
      soundFx.playSuccess();
    }
  };

  const handleSettlePoints = () => {
    if (isSettled) return;
    const alivePlayers = mafiaState.players.filter(p => p.alive);
    if (alivePlayers.length > 0) {
      alivePlayers.forEach(p => {
        awardPoints(room?.mode === 'team' ? p.teamId : p.id, 300, room?.mode === 'team');
      });
    } else {
      participants.forEach(p => awardPoints(room?.mode === 'team' ? p.teamId : p.id, 100, room?.mode === 'team'));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.8rem' }}>🕵️</div>
          <div>
            <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              보너스 모드: 마피아 AI 심판 & 사회자 진행 보조
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              사회자의 완벽한 진행을 돕는 직업 배분, 스크립트 가이드, 무드 BGM 자동 플레이어
            </p>
          </div>
        </div>

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

      {/* Main Mafia Console */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Left: Step Guide */}
        <div className="glass-panel glass-panel-glow" style={{ padding: '26px' }}>
          
          {!mafiaState.rolesAssigned ? (
            <div style={{ textAlign: 'center', padding: '40px 10px' }}>
              <Skull size={50} color="var(--primary-color)" style={{ marginBottom: '14px' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>마피아 직업 자동 분배</h3>
              <p style={{ color: 'var(--text-sub)', marginTop: '8px', fontSize: '0.95rem' }}>
                현재 접속 참가자({participants.length || 8}명)에게 마피아, 의사, 경찰, 시민 직업을 즉시 무작위 배분합니다.
              </p>
              <button onClick={handleAssignRoles} className="btn-primary" style={{ marginTop: '20px', fontSize: '1.2rem', padding: '14px 32px' }}>
                <Play size={20} /> 직업 배분 및 마피아 게임 시작!
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                {mafiaState.phase === 'night' ? <Moon size={28} color="#00f3ff" /> : <Sun size={28} color="#ffd700" />}
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                  {NIGHT_STEPS[mafiaState.step]?.title || '낮 토론 및 투표'}
                </h3>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid var(--card-border)',
                marginBottom: '20px',
                fontSize: '1.15rem',
                lineHeight: '1.6',
                fontWeight: 700,
                color: 'var(--primary-color)'
              }}>
                💬 <strong>사회자 멘트 스크립트:</strong><br/>
                "{NIGHT_STEPS[mafiaState.step]?.text}"
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleNextStep} className="btn-primary" style={{ fontSize: '1.1rem', padding: '14px 28px' }}>
                  다음 사회 가이드 단계로 진행 ➔
                </button>
                <button onClick={handleAssignRoles} className="btn-secondary">
                  <RotateCcw size={16} /> 새 마피아 판 시작
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right: Secret Player Role Register (Host Only) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '14px' }}>
            🕵️ 사회자 전용 플레이어 직업 장부 (비밀)
          </h3>

          {mafiaState.players.length === 0 ? (
            <p style={{ color: 'var(--text-sub)' }}>게임 시작을 누르면 사회자 전용 직업 목록이 출력됩니다.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {mafiaState.players.map((p) => (
                <div key={p.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary-color)', marginTop: '2px' }}>{p.role}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px', background: p.isAlive ? 'rgba(0,255,136,0.2)' : 'rgba(255,0,85,0.2)', color: p.isAlive ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    {p.isAlive ? '생존' : '탈락'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
