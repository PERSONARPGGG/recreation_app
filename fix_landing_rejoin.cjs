const fs = require('fs');
let code = fs.readFileSync('src/components/Landing.jsx', 'utf8');

code = code.replace(
  '  React.useEffect(() => {\n    // Attempt to auto-rejoin to prevent team switching exploit\n    if (rejoinFromSession()) {\n      return;\n    }\n\n    const params = new URLSearchParams(window.location.search);\n    const codeParam = params.get(\'code\');\n    if (codeParam) {',
  '  React.useEffect(() => {\n    const params = new URLSearchParams(window.location.search);\n    const codeParam = params.get(\'code\');\n\n    // Attempt to auto-rejoin to prevent team switching exploit\n    if (rejoinFromSession(codeParam)) {\n      return;\n    }\n\n    if (codeParam) {'
);

fs.writeFileSync('src/components/Landing.jsx', code, 'utf8');
console.log('Fixed Landing.jsx');
