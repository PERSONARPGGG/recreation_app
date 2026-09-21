import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, applyTheme } from '../utils/theme';
import { TEAM_PRESETS, BOT_NICKNAMES } from '../utils/constants';
import confetti from 'canvas-confetti';
import { soundFx } from '../utils/sound';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.MALE);
  const [userRole, setUserRole] = useState(null); // null, 'host', or 'participant'
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

  useEffect(() => {
    roomRef.current = room;
    participantsRef.current = participants;
    userRoleRef.current = userRole;
    myPlayerIdRef.current = myPlayerId;
  }, [room, participants, userRole, myPlayerId]);

  // Sync channel (Supabase or BroadcastChannel fallback)
  const [channel, setChannel] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false);

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
            setParticipants(prev => prev.map(p => p.id === payload.id ? { ...p, lastInput: payload.lastInput } : p));
          })
          .on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
            if (userRoleRef.current === 'host') {
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
            setParticipants(prev => prev.map(p => p.id === payload.id ? { ...p, lastInput: payload.lastInput } : p));
          } else if (type === 'SCORE_UPDATE') {
            if (userRoleRef.current === 'host') {
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

  // Get active teams based on count
  const activeTeams = TEAM_PRESETS.slice(0, room.teamCount);

  // 100-Bot Simulation Engine
  const populateBots = (count = 100) => {
    const newBots = [];
    for (let i = 1; i <= count; i++) {
      const nameIndex = (i - 1) % BOT_NICKNAMES.length;
      const teamObj = activeTeams[(i - 1) % activeTeams.length];
      newBots.push({
        id: `bot-${i}`,
        name: `${BOT_NICKNAMES[nameIndex]} #${i}`,
        isBot: true,
        teamId: room.mode === 'team' ? teamObj.id : null,
        teamName: room.mode === 'team' ? teamObj.name : '개인',
        teamColor: room.mode === 'team' ? teamObj.color : '#00f3ff',
        score: Math.floor(Math.random() * 50),
        lastInput: null
      });
    }

    // Add host/my player
    const myTeam = activeTeams[0];
    const me = {
      id: myPlayerId,
      name: myPlayerName,
      isBot: false,
      teamId: room.mode === 'team' ? myTeam.id : null,
      teamName: room.mode === 'team' ? myTeam.name : '개인',
      teamColor: room.mode === 'team' ? myTeam.color : '#00f3ff',
      score: 100,
      lastInput: null
    };

    const combined = [me, ...newBots];
    setParticipants(combined);
    broadcast('SYNC_STATE', { room, participants: combined });
  };

  const clearBots = () => {
    setParticipants([]);
    broadcast('SYNC_STATE', { room, participants: [] });
  };

  const requestSync = () => {
    broadcast('REQUEST_SYNC', {});
  };

  // Join as real participant
  const joinAsPlayer = (name, selectedTeamId, forceId = null) => {
    const teamObj = activeTeams.find(t => t.id === selectedTeamId) || activeTeams[0];
    const newPlayer = {
      id: forceId || `player-${Date.now()}`,
      name,
      isBot: false,
      teamId: room.mode === 'team' ? teamObj.id : null,
      teamName: room.mode === 'team' ? teamObj.name : '개인',
      teamColor: room.mode === 'team' ? teamObj.color : '#00f3ff',
      score: 0,
      lastInput: null
    };

    setMyPlayerId(newPlayer.id);
    setMyPlayerName(name);
    setMyTeamId(newPlayer.teamId);

    // Save to session to prevent team switching on refresh
    sessionStorage.setItem('rec_myPlayerId', newPlayer.id);
    sessionStorage.setItem('rec_myPlayerName', name);
    sessionStorage.setItem('rec_myTeamId', teamObj.id);

    setParticipants(prev => {
      const filtered = prev.filter(p => p.id !== newPlayer.id);
      const updated = [...filtered, newPlayer];
      broadcast('PLAYER_JOIN', newPlayer);
      return updated;
    });
  };

  const rejoinFromSession = () => {
    const savedId = sessionStorage.getItem('rec_myPlayerId');
    const savedName = sessionStorage.getItem('rec_myPlayerName');
    const savedTeamId = sessionStorage.getItem('rec_myTeamId');

    if (savedId && savedName) {
      joinAsPlayer(savedName, savedTeamId, savedId);
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
      'rouletteRotation', 'rouletteState', 'rouletteResult', 'rouletteSelectedTeam'
    ];
    transientKeys.forEach(k => delete cleaned[k]);
    return cleaned;
  };

  // Update Game State
  const startGame = (gameId) => {
    const cleaned = cleanTransientGameStates(room);
    const nextRoom = { ...cleaned, activeGame: gameId, status: 'playing', gameState: 'ready' };
    setRoom(nextRoom);
    // Reset inputs for all participants
    const resetParticipants = participants.map(p => ({ ...p, lastInput: null }));
    setParticipants(resetParticipants);
    broadcast('SYNC_STATE', { room: nextRoom, participants: resetParticipants });
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

  const kickParticipant = (playerId) => {
    setParticipants(prev => {
      const updated = prev.filter(p => p.id !== playerId);
      broadcast('SYNC_STATE', { room, participants: updated });
      return updated;
    });
  };

  const shuffleTeams = () => {
    if (room.mode !== 'team') return;
    setParticipants(prev => {
      const updated = [...prev].map((p, i) => {
        if (p.id === myPlayerId) return p; // Don't shuffle host
        const teamObj = activeTeams[i % activeTeams.length];
        return {
          ...p,
          teamId: teamObj.id,
          teamName: teamObj.name,
          teamColor: teamObj.color
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

  // Add points to participant or team
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
        clearBots,
        createRoom,
        confirmRoomSetup,
        requestSync,
        joinAsPlayer,
        rejoinFromSession,
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
        shuffleTeams,
        addGlobalTime
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
