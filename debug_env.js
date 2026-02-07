const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('DB_HOST:', process.env.DB_HOST);
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQL_URL:', process.env.MYSQL_URL);
console.log('DB_NAME:', process.env.DB_NAME);
