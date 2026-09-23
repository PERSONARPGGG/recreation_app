export const generateReports = (room, participants, activeTeams) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
  
  // 1. Generate CSV (Excel)
  let csvContent = "PlayerID,Name,Team,Score,IsBot\n";
  sortedParticipants.forEach(p => {
    csvContent += `"${p.id}","${p.name}","${p.teamName || '개인'}","${p.score}","${p.isBot ? 'Yes' : 'No'}"\n`;
  });
  
  const csvBlob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const csvUrl = URL.createObjectURL(csvBlob);
  const csvLink = document.createElement("a");
  csvLink.setAttribute("href", csvUrl);
  csvLink.setAttribute("download", `recreation_report_${dateStr}.csv`);
  document.body.appendChild(csvLink);
  csvLink.click();
  document.body.removeChild(csvLink);

  // 2. Generate TXT (Markdown format for AI)
  let txtContent = `# 레크레이션 마스터 최종 결과 리포트\n\n`;
  txtContent += `## 📊 행사 요약\n`;
  txtContent += `- 행사일: ${dateStr}\n`;
  txtContent += `- 게임 모드: ${room.mode === 'team' ? '팀전' : '개인전'}\n`;
  txtContent += `- 총 참가자 수: ${participants.length}명\n\n`;

  if (room.mode === 'team') {
    txtContent += `## 🏆 팀별 최종 순위\n`;
    const teamScores = activeTeams.map(t => {
      const members = participants.filter(p => p.teamId === t.id);
      const totalScore = members.reduce((sum, p) => sum + p.score, 0);
      return { name: t.name, score: totalScore, count: members.length };
    }).sort((a, b) => b.score - a.score);

    teamScores.forEach((t, i) => {
      txtContent += `${i + 1}위: ${t.name} (총 ${t.score}점, ${t.count}명)\n`;
    });
    txtContent += `\n`;
  }

  txtContent += `## 🏅 개인별 랭킹 (Top 10)\n`;
  const top10 = sortedParticipants.slice(0, 10);
  top10.forEach((p, i) => {
    txtContent += `${i + 1}위: ${p.name} (${p.teamName || '개인'}) - ${p.score}점\n`;
  });
  
  txtContent += `\n## 📝 AI 분석 요청용 프롬프트 데이터\n`;
  txtContent += `[RAW DATA]\n`;
  sortedParticipants.forEach(p => {
    txtContent += `이름:${p.name}, 팀:${p.teamName || '개인'}, 점수:${p.score}\n`;
  });

  const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
  const txtUrl = URL.createObjectURL(txtBlob);
  const txtLink = document.createElement("a");
  txtLink.setAttribute("href", txtUrl);
  txtLink.setAttribute("download", `recreation_ai_summary_${dateStr}.txt`);
  document.body.appendChild(txtLink);
  txtLink.click();
  document.body.removeChild(txtLink);
};
