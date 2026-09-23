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

  const cycleTheme = () => {
    const themeList = Object.values(THEMES);
    const nextIdx = (themeList.indexOf(theme) + 1) % themeList.length;
    switchTheme(themeList[nextIdx]);
    soundFx.playTick();
  };

  return (
    <header className="glass-panel" style={{ padding: isCompact ? '4px 10px' : '12px 20px', marginBottom: isCompact ? '6px' : '16px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '6px' : '12px' }}>
          <div style={{
            width: isCompact ? '28px' : '40px',
            height: isCompact ? '28px' : '40px',
            borderRadius: isCompact ? '6px' : '10px',
            background: 'var(--button-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isCompact ? '0.95rem' : '1.35rem',
            boxShadow: '0 0 10px var(--primary-glow)',
            flexShrink: 0
          }}>
            🎮
          </div>
          <div>
            <div style={{ fontSize: isCompact ? '0.95rem' : '1.2rem', fontWeight: 900, letterSpacing: '-0.5px' }} className="font-heading">
              {isCompact ? (
                <>RM <span className="text-gradient">100</span></>
              ) : (
                <>RECREATION <span className="text-gradient">MASTER 100</span></>
              )}
            </div>
            {!isCompact && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                {room.title}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Controls Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? '4px' : '8px', flexWrap: 'wrap' }}>
          
          {/* Participant Count Badge */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.07)',
            padding: isCompact ? '4px 6px' : '6px 10px',
            borderRadius: '20px',
            border: '1px solid var(--card-border)',
            fontSize: isCompact ? '0.75rem' : '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--primary-color)',
            whiteSpace: 'nowrap'
          }}>
            <Users size={isCompact ? 13 : 15} />
            <span>{participants.length}명</span>
          </div>

          {/* Room Code Badge (Host Only) */}
          {userRole === 'host' && room.code && room.status !== 'setup' && (
            <>
              <div 
                onClick={() => document.getElementById('qr-modal').style.display = 'flex'}
                style={{
                  background: 'var(--button-gradient)',
                  padding: isCompact ? '4px 10px' : '6px 14px',
                  borderRadius: '20px',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 15px var(--primary-glow)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>
                <div style={{ background: '#fff', padding: '2px', borderRadius: '6px', display: 'flex' }}>
                  <QRCodeSVG value={`${window.location.origin}?code=${room.code}`} size={isCompact ? 22 : 32} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{room.code}</span>
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
                  <div style={{ background: '#fff', padding: '40px 30px', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 50px rgba(0,243,255,0.3)', maxWidth: '90vw' }}>
                    <QRCodeSVG value={`${window.location.origin}?code=${room.code}`} size={Math.min(window.innerWidth * 0.75, window.innerHeight * 0.5, 450)} />
                    <h2 style={{ color: '#000', marginTop: '20px', fontSize: '2.8rem', fontWeight: 900, letterSpacing: '4px' }}>{room.code}</h2>
                    <p style={{ color: '#444', fontSize: '1.1rem', fontWeight: 800 }}>스마트폰 카메라로 스캔하여 즉시 입장하세요!</p>
                    <button 
                      onClick={() => document.getElementById('qr-modal').style.display = 'none'}
                      className="btn-primary" style={{ marginTop: '20px', padding: '12px 40px', fontSize: '1.2rem' }}>
                      닫기
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </>
          )}

          {/* Compact Single Theme Cycle Button - Never Wraps or Breaks */}
          <button
            onClick={cycleTheme}
            className="btn-secondary"
            title={`테마 전환 (현재: ${THEME_DETAILS[theme]?.name || THEME_DETAILS['blue'].name} - 클릭 시 전환)`}
            style={{
              padding: isCompact ? '4px 8px' : '6px 12px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{THEME_DETAILS[theme]?.icon || THEME_DETAILS['blue'].icon}</span>
            <span style={{ fontSize: '0.72rem' }}>{THEME_DETAILS[theme]?.name || THEME_DETAILS['blue'].name}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            className="btn-secondary"
            style={{ padding: isCompact ? '4px 8px' : '6px 12px', borderRadius: '10px', fontSize: '0.85rem' }}
            title="효과음 켜기/끄기"
          >
            {muted ? <VolumeX size={isCompact ? 15 : 17} color="var(--danger-color)" /> : <Volume2 size={isCompact ? 15 : 17} color="var(--primary-color)" />}
          </button>

        </div>

      </div>
    </header>
  );
};
