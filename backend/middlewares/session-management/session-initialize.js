// Environment Context
const CONTEXT = process.env.NODE_ENV || 'DEVELOPMENT';

const session = require('express-session');
const passport = require('passport');

const passportGoogleStrategy = require('../passport/passport-google');

function initializeSession (app) {
    const sessionStore = getStore();

    app.use(session({
        name: 'stark.appel.session',
        secret: 'SECRET_KEY_HERE',
        store: sessionStore,
        cookie: {
            /**
             * Session will be expired after maxAge specified.
             * If rolling is true then maxAge will be counted since session was idle.
             * It will remove the session from store(sessionStore) after maxAge.
             */
            maxAge: 3600000 // seconds
        },
        rolling: true, // to increase the expiration time of the session cookie for non-idle session
        resave: false,
        saveUninitialized: false
    }));

    /**
     * Passport initialization
     * As well initialize Passport session as we are using persistent login sessions
     */
    app.use(passport.initialize());
    app.use(passport.session());

    passportGoogleStrategy();
}

function getStore() {
    let store;
    if (CONTEXT === 'PRODUCTION') {
        const redisConnect = require('connect-redis')(session);
        const redisClient = require('../../helpers/redis-helper/redis-initialize');
        store = new redisConnect({
            client: redisClient,
            logErrors: true
        });
    } else {
        const MemoryStore = require('memorystore')(session);
        store = new MemoryStore({
            checkPeriod: 86400000 // prune expired entries every 24h
        });
    }
    return store;
}

module.exports = initializeSession;
