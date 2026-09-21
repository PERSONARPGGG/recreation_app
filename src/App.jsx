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

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {userRole === 'host' ? <HostDashboard /> : <ParticipantMobileView />}
      </main>
      <ParticipantOverlay />
      <footer style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-sub)'
      }}>
        <div>RECREATION MASTER 100 — 100인 대규모 라이브 레크레이션 게임 엔진 &copy; 2026</div>
        <div style={{ marginTop: '8px', color: 'var(--primary-color)', fontWeight: 800 }}>
          버전: v1.4.6 (눈치게임·줄다리기 무한루프/프리징 해결, 초성퀴즈 입력단일잠금, 럭키룰렛 물리엔진 & 가위바위보 공정 1/3 랜덤 슬롯)
        </div>
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
