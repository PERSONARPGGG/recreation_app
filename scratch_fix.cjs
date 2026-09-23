const fs = require('fs');
let content = fs.readFileSync('src/components/Landing.jsx', 'utf8');

const target = `const handleHostClick = () => {
    setView('host_loading');`;
    
const replacement = `const handleHostClick = () => {
    const pwd = window.prompt('사회자 방을 만들려면 비밀번호를 입력하세요.');
    if (pwd !== '7501') {
      alert('비밀번호가 틀렸습니다.');
      return;
    }
    setView('host_loading');`;

// Also match different line endings
content = content.replace(/const handleHostClick = \(\) => \{\r?\n\s*setView\('host_loading'\);/, replacement);

fs.writeFileSync('src/components/Landing.jsx', content, 'utf8');
console.log('Done');
