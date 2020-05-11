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
        this.connections[roomName].users.push(user);
        userSocket.broadcast.emit('joined-room', { offer, user });
      });
      userSocket.on('accepted-offer', ({ answer, userName }) => {
        const user = {
          socketId: userSocket.client.id,
          userName
        };
        // Reject if 2 users already exist
        this.connections[roomName].users.push(user);
        userSocket.broadcast.emit('accepted-offer', { answer, user });
      });
      userSocket.on('acknowledgement', () => {
        userSocket.broadcast.emit('acknowledgement');
      });
      userSocket.on('icecandidate', ({ candidate }) => {
        userSocket.broadcast.emit('onicecandidate', { candidate });
      });
      userSocket.on('disconnect', s => {
        console.log(`${userSocket.client.id} Left the Room ${roomName}`);
        this.connections[roomName].users = this.connections[roomName].users.filter(u => u.socketId !== userSocket.client.id);
      });
    });
  }
}

module.exports = new ConnectionPool();
