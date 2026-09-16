import React from 'react';
import { useGame } from '../context/GameContext';
import { THEMES, THEME_DETAILS } from '../utils/theme';
import { soundFx } from '../utils/sound';
import { Volume2, VolumeX, Monitor, Smartphone, Users, Sparkles, Award } from 'lucide-react';

export const Header = () => {
  const { theme, switchTheme, userRole, setUserRole, room, participants } = useGame();
  const [muted, setMuted] = React.useState(soundFx.isMuted);

  const handleSoundToggle = () => {
    const isMute = soundFx.toggleMute();
    setMuted(isMute);
  };

  return (
    <header className="glass-panel" style={{ padding: '14px 24px', marginBottom: '20px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--button-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 0 15px var(--primary-glow)'
          }}>
            🎮
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }} className="font-heading">
              RECREATION <span className="text-gradient">MASTER 100</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', fontWeight: 500 }}>
              {room.title}
            </div>
          </div>
        </div>

        {/* Dynamic Controls Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Participant Count Badge */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.07)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid var(--card-border)',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--primary-color)'
          }}>
            <Users size={16} />
            <span>{participants.length}명 참여 중</span>
          </div>

          {/* Theme Switcher 3-Buttons */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '12px',
            padding: '4px',
            display: 'flex',
            gap: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {Object.values(THEMES).map(tId => {
              const info = THEME_DETAILS[tId];
              const isActive = theme === tId;
              return (
                <button
                  key={tId}
                  onClick={() => switchTheme(tId)}
                  title={info.name}
                  style={{
                    background: isActive ? 'var(--button-gradient)' : 'transparent',
                    color: isActive ? 'var(--button-text)' : 'var(--text-sub)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{info.icon}</span>
                  <span style={{ display: isActive ? 'inline' : 'none' }}>{info.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            className="btn-secondary"
            style={{ padding: '8px 12px', borderRadius: '12px', fontSize: '0.85rem' }}
            title="효과음 켜기/끄기"
          >
            {muted ? <VolumeX size={18} color="var(--danger-color)" /> : <Volume2 size={18} color="var(--primary-color)" />}
          </button>

          {/* Screen Perspective Toggle (Host vs Player) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '3px',
            display: 'flex',
            border: '1px solid var(--card-border)'
          }}>
            <button
              onClick={() => setUserRole('host')}
              style={{
                background: userRole === 'host' ? 'var(--primary-color)' : 'transparent',
                color: userRole === 'host' ? '#000' : 'var(--text-main)',
                border: 'none',
                borderRadius: '9px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
            >
              <Monitor size={15} />
              <span>사회자 빔프로젝터</span>
            </button>

            <button
              onClick={() => setUserRole('participant')}
              style={{
                background: userRole === 'participant' ? 'var(--primary-color)' : 'transparent',
                color: userRole === 'participant' ? '#000' : 'var(--text-main)',
                border: 'none',
                borderRadius: '9px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
            >
              <Smartphone size={15} />
              <span>참가자 스마트폰</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
