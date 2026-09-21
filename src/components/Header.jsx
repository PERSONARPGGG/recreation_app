import React from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import { THEMES, THEME_DETAILS } from '../utils/theme';
import { soundFx } from '../utils/sound';
import { Volume2, VolumeX, Monitor, Smartphone, Users, Sparkles, Award } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const Header = ({ isCompact = false }) => {
  const { theme, switchTheme, userRole, setUserRole, room, participants } = useGame();
  const [muted, setMuted] = React.useState(soundFx.isMuted);

  const handleSoundToggle = () => {
    const isMute = soundFx.toggleMute();
    setMuted(isMute);
  };

  return (
    <header className="glass-panel" style={{ padding: isCompact ? '6px 14px' : '14px 24px', marginBottom: isCompact ? '8px' : '20px', borderRadius: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '8px' : '12px' }}>
          <div style={{
            width: isCompact ? '32px' : '44px',
            height: isCompact ? '32px' : '44px',
            borderRadius: isCompact ? '8px' : '12px',
            background: 'var(--button-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isCompact ? '1.1rem' : '1.5rem',
            boxShadow: '0 0 10px var(--primary-glow)'
          }}>
            🎮
          </div>
          <div>
            <div style={{ fontSize: isCompact ? '1.05rem' : '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }} className="font-heading">
              RECREATION <span className="text-gradient">MASTER 100</span>
            </div>
            {!isCompact && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                {room.title}
              </div>
            )}
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

          {/* Room Code Badge (Host Only) */}
          {userRole === 'host' && room.code && room.status !== 'setup' && (
            <>
              <div 
                onClick={() => document.getElementById('qr-modal').style.display = 'flex'}
                style={{
                  background: 'var(--button-gradient)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 0 15px var(--primary-glow)',
                  cursor: 'pointer'
                }}>
                <div style={{ background: '#fff', padding: '4px', borderRadius: '8px', display: 'flex' }}>
                  <QRCodeSVG value={`${window.location.origin}?code=${room.code}`} size={40} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px' }}>크게 보기 🔍</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px' }}>{room.code}</span>
                </div>
              </div>

              {/* QR Code Enlarge Modal via Portal */}
              {document.body && createPortal(
                <div 
                  id="qr-modal"
                  onClick={(e) => {
                    if (e.target.id === 'qr-modal') e.target.style.display = 'none';
                  }}
                  style={{
                    display: 'none', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.95)', zIndex: 999999,
                    alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                  }}>
                  <div style={{ background: '#fff', padding: '60px', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 50px rgba(0,243,255,0.3)' }}>
                    <QRCodeSVG value={`${window.location.origin}?code=${room.code}`} size={Math.min(window.innerWidth * 0.8, window.innerHeight * 0.6, 600)} />
                    <h2 style={{ color: '#000', marginTop: '30px', fontSize: '4rem', fontWeight: 900, letterSpacing: '5px' }}>{room.code}</h2>
                    <p style={{ color: '#444', fontSize: '1.5rem', fontWeight: 800 }}>카메라로 스캔하여 즉시 접속하세요!</p>
                    <button 
                      onClick={() => document.getElementById('qr-modal').style.display = 'none'}
                      className="btn-primary" style={{ marginTop: '30px', padding: '15px 50px', fontSize: '1.5rem' }}>
                      닫기
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </>
          )}

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

        </div>

      </div>
    </header>
  );
};
