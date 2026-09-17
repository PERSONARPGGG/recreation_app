import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, UserMinus, Gift, PlusSquare, Shuffle, Target, Megaphone, Timer, Music, Download, X } from 'lucide-react';
import { soundFx } from '../utils/sound';

export const HostControls = () => {
  const { room, toggleFreeze, triggerEvent, triggerSpotlight, shuffleTeams, setGlobalAnnouncement, kickParticipant, addGlobalTime } = useGame();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (actionType) => {
    soundFx.playTick();
    switch (actionType) {
      case 'FREEZE': toggleFreeze(); break;
      case 'EVENT': triggerEvent('깜짝 보너스 이벤트 시작!'); break;
      case 'SPOTLIGHT': triggerSpotlight(); break;
      case 'SHUFFLE': shuffleTeams(); break;
      case 'ANNOUNCE': setGlobalAnnouncement('잠시 후 새로운 게임이 시작됩니다!'); break;
      case 'TIMER': addGlobalTime(); break;
      // KICK, SCORE, BGM, REPORT are placeholders/unimplemented but won't crash now.
      default: break;
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          background: 'var(--danger-color)', color: '#fff', padding: '16px', borderRadius: '50%',
          boxShadow: '0 0 20px rgba(255,0,85,0.5)', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        title="호스트 마스터 컨트롤"
      >
        <ShieldAlert size={32} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
      background: 'rgba(10, 10, 20, 0.95)', border: '2px solid var(--danger-color)',
      borderRadius: '20px', padding: '20px', width: '380px', backdropFilter: 'blur(10px)',
      boxShadow: '0 0 30px rgba(255,0,85,0.3)', display: 'flex', flexDirection: 'column', gap: '15px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <h3 className="font-heading" style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
          <ShieldAlert size={20} /> 호스트 마스터 컨트롤
        </h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button className="btn-secondary" onClick={() => handleAction('FREEZE')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={20} /> 화면 강제 얼음
        </button>
        <button className="btn-secondary" onClick={() => handleAction('KICK')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <UserMinus size={20} /> 참가자 강제 퇴장
        </button>
        <button className="btn-secondary" onClick={() => handleAction('EVENT')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Gift size={20} /> 깜짝 이벤트 팝업
        </button>
        <button className="btn-secondary" onClick={() => handleAction('SCORE')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <PlusSquare size={20} /> 수동 점수 자판기
        </button>
        <button className="btn-secondary" onClick={() => handleAction('SHUFFLE')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Shuffle size={20} /> 팀 랜덤 셔플
        </button>
        <button className="btn-secondary" onClick={() => handleAction('SPOTLIGHT')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Target size={20} /> 참가자 스포트라이트
        </button>
        <button className="btn-secondary" onClick={() => handleAction('ANNOUNCE')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Megaphone size={20} /> 전체 공지 전송
        </button>
        <button className="btn-secondary" onClick={() => handleAction('TIMER')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Timer size={20} /> 타이머 제어 (+10s)
        </button>
        <button className="btn-secondary" onClick={() => handleAction('BGM')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Music size={20} /> 긴장감 BGM 변경
        </button>
        <button className="btn-secondary" onClick={() => handleAction('REPORT')} style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <Download size={20} /> 최종 결과 리포트
        </button>
      </div>
    </div>
  );
};
