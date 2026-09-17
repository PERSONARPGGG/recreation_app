import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Dribbble, Play } from 'lucide-react';
import { soundFx } from '../../utils/sound';

const ROULETTE_ITEMS = [
  { label: '+500점 (대박!)', color: '#34c759', effect: 500 },
  { label: '-300점 (앗!)', color: '#ff3b30', effect: -300 },
  { label: '점수 2배', color: '#007aff', effect: 'double' },
  { label: '꼴찌 탈출 (+1000점)', color: '#ffd700', effect: 1000 },
  { label: '꽝 (변동 없음)', color: '#8e8e93', effect: 0 },
];

export const LuckyRoulette = () => {
  const { userRole, activeTeams, awardPoints, returnToLobby, participants } = useGame();
  
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(activeTeams[0]?.id);

  const handleSpin = () => {
    setSpinning(true);
    setResult(null);
    soundFx.playTick(); // Ideally a roulette sound
    
    setTimeout(() => {
      const randomItem = ROULETTE_ITEMS[Math.floor(Math.random() * ROULETTE_ITEMS.length)];
      setResult(randomItem);
      setSpinning(false);
      soundFx.playSuccess();
      
      // Apply effect
      if (randomItem.effect === 'double') {
        const teamScore = participants.filter(p => p.teamId === selectedTeam).reduce((sum, p) => sum + p.score, 0);
        awardPoints(selectedTeam, teamScore, true); // add same amount again
      } else {
        awardPoints(selectedTeam, randomItem.effect, true);
      }
    }, 3000); // spin for 3 seconds
  };

  if (userRole === 'participant') {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>🎡 럭키 룰렛</h2>
        <div style={{ color: 'var(--text-sub)' }}>
          호스트가 룰렛을 돌리고 있습니다. 결과를 메인 화면에서 확인하세요!
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          🎡 럭키 룰렛 대박 뽑기 (Lucky Roulette)
        </h2>
        <button onClick={returnToLobby} className="btn-secondary">
          로비로 돌아가기
        </button>
      </div>

      <div className="glass-panel glass-panel-glow" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '1.2rem' }}>대상 팀 선택:</label>
          <select 
            value={selectedTeam} 
            onChange={e => setSelectedTeam(e.target.value)}
            disabled={spinning}
            style={{ padding: '10px', borderRadius: '8px', fontSize: '1.1rem', background: '#333', color: '#fff', border: '1px solid #555' }}
          >
            {activeTeams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          width: '300px', height: '300px', borderRadius: '50%', border: '10px solid #fff',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          background: result ? result.color : '#222',
          transition: 'all 0.5s',
          animation: spinning ? 'spin 1s linear infinite' : 'none',
          boxShadow: '0 0 30px rgba(0,0,0,0.5)'
        }}>
          {spinning ? (
            <Dribbble size={100} color="#fff" />
          ) : result ? (
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{result.label}</h3>
            </div>
          ) : (
            <div style={{ color: '#aaa', fontSize: '1.5rem' }}>준비 완료</div>
          )}
        </div>

        {!spinning && (
          <button onClick={handleSpin} className="btn-primary" style={{ marginTop: '40px', padding: '15px 40px', fontSize: '1.5rem' }}>
            <Play size={24} /> 룰렛 돌리기!
          </button>
        )}
      </div>
    </div>
  );
};
