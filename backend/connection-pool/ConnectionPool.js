const fs = require('fs');
const path = require('path');

const events = [
  { event: 'acknowledgement', fireEvent: 'acknowledgement' },
  { event: 'icecandidate', fireEvent: 'onicecandidate' },
  { event: 'calling', fireEvent: 'calling' },
  { event: 'cancelledCall', fireEvent: 'cancelledCall' },
  { event: 'rejectedCall', fireEvent: 'rejectedCall' },
  { event: 'pickedUpCall', fireEvent: 'pickedUpCall' },
  { event: 'disconnectedCall', fireEvent: 'disconnectedCall' },
  { event: 'camStatus', fireEvent: 'camStatus' }
]

class ConnectionPool {
  constructor() {
    this.connections = {};
    this.io = null;
  }

  join(roomName) {
    let roomExist = true;
    let roomFull = false;
    if (!this.connections[roomName]) {
      this.connections[roomName] = {};
      roomExist = false;
    }
    if (!this.connections[roomName].socket) {
      this.connections[roomName].socket = this.io.of(`/${roomName}`);
      this.initializeRoom(roomName);
    }
    if (!this.connections[roomName].users) {
      this.connections[roomName].users = [];
    }
    console.log(roomExist ? `${roomName} exists` : `${roomName} does no exist. Created.`);
    console.log(`Users: ${this.connections[roomName].users.length}`);

    // Reject if 2 users already exist
    if (this.connections[roomName].users.length === 2) {
      roomFull = true;
      console.log(`${roomName}: full`);
    } else {
      console.log(`${roomName}: slot available`);
    }
    return { available: roomExist, full: roomFull };
  }

  initializeRoom(roomName) {
    const socket = this.connections[roomName].socket;
    socket.on('connection', userSocket => {

      // Reject if 2 users already exist
      if (this.connections[roomName].users.length === 2) {
        console.log(`Connection: Denied connection for user ${userSocket.client.id} for ${roomName}: Room Full`);
        userSocket.emit('roomFull');
      } else {
        // If not exist then add user
        if (this.connections[roomName].users.findIndex(u => u.socketId === userSocket.client.id) < 0) {
          this.connections[roomName].users.push({ socketId: userSocket.client.id });
        }

        console.log(`${userSocket.client.id} Joined Room ${roomName}`);

        userSocket.on('joined-room', ({ offer, userName }) => {
          const user = {
            socketId: userSocket.client.id,
            userName
          };
          if (this.connections[roomName].users.findIndex(u => u.socketId === user.socketId) < 0) {
            this.connections[roomName].users.push(user);
          } else {
            const existingUser = this.connections[roomName].users.find(u => u.socketId === user.socketId && !u.userName);
            if (existingUser) existingUser.userName = userName;
          }
          userSocket.broadcast.emit('joined-room', { offer, user });
        });

        userSocket.on('accepted-offer', ({ answer, userName }) => {
          const user = {
            socketId: userSocket.client.id,
            userName
          };
          // Reject if 2 users already exist
          if (this.connections[roomName].users.findIndex(u => u.socketId === user.socketId) < 0) {
            this.connections[roomName].users.push(user);
          }
          userSocket.broadcast.emit('accepted-offer', { answer, user });
        });

        events.forEach(e => {
          userSocket.on(e.event, args => {
            userSocket.broadcast.emit(e.fireEvent, args);
          });
        });

        userSocket.on('disconnect', s => {
          console.log(`${userSocket.client.id} Left the Room ${roomName}`);
          this.connections[roomName].users = this.connections[roomName].users.filter(u => u.socketId !== userSocket.client.id);
          userSocket.broadcast.emit('disconnected');

          if (this.connections[roomName].users.length === 0) {
            cleanUpUploads(roomName);
            this.connections[roomName].socket.removeAllListeners();
            this.connections[roomName].socket = null;
            this.connections[roomName].users = null;
            delete this.connections[roomName];
          }
        });
      }
    });
  }
}

function cleanUpUploads(roomName) {
  if (fs.existsSync(path.join('uploads', roomName))) {
    const files = fs.readdirSync(path.join('uploads', roomName));
    files.forEach(f => {
      if (fs.statSync(path.join('uploads', roomName, f)).isFile()) {
        fs.unlinkSync(path.join('uploads', roomName, f));
      }
    });
    fs.rmdirSync(path.join('uploads', roomName));
  }
}

module.exports = new ConnectionPool();
