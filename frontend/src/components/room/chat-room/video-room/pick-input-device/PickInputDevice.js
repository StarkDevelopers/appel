import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Typography, Fab, Snackbar } from '@material-ui/core';
import { createStyles, withStyles, createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Clear, Refresh, Update } from '@material-ui/icons';

import MediaDevices from '../MediaDevices';
import VideoConstraints from '../VideoConstraints';

class PickInputDevice extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.state = {
      audioDevice: '',
      videoDevice: '',
      audioDevices: [],
      videoDevices: [],
      audioDoesNotExist: false,
      videoDoesNotExist: false,
      showAlert: false,
      showAlertMessage: ''
    };
    this.videoStream = null;

    this.initDevices = this.initDevices.bind(this);
    this.handleVideoInputChange = this.handleVideoInputChange.bind(this);
    this.handleAudioInputChange = this.handleAudioInputChange.bind(this);
    this.refreshStream = this.refreshStream.bind(this);
    this.makeCall = this.makeCall.bind(this);
    this.showAlertMediaDevices = this.showAlertMediaDevices.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
  }

  async initDevices() {
    try {
      const {
        audioDevices,
        videoDevices,
        stream,
        audioDoesNotExist,
        videoDoesNotExist
      } = await MediaDevices();

      if (stream) {
        stream.getTracks().forEach(t => t.stop());

        if (audioDevices.concat(videoDevices).findIndex(d => !d.label) > -1) {
          return this.initDevices();
        }
      }

      // Reset Audio-Video devices if they are in use and they are not available anymore
      let audioDevice = audioDevices.find(d => d.deviceId === this.state.audioDevice);
      audioDevice = audioDevice ? audioDevice.deviceId : '';
      let videoDevice = videoDevices.find(d => d.deviceId === this.state.videoDevice);
      videoDevice = videoDevice ? videoDevice.deviceId : '';

      if (!audioDevice || !videoDevice) {
        const audioDeviceToUse = audioDevice ? Object.assign({}, VideoConstraints, { deviceId: { exact: audioDevice } }) : VideoConstraints;
        const videoDeviceToUse = videoDevice ? { deviceId: { exact: videoDevice } } : true;
        this.refreshStream(audioDeviceToUse, videoDeviceToUse, audioDoesNotExist, videoDoesNotExist);
      }

      this.showAlertMediaDevices(audioDoesNotExist, videoDoesNotExist);
      this.setState({
        audioDevice,
        videoDevice,
        audioDevices,
        videoDevices,
        audioDoesNotExist,
        videoDoesNotExist
      });
    } catch (error) {
      console.log(error);
      this.setState({
        showAlert: true,
        showAlertMessage: 'Error while getting devices. Try again later.'
      });
    }
  }

  componentDidMount() {
    this.initDevices();
  }

  componentWillUnmount() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
    }
  }

  refreshStream(audioDevice, videoDevice, audioDoesNotExist, videoDoesNotExist) {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
    }

    if (!audioDoesNotExist || !videoDoesNotExist) {
      navigator.mediaDevices.getUserMedia({ audio: !audioDoesNotExist ? audioDevice : false, video: !videoDoesNotExist ? videoDevice : false })
        .then(stream => {
          this.videoStream = stream;
          if ('srcObject' in this.videoRef.current) {
            this.videoRef.current.srcObject = stream;
          } else {
            this.videoRef.current.src = window.URL.createObjectURL(stream);
          }
        })
        .catch(error => {
          console.error(error);
        });
    }
  }

  handleVideoInputChange(e) {
    this.setState({
      videoDevice: e.target.value
    });
    if (e.target.value) {
      const audioDevice = this.state.audioDevice ? { deviceId: { exact: this.state.audioDevice } } : true;
      const videoDevice = Object.assign({}, VideoConstraints, { deviceId: { exact: e.target.value } });

      this.refreshStream(audioDevice, videoDevice, this.state.audioDoesNotExist, this.state.videoDoesNotExist);
    }
  }

  handleAudioInputChange(e) {
    this.setState({
      audioDevice: e.target.value
    });
    if (e.target.value) {
      const videoDevice = this.state.videoDevice ? Object.assign({}, VideoConstraints, { deviceId: { exact: e.target.value } }) : VideoConstraints;
      const audioDevice = { deviceId: { exact: e.target.value } };

      this.refreshStream(audioDevice, videoDevice, this.state.audioDoesNotExist, this.state.videoDoesNotExist);
    }
  }

  showAlertMediaDevices(audioDoesNotExist, videoDoesNotExist) {
    if (audioDoesNotExist && videoDoesNotExist) {
      this.setState({
        showAlert: true,
        showAlertMessage: 'Video Cam and Mic do not exist'
      });
    } else if (audioDoesNotExist) {
      this.setState({
        showAlert: true,
        showAlertMessage: 'Mic does not exist'
      });
    } else if (videoDoesNotExist) {
      this.setState({
        showAlert: true,
        showAlertMessage: 'Video Cam does not exist'
      });
    }
  }

  makeCall() {
    this.props.onClose(
      true,
      this.state.audioDevice,
      this.state.videoDevice,
      this.state.audioDoesNotExist,
      this.state.videoDoesNotExist
    );
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
      <Grid container justify="center" alignItems="center" className={classes.container}>
        <Grid item xs={11} sm={9} md={5} lg={4} xl={3} className={classes.box}>
          <Grid container>
            <Grid item className={classes.title}>
              <Typography>Select Input Devices</Typography>
            </Grid>
            <Grid item>
              <Clear onClick={() => this.props.onClose(false)} className={classes.icon} />
            </Grid>
          </Grid>
          <Grid container justify="center" alignItems="center" className={classes.selectContainer}>
            <Grid item className={classes.flexGrow}>
              <ThemeProvider theme={selectStyle}>
                <FormControl variant="filled" className={classes.select}>
                  <InputLabel id="select-video-device" className={classes.label}>Select Input Video Device</InputLabel>
                  <Select
                    labelId="select-video-device"
                    value={this.state.videoDevice}
                    onChange={this.handleVideoInputChange}
                  >
                    {this.state.videoDevices.map((v, index) => (
                      <MenuItem key={index} value={v.deviceId}>{v.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </ThemeProvider>
            </Grid>
            <Grid item>
              <Refresh onClick={this.initDevices} className={classes.icon} />
            </Grid>
          </Grid>
          <Grid container justify="center" alignItems="center" className={classes.selectContainer}>
            <Grid item className={classes.flexGrow}>
              <ThemeProvider theme={selectStyle}>
                <FormControl variant="filled" className={classes.select}>
                  <InputLabel id="select-audio-device" className={classes.label}>Select Input Audio Device</InputLabel>
                  <Select
                    labelId="select-audio-device"
                    value={this.state.audioDevice}
                    onChange={this.handleAudioInputChange}
                  >
                    {this.state.audioDevices.map((v, index) => (
                      <MenuItem key={index} value={v.deviceId}>{v.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </ThemeProvider>
            </Grid>
            <Grid item>
              <Refresh onClick={this.initDevices} className={classes.icon} />
            </Grid>
          </Grid>
          <video className={classes.video} ref={this.videoRef} autoPlay={true} controls={false} playsInline={true} ></video>
          <Grid container justify="center" alignItems="center" spacing={2}>
            <Grid item>
              <Fab aria-label="call" onClick={this.makeCall} className={classes.greenCallBtn}>
                <Update />
              </Fab>
            </Grid>
          </Grid>
        </Grid>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          key={`top,center`}
          open={this.state.showAlert}
          onClose={this.handleAlertClose}
          message={this.state.showAlertMessage}
        />
      </Grid>
    )
  }
}

const style = reactTheme => createStyles({
  container: {
    width: '100%',
    height: '100%',
    color: '#FFFFFF',
    fontFamily: '"Ubuntu", sans-serif',
    textAlign: 'center'
  },
  box: {
    boxShadow: '8px 8px 8px 1px #666666',
    backgroundColor: '#333333',
    padding: '1rem'
  },
  title: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    flexGrow: '1'
  },
  icon: {
    cursor: 'pointer'
  },
  selectContainer: {
    textAlign: 'left',
    marginBottom: '1rem'
  },
  flexGrow: {
    flexGrow: '1',
    paddingRight: '0.5rem'
  },
  select: {
    width: '100%'
  },
  label: {
    color: '#FFFFFF'
  },
  video: {
    transform: 'scaleX(-1)',
    width: '80%',
    maxHeight: '20rem',
    marginBottom: '1rem',
    pointerEvents: 'none'
  },
  greenCallBtn: {
    backgroundColor: '#4caf50'
  }
});

const selectStyle = createMuiTheme({
  palette: {
    primary: {
      main: '#FFFFFF'
    },
    text: {
      primary: '#FFFFFF'
    },
    background: {
      paper: '#666666'
    }
  }
});

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {}
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(PickInputDevice));
