const ConnectionPool = require('../connection-pool/ConnectionPool');

function initRoutes(app) {
  /**
   * Route to join Room
   * If Room is not available then it will initialize it
   * If Room is available then it will register current user
   * Returns availability of Room
   */
  app.post('/api/join/:roomName', (req, res) => {
    try {
      console.log('Received');
      const response = ConnectionPool.join(req.params.roomName);
      return res.send(response);
    } catch (exception) {
      console.error(`Error while adding room: ${exception}`);
      return res.status(500).send('Error while adding room');
    }
  });
}

module.exports = {
  initRoutes
};
