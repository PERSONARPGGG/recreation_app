import React from 'react';
import { useGame } from '../context/GameContext';
import { Users } from 'lucide-react';

export const ParticipantMiniBoard = () => {
  const { participants, activeTeams, room } = useGame();

  if (participants.length === 0) return null;

  return (
    <div className="glass-panel" style={{ 
      padding: '12px', marginTop: '20px', borderRadius: '12px',
      display: 'flex', flexDirection: 'column', gap: '10px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-sub)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} /> 실시간 참가자 현황 (총 {participants.length}명)
        </h4>
      </div>
      
      {room.mode === 'team' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(5, activeTeams.length)}, 1fr)`, gap: '10px' }}>
          {activeTeams.map(team => {
            const teamMembers = participants.filter(p => p.teamId === team.id);
            if (teamMembers.length === 0) return null;
            return (
              <div key={team.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', border: `1px solid ${team.color}40` }}>
                <div style={{ fontSize: '0.75rem', color: team.color, fontWeight: 800, marginBottom: '6px' }}>{team.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {teamMembers.map(p => {
                    const hasSubmitted = p.lastInput !== null;
                    return (
                      <div 
                        key={p.id}
                        title={`${p.name} ${hasSubmitted ? '(입력완료)' : '(대기중)'}`}
                        style={{
                          width: '12px', height: '12px', borderRadius: '50%',
                          background: hasSubmitted ? team.color : 'rgba(255,255,255,0.1)',
                          boxShadow: hasSubmitted ? `0 0 5px ${team.color}` : 'none',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {participants.map(p => {
            const hasSubmitted = p.lastInput !== null;
            return (
              <div 
                key={p.id}
                title={`${p.name} ${hasSubmitted ? '(입력완료)' : '(대기중)'}`}
                style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: hasSubmitted ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                  boxShadow: hasSubmitted ? `0 0 5px var(--primary-color)` : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
