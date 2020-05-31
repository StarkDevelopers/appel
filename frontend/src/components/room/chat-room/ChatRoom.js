import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { Grid, Snackbar, SnackbarContent, Fab } from '@material-ui/core';
import { connect } from 'react-redux';
import io from 'socket.io-client';
import { Call, CallEnd } from '@material-ui/icons';

import ChatRoomCSS from './ChatRoomCSS';
import MessageRoom from './message-room/MessageRoom';
import VideoRoom from './video-room/VideoRoom';
import RTCPeerReceiver from '../../../rtc-manager/RTCPeerReceiver';
import RTCPeerSender from '../../../rtc-manager/RTCPeerSender';

class ChatRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      openPickInputDevice: false,
      openIncomingCall: false,
      openCalling: false
    };
    this.iceConfiguration = {
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun.xpert.ly:3478' },
        {
          'urls': 'turn:turn.xpert.ly:3478',
          'username': 'turnserveruser',
          'credential': 'N0Pa$$word'
      }
      ]
    };
    this.socket = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.isPeerJoined = false;
    this.roomFull = false;

    this.addDataChannel = this.addDataChannel.bind(this);
    this.peerJoined = this.peerJoined.bind(this);
    this.peerLeft = this.peerLeft.bind(this);
    this.initRoom = this.initRoom.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.receivedMessage = this.receivedMessage.bind(this);
    this.calling = this.calling.bind(this);
    this.incomingCall = this.incomingCall.bind(this);
    this.cancelledCall = this.cancelledCall.bind(this);
    this.rejectedCall = this.rejectedCall.bind(this);
    this.pickedUpCall = this.pickedUpCall.bind(this);
    this.disconnectedCall = this.disconnectedCall.bind(this);
    this.closeCallNotification = this.closeCallNotification.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
  }

  initRoom(data) {
    if (data.full) {
      console.log('Room is full');
      this.roomFull = true;
      this.props.roomFull();
      return;
    }
    this.socket = io(`/${this.props.roomName}`);
    this.socket.on('roomFull', () => {
      this.roomFull = true;
      this.props.roomFull();
    });

    this.socket.on('connect', () => {
      setTimeout(async () => {
        if (this.roomFull) {
          console.log('Room is full');
          this.socket.disconnect();
          return;
        }

        console.log('connected ', this.socket.id);
  
        if (data.available) {
          this.peerConnection = new RTCPeerConnection(this.iceConfiguration);
  
          this.dataChannel = await RTCPeerReceiver(this.peerConnection, this.socket, this.props.roomName, this.props.userName, {
            receivedMessage: this.receivedMessage,
            addPeerUserName: this.props.addPeerUserName,
            peerJoined: this.peerJoined,
            peerLeft: this.peerLeft,
            incomingCall: this.incomingCall,
            cancelledCall: this.cancelledCall,
            rejectedCall: this.rejectedCall,
            pickedUpCall: this.pickedUpCall,
            disconnectedCall: this.disconnectedCall
          });
        }
        this.socket.on('joined-room', async ({ offer, user }) => {
          const isNegotiation = !!this.peerConnection;
          if (!isNegotiation) {
            this.peerConnection = new RTCPeerConnection(this.iceConfiguration);
          }
  
          await RTCPeerSender(this.peerConnection, this.socket, { offer, user }, this.props.userName, {
            receivedMessage: this.receivedMessage,
            addPeerUserName: this.props.addPeerUserName,
            peerJoined: this.peerJoined,
            addDataChannel: this.addDataChannel,
            peerLeft: this.peerLeft,
            incomingCall: this.incomingCall,
            cancelledCall: this.cancelledCall,
            rejectedCall: this.rejectedCall,
            pickedUpCall: this.pickedUpCall,
            disconnectedCall: this.disconnectedCall
          }, isNegotiation);
        });
      });
    });
  }

  componentDidMount() {
    fetch(`/api/join/${this.props.roomName}`, {
      method: 'POST',
      headers:{
        "accepts":"application/json"
      }
    })
    .then(response => response.json())
    .then(this.initRoom)
    .catch(error => {
      console.error('Error while joining room ', error);
    });
  }

  peerJoined() {
    if (!this.isPeerJoined) {
      this.isPeerJoined = true;
      this.props.peerJoined();
    }
  }

  peerLeft() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      this.dataChannel = null;
    }
    this.isPeerJoined= false;
    if (!this.props.waitingForPeer) this.props.peerLeft();
  }

  addDataChannel(dataChannel) {
    this.dataChannel = dataChannel;
  }

  calling() {
    this.socket.emit('calling');
    this.setState({
      openCalling: true
    });
    this.props.addMessage(`You Started Call`);
  }

  incomingCall() {
    this.props.addMessage(`${this.props.peerUserName.userName} Started Call`);
    this.setState({
      openIncomingCall: true
    });
  }

  cancelledCall(received = false) {
    let userName = this.props.peerUserName.userName;
    if (!received) {
      userName = 'You';
      this.socket.emit('cancelledCall');
    }
    this.closeCallNotification();
    this.props.addMessage(`${userName} Cancelled Call`);
  }

  rejectedCall(received = false) {
    let userName = this.props.peerUserName.userName;
    if (!received) {
      userName = 'You';
      this.socket.emit('rejectedCall');
    }
    this.closeCallNotification();
    this.props.addMessage(`${userName} Rejected Call`);
  }

  pickedUpCall(received = false) {
    if (!received) {
      this.socket.emit('pickedUpCall');
    }
    this.closeCallNotification();
    this.props.joinVideoCall();
  }

  disconnectedCall(message) {
    this.props.disconnectedCall(message);
  }

  closeCallNotification() {
    this.setState({
      openIncomingCall: false,
      openCalling: false
    });
  }

  handleSendMessage(message) {
    if (this.dataChannel) {
      this.dataChannel.send(message);
      this.props.sendMessage(message);
    }
  }

  handleFileUpload(originalFileName, fileName, fileSize) {
    if (this.dataChannel) {
      const data = {
        type: 'FILE',
        originalFileName,
        fileName,
        fileSize,
        userName: this.props.peerUserName.userName
      };
      this.dataChannel.send(JSON.stringify(data));
      this.props.fileUploaded(originalFileName, fileName, fileSize, 'You');
    }
  }

  receivedMessage(message) {
    try {
      message = JSON.parse(message);
    } catch (e) {}

    if (message.type === 'FILE') {
      this.props.fileUploaded(message.originalFileName, message.fileName, message.fileSize, message.userName);
    } else {
      this.props.receivedMessage(message);
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <Grid container justify="center" alignItems="center" className={classes.container}>
        <Grid item xs={12} lg={11} xl={10} className={classes.box}>

          {/* Message Room */}
          { !this.props.inVideoCall && <MessageRoom
            handleSendMessage={this.handleSendMessage}
            calling={this.calling}
            onUploaded={this.handleFileUpload} /> }
          
          {/* Video Room */}
          { this.props.inVideoCall && <VideoRoom
            handleSendMessage={this.handleSendMessage}
            peerConnection={this.peerConnection}
            socket={this.socket}
            onDisconnectCall={this.disconnectedCall}
            onUploaded={this.handleFileUpload} /> }

          <Snackbar
            className={classes.snackbar}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
            open={this.state.openCalling || this.state.openIncomingCall}
            onClose={() => {}}
            onExited={() => {}}
          >
            <SnackbarContent
              className={classes.snackbarContent}
              message={ this.state.openCalling ? 'Calling...' : 'Incoming Call...' }
              action={
                <React.Fragment>
                  { this.state.openIncomingCall && <Fab aria-label="pickup" onClick={() => this.pickedUpCall()} className={classes.pickupButton}>
                    <Call className={classes.callingIcon} />
                  </Fab> }
                  <Fab
                    color="secondary"
                    aria-label="cancel"
                    onClick={this.state.openCalling ? () => this.cancelledCall() : () => this.rejectedCall()}
                    className={classes.callingButton}>
                    <CallEnd className={classes.callingIcon} />
                  </Fab>
                </React.Fragment>
              }
            />
          </Snackbar>
         </Grid>
       </Grid>
    );
  }
}

