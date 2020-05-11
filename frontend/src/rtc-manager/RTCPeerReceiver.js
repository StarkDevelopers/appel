export default async function RTCPeerReceiver(peerConnection, socket, roomName, connectedUser, userName) {
  peerConnection.addEventListener('icegatheringstatechange', status => {});

  peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      socket.emit('icecandidate', { candidate: event.candidate });
    }
  });

  socket.on('onicecandidate', async ({ candidate }) => {
    try {
      if (candidate) {
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Error while adding icecandidate ', error);
    }
  });

  const dataChannel = peerConnection.createDataChannel(roomName);

  dataChannel.addEventListener('open', event => {});

  dataChannel.addEventListener('close', event => {});

  socket.on('accepted-offer', async ({ answer, user }) => {
    const remoteAnswer = new RTCSessionDescription(answer);
    await peerConnection.setRemoteDescription(remoteAnswer);

    connectedUser['socketId'] = user.socketId;
    connectedUser['userName'] = user.userName;

    socket.emit('acknowledgement');
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('joined-room', { offer, userName });

  return dataChannel;
}
