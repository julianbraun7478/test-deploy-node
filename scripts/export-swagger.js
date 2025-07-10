// scripts/export-swagger.js
const fs = require('fs');
const path = require('path');
const swaggerDocs = require('../config/swagger');

const outputPath = path.join(__dirname, '../public/swagger.json');

fs.writeFileSync(outputPath, JSON.stringify(swaggerDocs, null, 2));
console.log('✅ Swagger JSON exported to public/swagger.json');
