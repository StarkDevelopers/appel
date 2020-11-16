const fs = require('fs');
const path = require('path');

const SocketPool = require('../socket-pool/socket-pool');

function initRoutes(app) {
  /**
   * Route to join Room
   * If Room is not available then it will initialize it
   * If Room is available then it will register current user
   * Returns availability of Room
   */
  app.post('/api/join/:roomName', (req, res) => {
    try {
      const response = SocketPool.join(req.params.roomName);
      return res.send(response);
    } catch (exception) {
      console.error(`Error while adding room: ${exception.message} \n Stack Trace: ${exception.stack}`);
      return res.status(500).send({ error: `Error while adding room: ${exception.message}` });
    }
  });

  /**
   * Route to Upload file
   * Returns name of the file
   */
  app.post('/api/upload-file/:roomName', app.fileUpload.single('file'), (req, res) => {
    try {
      return res.send({ filename: req.file.filename });
    } catch (exception) {
      console.error(`Error while uploading file: ${exception.message} \n Stack Trace: ${exception.stack}`);
      return res.status(500).send({ error: `Error while uploading file: ${exception.message}` });
    }
  });

  /**
   * Route to Download file
   * Downloads file if exists
   * Else returns file not exists
   */
  app.get('/api/download-file/:roomName/:fileName/:originalFileName', (req, res) => {
    try {
      const filePath = path.join('uploads', req.params.roomName, req.params.fileName);
      if (fs.existsSync(filePath)) {
        return res.download(filePath, req.params.originalFileName);
      } else {
        return res.status(404).send({ exists: 'File does not exist' });
      }
    } catch (exception) {
      console.error(`Error while downloading file: ${exception.message} \n Stack Trace: ${exception.stack}`);
      if (!res.headersSent) {
        return res.status(500).send({ error: `Error while downloading file: ${exception.message}` });
      }
      return;
    }
  });
}

module.exports = {
  initRoutes
};
