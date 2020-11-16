const passport = require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const User = require('../../features/users/users');

module.exports = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: `${process.env.GOOGLE_AUTH_CALLBACK}/auth/google/callback`,
        passReqToCallback: true
      },
      async function(request, accessToken, refreshToken, profile, done) {
        try {
          await User.createOrUpdateUser(profile);
          return done(null, profile);
        } catch (error) {
          return done(null, false, { message: error.message });
        }
      }
    ));

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });
};
