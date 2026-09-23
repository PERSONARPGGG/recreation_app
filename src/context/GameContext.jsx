import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, applyTheme } from '../utils/theme';
import { TEAM_PRESETS, BOT_NICKNAMES } from '../utils/constants';
import confetti from 'canvas-confetti';
import { soundFx } from '../utils/sound';

const GameContext = createContext();

/**
 * 앱 전체의 상태(방 정보, 참가자 목록, 점수 등)를 관리하고 동기화하는 최상위 전역 Provider입니다.
 * 호스트와 참가자 간의 실시간 통신 로직(Supabase 또는 BroadcastChannel)이 여기에 집중되어 있습니다.
 */
export const GameProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.BLUE);
  const [userRole, setUserRole] = useState(null); // null(시작 전), 'host'(사회자), or 'participant'(일반 참가자)
  
  // 방의 전체 상태(게임 모드, 진행 상태, 알림 등)를 관리하는 객체
  const [room, setRoom] = useState({
    code: '',
    title: '🎉 100인 대격돌 명랑 레크레이션',
    mode: 'team',
    teamCount: 4,
    status: 'lobby',
    activeGame: null,
    gameState: 'ready', // 'ready', 'playing', 'finished'
    isFrozen: false,
    activeEvent: null,
    announcement: null,
    spotlightPlayer: null,
    teamOverrides: {}
  });

  const [participants, setParticipants] = useState([]);
  const [myPlayerId, setMyPlayerId] = useState('');
  const [myPlayerName, setMyPlayerName] = useState('');
  const [myTeamId, setMyTeamId] = useState('');

  // Refs for realtime callbacks to access latest state without reconnecting
  const roomRef = React.useRef(room);
  const participantsRef = React.useRef(participants);
  const userRoleRef = React.useRef(userRole);
  const myPlayerIdRef = React.useRef(myPlayerId);
  const activeTeamsRef = React.useRef([]);

  // Get active teams based on count (Max 6, Min 1 to prevent empty array errors)
  const safeTeamCount = Math.min(6, Math.max(1, Number(room.teamCount) || 4));
  const activeTeams = TEAM_PRESETS.slice(0, safeTeamCount).map(t => ({
    ...t,
    name: room.teamOverrides?.[t.id]?.name || t.name,
    scoreOffset: room.teamOverrides?.[t.id]?.scoreOffset || 0
  }));

  useEffect(() => {
    roomRef.current = room;
    participantsRef.current = participants;
    userRoleRef.current = userRole;
    myPlayerIdRef.current = myPlayerId;
    activeTeamsRef.current = activeTeams;
  }, [room, participants, userRole, myPlayerId, activeTeams]);

  // 동기화 채널 객체 (Supabase Realtime Channel 또는 로컬 브라우저용 BroadcastChannel)
  const [channel, setChannel] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false); // Supabase 연결 여부

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Setup broadcast channel for real multi-tab simulation OR Supabase
  useEffect(() => {
    import('../utils/supabase').then(({ supabase, isSupabaseConfigured }) => {
      if (isSupabaseConfigured) {
        setIsRealtime(true);
        const roomChannel = supabase.channel('recreation_master_channel', {
          config: { broadcast: { self: false } }
        });

        roomChannel
          .on('broadcast', { event: 'SYNC_STATE' }, ({ payload }) => {
            // Only participants should adopt the host's state, host ignores SYNC_STATE
            if (userRoleRef.current !== 'host') {
              setRoom(payload.room);
              setParticipants(payload.participants);

              // Auto-heal missing participant: if participant isn't in host's list, resend JOIN
              if (userRoleRef.current === 'participant' && myPlayerIdRef.current) {
                const amIInList = payload.participants.some(p => p.id === myPlayerIdRef.current);
                if (!amIInList) {
                  const savedName = localStorage.getItem('rec_myPlayerName');
                  const savedTeamId = localStorage.getItem('rec_myTeamId');
                  if (savedName && savedTeamId) {
                    const teamObj = activeTeamsRef.current.find(t => t.id === savedTeamId) || activeTeamsRef.current[0];
                    const healPlayer = {
                      id: myPlayerIdRef.current,
                      name: savedName,
                      isBot: false,
                      teamId: teamObj?.id,
                      teamName: teamObj?.name,
                      teamColor: teamObj?.color,
                      score: 0,
                      lastInput: null
                    };
                    roomChannel.send({ type: 'broadcast', event: 'PLAYER_JOIN', payload: healPlayer });
                  }
                }
              }
            }
          })
          .on('broadcast', { event: 'PLAYER_JOIN' }, ({ payload }) => {
            setParticipants(prev => {
              if (prev.some(p => p.id === payload.id)) return prev;
              const updated = [...prev, payload];
              // Host replies with full state to sync the new player
              if (userRoleRef.current === 'host') {
                roomChannel.send({ type: 'broadcast', event: 'SYNC_STATE', payload: { room: roomRef.current, participants: updated } });
              }
              return updated;
            });
          })
          .on('broadcast', { event: 'REQUEST_SYNC' }, () => {
            if (userRoleRef.current === 'host') {
              roomChannel.send({ type: 'broadcast', event: 'SYNC_STATE', payload: { room: roomRef.current, participants: participantsRef.current } });
            }
          })
          .on('broadcast', { event: 'PLAYER_SUBMIT' }, ({ payload }) => {
            // Anti-Cheat: 물리적 한계치 초과 패킷 무시 (오토클리커/매크로 방어)
            if (payload.lastInput) {
              if (payload.lastInput.tapCount > 300) return; 
              if (payload.lastInput.taps > 300) return; 
              if (payload.lastInput.score > 200) return;
            }
            setParticipants(prev => prev.map(p => p.id === payload.id ? { ...p, lastInput: payload.lastInput } : p));
          })
          .on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
            if (userRoleRef.current === 'host') {
               // Anti-Cheat: 1회당 획득 가능한 비정상적인 점수(100점 초과) 요청 차단
               if (payload.points > 100 || payload.points < -100) return;
               awardPoints(payload.targetId, payload.points, payload.isTeam);
            }
          })
          .on('broadcast', { event: 'CONFIG_CHANGE' }, () => {
            if (userRoleRef.current === 'participant') {
               setUserRole(null);
               setRoom(prev => ({ ...prev, status: 'lobby' }));
            }
          })
          .on('broadcast', { event: 'HOST_EVENT' }, ({ payload }) => {
            handleHostEvent(payload.action);
          })
          .subscribe();

        setChannel(roomChannel);
      } else {
        // Fallback to BroadcastChannel
        const bc = new BroadcastChannel('recreation_master_channel');
        setChannel(bc);

        bc.onmessage = (event) => {
          const { type, payload } = event.data;
          if (type === 'SYNC_STATE') {
            if (userRoleRef.current !== 'host') {
              setRoom(payload.room);
              setParticipants(payload.participants);

              if (userRoleRef.current === 'participant' && myPlayerIdRef.current) {
                const amIInList = payload.participants.some(p => p.id === myPlayerIdRef.current);
                if (!amIInList) {
                  const savedName = localStorage.getItem('rec_myPlayerName');
                  const savedTeamId = localStorage.getItem('rec_myTeamId');
                  if (savedName && savedTeamId) {
                    const teamObj = activeTeamsRef.current.find(t => t.id === savedTeamId) || activeTeamsRef.current[0];
                    const healPlayer = {
                      id: myPlayerIdRef.current,
                      name: savedName,
                      isBot: false,
                      teamId: teamObj?.id,
                      teamName: teamObj?.name,
                      teamColor: teamObj?.color,
                      score: 0,
                      lastInput: null
                    };
                    bc.postMessage({ type: 'PLAYER_JOIN', payload: healPlayer });
                  }
                }
              }
            }
          } else if (type === 'PLAYER_JOIN') {
            setParticipants(prev => {
              if (prev.some(p => p.id === payload.id)) return prev;
              const updated = [...prev, payload];
              if (userRoleRef.current === 'host') {
                bc.postMessage({ type: 'SYNC_STATE', payload: { room: roomRef.current, participants: updated } });
              }
              return updated;
            });
          } else if (type === 'REQUEST_SYNC') {
            if (userRoleRef.current === 'host') {
              bc.postMessage({ type: 'SYNC_STATE', payload: { room: roomRef.current, participants: participantsRef.current } });
            }
          } else if (type === 'PLAYER_SUBMIT') {
            // Anti-Cheat: 물리적 한계치 초과 패킷 무시
            if (payload.lastInput) {
              if (payload.lastInput.tapCount > 300) return;
              if (payload.lastInput.taps > 300) return;
              if (payload.lastInput.score > 200) return;
            }
            setParticipants(prev => prev.map(p => p.id === payload.id ? { ...p, lastInput: payload.lastInput } : p));
          } else if (type === 'SCORE_UPDATE') {
            if (userRoleRef.current === 'host') {
               if (payload.points > 100 || payload.points < -100) return;
               awardPoints(payload.targetId, payload.points, payload.isTeam);
            }
          } else if (type === 'CONFIG_CHANGE') {
            if (userRoleRef.current === 'participant') {
               setUserRole(null);
               setRoom(prev => ({ ...prev, status: 'lobby' }));
            }
          } else if (type === 'HOST_EVENT') {
            handleHostEvent(payload.action);
          }
        };
      }
    });

    return () => {
      if (channel) {
        if (isRealtime) channel.unsubscribe();
        else channel.close();
      }
    };
  }, []); // Note: channel state changes shouldn't trigger this again

  const handleHostEvent = (actionType) => {
    if (actionType === 'ADD_TIME') {
      window.dispatchEvent(new CustomEvent('ADD_TIME'));
    }
  };

  // Broadcast helper
  const broadcast = (type, payload) => {
    if (channel) {
      if (isRealtime) {
        channel.send({
          type: 'broadcast',
          event: type,
          payload: payload
        });
      } else {
        try {
          channel.postMessage({ type, payload });
        } catch (e) {}
      }
    }
  };

  // Change Theme
  const switchTheme = (newTheme) => {
    setTheme(newTheme);
  };

  // Moved activeTeams to the top to fix Temporal Dead Zone ReferenceError

  const updateTeamInfo = (teamId, newName, targetTotalScore) => {
    setRoom(prev => {
      const teamMembers = participantsRef.current.filter(p => p.teamId === teamId);
      const baseScore = teamMembers.reduce((sum, p) => sum + p.score, 0);
      const scoreOffset = targetTotalScore - baseScore;
      
      const updatedOverrides = {
        ...prev.teamOverrides,
        [teamId]: {
          name: newName,
          scoreOffset
        }
      };
      
      const newRoom = { ...prev, teamOverrides: updatedOverrides };
      broadcast('SYNC_STATE', { room: newRoom, participants: participantsRef.current });
      return newRoom;
    });
  };

  /**
   * 100인 테스트용 봇(가짜 유저)을 생성합니다.
   * 개발 및 시연 시 혼자서 다수의 참가자가 있는 환경을 시뮬레이션할 때 사용합니다.
   */
  const populateBots = (count = 100) => {
    const newBots = [];
    const teamCount = activeTeams.length || 1;
    const botsPerTeam = Math.ceil(count / teamCount);

    for (let i = 1; i <= count; i++) {
      const nameIndex = (i - 1) % BOT_NICKNAMES.length;
      // In team mode, group bots sequentially by team so teams are not scrambled
      const teamIndex = room.mode === 'team' ? Math.floor((i - 1) / botsPerTeam) % teamCount : 0;
      const teamObj = activeTeams[teamIndex] || activeTeams[0] || TEAM_PRESETS[0];
      newBots.push({
        id: `bot-${i}`,
        name: `${BOT_NICKNAMES[nameIndex]} #${i}`,
        isBot: true,
        teamId: teamObj?.id,
        teamName: teamObj?.name,
        teamColor: teamObj?.color,
        score: Math.floor(Math.random() * 50),
        lastInput: null
      });
    }

    // Add host/my player
    const myTeam = activeTeams.find(t => t.id === myTeamId) || activeTeams[0] || TEAM_PRESETS[0];
    const me = {
      id: myPlayerId,
      name: myPlayerName,
      isBot: false,
      teamId: myTeam?.id,
      teamName: myTeam?.name,
      teamColor: myTeam?.color,
      score: 100,
      lastInput: null
    };

    const combined = [me, ...newBots];
    setParticipants(combined);
    broadcast('SYNC_STATE', { room, participants: combined });
  };

  const clearBots = () => {
    setParticipants(prev => {
      const updated = prev.filter(p => !p.id.startsWith('bot_'));
      broadcast('SYNC_STATE', { room, participants: updated });
      return updated;
    });
  };

  const requestSync = () => {
    broadcast('REQUEST_SYNC', {});
  };

  // Join as real participant
  const joinAsPlayer = (name, selectedTeamId, forceId = null, joinRoomCode = null) => {
    const teamObj = activeTeams.find(t => t.id === selectedTeamId) || activeTeams[0] || TEAM_PRESETS[0];
    const newPlayer = {
      id: forceId || `player-${Date.now()}`,
      name,
      isBot: false,
      teamId: teamObj?.id,
      teamName: teamObj?.name,
      teamColor: teamObj?.color,
      score: 0,
      lastInput: null
    };

    setMyPlayerId(newPlayer.id);
    setMyPlayerName(name);
    setMyTeamId(newPlayer.teamId);

    // Anti-Cheat: Save to localStorage to prevent multi-boxing (multiple tabs joining)
    localStorage.setItem('rec_myPlayerId', newPlayer.id);
    localStorage.setItem('rec_myPlayerName', name);
    localStorage.setItem('rec_myTeamId', teamObj.id);
    if (joinRoomCode) {
      localStorage.setItem('rec_roomCode', joinRoomCode);
    } else if (room.code) {
      localStorage.setItem('rec_roomCode', room.code);
    }

    setParticipants(prev => {
      const filtered = prev.filter(p => p.id !== newPlayer.id);
      const updated = [...filtered, newPlayer];
      broadcast('PLAYER_JOIN', newPlayer);
      return updated;
    });
  };

  const rejoinFromSession = (currentUrlCode) => {
    const savedId = localStorage.getItem('rec_myPlayerId');
    const savedName = localStorage.getItem('rec_myPlayerName');
    const savedTeamId = localStorage.getItem('rec_myTeamId');
    const savedRoomCode = localStorage.getItem('rec_roomCode');

    if (currentUrlCode && savedRoomCode && currentUrlCode.toUpperCase() !== savedRoomCode.toUpperCase()) {
      localStorage.removeItem('rec_myPlayerId');
      localStorage.removeItem('rec_myPlayerName');
      localStorage.removeItem('rec_myTeamId');
      localStorage.removeItem('rec_roomCode');
      return false;
    }

    if (savedId && savedName) {
      joinAsPlayer(savedName, savedTeamId, savedId, currentUrlCode);
      setUserRole('participant');
      return true;
    }
    return false;
  };

  // Host creates a room
  const createRoom = () => {
    // Generate a random 6-character alphanumeric code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoom(prev => ({ ...prev, code: newCode, status: 'setup' }));
    setUserRole('host');
    setMyPlayerId('host-me');
    setMyPlayerName('사회자');
    soundFx.playSuccess();
    broadcast('SYNC_STATE', { room: { ...room, code: newCode }, participants });
  };

  // Host confirms setup and opens room
  const confirmRoomSetup = () => {
    const nextRoom = { ...room, status: 'lobby' };
    setRoom(nextRoom);
    soundFx.playSuccess();
    broadcast('SYNC_STATE', { room: nextRoom, participants });
  };
  // Safe robust state updater to prevent stale closures during intervals
  const updateRoomState = (updates) => {
    setRoom(prev => {
      const nextRoom = { ...prev, ...updates };
      broadcast('SYNC_STATE', { room: nextRoom, participants: participantsRef.current });
      return nextRoom;
    });
  };

  // Helper to remove lingering mini-game transient states from room
  const cleanTransientGameStates = (baseRoom) => {
    const cleaned = { ...baseRoom };
    const transientKeys = [
      'rpsState', 'rpsRound', 'rpsHostChoice', 'rpsSurvivors', 'rpsRoundOutcome',
      'nunchiState', 'nunchiNumber', 'nunchiEliminated', 'nunchiPassed',
      'bombState', 'bombTimeLeft', 'bombHolder',
      'quizCurrentWord', 'quizWinners', 'quizState',
      'mindsyncRevealed', 'mindsyncLocked', 'mindsyncTimeLeft',
      'oxQIndex', 'oxRevealed',
      'tugState', 'tugTimeLeft', 'tugRopePos',
      'sprintTimeLeft',
      'rouletteRotation', 'rouletteState', 'rouletteResult', 'rouletteSelectedTeam',
      'blockstackState', 'blockstackTimeLeft'
    ];
    transientKeys.forEach(k => delete cleaned[k]);
    return cleaned;
  };

  /**
   * 특정 미니 게임을 시작합니다.
   * 기존 게임의 잔여 데이터를 정리(clean)하고 게임 상태를 초기화합니다.
   */
  const previewGame = (gameId) => {
    const nextRoom = { ...room, activeGame: gameId, status: 'preview', countdown: null };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
  };

  const startGame = (gameId) => {
    let count = 5;
    const countRoom = { ...room, activeGame: gameId || room.activeGame, status: 'countdown', countdown: count };
    setRoom(countRoom);
    broadcast('SYNC_STATE', { room: countRoom, participants });
    soundFx.playTick(); // tick for 5
    
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        soundFx.playTick(); // tick for 2, 1
        setRoom(prev => {
          const next = { ...prev, countdown: count };
          broadcast('SYNC_STATE', { room: next, participants });
          return next;
        });
      } else {
        clearInterval(interval);
        soundFx.playSuccess(); // go!
        setRoom(prev => {
          const cleaned = cleanTransientGameStates(prev);
          const next = { ...cleaned, activeGame: gameId || prev.activeGame, status: 'playing', gameState: 'ready', countdown: null };
          
          // Reset inputs for all participants
          const resetParticipants = participants.map(p => ({ ...p, lastInput: null }));
          setParticipants(resetParticipants);
          
          broadcast('SYNC_STATE', { room: next, participants: resetParticipants });
          return next;
        });
      }
    }, 1000);
  };

  const startRound = () => {
    if (userRole !== 'host') return;
    const nextRoom = { ...room, gameState: 'playing' };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
    broadcast('HOST_EVENT', { action: 'START_ROUND' });
  };

  const endRound = () => {
    if (userRole !== 'host') return;
    const nextRoom = { ...room, gameState: 'finished' };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
    broadcast('HOST_EVENT', { action: 'END_ROUND' });
  };

  const returnToLobby = () => {
    const cleaned = cleanTransientGameStates(room);
    const nextRoom = { ...cleaned, activeGame: null, status: 'lobby', gameState: 'ready' };
    setRoom(nextRoom);
    const resetParticipants = participants.map(p => ({ ...p, lastInput: null }));
    setParticipants(resetParticipants);
    broadcast('SYNC_STATE', { room: nextRoom, participants: resetParticipants });
  };

  // Host Control Actions
  const toggleFreeze = () => {
    const nextRoom = { ...room, isFrozen: !room.isFrozen };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
  };

  const triggerEvent = (message) => {
    const nextRoom = { ...room, activeEvent: message };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
    
    // Auto-clear event after 10s
    if (message) {
      setTimeout(() => {
        setRoom(prev => {
          const cleared = { ...prev, activeEvent: null };
          broadcast('SYNC_STATE', { room: cleared, participants });
          return cleared;
        });
      }, 10000);
    }
  };

  const setGlobalAnnouncement = (message) => {
    const nextRoom = { ...room, announcement: message };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
  };

  const triggerSpotlight = () => {
    if (participants.length === 0) return;
    const randomPlayer = participants[Math.floor(Math.random() * participants.length)];
    const nextRoom = { ...room, spotlightPlayer: randomPlayer };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
    
    // Auto-clear after 7s
    setTimeout(() => {
      setRoom(prev => {
        const cleared = { ...prev, spotlightPlayer: null };
        broadcast('SYNC_STATE', { room: cleared, participants });
        return cleared;
      });
    }, 7000);
  };

  const destroyRoom = () => {
    broadcast('DESTROY_ROOM', {});
    updateRoomState({ status: 'destroyed' });
    setParticipants([]);
    setRoom({
      mode: 'solo',
      status: 'ready',
      teamCount: 4,
      round: 1,
      targetScore: 1000
    });
  };

  const kickParticipant = (playerId) => {
    setParticipants(prev => {
      const updated = prev.filter(p => p.id !== playerId);
      broadcast('SYNC_STATE', { room, participants: updated });
      return updated;
    });
  };

  const resetAllScores = () => {
    setParticipants(prev => {
      const updated = prev.map(p => ({ ...p, score: 0 }));
      broadcast('SYNC_STATE', { room: roomRef.current, participants: updated });
      return updated;
    });
  };

  const shuffleTeams = () => {
    if (room.mode !== 'team') return;
    setParticipants(prev => {
      const updated = [...prev].map((p, i) => {
        if (p.id === myPlayerId) return p; // Don't shuffle host
        const teamObj = activeTeams[i % Math.max(1, activeTeams.length)] || TEAM_PRESETS[0];
        return {
          ...p,
          teamId: teamObj?.id,
          teamName: teamObj?.name,
          teamColor: teamObj?.color
        };
      });
      // Randomize array order
      updated.sort(() => Math.random() - 0.5);
      broadcast('SYNC_STATE', { room, participants: updated });
      return updated;
    });
  };

  const addGlobalTime = () => {
    // Broadcast as an event, but also trigger locally
    window.dispatchEvent(new CustomEvent('ADD_TIME'));
    broadcast('HOST_EVENT', { action: 'ADD_TIME' });
  };

  // Record player input
  const submitPlayerInput = (playerId, gameData) => {
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          return { ...p, lastInput: gameData };
        }
        return p;
      });
      participantsRef.current = updated;
      // Participant broadcasts input to everyone (including host)
      broadcast('PLAYER_SUBMIT', { id: playerId, lastInput: gameData });
      return updated;
    });
  };

  // Batch clear all participants' lastInput in a single atomic update & broadcast
  const resetAllPlayerInputs = () => {
    setParticipants(prev => {
      const resetList = prev.map(p => ({ ...p, lastInput: null }));
      participantsRef.current = resetList;
      setTimeout(() => {
        broadcast('SYNC_STATE', { room: roomRef.current, participants: resetList });
      }, 0);
      return resetList;
    });
  };

  /**
   * 참가자 또는 특정 팀에게 점수를 부여합니다.
   * 폭죽 효과(confetti)를 발생시킵니다.
   */
  const awardPoints = (playerIdOrTeamId, points, isTeam = false) => {
    // If we are participant, send score update request to host
    if (userRoleRef.current === 'participant') {
      broadcast('SCORE_UPDATE', { targetId: playerIdOrTeamId, points, isTeam });
      return;
    }

    // Host updates and syncs
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (isTeam && p.teamId === playerIdOrTeamId) {
          return { ...p, score: p.score + points };
        } else if (!isTeam && p.id === playerIdOrTeamId) {
          return { ...p, score: p.score + points };
        }
        return p;
      });
      
      // Delay broadcast slightly to ensure it happens outside the render cycle if batched
      setTimeout(() => {
        broadcast('SYNC_STATE', { room: roomRef.current, participants: updated });
      }, 0);
      
      return updated;
    });
    // Trigger celebration fireworks!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Batch award points to multiple participants or teams in a single state & broadcast cycle
  const awardBatchPoints = (awards) => {
    if (!awards || awards.length === 0) return;
    if (userRoleRef.current === 'participant') {
      awards.forEach(a => broadcast('SCORE_UPDATE', a));
      return;
    }

    setParticipants(prev => {
      let updated = [...prev];
      awards.forEach(award => {
        const { targetId, points, isTeam } = award;
        updated = updated.map(p => {
          if (isTeam && p.teamId === targetId) {
            return { ...p, score: p.score + points };
          } else if (!isTeam && p.id === targetId) {
            return { ...p, score: p.score + points };
          }
          return p;
        });
      });

      setTimeout(() => {
        broadcast('SYNC_STATE', { room: roomRef.current, participants: updated });
      }, 0);

      return updated;
    });

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  // Bot input simulator for live mini games
  const simulateBotGameInputs = (gameType, targetValue) => {
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (!p.isBot) return p;

        let botInput = null;
        if (gameType === 'stopwatch') {
          // targetValue = 10.000s
          // Bot error standard deviation around targetValue
          const diff = (Math.random() - 0.48) * 1.8; // -0.8s to +0.8s diff
          const stopTime = Math.max(0.1, +(targetValue + diff).toFixed(3));
          const diffAbs = Math.abs(stopTime - targetValue);
          botInput = { stopTime, diffAbs };
        } else if (gameType === 'blockstack') {
          const height = Math.floor(Math.random() * 25) + 5;
          botInput = { towerHeight: height };
        } else if (gameType === 'oxquiz') {
          const choice = Math.random() > 0.48 ? 'O' : 'X';
          botInput = { choice };
        } else if (gameType === 'sprint') {
          const tapCount = Math.floor(Math.random() * 75) + 30; // 30-105 taps
          botInput = { tapCount };
        } else if (gameType === 'mindsync') {
          const choiceNum = Math.floor(Math.random() * 95) + 5; // 5-100
          botInput = { choiceNum };
        } else if (gameType === 'tug') {
          const currentTaps = p.lastInput?.taps || 0;
          const added = Math.floor(Math.random() * 8) + 2;
          botInput = { taps: currentTaps + added };
        }

        return { ...p, lastInput: botInput };
      });
      broadcast('SYNC_STATE', { room, participants: updated });
      return updated;
    });
  };

  return (
    <GameContext.Provider
      value={{
        theme,
        switchTheme,
        userRole,
        setUserRole,
        room,
        setRoom,
        activeTeams,
        participants,
        myPlayerId,
        myPlayerName,
        myTeamId,
        populateBots,
        clearBots, destroyRoom,
        createRoom,
        confirmRoomSetup,
        requestSync,
        joinAsPlayer,
        rejoinFromSession,
        previewGame,
        startGame,
        updateRoomState,
        startRound,
        endRound,
        returnToLobby,
        submitPlayerInput,
        resetAllPlayerInputs,
        awardPoints,
        awardBatchPoints,
        simulateBotGameInputs,
        toggleFreeze,
        triggerEvent,
        setGlobalAnnouncement,
        triggerSpotlight,
        kickParticipant,
        resetAllScores,
        shuffleTeams,
        addGlobalTime,
        updateTeamInfo,
        broadcast
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
