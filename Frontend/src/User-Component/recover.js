const fs = require('fs');
const path = require('path');

const mapPath = 'C:/Users/HP/Downloads/Goyee-final/Goyee-final/Goyee-final/Goyee/goyee/Frontend/build/static/js/main.af26f1b8.js.map';
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const index = mapData.sources.findIndex(s => s.includes('Navbar.js'));
if (index !== -1) {
    const content = mapData.sourcesContent[index];
    fs.writeFileSync('C:/Users/HP/Downloads/Goyee-final/Goyee-final/Goyee-final/Goyee/goyee/Frontend/src/User-Component/Navbar.js', content, 'utf8');
    console.log('Successfully recovered Navbar.js!');
} else {
    console.log('Navbar.js not found in source map.');
}
