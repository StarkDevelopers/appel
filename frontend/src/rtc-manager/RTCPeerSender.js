export default async function RTCPeerSender(peerConnection, socket, { offer, user }, connectedUser, userName) {
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

  const remoteOffer = new RTCSessionDescription(offer);
  await peerConnection.setRemoteDescription(remoteOffer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  connectedUser['socketId'] = user.socketId;
  connectedUser['userName'] = user.userName;

  socket.emit('accepted-offer', { answer, userName });
}
