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
        <h2 className="font-heading" style={{ marginTop: '40px', fontSize: '2rem', animation: 'pulse 1s infinite' }}>?¬íšŒ???œìŠ¤??ë¶€??ì¤?..</h2>
      </div>
    );
  }

  if (view === 'guest_envelope') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510' }}>
        <div className="envelope-animation">
          <MailOpen size={120} color="#ffd700" />
          <h2 style={{ marginTop: '20px', color: '#ffd700' }}>ì´ˆë??¥ì´ ?´ë¦½?ˆë‹¤...</h2>
        </div>
      </div>
    );
  }

  if (view === 'guest_form') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <form onSubmit={handleAuthSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeInUp 0.5s ease' }}>
          <h2 className="font-heading text-gradient" style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '10px' }}>ì´ˆë????•ì¸</h2>
          
          <div>
            <label style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-sub)', display: 'block', marginBottom: '10px' }}>ë°?ì½”ë“œ</label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="?? REC-1234"
              required
              style={{
                width: '100%', padding: '20px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid var(--primary-color)', color: '#fff', fontSize: '1.5rem', textAlign: 'center', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-sub)', display: 'block', marginBottom: '10px' }}>???‰ë„¤??/label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="?´ë¦„???…ë ¥?˜ì„¸??
              required
              style={{
                width: '100%', padding: '20px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.4)',
                border: '2px solid var(--card-border)', color: '#fff', fontSize: '1.5rem', textAlign: 'center', outline: 'none'
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '20px', padding: '20px', fontSize: '1.8rem', fontWeight: 900 }}>
            ?¤ìŒ ?¨ê³„
          </button>
        </form>
      </div>
    );
  }

  if (view === 'guest_team_select') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeInUp 0.5s ease' }}>
          <h2 className="font-heading text-gradient" style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '4px' }}>?…ì¥ ì¤€ë¹?/h2>
          
          {room.status === 'setup' ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <Monitor size={60} color="var(--primary-color)" style={{ marginBottom: '20px', animation: 'pulse 2s infinite' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>ì§„í–‰?ê? ë°©ì„ ?¤ì • ì¤‘ì…?ˆë‹¤</h3>
              <p style={{ color: 'var(--text-sub)' }}>?¤ì •???„ë£Œ???Œê¹Œì§€ ? ì‹œ ?€ê¸°í•´ ì£¼ì„¸??..</p>
            </div>
          ) : (
            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {room.mode === 'team' && (
                <div>
                  <label style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-sub)', display: 'block', marginBottom: '10px' }}>?Œì† ?€??? íƒ?˜ì„¸??({activeTeams.length}ê°??€)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                    {activeTeams.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTeam(t.id)}
                        style={{
                          padding: '12px 8px', borderRadius: '10px',
                          border: selectedTeam === t.id ? `3px solid ${t.color}` : '2px solid rgba(255,255,255,0.1)',
                          background: selectedTeam === t.id ? `${t.color}30` : 'rgba(255,255,255,0.05)',
                          color: t.color, fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                          transition: 'all 0.2s ease', textAlign: 'center'
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {room.mode === 'solo' && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <User size={50} color="var(--primary-color)" style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '1.3rem' }}>ê°œì¸??ëª¨ë“œ?…ë‹ˆ??/h3>
                  <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>ì¤€ë¹„ë˜?¨ë‹¤ë©??…ì¥?˜ê¸° ë²„íŠ¼???ŒëŸ¬ì£¼ì„¸??</p>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '16px', fontSize: '1.4rem', fontWeight: 900 }}>
                ?? ë°??…ì¥?˜ê¸°
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // view === 'main'
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      
      <h1 className="font-heading text-gradient" style={{ fontSize: '3rem', marginBottom: '10px' }}>RECREATION MASTER 100</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-sub)', marginBottom: '60px' }}>?¸ìƒ?ì„œ ê°€??ì¦ê±°??100???€ê·œëª¨ ?ˆí¬?ˆì´???Œë«??/p>

      {/* Mode Selector Card Grid */}
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Host Mode Button */}
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
          <h2 className="font-heading" style={{ fontSize: '2.2rem', marginBottom: '15px' }}>?¬íšŒ???¸ìŠ¤??/h2>
          <div className="btn-primary" style={{ fontSize: '1.2rem' }}>??ë°?ë§Œë“¤ê¸?/div>
        </button>

        {/* Guest Mode Button */}
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
          <h2 className="font-heading" style={{ fontSize: '2.2rem', marginBottom: '15px', color: '#ffd700' }}>ì°¸ê???/h2>
          <div style={{ background: '#ffd700', color: '#000', padding: '15px 30px', fontSize: '1.2rem', borderRadius: '12px', fontWeight: 800 }}>ì´ˆë????´ê¸°</div>
        </button>

      </div>

      <footer style={{
        marginTop: '60px',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-sub)'
      }}>
        <div>RECREATION MASTER 100 ??100???€ê·œëª¨ ?¼ì´ë¸??ˆí¬?ˆì´??ê²Œì„ ?”ì§„ &copy; 2026</div>
        <div style={{ marginTop: '8px', color: 'var(--primary-color)', fontWeight: 800 }}>
          ë²„ì „: v1.5.1 (?¸ìŠ¤???€?œë³´??ê°„ì†Œ?? ?€/?Œë§ˆ ìµœì ??ë°??¤ì‹œê°??˜ì • ê¸°ëŠ¥)
        </div>
      </footer>
    </div>
  );
};
