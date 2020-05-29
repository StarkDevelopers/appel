export default async function RTCPeerReceiver(
    peerConnection,
    socket,
    roomName,
    userName,
    {
      receivedMessage,
      peerJoined,
      addPeerUserName,
      peerLeft,
      incomingCall,
      cancelledCall,
      rejectedCall,
      pickedUpCall
    }) {
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

  peerConnection.addEventListener('icegatheringstatechange', status => {
    console.log('connectionState', peerConnection.connectionState);
    console.log('iceConnectionState', peerConnection.iceConnectionState);
  });

  peerConnection.addEventListener('iceconnectionstatechange', status => {
    console.log('connectionState', peerConnection.connectionState);
    console.log('iceConnectionState', peerConnection.iceConnectionState);
    if (peerConnection.iceConnectionState === 'connected') {
      // Peers connected!
      peerJoined();
    } else if (['closed', 'failed'].indexOf(peerConnection.iceConnectionState) > -1) {
      onPeerLeave();
    }
  });

  peerConnection.addEventListener('connectionstatechange', event => {
    console.log('STATE', peerConnection.connectionState);
    if (['closed', 'failed'].indexOf(peerConnection.connectionState) > -1) {
      onPeerLeave();
    }
  });

  socket.on('acknowledgement', () => {});

  const onPeerLeave = () => {
    socket.off('acknowledgement');
    socket.off('accepted-offer');
    socket.off('onicecandidate');
    socket.off('disconnected');
    socket.off('calling');
    socket.off('cancelledCall');
    socket.off('rejectedCall');
    socket.off('pickedUpCall');
    peerLeft();
  };

  socket.on('disconnected', () => {
    onPeerLeave();
  });

  const dataChannel = peerConnection.createDataChannel(roomName);

  dataChannel.addEventListener('open', event => {});

  dataChannel.addEventListener('close', event => {});

  dataChannel.addEventListener('message', event => {
    receivedMessage(event.data);
  });

  socket.on('calling', () => {
    incomingCall();
  });

  socket.on('cancelledCall', () => {
    cancelledCall(true);
  });

  socket.on('rejectedCall', () => {
    rejectedCall(true);
  });

  socket.on('pickedUpCall', () => {
    pickedUpCall(true);
  });

  socket.on('accepted-offer', async ({ answer, user }) => {
    addPeerUserName(user.socketId, user.userName);

    const remoteAnswer = new RTCSessionDescription(answer);
    await peerConnection.setRemoteDescription(remoteAnswer);

    socket.emit('acknowledgement');
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('joined-room', { offer, userName });

  if (!peerConnection.onnegotiationneeded) {
    peerConnection.onnegotiationneeded = async () => {
      console.log('Negotiation');
      setTimeout(async () => {
        if (peerConnection.signalingState === 'stable') {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          socket.emit('joined-room', { offer, userName });
        }
      }, 500);
    };
  }

  return dataChannel;
}
