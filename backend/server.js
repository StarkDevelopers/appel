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

// Project Modules
const initializeSession = require('./middlewares/session-management/session-initialize');
const loginSequence = require('./middlewares/session-management/login-sequence');
const initializeCSRFToken = require('./middlewares/csrf-management/csrf-token');
const {
  serveEJSTemplates,
  frontendResources,
  staticResourcesFromUtility
} = require('./middlewares/static-resource-management/static-resource');
const DBConnection = require('./connection-pool/dbConnection');
const checkForAuthenticatedUser = require('./middlewares/session-management/authenticated-user');

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
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(require('cookie-parser')());

// Initialize Multer for parsing multi-part form data
const fileUpload = require('./middlewares/multer/multer')();
app.fileUpload = fileUpload;

// Initialize Socket
const io = require('socket.io')(http);

// Initialize Connection Pool
const SocketPool = require('./socket-pool/socket-pool');
SocketPool.io = io;

// API Routes
const { initRoutes } = require('./routes/routes');
const { authenticateRoutes } = require('./routes/authenticateRoutes');

/**
 * Initializes express-session with redis store/memory store based on CONTEXT
 * Initialized passport and passport-session
 * As well defines passport local-strategy for login
 */
initializeSession(app);

/**
 * Sets CSRF token in responses
 * Checks CSRF token in incoming requests
 */
initializeCSRFToken(app);

/**
 * Logs in user with passport local-strategy
 * Redirects to / or requested page
 */
loginSequence(app);

/**
 * Initialize API Routes
 */
initRoutes(app);

/**
 * Authenticate Routes
 */
authenticateRoutes(app);

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

(async () => {
  try {
    /**
     * Initialize Database Connection
     */
    await DBConnection.getConnection();

    /**
     * Starting http server on specified port default 8080
     */
    http.listen(process.env.PORT, () => {
      console.log(`listening on ${process.env.PORT}`);
    });
  } catch (exception) {
    console.error(`Exception occurred while connecting to Database. Failed to start server.: ${exception.message}\n${exception.stack}`);
  }
})();
