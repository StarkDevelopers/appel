import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { Grid, InputBase, Typography, IconButton, Modal, Snackbar } from '@material-ui/core';
import { Send, AttachFile, VideoCall, FiberManualRecord, GetApp } from '@material-ui/icons';
import { connect } from 'react-redux';

import ChatRoomCSS from '../ChatRoomCSS';
import FileUploadPicker from '../file-upload/FileUploadPicker';

class MessageRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: '',
      fileUploadOpen: false,
      showAlert: false,
      showAlertMessage: ''
    };
    this.handleMessage = this.handleMessage.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.handleOpenFileUpload = this.handleOpenFileUpload.bind(this);
    this.onFileUploadError = this.onFileUploadError.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
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

  handleOpenFileUpload() {
    const fileUploadOpen = !this.state.fileUploadOpen;
    this.setState({
      fileUploadOpen
    });
  }

  onFileUploadError() {
    this.setState({
      showAlert: true,
      showAlertMessage: 'File upload failed. Please try again later.'
    });
  }

  handleAlertClose() {
    this.setState({
      showAlert: false,
      showAlertMessage: ''
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
            <Grid item>
              <IconButton className={classes.submitButton} aria-label="videocall" disabled={this.props.waitingForPeer} onClick={this.props.calling}>
                <VideoCall className={classes.icon} />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
        {/* Chat Messages */}
        <Grid item className={classes.messagesBox}>
          <Grid container className={classes.messagesContainer}>
            <Grid item className={classes.messages}>
              {this.props.messages.map((message, index) => (
                <div className={classes.mBox} key={index}>
                  { message.type && ['CALL', 'PEER_JOINED', 'PEER_LEFT'].indexOf(message.type) > -1 && <Typography className={classes.peerJoinedStatus}>
                        {message.m}
                      </Typography> }
                  { message.type && message.type === 'FILE' && <React.Fragment>
                      <Typography className={classes.senderName}>
                        {message.from}
                      </Typography>
                      <div className={classes.fileContainer}>
                        <Typography className={classes.fileName}>
                          {message.originalFileName}
                        </Typography>
                        <Typography className={classes.fileSize}>
                          {message.fileSize}
                        </Typography>
                        <IconButton className={classes.fileDownload} aria-label="download-file">
                          <a
                            href={`/api/download-file/${this.props.roomName}/${message.fileName}/${message.originalFileName}`}
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
                  disabled={this.props.waitingForPeer} />
              </Grid>
              <Grid item>
                <IconButton className={classes.submitButton} aria-label="attachfile" disabled={this.props.waitingForPeer} color="primary" onClick={this.handleOpenFileUpload}>
                  <AttachFile className={classes.icon} />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton type="submit" className={classes.submitButton} aria-label="send" disabled={this.props.waitingForPeer} color="primary">
                  <Send className={classes.icon} />
                </IconButton>
              </Grid>
            </Grid>
          </form>
        </Grid>
        <Modal
          open={this.state.fileUploadOpen}
          aria-labelledby="File Upload"
          aria-describedby="File Upload"
        >
          <FileUploadPicker onClose={this.handleOpenFileUpload} onUploaded={this.props.onUploaded} onFileUploadError={this.onFileUploadError} />
        </Modal>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          key={`top,center`}
          open={this.state.showAlert}
          onClose={this.handleAlertClose}
          message={this.state.showAlertMessage}
        />
      </Grid>
    );
  }
}

const style = reactTheme => createStyles(ChatRoomCSS(reactTheme));

const mapStateToProps = state => {
  return {
    roomName: state.roomName,
    messages: state.messages,
    waitingForPeer: state.waitingForPeer
  };
};

const mapDispatchToProps = dispatch => {
  return {}
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(MessageRoom));
