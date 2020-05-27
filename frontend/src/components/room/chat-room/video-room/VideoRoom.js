import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { Grid, Typography, Modal, Fab, InputBase, IconButton } from '@material-ui/core';
import { FiberManualRecord, VideocamOff, Videocam, Mic, MicOff, CallEnd, AttachFile, Send, Chat, GetApp } from '@material-ui/icons';
import { connect } from 'react-redux';

import ChatRoomCSS from '../ChatRoomCSS';
import PickInputDevice from './pick-input-device/PickInputDevice';
import FileUpload from '../file-upload/FileUpload';

class VideoRoom extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.remoteVideoRef = React.createRef();
    this.state = {
      openPickInputDevice: true,
      videoCamOff: false,
      micOff: false,
      message: '',
      chatOpened: false,
      fileUploadOpen: false,
      remoteCamOff: false,
      audioDoesNotExist: false,
      videoDoesNotExist: false,
      remoteVideoStream: new MediaStream()
    };
    // Audio/Video Device ID
    this.audioDeviceId = null;
    this.videoDeviceId = null;
    // Streams
    this.videoStream = new MediaStream();

    // Timeout for removing video-audio tracks from local stream
    this.videoCleanUpTimeout = null;
    this.addedRemoteTracks = [];
    // Timer
    this.time = 0;
    this.timerInterval = null;

    this.disconnectedListener = null;

    this.cleanVideoStream = this.cleanVideoStream.bind(this);
    this.handleClosePickInputDevice = this.handleClosePickInputDevice.bind(this);
    this.initVideoCall = this.initVideoCall.bind(this);
    this.handleVideoCamOff = this.handleVideoCamOff.bind(this);
    this.enableVideoCamOff = this.enableVideoCamOff.bind(this);
    this.handleMicOff = this.handleMicOff.bind(this);
    this.enableMicOff = this.enableMicOff.bind(this);
    this.disconnectedCall = this.disconnectedCall.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.openChat = this.openChat.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
  }

  componentDidMount() {
    this.timerInterval = setInterval(() => this.time += 1, 1000);

    if ('srcObject' in this.videoRef.current) {
      this.videoRef.current.srcObject = this.videoStream;
      this.remoteVideoRef.current.srcObject = this.state.remoteVideoStream;
    } else {
      this.videoRef.current.src = window.URL.createObjectURL(this.videoStream);
      this.remoteVideoRef.current.src = window.URL.createObjectURL(this.state.remoteVideoStream);
    }

    this.props.peerConnection.ontrack = event => {
      console.log('received track');

      const remoteVideoStream = event.streams[0];
      if ('srcObject' in this.remoteVideoRef.current) {
        this.remoteVideoRef.current.srcObject = remoteVideoStream;
      } else {
        this.remoteVideoRef.current.src = window.URL.createObjectURL(remoteVideoStream);
      }

      this.setState({
        remoteVideoStream
      });
    };

    this.props.socket.on('camStatus', off => {
      this.setState({
        remoteCamOff: off
      });
    });

    this.props.socket.on('disconnectedCall', () => {
      this.disconnectedCall(true);
    });

    this.disconnectedListener = () => {
      this.disconnectedCall(true);
    }

    this.props.socket.on('disconnected', this.disconnectedListener);
  }

  componentWillUnmount() {
    // Remove listeners
    this.props.socket.off('camStatus');
    this.props.socket.off('disconnectedCall');
    this.props.socket.removeListener('disconnected', this.disconnectedListener);

    if (this.props.peerConnection) {
      this.props.peerConnection.ontrack = null;
    }

    // Clean up Local Stream Tracks
    this.cleanVideoStream();

    // Clear Timer Interval
    clearInterval(this.timerInterval);
  }

  initVideoCall(micOff = false, videoCamOff = false, audioDoesNotExist = false, videoDoesNotExist = false) {
    const audioDevice = this.audioDeviceId ? { deviceId: { exact: this.audioDeviceId } } : true;
    const videoDevice = this.videoDeviceId ? { deviceId: { exact: this.videoDeviceId } } : true;

    if (!audioDoesNotExist || !videoDoesNotExist) {
      navigator.mediaDevices.getUserMedia({ audio: !audioDoesNotExist ? audioDevice : false, video: !videoDoesNotExist ? videoDevice : false })
        .then(stream => {
          this.videoStream = stream;

          stream.getTracks().forEach(track => {
            if ('srcObject' in this.videoRef.current) {
              this.videoRef.current.srcObject = stream;
            } else {
              this.videoRef.current.src = window.URL.createObjectURL(stream);
            }

            if (track.kind === 'audio') {
              if (micOff) this.enableMicOff(micOff);
              this.props.peerConnection.addTrack(track, stream);
            }
            if (track.kind === 'video') {
              if (videoCamOff) this.enableVideoCamOff(videoCamOff);
              this.props.peerConnection.addTrack(track, stream);
            }
          });
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  cleanVideoStream() {
    const oldTracks = [];
    this.videoStream.getTracks().forEach(t => oldTracks.push(t));
    oldTracks.forEach(t => {
      t.stop();
      this.videoStream.removeTrack(t);
    });
  }

  handleClosePickInputDevice(audioDevice, videoDevice, videoCamOff, micOff, audioDoesNotExist, videoDoesNotExist) {
    if (audioDevice === undefined && videoDevice === undefined && videoCamOff === undefined && micOff === undefined) {
      micOff = this.state.micOff;
      videoCamOff = this.state.videoCamOff;
      this.setState({
        openPickInputDevice: false
      });
    } else {
      this.audioDeviceId = audioDevice;
      this.videoDeviceId = videoDevice;
      this.setState({
        openPickInputDevice: false,
        videoCamOff,
        micOff,
        audioDoesNotExist,
        videoDoesNotExist
      });
    }
    if (videoDoesNotExist) {
      this.props.socket.emit('camStatus', true);
    }
    this.initVideoCall(micOff, videoCamOff, audioDoesNotExist, videoDoesNotExist);
  }

  enableVideoCamOff(off) {
    this.props.socket.emit('camStatus', off);
    this.videoStream.getVideoTracks().forEach(t => {
      t.enabled = !off;
    });
  }

  handleVideoCamOff(off = true) {
    this.setState({
      videoCamOff: off
    });
    this.enableVideoCamOff(off);
  }

  enableMicOff(off) {
    this.videoStream.getAudioTracks().forEach(t => {
      t.enabled = !off;
    });
  }

  handleMicOff(off = true) {
    this.setState({
      micOff: off
    });
    this.enableMicOff(off);
  }

  handleMessage(event) {
    this.setState({
      message: event.target.value
    });
  }

  handleSendMessage(event) {
    event.preventDefault();

    const message = this.state.message;
    if (message) {
      this.props.handleSendMessage(message);
      this.setState({
        message: ''
      });
    }
  }

  disconnectedCall(received = false) {
    let userName = '';
    if (this.props.peerUserName) {
      userName = this.props.peerUserName.userName;
    }
    if (!received) {
      userName = 'You';
      this.props.socket.emit('disconnectedCall');
    }

    const time = new Date(this.time * 1000);
    let timeString = '';
    const hours = time.getUTCHours().toString();
    const minutes = time.getUTCMinutes().toString();
    const seconds = time.getUTCSeconds().toString();

    if (hours !== '0') timeString += `${hours.length === 1 ? `0${hours}` : hours}`;

    timeString += `${minutes.length === 1 ? `0${minutes}` : minutes}:${seconds.length === 1 ? `0${seconds}` : seconds}`;

    this.props.onDisconnectCall(`${userName} Disconnected Call: ${timeString}`);
  }

  openChat() {
    const isOpened = this.state.chatOpened;
    this.setState({
      chatOpened: !isOpened
    });
  }

  handleFileUpload() {
    const fileUploadOpen = !this.state.fileUploadOpen;
    this.setState({
      fileUploadOpen
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <Grid container className={classes.chatContainer} direction="column">
        {/* Room Title */}
        <Grid item className={classes.titleBox}>
          <Grid container>
            <Grid item className={classes.roomTitleFlex}>
              <Typography className={classes.roomTitle}>{this.props.roomName.toUpperCase()}</Typography>
              <FiberManualRecord className={this.props.waitingForPeer ? classes.roomDeactivateStatus : classes.roomActivateStatus} />
            </Grid>
          </Grid>
        </Grid>
        {/* Video Container */}
        <Grid item className={classes.videoBox}>
          <Grid container className={classes.videoContainer}>
            <Grid item xs={12} md={6} className={this.state.remoteVideoStream.getVideoTracks().length === 0 ? classes.videoItem : classes.pictureInPicture}>
              <video
                className={classes.video}
                ref={this.videoRef}
                autoPlay={true}
                controls={false}
                muted={true}
                playsInline={true}
              ></video>
              { (this.state.videoCamOff || this.state.videoDoesNotExist) && <div className={classes.videoOverlay}></div>}
              <Typography className={classes.videoUserName}>{`You(${this.props.userName})`}</Typography>
            </Grid>
            <Grid item xs={12} md={6} className={classes.videoItem}>
              <video
                className={classes.video}
                ref={this.remoteVideoRef}
                autoPlay={true}
                controls={false}
                playsInline={true}
              ></video>
              { (this.state.remoteCamOff || this.state.remoteVideoStream.getVideoTracks().length === 0) && <div className={classes.videoOverlay}></div>}
              <Typography className={classes.remoteVideoUserName}>{this.props.peerUserName ? this.props.peerUserName.userName : ''}</Typography>
            </Grid>
          </Grid>
          {/* Chat Messages */}
          { this.state.chatOpened && <Grid item className={classes.videoMessagesBox}>
            <Grid container className={classes.messagesContainer}>
              <Grid item className={classes.messages}>
                {this.props.messages.map((message, index) => (
                  <div className={classes.mBox} key={index}>
                    { message.type && message.type === 'FILE' && <React.Fragment>
                        <Typography className={classes.senderName}>
                          {message.from}
                        </Typography>
                        <div container className={classes.fileContainer}>
                          <Typography className={classes.fileName}>
                            {message.originalFileName}
                          </Typography>
                          <Typography className={classes.fileSize}>
                            {message.fileSize}
                          </Typography>
                          <IconButton className={classes.fileDownload} aria-label="download-file">
                            <a
                              href={`api/download-file/${this.props.roomName}/${message.fileName}/${message.originalFileName}`}
                              // onClick={e => e.preventDefault()}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <GetApp className={classes.downloadIcon} />
                            </a>
                          </IconButton>
                        </div>
                      </React.Fragment> }
                    { !message.type && <React.Fragment>
                        <Typography className={classes.senderName}>
                          {message.from}
                        </Typography>
                        <Typography className={classes.messageContent}>
                          {message.m}
                        </Typography>
                      </React.Fragment> }
                  </div>
                ))}
              </Grid>
            </Grid>
          </Grid> }
          {/* Message Input */}
          { this.state.chatOpened && <Grid item className={classes.videoMessageInputBox}>
            <form onSubmit={this.handleSendMessage}>
              <Grid container>
                <Grid item className={classes.messageInput}>
                  <InputBase
                    className={classes.roomField}
                    type="text"
                    value={this.state.message}
                    onChange={this.handleMessage}
                    placeholder="Type Message..."
                    disabled={this.props.waitingForPeer} />
                </Grid>
                <Grid item>
                  <IconButton type="submit" className={classes.submitButton} aria-label="send" disabled={this.props.waitingForPeer} color="primary">
                    <Send className={classes.icon} />
                  </IconButton>
                </Grid>
              </Grid>
            </form>
          </Grid> }
        </Grid>
        {/* Video Actions */}
        <Grid item className={classes.videoActionBox}>
          <Grid container justify="center" alignItems="center">
            <Grid item>
              {/* Video Cam Off */}
              { this.state.videoCamOff && <Fab className={classes.videoAction} color="secondary" aria-label="videoCamOff" disabled={this.state.videoDoesNotExist} onClick={() => this.handleVideoCamOff(false)}>
                <VideocamOff />
              </Fab> }

              {/* Video Cam On */}
              { !this.state.videoCamOff && <Fab className={classes.videoAction} aria-label="videoCamOn" disabled={this.state.videoDoesNotExist} onClick={() => this.handleVideoCamOff(true)}>
                <Videocam />
              </Fab> }
            </Grid>
            <Grid item>
              {/* Mic Off */}
              { this.state.micOff && <Fab className={classes.videoAction} color="secondary" aria-label="micOff" disabled={this.state.audioDoesNotExist} onClick={() => this.handleMicOff(false)}>
                <MicOff />
              </Fab> }

              {/* Mic On */}
              { !this.state.micOff && <Fab className={classes.videoAction} aria-label="micOn" disabled={this.state.audioDoesNotExist} onClick={() => this.handleMicOff(true)}>
                <Mic />
              </Fab> }
            </Grid>
            <Grid item>
              <Fab className={classes.videoAction} color={this.state.chatOpened ? 'primary' : ''} aria-label="chat" onClick={this.openChat}>
                <Chat />
              </Fab>
            </Grid>
            <Grid item>
              <Fab className={classes.videoAction} color={this.state.fileUploadOpen ? 'primary' : ''} aria-label="file-upload" onClick={this.handleFileUpload}>
                <AttachFile />
              </Fab>
            </Grid>
            <Grid item>
              <Fab className={classes.videoAction} color="secondary" aria-label="callEnd" onClick={() => this.disconnectedCall()}>
                <CallEnd />
              </Fab>
            </Grid>
          </Grid>
        </Grid>
        <Modal
          open={this.state.openPickInputDevice}
          aria-labelledby="Pick Input Device"
          aria-describedby="Pick Audio/Video Devices"
        >
          <PickInputDevice onClose={this.handleClosePickInputDevice} />
        </Modal>
        <Modal
          open={this.state.fileUploadOpen}
          aria-labelledby="File Upload"
          aria-describedby="File Upload"
        >
          <FileUpload onClose={this.handleFileUpload} onUploaded={this.props.onUploaded} />
        </Modal>
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
    messages: state.messages
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeVideoCamStatus: status => dispatch({ type: 'VIDEO_CAM_STATUS', status }),
    changeMicStatus: status => dispatch({ type: 'MIC_STATUS', status }),
    joinVideoCall: (join = true) => dispatch({ type: 'JOIN_VIDEO_CALL', join })
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(VideoRoom));
