const fs = require('fs');

let code = fs.readFileSync('src/components/Landing.jsx', 'utf8');
const lines = code.split('\n');

// Find the second React.useEffect (the one for rejoinFromSession)
let effectIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('React.useEffect(() => {') && lines[i+1].includes('// Attempt to auto-rejoin to prevent team switching exploit')) {
    effectIdx = i;
    break;
  }
}

if (effectIdx !== -1) {
  lines.splice(effectIdx + 1, 4,
    '    const params = new URLSearchParams(window.location.search);',
    '    const codeParam = params.get(\'code\');',
    '',
    '    // Attempt to auto-rejoin to prevent team switching exploit',
    '    if (rejoinFromSession(codeParam)) {',
    '      return;',
    '    }'
  );
  
  // also remove the old const params ... below it
  for (let i = effectIdx + 8; i < effectIdx + 12; i++) {
     if (lines[i] && lines[i].includes('const params = new URLSearchParams')) {
        lines.splice(i, 2); // remove params and codeParam lines
        break;
     }
  }

  const finalCode = lines.join('\n');
  fs.writeFileSync('src/components/Landing.jsx', finalCode, 'utf8');
  console.log('Successfully patched Landing.jsx');
} else {
  console.log('Could not find target lines');
}
