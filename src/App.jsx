import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { HostDashboard } from './components/HostDashboard';
import { ParticipantMobileView } from './components/ParticipantMobileView';
import { ParticipantOverlay } from './components/ParticipantOverlay';

const MainAppContent = () => {
  const { userRole, room } = useGame();

  // If user hasn't joined yet, show Landing screen
  if (!userRole) {
    return <Landing />;
  }

  const isPlaying = room.status === 'playing';

  return (
    <div className={`app-container ${isPlaying ? 'app-playing' : ''}`}>
      <Header isCompact={isPlaying} />
      <main className="main-content" style={{ flex: 1 }}>
        {userRole === 'host' ? <HostDashboard /> : <ParticipantMobileView />}
      </main>
      <ParticipantOverlay />
      {!isPlaying && (
        <footer style={{
          marginTop: '30px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-sub)'
        }}>
          <div>RECREATION MASTER 100 ??100???�규모 ?�이�??�크?�이??게임 ?�진 &copy; 2026</div>
          <div style={{ marginTop: '8px', color: 'var(--primary-color)', fontWeight: 800 }}>
            버전: v1.7.1 (핫픽스: 디버깅 및 UI/UX 총괄 최적화)
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainAppContent />
    </GameProvider>
  );
}
