import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, UserMinus, Gift, PlusSquare, Shuffle, Target, Megaphone, Timer, Music, Download, X } from 'lucide-react';
import { soundFx } from '../utils/sound';
import { generateReports } from '../utils/reportGenerator';

/**
 * HostControls 컴포넌트
 * 게임 진행 중 사회자가 언제든지 팝업하여 사용할 수 있는 마스터 컨트롤 패널입니다.
 * 강제 얼음(Freeze), 팀 셔플, 공지사항 전송 등의 돌발 이벤트를 제어합니다.
 */
export const HostControls = () => {
  const { room, toggleFreeze, triggerEvent, triggerSpotlight, shuffleTeams, setGlobalAnnouncement, kickParticipant, addGlobalTime, awardPoints, participants, activeTeams } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);

  /**
   * 컨트롤 패널의 각 버튼 클릭 시 실행될 액션 핸들러
   * GameContext의 훅들을 호출하여 앱 전체의 상태를 변경(동기화)시킵니다.
   */
  const handleAction = (actionType) => {
    soundFx.playTick();
    switch (actionType) {
      case 'FREEZE': toggleFreeze(); break;
      case 'EVENT': triggerEvent('깜짝 보너스 이벤트 시작!'); break;
      case 'SPOTLIGHT': triggerSpotlight(); break;
      case 'SHUFFLE': shuffleTeams(); break;
      case 'ANNOUNCE': setGlobalAnnouncement('잠시 후 새로운 게임이 시작됩니다!'); break;
      case 'TIMER': addGlobalTime(); break;
      case 'SCORE': 
        const targetId = prompt('점수를 수정할 팀 ID(t1, t2...) 또는 참가자 ID를 입력하세요:');
        if (targetId) {
          const score = parseInt(prompt('얼마를 더할까요? (차감하려면 음수 입력)'), 10);
          if (!isNaN(score)) {
            const isTeam = targetId.startsWith('t');
            awardPoints(targetId, score, isTeam);
          }
        }
        break;
      case 'REPORT':
        generateReports(room, participants, activeTeams);
        break;
      case 'KICK': setShowKickModal(true); break;
      default: break;
    }
  };

  if (!isOpen) {
    if (showKickModal) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ color: 'var(--danger-color)', margin: 0 }}>참가자 강제 퇴장</h3>
            <button onClick={() => setShowKickModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>누구를 강제 퇴장시키겠습니까?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto' }}>
            {participants.length === 0 ? <p style={{ color: '#888' }}>접속자가 없습니다.</p> : participants.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                <button onClick={() => { if(window.confirm(p.name + '님을 퇴장시키겠습니까?')){ kickParticipant(p.id); } }} className="btn-secondary" style={{ border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '4px 12px' }}>강퇴</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
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
