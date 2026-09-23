const fs = require('fs');
let code = fs.readFileSync('src/components/Landing.jsx', 'utf8');
code = code.replace(/버전: v1\.6\.3 \(강력한 안티치트 꼼수 방지 시스템 및 테마 복구\)/g, '버전: v1.6.4 (엑셀 및 AI 분석용 텍스트 결과 리포트 추출 기능 추가)');
fs.writeFileSync('src/components/Landing.jsx', code, 'utf8');
console.log('Version updated in Landing.jsx');
