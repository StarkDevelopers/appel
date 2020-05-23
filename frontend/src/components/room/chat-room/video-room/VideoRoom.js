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
      videoStream: new MediaStream(),
      remoteVideoStream: new MediaStream(),
      videoCamOff: false,
      micOff: false,
      audioDevice: '',
      videoDevice: '',
      enableVideoOverlay: false,
      message: '',
      chatOpened: false,
      fileUploadOpen: false
    };
    this.rtcRtpSenderAudio = null;
    this.rtcRtpSenderVideo = null;
    // Timeout for removing video-audio tracks from local stream
    this.videoCleanUpTimeout = null;
    this.addedRemoteTracks = [];
    // Timer
    this.time = 0;
    this.timerInterval = null;

    this.cleanVideoStream = this.cleanVideoStream.bind(this);
    this.cleanRemoteVideoStream = this.cleanRemoteVideoStream.bind(this);
    this.clearRemoteAudio = this.clearRemoteAudio.bind(this);
    this.clearRemoteVideo = this.clearRemoteVideo.bind(this);
    this.handleClosePickInputDevice = this.handleClosePickInputDevice.bind(this);
    this.initVideoCall = this.initVideoCall.bind(this);
    this.handleVideoCamOff = this.handleVideoCamOff.bind(this);
    this.handleMicOff = this.handleMicOff.bind(this);
    this.disconnectedCall = this.disconnectedCall.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.openChat = this.openChat.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
  }

  componentDidMount() {
    this.timerInterval = setInterval(() => this.time += 1, 1000);

    console.log(this.videoRef.current);
    if ('srcObject' in this.videoRef.current) {
      this.videoRef.current.srcObject = this.state.videoStream;
      this.remoteVideoRef.current.srcObject = this.state.remoteVideoStream;
    } else {
      this.videoRef.current.src = window.URL.createObjectURL(this.state.videoStream);
      this.remoteVideoRef.current.src = window.URL.createObjectURL(this.state.remoteVideoStream);
    }

    this.props.peerConnection.ontrack = event => {
      console.log('received track');
      this.state.remoteVideoStream.addTrack(event.track, event.stream);

      this.setState({
        enableVideoOverlay: false,
        remoteVideoStream: this.state.remoteVideoStream
      });

      this.addedRemoteTracks.push(event.track.id);
      if (this.videoCleanUpTimeout) {
        clearTimeout(this.videoCleanUpTimeout);
      }
      this.videoCleanUpTimeout = setTimeout(() => {
        this.cleanRemoteVideoStream();
      });
    };

    this.props.socket.on('videocam-mic-off', () => {
      this.setState({
        enableVideoOverlay: true
      });
    });

    this.props.socket.on('disconnectedCall', () => {
      this.disconnectedCall(true);
    });

    this.props.socket.on('disconnected', () => {
      this.disconnectedCall(true);
    });
  }

  componentWillUnmount() {
    // Remove listeners
    this.props.socket.off('videocam-mic-off');
    this.props.socket.off('disconnectedCall');
    this.props.socket.off('disconnected');

    if (this.props.peerConnection) {
      this.props.peerConnection.ontrack = null;
    }

    // Clean up Remote/Local Stream Tracks
    this.cleanRemoteVideoStream();
    this.cleanVideoStream();

    // Clear Timer Interval
    clearInterval(this.timerInterval);
  }

  initVideoCall(micOff = false, videoCamOff = false) {
    let audioDevice = false;
    let videoDevice = false;

    if (!micOff) audioDevice = this.props.audioDeviceId ? { deviceId: { exact: this.state.audioDeviceId } } : true;
    if (!videoCamOff) videoDevice = this.props.videoDeviceId ? { deviceId: { exact: this.state.videoDeviceId } } : true;

    if (!micOff || !videoCamOff) {
      navigator.mediaDevices.getUserMedia({ audio: audioDevice, video: videoDevice })
        .then(stream => {
          this.cleanVideoStream();

          if (micOff && this.rtcRtpSenderAudio) {
            this.clearRemoteAudio();
          }
          if (videoCamOff && this.rtcRtpSenderVideo) {
            this.clearRemoteVideo();
          }

          stream.getTracks().forEach(track => {
            this.state.videoStream.addTrack(track, stream);

            if (track.kind === 'audio' && !micOff) {
              this.rtcRtpSenderAudio = this.props.peerConnection.addTrack(track, stream);
            }
            if (track.kind === 'video' && !videoCamOff) {
              this.rtcRtpSenderVideo = this.props.peerConnection.addTrack(track, stream);
            }
          });
          this.setState({
            videoStream: this.state.videoStream
          });
        })
        .catch(error => {
          console.error(error);
        });
    }
    if (micOff && videoCamOff) {
      this.cleanVideoStream();

      if (micOff && this.rtcRtpSenderAudio) {
        this.clearRemoteAudio();
      }
      if (videoCamOff && this.rtcRtpSenderVideo) {
        this.clearRemoteVideo();
      }

      this.props.socket.emit('videocam-mic-off');

      this.setState({
        videoStream: this.state.videoStream
      });
    }
  }

  cleanVideoStream() {
    const oldTracks = [];
    this.state.videoStream.getTracks().forEach(t => oldTracks.push(t));
    oldTracks.forEach(t => {
      t.stop();
      this.state.videoStream.removeTrack(t);
    });
  }

  cleanRemoteVideoStream() {
    const addedTracks = [].concat(this.addedRemoteTracks);
    this.addedRemoteTracks = [];
    this.videoCleanUpTimeout = null;

    const oldTracks = [];
    this.state.remoteVideoStream.getTracks().forEach(t => {
      if (addedTracks.indexOf(t.id) < 0) oldTracks.push(t);
    });
    oldTracks.forEach(t => {
      t.stop();
      this.state.remoteVideoStream.removeTrack(t);
    });
  }

  clearRemoteAudio() {
    this.props.peerConnection.removeTrack(this.rtcRtpSenderAudio);
    this.rtcRtpSenderAudio = null;
  }

  clearRemoteVideo() {
    this.props.peerConnection.removeTrack(this.rtcRtpSenderVideo);
    this.rtcRtpSenderVideo = null;
  }

  handleClosePickInputDevice(audioDevice, videoDevice, videoCamOff, micOff) {
    if (audioDevice === undefined && videoDevice === undefined && videoCamOff === undefined && micOff === undefined) {
      micOff = this.state.micOff;
      videoCamOff = this.state.videoCamOff;
      this.setState({
        openPickInputDevice: false
      });
    } else {
      this.setState({
        openPickInputDevice: false,
        audioDevice,
        videoDevice,
        videoCamOff,
        micOff
      });
    }
    this.initVideoCall(micOff, videoCamOff);
  }

  handleVideoCamOff(off = true) {
    this.setState({
      videoCamOff: off
    });
    this.initVideoCall(this.state.micOff, off);
  }

  handleMicOff(off = true) {
    this.setState({
      micOff: off
    });
    this.initVideoCall(off, this.state.videoCamOff);
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
            <Grid item xs={12} md={6} className={classes.videoItem}>
              <video className={classes.video} ref={this.videoRef} autoPlay controls={false} muted={true} ></video>
              { (this.state.videoStream.getVideoTracks().length === 0 || this.state.videoStream.getVideoTracks()[0].readyState === 'ended') && <div className={classes.videoOverlay}></div>}
              <Typography className={classes.videoUserName}>{`You(${this.props.userName})`}</Typography>
            </Grid>
            <Grid item xs={12} md={6} className={classes.videoItem}>
              <video className={classes.video} ref={this.remoteVideoRef} autoPlay controls={false} ></video>
              { (this.state.remoteVideoStream.getVideoTracks().length === 0 || this.state.remoteVideoStream.getVideoTracks()[0].readyState === 'ended' || this.state.enableVideoOverlay) && <div className={classes.videoOverlay}></div>}
              <Typography className={classes.videoUserName}>{this.props.peerUserName ? this.props.peerUserName.userName : ''}</Typography>
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
              { this.state.videoCamOff && <Fab className={classes.videoAction} color="secondary" aria-label="videoCamOff" onClick={() => this.handleVideoCamOff(false)}>
                <VideocamOff />
              </Fab> }

              {/* Video Cam On */}
              { !this.state.videoCamOff && <Fab className={classes.videoAction} aria-label="videoCamOn" onClick={() => this.handleVideoCamOff(true)}>
                <Videocam />
              </Fab> }
            </Grid>
            <Grid item>
              {/* Mic Off */}
              { this.state.micOff && <Fab className={classes.videoAction} color="secondary" aria-label="micOff" onClick={() => this.handleMicOff(false)}>
                <MicOff />
              </Fab> }

              {/* Mic On */}
              { !this.state.micOff && <Fab className={classes.videoAction} aria-label="micOn" onClick={() => this.handleMicOff(true)}>
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
