const authenticatedUser = require('../middlewares/session-management/authenticated-user');

function authenticateRoutes(app) {
  /**
   * Route to Check Authenticated Users
   */
  app.get('/api/isAuthenticated', authenticatedUser, (req, res, next) => {
    const user = req.user ? req.user._json : {};
    res.status(200).send(user);
  }, (err, req, res, next) => {
    console.log(err);
    res.status(403).send({ message: 'Not-authorized' });
  });

  /**
   * Route to Send Profile Details
   */
  app.get('/api/profile', (req, res, next) => {
    const user = req.user ? req.user._json : {};
    res.status(200).send(user);
  });

  /**
   * Route to Logout User
   */
  app.get('/api/logout', (req, res, next) => {
    if (req.user) {
      req.session.destroy();
      res.clearCookie('stark.appel.session');
      req.logout();
    }
    res.redirect('/');
  });
}

module.exports = {
  authenticateRoutes
};
