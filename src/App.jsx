import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { HostDashboard } from './components/HostDashboard';
import { ParticipantMobileView } from './components/ParticipantMobileView';
import { Landing } from './components/Landing';

const MainAppContent = () => {
  const { userRole } = useGame();

  if (!userRole) {
    return <Landing />;
  }

  return (
    <div className="app-container">
      <Header />
      <main style={{ flex: 1 }}>
        {userRole === 'host' ? <HostDashboard /> : <ParticipantMobileView />}
      </main>
      <footer style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-sub)'
      }}>
        RECREATION MASTER 100 — 100인 대규모 라이브 레크레이션 게임 엔진 &copy; 2026
      </footer>
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
