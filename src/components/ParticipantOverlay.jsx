import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, Gift, Star, Megaphone } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../utils/sound';

export const ParticipantOverlay = () => {
  const { room, userRole } = useGame();
  const [showEvent, setShowEvent] = useState(false);

  // Trigger confetti when spotlight changes
  useEffect(() => {
    if (room.spotlightPlayer) {
      soundFx.playSuccess();
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        zIndex: 10001
      });
    }
  }, [room.spotlightPlayer]);

  useEffect(() => {
    if (room.activeEvent) {
      soundFx.playTick();
      setShowEvent(true);
      setTimeout(() => setShowEvent(false), 8000);
    }
  }, [room.activeEvent]);

  // Don't show these overlays to the host (host has the dashboard to control them)
  if (userRole === 'host') return null;

  return (
    <>
      {/* Announcement Marquee */}
      {room.announcement && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
          background: 'var(--danger-color)', color: '#fff',
          padding: '10px', display: 'flex', alignItems: 'center', gap: '10px',
          fontWeight: 800, fontSize: '1rem',
          boxShadow: '0 4px 15px rgba(255, 0, 85, 0.4)'
        }}>
          <Megaphone size={20} />
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
            <div style={{ animation: 'marquee 15s linear infinite' }}>
              {room.announcement}
            </div>
          </div>
        </div>
      )}

      {/* Freeze Overlay */}
      {room.isFrozen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998,
          background: 'rgba(0, 50, 100, 0.85)', backdropFilter: 'blur(15px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#00f3ff', textAlign: 'center', padding: '20px'
        }}>
          <ShieldAlert size={100} style={{ marginBottom: '20px', animation: 'pulse 2s infinite' }} />
          <h1 className="font-heading" style={{ fontSize: '3rem', marginBottom: '10px', textShadow: '0 0 20px rgba(0,243,255,0.8)' }}>
            얼음!
          </h1>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>진행자에게 주목해 주세요!</p>
        </div>
      )}

      {/* Active Event Pop-up */}
      {showEvent && room.activeEvent && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999,
          background: 'linear-gradient(135deg, #ff0055 0%, #ff5e00 100%)',
          padding: '40px', borderRadius: '24px', color: '#fff', textAlign: 'center',
          boxShadow: '0 20px 50px rgba(255, 0, 85, 0.5)', border: '4px solid #fff',
          animation: 'fadeInUp 0.5s ease', minWidth: '300px'
        }}>
          <Gift size={60} style={{ marginBottom: '20px' }} />
          <h2 className="font-heading" style={{ fontSize: '2rem', marginBottom: '15px' }}>깜짝 이벤트</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{room.activeEvent}</p>
        </div>
      )}

      {/* Spotlight Pop-up */}
      {room.spotlightPlayer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', textAlign: 'center'
        }}>
          <Star size={120} color="#ffd700" style={{ marginBottom: '30px', animation: 'pulse 1s infinite' }} />
          <div style={{ fontSize: '1.5rem', color: 'var(--text-sub)', fontWeight: 800, marginBottom: '10px' }}>
            🎉 스포트라이트 당첨! 🎉
          </div>
          <h1 className="font-heading text-gradient" style={{ fontSize: '4rem', marginBottom: '10px' }}>
            {room.spotlightPlayer.name}
          </h1>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: room.spotlightPlayer.teamColor }}>
            {room.spotlightPlayer.teamName}
          </div>
        </div>
      )}
    </>
  );
};
