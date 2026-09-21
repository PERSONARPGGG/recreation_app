import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { Play, Sparkles, Trophy, Award } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const ROULETTE_ITEMS = [
  { id: 0, label: '+500점 (대박!)', color: '#10b981', effect: 500, icon: '🎉' },
  { id: 1, label: '-300점 (앗!)', color: '#ef4444', effect: -300, icon: '💥' },
  { id: 2, label: '점수 2배', color: '#3b82f6', effect: 'double', icon: '⚡' },
  { id: 3, label: '골든잭팟 (+1000점)', color: '#f59e0b', effect: 1000, icon: '👑' },
  { id: 4, label: '꽝 (변동 없음)', color: '#6b7280', effect: 0, icon: '💨' },
  { id: 5, label: '+700점 (보너스)', color: '#8b5cf6', effect: 700, icon: '🎁' },
];

const NUM_SLICES = ROULETTE_ITEMS.length;
const SLICE_DEG = 360 / NUM_SLICES;

export const LuckyRoulette = () => {
  const { userRole, activeTeams, awardPoints, returnToLobby, participants, room, updateRoomState } = useGame();
  
  const [selectedTeam, setSelectedTeam] = useState(activeTeams[0]?.id || 'A');
  const [isSettled, setIsSettled] = useState(false);
  const [localRotation, setLocalRotation] = useState(0);
  const [isSpinningLocal, setIsSpinningLocal] = useState(false);

  const rouletteRotation = room.rouletteRotation || 0;
  const rouletteState = room.rouletteState || 'idle'; // 'idle' | 'spinning' | 'finished'
  const result = room.rouletteResult || null;
  const currentTargetTeam = room.rouletteSelectedTeam || selectedTeam;

  const tickIntervalRef = useRef(null);

  // Sync rotation from room state
  useEffect(() => {
    if (rouletteRotation !== localRotation) {
      setLocalRotation(rouletteRotation);
    }
  }, [rouletteRotation]);

  // Audio effect during spinning
  useEffect(() => {
    if (rouletteState === 'spinning') {
      setIsSpinningLocal(true);
      let speed = 90;
      const playTickLoop = () => {
        soundFx.playTick();
      };
      tickIntervalRef.current = setInterval(playTickLoop, speed);

      // Clean up after 3.5s
      const timer = setTimeout(() => {
        if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        setIsSpinningLocal(false);
      }, 3500);

      return () => {
        if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        clearTimeout(timer);
      };
    } else {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      setIsSpinningLocal(false);
    }
  }, [rouletteState]);

  const handleSpin = () => {
    if (rouletteState === 'spinning' || isSpinningLocal) return;

    // Pick fair honest random slice
    const winIndex = Math.floor(Math.random() * NUM_SLICES);
    const winItem = ROULETTE_ITEMS[winIndex];

    // Pointer is at the top (270 deg or 0 deg).
    // Center of slice i is at i * SLICE_DEG + SLICE_DEG / 2.
    // To land on slice i at 0 deg (top):
    const sliceCenter = winIndex * SLICE_DEG + SLICE_DEG / 2;
    // Extra full spins (between 5 and 7 rotations)
    const extraSpins = 360 * 6;
    // Calculate new target rotation
    const currentBase = Math.floor(localRotation / 360) * 360;
    const targetRotation = currentBase + extraSpins + (360 - sliceCenter);

    setIsSettled(false);
    updateRoomState({
      rouletteState: 'spinning',
      rouletteRotation: targetRotation,
      rouletteResult: null,
      rouletteSelectedTeam: selectedTeam,
    });

    // Stop and finalize after 3.6s
    setTimeout(() => {
      soundFx.playSuccess();
      updateRoomState({
        rouletteState: 'finished',
        rouletteResult: winItem,
      });

      // Apply points to chosen team
      const teamId = selectedTeam;
      if (winItem.effect === 'double') {
        const teamScore = participants.filter(p => p.teamId === teamId).reduce((sum, p) => sum + p.score, 0);
        awardPoints(teamId, Math.max(teamScore, 300), true);
      } else if (winItem.effect !== 0) {
        awardPoints(teamId, winItem.effect, true);
      }
      setIsSettled(true);
    }, 3600);
  };

  const handleSettlePoints = () => {
    if (isSettled) return;
    const teamId = currentTargetTeam || selectedTeam;
    if (result) {
      if (result.effect === 'double') {
        const teamScore = participants.filter(p => p.teamId === teamId).reduce((sum, p) => sum + p.score, 0);
        awardPoints(teamId, Math.max(teamScore, 300), true);
      } else {
        awardPoints(teamId, result.effect, true);
      }
    } else {
      awardPoints(teamId, 500, true);
    }
    setIsSettled(true);
    soundFx.playSuccess();
  };

  const handleReturnToLobby = () => {
    if (result && !isSettled) {
      handleSettlePoints();
    }
    returnToLobby();
  };

  // SVG wheel rendering helper
  const renderWheel = (size = 360) => {
    const radius = size / 2;
    const center = radius;

    return (
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        {/* Top Pointer Needle */}
        <div style={{
          position: 'absolute',
          top: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
          animation: isSpinningLocal ? 'needleBounce 0.15s infinite alternate ease-in-out' : 'none'
        }}>
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '32px solid #ef4444',
          }} />
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid #b91c1c'
          }} />
        </div>

        {/* Rotating Wheel Container */}
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          boxShadow: '0 0 35px rgba(0,0,0,0.6), 0 0 15px rgba(255,215,0,0.3)',
          border: '8px solid #ffd700',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: isSpinningLocal ? 'transform 3.5s cubic-bezier(0.12, 0.8, 0.18, 1)' : 'none',
          transform: `rotate(${localRotation}deg)`,
        }}>
          <svg width={size - 16} height={size - 16} viewBox={`0 0 ${size} ${size}`}>
            <g transform={`translate(${center}, ${center})`}>
              {ROULETTE_ITEMS.map((item, idx) => {
                const startAngle = (idx * SLICE_DEG - 90) * (Math.PI / 180);
                const endAngle = ((idx + 1) * SLICE_DEG - 90) * (Math.PI / 180);
                const x1 = radius * Math.cos(startAngle);
                const y1 = radius * Math.sin(startAngle);
                const x2 = radius * Math.cos(endAngle);
                const y2 = radius * Math.sin(endAngle);

                const midAngleDeg = idx * SLICE_DEG + SLICE_DEG / 2;

                return (
                  <g key={item.id}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                      fill={item.color}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <g transform={`rotate(${midAngleDeg}) translate(0, -${radius * 0.65})`}>
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fff"
                        style={{
                          fontSize: size > 320 ? '13px' : '11px',
                          fontWeight: 800,
                          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                          userSelect: 'none',
                        }}
                      >
                        {item.icon} {item.label.split(' ')[0]}
                      </text>
                    </g>
                  </g>
                );
              })}
              {/* Wheel Center Cap */}
              <circle r="26" fill="#1e293b" stroke="#ffd700" strokeWidth="4" />
              <circle r="10" fill="#ffd700" />
            </g>
          </svg>
        </div>
      </div>
    );
  };

  const targetTeamObj = activeTeams.find(t => t.id === currentTargetTeam);

  // Participant View
  if (userRole === 'participant') {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', minHeight: '65vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>🎡 럭키 룰렛 대박 뽑기</h2>
        <div style={{ color: 'var(--text-sub)', marginBottom: '20px' }}>
          {rouletteState === 'spinning' ? (
            <span style={{ color: '#ffd700', fontWeight: 800, fontSize: '1.2rem', animation: 'pulse 1s infinite' }}>
              ⚡ 룰렛이 회전하고 있습니다! 긴장되는 순간... ⚡
            </span>
          ) : result ? (
            <span style={{ color: 'var(--success-color)', fontWeight: 800, fontSize: '1.2rem' }}>
              🎉 룰렛 결과가 확정되었습니다!
            </span>
          ) : (
            '호스트가 룰렛을 돌리기 직전입니다!'
          )}
        </div>

        {renderWheel(300)}

        {result && (
          <div className="glass-card" style={{ marginTop: '25px', padding: '20px', maxWidth: '380px', width: '100%', border: '2px solid #ffd700', background: 'rgba(255, 215, 0, 0.1)' }}>
            <div style={{ fontSize: '2.5rem' }}>{result.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: '6px' }}>{result.label}</div>
            <div style={{ fontSize: '1.1rem', color: targetTeamObj?.color || '#ffd700', marginTop: '8px', fontWeight: 700 }}>
              대상: [{targetTeamObj?.name || '팀'}]
            </div>
          </div>
        )}
      </div>
    );
  }

  // Host View
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          🎡 럭키 룰렛 대박 뽑기 (Lucky Roulette)
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSettlePoints} 
            disabled={isSettled || !result}
            className="btn-primary" 
            style={{ 
              background: isSettled ? '#555' : !result ? '#333' : 'var(--success-color)', 
              cursor: isSettled || !result ? 'not-allowed' : 'pointer',
              opacity: (!result && !isSettled) ? 0.6 : 1
            }}
          >
            {isSettled ? '✅ 정산 완료' : !result ? '⏳ 룰렛 결과 후 정산' : '🏆 포인트 정산하기'}
          </button>
          <button onClick={handleReturnToLobby} className="btn-secondary">
            🏠 로비로 돌아가기
          </button>
        </div>
      </div>

      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
        
        {/* Team Selector */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '1.2rem', fontWeight: 700 }}>🎯 행운의 대상 팀:</label>
          <select 
            value={selectedTeam} 
            onChange={e => setSelectedTeam(e.target.value)}
            disabled={rouletteState === 'spinning'}
            style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '1.1rem', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '2px solid var(--primary-color)' }}
          >
            {activeTeams.map(t => (
              <option key={t.id} value={t.id} style={{ background: '#222' }}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Animated Wheel */}
        <div style={{ margin: '15px 0' }}>
          {renderWheel(360)}
        </div>

        {/* Action Controls & Results */}
        {rouletteState === 'spinning' ? (
          <div style={{ marginTop: '25px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffd700', animation: 'pulse 1s infinite' }}>
              🎰 회전 중... 과연 대박의 주인공은 누구일까요?! 🎰
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            {result && (
              <div className="glass-card" style={{ padding: '16px 30px', textAlign: 'center', border: '2px solid #ffd700', background: 'rgba(255, 215, 0, 0.12)' }}>
                <div style={{ fontSize: '2rem' }}>{result.icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff' }}>{result.label}</div>
                <div style={{ fontSize: '1.1rem', color: targetTeamObj?.color || '#ffd700', fontWeight: 800, marginTop: '4px' }}>
                  적용 대상: {targetTeamObj?.name}
                </div>
              </div>
            )}

            <button 
              onClick={handleSpin} 
              className="btn-primary" 
              style={{ padding: '16px 48px', fontSize: '1.5rem', fontWeight: 900, borderRadius: '50px', boxShadow: '0 0 25px rgba(99, 102, 241, 0.6)' }}
            >
              <Play size={26} /> {result ? '🔄 룰렛 다시 돌리기!' : '🚀 룰렛 돌리기!'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
