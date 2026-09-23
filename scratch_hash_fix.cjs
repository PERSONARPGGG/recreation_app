const fs = require('fs');
let content = fs.readFileSync('src/components/Landing.jsx', 'utf8');

const targetRegex = /const handleHostClick = \(\) => \{\r?\n\s*const pwd = window\.prompt\('사회자 방을 만들려면 비밀번호를 입력하세요\.'\);\r?\n\s*if \(pwd !== '7501'\) \{\r?\n\s*alert\('비밀번호가 틀렸습니다\.'\);\r?\n\s*return;\r?\n\s*\}\r?\n\s*setView\('host_loading'\);/;

const replacement = `const handleHostClick = async () => {
    const pwd = window.prompt('사회자 방을 만들려면 비밀번호를 입력하세요.');
    if (!pwd) return;
    
    // 비밀번호 해싱 처리 (클라이언트에 원문 노출 방지)
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (hashHex !== 'a5dae85d4d8658bd850ff6fe88244039da669084d93d064521d36fbb38f04e0f') {
      alert('비밀번호가 틀렸습니다.');
      return;
    }
    
    setView('host_loading');`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/components/Landing.jsx', content, 'utf8');
console.log('Hash replaced successfully');
