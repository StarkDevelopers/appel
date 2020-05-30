export default async function RTCPeerSender(
    peerConnection,
    socket,
    { offer, user },
    userName,
    {
      receivedMessage,
      peerJoined,
      addPeerUserName,
      addDataChannel,
      peerLeft,
      incomingCall,
      cancelledCall,
      rejectedCall,
      pickedUpCall
    }, isNegotiation = false) {
  if (!isNegotiation) {
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
        if (!isNegotiation) {
          peerJoined();
        }
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

    // For later negotiations
    socket.on('accepted-offer', async ({ answer, user }) => {
      const remoteAnswer = new RTCSessionDescription(answer);
      await peerConnection.setRemoteDescription(remoteAnswer);
  
      socket.emit('acknowledgement');
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
  
    peerConnection.addEventListener('datachannel', event => {
      const dataChannel = event.channel;
  
      dataChannel.addEventListener('open', event => {});
  
      dataChannel.addEventListener('close', event => {});
  
      dataChannel.addEventListener('message', event => {
        receivedMessage(event.data);
      });

      addDataChannel(dataChannel);
    });

    peerConnection.onnegotiationneeded = async () => {
      console.log('Negotiation');
      // Kept different Timeouts(400-800) so both the device won't fire negotiation at the same time.
      setTimeout(async () => {
        if (peerConnection.signalingState === 'stable') {
          console.log('Negotiation started');
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          socket.emit('joined-room', { offer, userName });
        }
      }, 1000);
    };

    addPeerUserName(user.socketId, user.userName);
  }

  const remoteOffer = new RTCSessionDescription(offer);
  await peerConnection.setRemoteDescription(remoteOffer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('accepted-offer', { answer, userName });
}
