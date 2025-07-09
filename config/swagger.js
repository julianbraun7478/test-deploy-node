const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Louis Application Backend API',
      version: '1.0.0',
      description: 'API documentation for the Louis application backend',
    },
    servers: [
      {
        url: process.env.BASE_URL,
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
module.exports = swaggerDocs;