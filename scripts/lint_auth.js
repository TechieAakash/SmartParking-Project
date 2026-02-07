const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '../frontend/js/auth.js');
const code = fs.readFileSync(filePath, 'utf8');

try {
    new vm.Script(code);
    console.log('auth.js is valid');
} catch (err) {
    console.error('Syntax Error in auth.js:', err.message);
}
