import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { soundFx } from '../utils/sound';
import { StopwatchChallenge } from './games/StopwatchChallenge';
import { BlockStacker } from './games/BlockStacker';
import { SurvivalOxQuiz } from './games/SurvivalOxQuiz';
import { RapidTapSprint } from './games/RapidTapSprint';
import { MindSyncBalance } from './games/MindSyncBalance';
import { Smartphone, User, Shield, Trophy, CheckCircle, Zap } from 'lucide-react';

export const ParticipantMobileView = () => {
  const {
    room,
    participants,
    activeTeams,
    myPlayerId,
    myPlayerName,
    myTeamId,
    joinAsPlayer
  } = useGame();

  const [inputName, setInputName] = useState(myPlayerName || '신나는플레이어');
  const [selectedTeam, setSelectedTeam] = useState(myTeamId || activeTeams[0]?.id);
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    joinAsPlayer(inputName, selectedTeam);
    setIsJoined(true);
    soundFx.playSuccess();
  };

  // Find my player object
  const me = participants.find(p => p.id === myPlayerId) || {
    name: inputName,
    score: 0,
    teamName: activeTeams.find(t => t.id === selectedTeam)?.name || '개인',
    teamColor: activeTeams.find(t => t.id === selectedTeam)?.color || '#00f3ff'
  };

  // Render current game if host started playing
  if (room.status === 'playing') {
    switch (room.activeGame) {
      case 'stopwatch': return <StopwatchChallenge />;
      case 'blockstack': return <BlockStacker />;
      case 'oxquiz': return <SurvivalOxQuiz />;
      case 'sprint': return <RapidTapSprint />;
      case 'mindsync': return <MindSyncBalance />;
      default: break;
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Mobile Header Banner */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,243,255,0.15)', color: 'var(--primary-color)', padding: '4px 12px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '8px' }}>
          <Smartphone size={14} /> 모바일 참가자 모드
        </div>
        <h2 className="font-heading text-gradient" style={{ fontSize: '1.6rem', fontWeight: 900 }}>
          {room.title}
        </h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '4px' }}>
          방 코드: <strong style={{ color: '#fff' }}>{room.code}</strong>
        </div>
      </div>

      {/* Participant Registration Card */}
      {!isJoined ? (
        <form onSubmit={handleJoin} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} color="var(--primary-color)" />
            참가자 프로필 설정
          </h3>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>닉네임 입력</label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="이름 또는 닉네임을 입력하세요"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--card-border)',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {room.mode === 'team' && (
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-sub)', display: 'block', marginBottom: '8px' }}>소속 팀 선택</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {activeTeams.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTeam(t.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: selectedTeam === t.id ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.1)',
                      background: selectedTeam === t.id ? `${t.color}25` : 'rgba(255,255,255,0.04)',
                      color: t.color,
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '10px', width: '100%', fontSize: '1.1rem', padding: '14px' }}>
            🚀 대기실 입장 완료!
          </button>
        </form>
      ) : (
        /* Joined Dashboard */
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--button-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 14px auto',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            👤
          </div>

          <h3 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 900 }}>
            {me.name} 님 환영합니다!
          </h3>

          {room.mode === 'team' && (
            <div style={{ marginTop: '8px' }}>
              <span className={`team-badge ${me.teamColor}`} style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
                {me.teamName} 소속
              </span>
            </div>
          )}

          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '20px',
            borderRadius: '16px',
            margin: '20px 0',
            border: '1px solid var(--card-border)'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>현재 내 점수</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-color)' }}>
              {me.score} <span style={{ fontSize: '1rem' }}>PTS</span>
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(0, 243, 255, 0.08)',
            border: '1px dashed var(--primary-color)',
            color: 'var(--text-sub)',
            fontSize: '0.9rem'
          }}>
            ⏳ <strong>사회자가 게임을 시작하면 모바일 컨트롤러가 자동으로 가동됩니다.</strong><br/>
            빔프로젝터 메인 화면을 주목해 주세요!
          </div>

        </div>
      )}

    </div>
  );
};
