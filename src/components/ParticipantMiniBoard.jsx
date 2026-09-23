import React from 'react';
import { useGame } from '../context/GameContext';
import { Users } from 'lucide-react';

/**
 * ParticipantMiniBoard 컴포넌트
 * 호스트 대시보드의 하단이나 미니게임 진행 중에 참가자들의 실시간 현황(접속자 수, 점수 등)을 작게 요약해서 보여주는 보드입니다.
 */
export const ParticipantMiniBoard = () => {
  const { participants, activeTeams, room } = useGame();
  const [collapsed, setCollapsed] = React.useState(false);

  if (participants.length === 0) return null;

  return (
    <div className="glass-panel" style={{ 
      padding: '8px 12px', marginTop: '6px', borderRadius: '12px',
      display: 'flex', flexDirection: 'column', gap: '6px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-sub)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} /> 실시간 참가자 현황 (총 {participants.length}명)
        </h4>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none', border: 'none', color: 'var(--primary-color)',
            fontSize: '0.75rem', cursor: 'pointer', padding: '2px 6px'
          }}
        >
          {collapsed ? '▼ 펼치기' : '▲ 접기'}
        </button>
      </div>
      
      {/* 
        팀 모드일 경우: 팀별로 묶어서 점수를 합산해 보여주고,
        개인 모드일 경우: 개인별 이름과 점수를 나열합니다.
      */}
      {!collapsed && (
        room.mode === 'team' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
            {activeTeams.map(team => {
              const teamMembers = participants.filter(p => p.teamId === team.id);
              if (teamMembers.length === 0) return null;
              const teamScore = teamMembers.reduce((sum, p) => sum + p.score, 0);
              
              return (
                <div key={team.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', border: `1px solid ${team.color}40`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: team.color, fontWeight: 800 }}>{team.name}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{teamScore}<span style={{fontSize: '0.65rem', color: 'var(--text-sub)'}}>점</span></div>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxHeight: '60px', overflowY: 'auto' }}>
                    {teamMembers.map(p => {
                      const hasSubmitted = p.lastInput !== null;
                      return (
                        <div 
                          key={p.id}
                          title={`${p.name}: ${p.score}점 ${hasSubmitted ? '(입력완료)' : '(대기중)'}`}
                          style={{
                            width: '10px', height: '10px', borderRadius: '50%',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px', maxHeight: '140px', overflowY: 'auto', paddingRight: '4px' }}>
            {participants.map(p => {
              const hasSubmitted = p.lastInput !== null;
              return (
                <div 
                  key={p.id}
                  title={`${p.name} ${hasSubmitted ? '(입력완료)' : '(대기중)'}`}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${hasSubmitted ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary-color)' }}>
                    {p.score}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
