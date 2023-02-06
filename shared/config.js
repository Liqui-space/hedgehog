const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envDir = path.join(__dirname, '../', '.env');
module.exports = dotenv.parse(fs.readFileSync(envDir));