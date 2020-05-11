import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { Grid, InputBase, Typography, IconButton } from '@material-ui/core';
import { Send, AttachFile, VideoCall, FiberManualRecord } from '@material-ui/icons';
import { connect } from 'react-redux';
import io from 'socket.io-client';

import { STYLES } from '../../../styles/styles';
import RTCPeerReceiver from '../../../rtc-manager/RTCPeerReceiver';
import RTCPeerSender from '../../../rtc-manager/RTCPeerSender';

class ChatRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      waitingToChat: true,
      messages: []
    };
    this.connectedUser = {};
    this.iceConfiguration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };
    this.peerConnection = null;
    this.dataChannel = null;
    this.handleMessage = this.handleMessage.bind(this);
    this.initRoom = this.initRoom.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
  }

  initRoom(data) {
    const socket = io(`http://localhost:8080/${this.props.roomName}`);
    socket.on('connect', async () => {
      console.log('connected ', socket.id);

      if (data.available) {
        this.peerConnection = new RTCPeerConnection(this.iceConfiguration);

        this.peerConnection.addEventListener('connectionstatechange', event => {
          if (this.peerConnection.connectionState === 'connected') {
            // Peers connected!
            this.setState({
              waitingToChat: false
            });
          }
        });

        this.dataChannel = await RTCPeerReceiver(this.peerConnection, socket, this.props.roomName, this.connectedUser, this.props.userName);

        this.dataChannel.addEventListener('message', event => {
          const message = event.data;
          const messages = [].concat(this.state.messages);
          messages.push({
            from: this.connectedUser.userName,
            m: message
          });
          this.setState({
            messages
          });
        });
      } else {
        socket.on('joined-room', async ({ offer, user }) => {
          this.peerConnection = new RTCPeerConnection(this.iceConfiguration);

          this.peerConnection.addEventListener('connectionstatechange', event => {
            if (this.peerConnection.connectionState === 'connected') {
              // Peers connected!
              this.setState({
                waitingToChat: false
              });
            }
          });

          this.peerConnection.addEventListener('datachannel', event => {
            this.dataChannel = event.channel;

            this.dataChannel.addEventListener('open', event => {});
  
            this.dataChannel.addEventListener('close', event => {});

            this.dataChannel.addEventListener('message', event => {
              const message = event.data;
              const messages = [].concat(this.state.messages);
              messages.push({
                from: this.connectedUser.userName,
                m: message
              });
              this.setState({
                messages
              });
            });
          });

          await RTCPeerSender(this.peerConnection, socket, { offer, user }, this.connectedUser, this.props.userName);
        });

        socket.on('acknowledgement', () => {
        });
      }
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

  handleMessage(event) {
    this.setState({
      message: event.target.value
    });
  }

  handleSendMessage(event) {
    event.preventDefault();
    if (this.dataChannel) {
      const message = this.state.message;
      this.dataChannel.send(message);

      const messages = [].concat(this.state.messages);
      messages.push({
        from: this.props.userName,
        m: message
      });

      this.setState({
        message: '',
        messages
      });
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <Grid container justify="center" alignItems="center" className={classes.container}>
        <Grid item xs={12} lg={11} xl={10} className={classes.box}>
          <Grid container className={classes.chatContainer} direction="column">
            {/* Room Title */}
            <Grid item className={classes.titleBox}>
              <Grid container>
                <Grid item className={classes.roomTitleFlex}>
                  <Typography className={classes.roomTitle}>{this.props.roomName.toUpperCase()}</Typography>
                  <FiberManualRecord className={this.state.waitingToChat ? classes.roomDeactivateStatus : classes.roomActivateStatus} />
                </Grid>
                <Grid item>
                  <IconButton className={classes.submitButton} aria-label="videocall" disabled={this.state.waitingToChat} color="primary">
                    <VideoCall className={classes.icon} />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
            {/* Chat Messages */}
            <Grid item className={classes.messagesBox}>
              <Grid container className={classes.messagesContainer}>
                <Grid item className={classes.messages}>
                  {this.state.messages.map((message, index) => (
                    <div className={classes.mBox} key={index}>
                      <Typography className={classes.senderName}>
                        {message.from}
                      </Typography>
                      <Typography className={classes.messageContent}>
                        {message.m}
                      </Typography>
                    </div>
                  ))}
                </Grid>
              </Grid>
            </Grid>
            {/* Message Input */}
            <Grid item className={classes.messageInputBox}>
              <form onSubmit={this.handleSendMessage}>
                <Grid container>
                  <Grid item className={classes.messageInput}>
                    <InputBase
                      className={classes.roomField}
                      type="text"
                      value={this.state.message}
                      onChange={this.handleMessage}
                      placeholder="Type Message..."
                      disabled={this.state.waitingToChat} />
                  </Grid>
                  <Grid item>
                    <IconButton className={classes.submitButton} aria-label="attachfile" disabled={this.state.waitingToChat} color="primary">
                      <AttachFile className={classes.icon} />
                    </IconButton>
                  </Grid>
                  <Grid item>
                    <IconButton type="submit" className={classes.submitButton} aria-label="send" disabled={this.state.waitingToChat} color="primary">
                      <Send className={classes.icon} />
                    </IconButton>
                  </Grid>
                </Grid>
              </form>
            </Grid>
          </Grid>
         </Grid>
       </Grid>
    );
  }
}

const style = reactTheme => createStyles({
  container: {
    height: '100%'
  },
  box: {
    height: '100%',
    padding: '1rem',
    [reactTheme.breakpoints.down('md')]: {
      padding: '0'
    }
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    color: '#FFFFFF',
    boxShadow: '8px 8px 8px 1px #666666'
  },
  titleBox: {
    backgroundColor: '#333333',
    height: '3rem'
  },
  roomTitleFlex: {
    flexGrow: '1',
    padding: '0.75rem'
  },
  roomTitle: {
    display: 'inline',
    fontSize: '1rem',
    marginRight: '0.5rem'
  },
  roomDeactivateStatus: {
    display: 'inline',
    fontSize: '0.75rem',
    color: '#b96959'
  },
  roomActivateStatus: {
    display: 'inline',
    fontSize: '0.75rem',
    color: '#a3c463'
  },
  messagesBox: {
    backgroundColor: '#999999',
    flex: '1 1 auto',
    overflowY: 'auto',
    minHeight: '0px',
    height: 'calc(100% - 6rem)'
  },
  messagesContainer: {
    height: '100%'
  },
  messages: {
    alignSelf: 'flex-end',
    width: '100%'
  },
  messageInputBox: {
    backgroundColor: '#333333',
    height: '3rem'
  },
  messageInput: {
    flexGrow: '1'
  },
  roomField: Object.assign(
    {},
    STYLES.inputField,
    {
      fontSize: '1rem',
      padding: '1rem'
    }
  ),
  submitButton: {
    padding: '0',
    color: '#FFFFFF',
    '&:disabled': {
      color: '#999999'
    }
  },
  icon: {
    height: '2rem',
    padding: '0.5rem'
  },
  mBox: {
    margin: '0rem 1.5rem 0.5rem 1.5rem'
  },
  senderName: {
    color: '#333333',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  messageContent: {
    color: '#999999',
    backgroundColor: '#333333',
    padding: '0.25rem 1rem',
    fontSize: '1rem',
    borderRadius: '1rem',
    display: 'inline-block'
  }
});

const mapStateToProps = state => {
  return {
    roomName: state.roomName,
    userName: state.userName
  };
};

const mapDispatchToProps = dispatch => {
  return {
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(ChatRoom));
