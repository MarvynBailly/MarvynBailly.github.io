// Convert JavaScript object to JSON
const fs = require('fs');

// Read the JavaScript output
const jsContent = fs.readFileSync('presets/cursive-m-output3.txt', 'utf8');

// Extract the array
const arrayStr = jsContent.replace('this.DEFAULT_OBSTACLES = ', '').replace(/;$/, '').trim();

// Evaluate the JavaScript array
const obstacles = eval(arrayStr);

// Create proper JSON
const json = {
    name: 'Cursive M',
    description: 'Flowing cursive M with smooth curves',
    obstacles: obstacles
};

// Write proper JSON
fs.writeFileSync('presets/cursive-m.json', JSON.stringify(json, null, 2), 'utf8');

console.log('Created cursive-m.json with', obstacles.length, 'triangles');