const style = reactTheme => createStyles(ChatRoomCSS(reactTheme));

const mapStateToProps = state => {
  return {
    roomName: state.roomName,
    userName: state.userName,
    peerUserName: state.peerUserName,
    inVideoCall: state.inVideoCall
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addPeerUserName: (peerSocketId, peerUserName) => dispatch({ type: 'PEER_USER_NAME', data: { peerSocketId, peerUserName } }),
    peerJoined: () => dispatch({ type: 'PEER_JOINED' }),
    peerLeft: () => dispatch({ type: 'PEER_LEFT' }),
    receivedMessage: message => dispatch({ type: 'RECEIVED_MESSAGE', message }),
    sendMessage: message => dispatch({ type: 'SEND_MESSAGE', message }),
    addMessage: message => dispatch({ type: 'ADD_MESSAGE', message }),
    joinVideoCall: (join = true) => dispatch({ type: 'JOIN_VIDEO_CALL', join }),
    disconnectedCall: message => dispatch({ type: 'DISCONNECT_CALL', message }),
    fileUploaded: (originalFileName, fileName, fileSize, userName) => dispatch({ type: 'FILE_UPLOADED', originalFileName, fileName, fileSize, userName }),
    roomFull: () => dispatch({ type: 'ROOM_FULL' })
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(ChatRoom));
