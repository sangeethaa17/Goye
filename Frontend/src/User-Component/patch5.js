const fs = require('fs');
let content = fs.readFileSync('Navbar.js', 'utf8');
content = content.replace(/\(PRO dY``\)/g, '(PRO 👑)');
fs.writeFileSync('Navbar.js', content, 'utf8');
console.log('Mobile PRO fixed');
