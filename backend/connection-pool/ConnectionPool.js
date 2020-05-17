class ConnectionPool {
  constructor() {
    this.connections = {};
    this.io = null;
  }

  join(roomName) {
    let roomExist = true;
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
    return { available: roomExist };
  }

  initializeRoom(roomName) {
    const socket = this.connections[roomName].socket;
    socket.on('connection', userSocket => {
      console.log(`${userSocket.client.id} Joined Room ${roomName}`);
      userSocket.on('joined-room', ({ offer, userName }) => {
        const user = {
          socketId: userSocket.client.id,
          userName
        };
        // Reject if 2 users already exist
        if (this.connections[roomName].users.findIndex(u => u.socketId === user.socketId) < 0) {
          this.connections[roomName].users.push(user);
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
      userSocket.on('acknowledgement', () => {
        userSocket.broadcast.emit('acknowledgement');
      });
      userSocket.on('icecandidate', ({ candidate }) => {
        userSocket.broadcast.emit('onicecandidate', { candidate });
      });
      userSocket.on('calling', () => {
        userSocket.broadcast.emit('calling');
      });
      userSocket.on('cancelledCall', () => {
        userSocket.broadcast.emit('cancelledCall');
      });
      userSocket.on('rejectedCall', () => {
        userSocket.broadcast.emit('rejectedCall');
      });
      userSocket.on('pickedUpCall', () => {
        userSocket.broadcast.emit('pickedUpCall');
      });
      userSocket.on('disconnectedCall', () => {
        userSocket.broadcast.emit('disconnectedCall');
      });
      userSocket.on('videocam-mic-off', () => {
        userSocket.broadcast.emit('videocam-mic-off');
      });
      userSocket.on('disconnect', s => {
        console.log(`${userSocket.client.id} Left the Room ${roomName}`);
        this.connections[roomName].users = this.connections[roomName].users.filter(u => u.socketId !== userSocket.client.id);
        userSocket.broadcast.emit('disconnected');

        if (this.connections[roomName].users.length === 0) {
          this.connections[roomName].socket.removeAllListeners();
          this.connections[roomName].socket = null;
          this.connections[roomName].users = null;
          delete this.connections[roomName];
        }
      });
    });
  }
}

module.exports = new ConnectionPool();
