import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEMES, applyTheme } from '../utils/theme';
import { TEAM_PRESETS, BOT_NICKNAMES } from '../utils/constants';
import confetti from 'canvas-confetti';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.MALE);
  const [userRole, setUserRole] = useState('host'); // 'host' or 'participant'
  const [room, setRoom] = useState({
    code: 'REC-100',
    title: '🎉 100인 대격돌 명랑 레크레이션',
    mode: 'team', // 'solo' or 'team'
    teamCount: 4,
    status: 'lobby', // 'lobby', 'playing', 'result'
    activeGame: null,
  });

  const [participants, setParticipants] = useState([]);
  const [myPlayerId, setMyPlayerId] = useState('player-me');
  const [myPlayerName, setMyPlayerName] = useState('레크 마스터');
  const [myTeamId, setMyTeamId] = useState('team-1');

  // Broadcast channel for multi-tab sync
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Setup broadcast channel for real multi-tab simulation
  useEffect(() => {
    const bc = new BroadcastChannel('recreation_master_channel');
    setChannel(bc);

    bc.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'SYNC_STATE') {
        setRoom(payload.room);
        setParticipants(payload.participants);
      } else if (type === 'PLAYER_JOIN') {
        setParticipants(prev => {
          if (prev.some(p => p.id === payload.id)) return prev;
          return [...prev, payload];
        });
      } else if (type === 'PLAYER_SUBMIT') {
        setParticipants(prev => prev.map(p => p.id === payload.id ? { ...p, ...payload } : p));
      }
    };

    return () => {
      bc.close();
    };
  }, []);

  // Broadcast helper
  const broadcast = (type, payload) => {
    if (channel) {
      try {
        channel.postMessage({ type, payload });
      } catch (e) {}
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

  // Join as real participant
  const joinAsPlayer = (name, selectedTeamId) => {
    const teamObj = activeTeams.find(t => t.id === selectedTeamId) || activeTeams[0];
    const newPlayer = {
      id: `player-${Date.now()}`,
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

    setParticipants(prev => {
      const filtered = prev.filter(p => p.id !== newPlayer.id);
      const updated = [...filtered, newPlayer];
      broadcast('SYNC_STATE', { room, participants: updated });
      return updated;
    });
  };

  // Update Game State
  const startGame = (gameId) => {
    const nextRoom = { ...room, activeGame: gameId, status: 'playing' };
    setRoom(nextRoom);
    // Reset inputs
    const resetParticipants = participants.map(p => ({ ...p, lastInput: null }));
    setParticipants(resetParticipants);
    broadcast('SYNC_STATE', { room: nextRoom, participants: resetParticipants });
  };

  const returnToLobby = () => {
    const nextRoom = { ...room, activeGame: null, status: 'lobby' };
    setRoom(nextRoom);
    broadcast('SYNC_STATE', { room: nextRoom, participants });
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
      broadcast('SYNC_STATE', { room, participants: updated });
      return updated;
    });
  };

  // Add points to participant or team
  const awardPoints = (playerIdOrTeamId, points, isTeam = false) => {
    setParticipants(prev => {
      const updated = prev.map(p => {
        if (isTeam && p.teamId === playerIdOrTeamId) {
          return { ...p, score: p.score + points };
        } else if (!isTeam && p.id === playerIdOrTeamId) {
          return { ...p, score: p.score + points };
        }
        return p;
      });
      broadcast('SYNC_STATE', { room, participants: updated });
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
        joinAsPlayer,
        startGame,
        returnToLobby,
        submitPlayerInput,
        awardPoints,
        simulateBotGameInputs
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
