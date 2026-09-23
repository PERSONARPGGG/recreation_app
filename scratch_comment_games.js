import fs from 'fs';
import path from 'path';

const dirs = ['src/components/games', 'src/components/mafia'];

dirs.forEach(dir => {
  fs.readdirSync(dir).filter(f => f.endsWith('.jsx')).forEach(f => {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('/**')) {
      const name = f.replace('.jsx', '');
      const header = `/**\n * ${name} 컴포넌트\n * 레크레이션 참여자들이 플레이하는 개별 게임 로직과 UI가 포함되어 있습니다.\n * Host(사회자) 화면과 Participant(참가자) 모바일 화면을 조건부로 렌더링합니다.\n */\n`;
      content = content.replace(/(export const \w+ = \(\) => \{)/, header + '$1');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Commented: ' + filePath);
    }
  });
});
