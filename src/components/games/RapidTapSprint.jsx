import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/sound';
import { Flame, Play, RotateCcw, Zap, Trophy, Flag } from 'lucide-react';

export const RapidTapSprint = () => {
  const { userRole, participants, submitPlayerInput, myPlayerId, awardPoints, room, simulateBotGameInputs, returnToLobby, activeTeams } = useGame();

  const GAME_DURATION = 10; // 10 seconds race
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isRacing, setIsRacing] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [raceFinished, setRaceFinished] = useState(false);

  const timerRef = useRef(null);

  const startRace = () => {
    setIsRacing(true);
    setRaceFinished(false);
    setTapCount(0);
    setTimeLeft(GAME_DURATION);
    soundFx.playCountdown(true);

    let currentSeconds = GAME_DURATION;
    timerRef.current = setInterval(() => {
      currentSeconds -= 1;
      setTimeLeft(currentSeconds);
      soundFx.playCountdown(false);

      if (currentSeconds <= 0) {
        clearInterval(timerRef.current);
        setIsRacing(false);
        setRaceFinished(true);
        soundFx.playSuccess();
      }
    }, 1000);
  };

  const handleTap = () => {
    if (!isRacing) return;
    const nextTap = tapCount + 1;
    setTapCount(nextTap);
    submitPlayerInput(myPlayerId, { tapCount: nextTap });
    soundFx.playTick(600 + (nextTap % 10) * 30);
  };

  const handleSimulateBots = () => {
    simulateBotGameInputs('sprint');
    soundFx.playSuccess();
  };

  // Ranking calculation
  const rankedParticipants = [...participants]
    .filter(p => p.lastInput && p.lastInput.tapCount !== undefined)
    .sort((a, b) => b.lastInput.tapCount - a.lastInput.tapCount);

  // Team Total Taps calculation
  const teamScores = activeTeams.map(t => {
    const teamMembers = participants.filter(p => p.teamId === t.id);
    const totalTaps = teamMembers.reduce((sum, p) => sum + (p.lastInput?.tapCount || 0), 0);
    return { ...t, totalTaps };
  }).sort((a, b) => b.totalTaps - a.totalTaps);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.8rem' }}>⚡</div>
          <div>
            <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
              100인 실시간 탭 대격돌 100m 파워 스프린트
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
              10초 동안 미친 듯이 연타하여 승리를 쟁취하세요!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {userRole === 'host' && (
            <>
              <button onClick={handleSimulateBots} className="btn-secondary" style={{ border: '1px solid var(--primary-color)' }}>
                <Zap size={16} /> 100인 탭 시뮬레이션
              </button>
              <button onClick={returnToLobby} className="btn-secondary">
                로비로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>

      {/* Gameplay & Track */}
      <div style={{ display: 'grid', gridTemplateColumns: userRole === 'host' ? '1fr 1fr' : '1fr', gap: '20px' }}>
        
        {/* Sprint Controller / Mobile Tap Area */}
        <div className="glass-panel glass-panel-glow" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ fontSize: '1rem', color: 'var(--text-sub)', fontWeight: 800 }}>
            RACE TIMER
          </div>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary-color)', margin: '10px 0' }}>
            {timeLeft}s
          </div>

          <div style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px', fontWeight: 800 }}>
            내 탭 횟수: <strong style={{ fontSize: '2.5rem', color: '#ff007a' }}>{tapCount}</strong> 회
          </div>

          {/* Huge Tap Button */}
          {isRacing ? (
            <button
              onClick={handleTap}
              className="btn-primary animate-pulse-glow"
              style={{
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                fontSize: '2rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #ff0055 0%, #ff00e5 100%)',
                boxShadow: '0 0 50px rgba(255, 0, 85, 0.8)',
                cursor: 'pointer'
              }}
            >
              🔥 TAP! (연타)
            </button>
          ) : (
            <button
              onClick={startRace}
              className="btn-primary"
              style={{ fontSize: '1.3rem', padding: '16px 40px' }}
            >
              <Play size={22} /> {raceFinished ? '스프린트 재경기' : '10초 스프린트 시작!'}
            </button>
          )}

        </div>

        {/* Live Race Track Visualizer */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Flag size={20} color="var(--primary-color)" />
            {room.mode === 'team' ? '팀별 트랙 레이스 현황' : '개인별 탭 랭킹'}
          </h3>

          {room.mode === 'team' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {teamScores.map((t, idx) => {
                const maxTaps = Math.max(...teamScores.map(ts => ts.totalTaps), 1);
                const progressPct = Math.min(100, Math.round((t.totalTaps / (maxTaps * 1.1)) * 100));
                return (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 800 }}>
                      <span style={{ color: t.color }}>{t.name}</span>
                      <span>총 {t.totalTaps} 탭</span>
                    </div>
                    <div style={{ height: '20px', background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: t.color, transition: 'width 0.2s ease', borderRadius: '10px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
              {rankedParticipants.slice(0, 30).map((player, rank) => (
                <div key={player.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                  <span>#{rank + 1} {player.name}</span>
                  <strong style={{ color: 'var(--primary-color)' }}>{player.lastInput.tapCount} 탭</strong>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
