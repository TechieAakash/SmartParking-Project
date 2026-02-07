const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '../frontend/profile-driver.html');
const content = fs.readFileSync(filePath, 'utf8');

const scriptMatches = content.match(/<script>([\s\S]*?)<\/script>/g);
if (!scriptMatches) {
    console.log('No inline scripts found.');
    process.exit(0);
}

scriptMatches.forEach((script, index) => {
    const code = script.replace(/<script>|<\/script>/g, '');
    try {
        new vm.Script(code, { filename: `script_${index}.js` });
        console.log(`Script ${index} is valid.`);
    } catch (err) {
        console.error(`--- Syntax Error in script ${index} ---`);
        console.error(err.message);
        console.error(err.stack);
    }
});
