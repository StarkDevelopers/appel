const path = require('path');
const fs = require('fs');

const passport = require('passport');

function loginSequence(app) {
  app.all('/api/sign-in', preLoginCheck, passport.authenticate('google', { scope:
    [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }));

  app.get('/auth/google/callback',
    passport.authenticate( 'google', {
      successRedirect: '/profile',
      failureRedirect: '/?loginFailed=true'
    })
  );

  /**
   * Middleware for Pre-login check like Blocked IPs...
   */
  function preLoginCheck(req, res, next) {
    if (req.isAuthenticated()) {
      console.log('Already Logged In');
      res.redirect('/profile');
    } else {
      next();
    }
  }
}

module.exports = loginSequence;
