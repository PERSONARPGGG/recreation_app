import React from 'react';
import { StopwatchChallenge } from './StopwatchChallenge';
import { BlockStacker } from './BlockStacker';
import { SurvivalOxQuiz } from './SurvivalOxQuiz';
import { RapidTapSprint } from './RapidTapSprint';
import { MindSyncBalance } from './MindSyncBalance';
import { MafiaRefereeModule } from '../mafia/MafiaRefereeModule';
import { BombPass } from './BombPass';
import { InitialWordQuiz } from './InitialWordQuiz';
import { LuckyRoulette } from './LuckyRoulette';
import { RockPaperScissors } from './RockPaperScissors';
import { TugOfWar } from './TugOfWar';
import { NunchiGame } from './NunchiGame';

export const GameRenderer = ({ activeGame }) => {
  switch (activeGame) {
    case 'stopwatch':
      return <StopwatchChallenge />;
    case 'blockstack':
      return <BlockStacker />;
    case 'oxquiz':
      return <SurvivalOxQuiz />;
    case 'sprint':
      return <RapidTapSprint />;
    case 'mindsync':
      return <MindSyncBalance />;
    case 'bombpass':
      return <BombPass />;
    case 'initialword':
      return <InitialWordQuiz />;
    case 'luckyroulette':
      return <LuckyRoulette />;
    case 'rockpaperscissors':
      return <RockPaperScissors />;
    case 'tugofwar':
      return <TugOfWar />;
    case 'nunchi':
      return <NunchiGame />;
    case 'mafia':
      return <MafiaRefereeModule />;
    default:
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
          선택된 게임을 찾을 수 없습니다.
        </div>
      );
  }
};
