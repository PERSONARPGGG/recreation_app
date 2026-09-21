import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Monitor, Smartphone, MailOpen, User, Users } from 'lucide-react';
import { soundFx } from '../utils/sound';

export const Landing = () => {
  const { createRoom, joinAsPlayer, rejoinFromSession, activeTeams, setUserRole, requestSync, room } = useGame();
  
  const [view, setView] = useState('main'); // main, host_loading, guest_envelope, guest_form
  const [inputName, setInputName] = useState('');
  const [inputCode, setInputCode] = useState('');
  // Set default team id if available, but it might change after sync
  const [selectedTeam, setSelectedTeam] = useState(activeTeams[0]?.id);

  React.useEffect(() => {
    // If activeTeams changes (e.g. after sync), update selectedTeam if it's invalid
    if (activeTeams.length > 0 && !activeTeams.find(t => t.id === selectedTeam)) {
      setSelectedTeam(activeTeams[0].id);
    }
  }, [activeTeams, selectedTeam]);

  React.useEffect(() => {
    // Attempt to auto-rejoin to prevent team switching exploit
    if (rejoinFromSession()) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setInputCode(codeParam.toUpperCase());
      setView('guest_form');
      requestSync(); // Request sync if directly loaded via QR/link
    }
  }, []);

  const handleHostClick = () => {
    setView('host_loading');
    soundFx.playTick();
    setTimeout(() => {
      createRoom();
      soundFx.playSuccess();
    }, 2000); // 2 second projector loading animation
  };

  const handleGuestClick = () => {
    setView('guest_envelope');
    soundFx.playTick();
    requestSync(); // Request sync so activeTeams is updated before form shows
    setTimeout(() => {
      setView('guest_form');
    }, 1500); // envelope opening animation
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!inputName.trim() || !inputCode.trim()) return;
    
    // Auth stage done. Request sync to get actual room state before team selection.
    requestSync();
    setView('guest_team_select');
    soundFx.playTick();
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    joinAsPlayer(inputName, selectedTeam);
    setUserRole('participant');
    soundFx.playSuccess();
  };

  if (view === 'host_loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050510' }}>
        <div className="projector-animation">
          <Monitor size={100} color="var(--primary-color)" />
          <div className="projector-beam"></div>
        </div>
        <h2 className="font-heading" style={{ marginTop: '40px', fontSize: '2rem', animation: 'pulse 1s infinite' }}>사회자 시스템 부팅 중...</h2>
      </div>
    );
  }

  if (view === 'guest_envelope') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510' }}>
        <div className="envelope-animation">
          <MailOpen size={120} color="#ffd700" />
          <h2 style={{ marginTop: '20px', color: '#ffd700' }}>초대장이 열립니다...</h2>
        </div>
      </div>
    );
  }

  if (view === 'guest_form') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <form onSubmit={handleAuthSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeInUp 0.5s ease' }}>
          <h2 className="font-heading text-gradient" style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>초대장 확인</h2>
          
          <div>
            <label style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-sub)', display: 'block', marginBottom: '10px' }}>방 코드</label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="예: REC-1234"
              required
              style={{
                width: '100%', padding: '20px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid var(--primary-color)', color: '#fff', fontSize: '1.5rem', textAlign: 'center', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-sub)', display: 'block', marginBottom: '10px' }}>내 닉네임</label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
              style={{
                width: '100%', padding: '20px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid var(--card-border)', color: '#fff', fontSize: '1.5rem', textAlign: 'center', outline: 'none'
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '20px', padding: '20px', fontSize: '1.8rem', fontWeight: 900 }}>
            다음 단계
          </button>
        </form>
      </div>
    );
  }

  if (view === 'guest_team_select') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeInUp 0.5s ease' }}>
          <h2 className="font-heading text-gradient" style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>입장 준비</h2>
          
          {room.status === 'setup' ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Monitor size={60} color="var(--primary-color)" style={{ marginBottom: '20px', animation: 'pulse 2s infinite' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>진행자가 방을 설정 중입니다</h3>
              <p style={{ color: 'var(--text-sub)' }}>설정이 완료될 때까지 잠시 대기해 주세요...</p>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {room.mode === 'team' && (
                <div>
                  <label style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-sub)', display: 'block', marginBottom: '15px' }}>소속 팀을 선택하세요</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {activeTeams.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTeam(t.id)}
                        style={{
                          padding: '16px', borderRadius: '12px',
                          border: selectedTeam === t.id ? `3px solid ${t.color}` : '2px solid rgba(255,255,255,0.1)',
                          background: selectedTeam === t.id ? `${t.color}30` : 'rgba(255,255,255,0.05)',
                          color: t.color, fontWeight: 900, fontSize: '1.2rem', cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {room.mode === 'solo' && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <User size={60} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '1.5rem' }}>개인전 모드입니다</h3>
                  <p style={{ color: 'var(--text-sub)' }}>준비되셨다면 입장하기 버튼을 눌러주세요!</p>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '20px', padding: '20px', fontSize: '1.8rem', fontWeight: 900 }}>
                🚀 방 입장하기
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // view === 'main'
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      
      <h1 className="font-heading text-gradient" style={{ fontSize: '3rem', marginBottom: '10px' }}>RECREATION MASTER 100</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-sub)', marginBottom: '60px' }}>세상에서 가장 즐거운 100인 대규모 레크레이션 플랫폼</p>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        <button 
          onClick={handleHostClick}
          className="glass-panel glass-panel-glow"
          style={{ 
            width: '300px', height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease', border: '2px solid rgba(0, 243, 255, 0.3)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Monitor size={80} color="var(--primary-color)" style={{ marginBottom: '30px' }} />
          <h2 className="font-heading" style={{ fontSize: '2.2rem', marginBottom: '15px' }}>사회자</h2>
          <div className="btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem' }}>방 만들기</div>
        </button>

        <button 
          onClick={handleGuestClick}
          className="glass-panel glass-panel-glow"
          style={{ 
            width: '300px', height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease', border: '2px solid rgba(255, 215, 0, 0.3)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Smartphone size={80} color="#ffd700" style={{ marginBottom: '30px' }} />
          <h2 className="font-heading" style={{ fontSize: '2.2rem', marginBottom: '15px', color: '#ffd700' }}>참가자</h2>
          <div style={{ background: '#ffd700', color: '#000', padding: '15px 30px', fontSize: '1.2rem', borderRadius: '12px', fontWeight: 800 }}>초대장 열기</div>
        </button>

      </div>

      <footer style={{
        marginTop: '60px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-sub)'
      }}>
        <div>RECREATION MASTER 100 — 100인 대규모 라이브 레크레이션 게임 엔진 &copy; 2026</div>
        <div style={{ marginTop: '8px', color: 'var(--primary-color)', fontWeight: 800 }}>
          버전: v1.4.3 (세션 기반 어뷰징 방지 및 포인트 일괄 정산 시스템)
        </div>
      </footer>
    </div>
  );
};
