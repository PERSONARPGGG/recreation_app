import React from 'react';
import { StopwatchChallenge } from './StopwatchChallenge';
import { BlockStacker } from './BlockStacker';
import { SurvivalOxQuiz } from './SurvivalOxQuiz';
import { RapidTapSprint } from './RapidTapSprint';
import { MindSyncBalance } from './MindSyncBalance';
import { MafiaRefereeModule } from '../mafia/MafiaRefereeModule';

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
