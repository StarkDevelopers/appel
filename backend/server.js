// Environment Context
const CONTEXT = process.env.NODE_ENV || 'DEVELOPMENT';
console.log('PROGRAM CONTEXT', CONTEXT);

// Built-in modules
const HTTP = require('http');

// Initialize Environment Variables
require('dotenv').config();

// 3rd party modules
const express = require('express');
const bodyParser = require('body-parser');

// Initializing express app
const app = express();
const http = HTTP.createServer(app);

// Only for development context enable CORS
if (CONTEXT === 'DEVELOPMENT') {
  const cors = require('cors');
  // Enable Cross-Origin Resource Sharing
  app.use(cors());
}

// Enable Parsing Body of incoming request
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize Socket
const io = require('socket.io')(http);

// Initialize Connection Pool
const ConnectionPool = require('./connection-pool/ConnectionPool');
ConnectionPool.io = io;

// Project modules
const {
  serveEJSTemplates,
  frontendResources,
  staticResourcesFromUtility
} = require('./middlewares/static-resource-management/static-resource');

// API Routes
const { initRoutes } = require('./routes/routes');

/**
 * Initialize API Routes
 */
initRoutes(app);

/**
 * Seriveg EJS templates from views/ directory
 */
serveEJSTemplates(app);

/**
 * Login not required to access these resources
 */
staticResourcesFromUtility(app, __dirname);

/**
 * Login will be required to access these resources
 */
frontendResources(app, __dirname);

/**
 * Uncaught Exception
 * For more information: https://nodejs.org/api/process.html#process_event_uncaughtexception
 */
process.on('uncaughtException', (error) => {
  /**
   * Try your execution does not enter into this piece of code
   */
  console.error('Uncaught Exception Caught \n', error);
  // Handle error here
  process.exit(1);
});

/**
* Unhandled Rejection
* For more information: https://nodejs.org/api/process.html#process_event_unhandledrejection
*/
process.on('unhandledRejection', (reason, p) => {
  /**
   * Try your execution does not enter into this piece of code
   */
  console.log('Unhandled Rejection at:', p, ' with reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

/**
* Exit Process
* For more information: https://nodejs.org/api/process.html#process_event_exit
*/
process.on('exit', (code) => {
  console.log(`Process is about to exit with code: ${code}`);
});

/**
 * Starting http server on specified port default 8080
 */
http.listen(process.env.PORT, () => {
  console.log(`listening on ${process.env.PORT}`);
});
