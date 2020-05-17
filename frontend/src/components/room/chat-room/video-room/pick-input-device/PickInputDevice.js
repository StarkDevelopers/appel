import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Typography, Fab } from '@material-ui/core';
import { createStyles, withStyles, createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Clear, Refresh, Call, Videocam, VideocamOff, Mic, MicOff } from '@material-ui/icons';

class PickInputDevice extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.state = {
      audioDevice: '',
      videoDevice: '',
      audioDevices: [],
      videoDevices: [],
      videoCamOff: false,
      micOff: false
    };
    this.videoStream = null;

    this.initDevices = this.initDevices.bind(this);
    this.handleVideoInputChange = this.handleVideoInputChange.bind(this);
    this.handleAudioInputChange = this.handleAudioInputChange.bind(this);
    this.refreshStream = this.refreshStream.bind(this);
    this.handleVideoCamOff = this.handleVideoCamOff.bind(this);
    this.handleMicOff = this.handleMicOff.bind(this);
    this.makeCall = this.makeCall.bind(this);
  }

  initDevices() {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioDevices = devices.filter(d => d.kind === 'audioinput');
        const videoDevices = devices.filter(d => d.kind === 'videoinput');

        let audioDevice = '';
        let videoDevice = '';
        if (this.state.audioDevice || this.state.videoDevice) {
          // Reset Audio-Video devices if they are in use and they are not available anymore
          audioDevice = devices.find(d => d.deviceId === this.state.audioDevice);
          audioDevice = audioDevice ? audioDevice.deviceId : '';
          videoDevice = devices.find(d => d.deviceId === this.state.videoDevice);
          videoDevice = videoDevice ? videoDevice.deviceId : '';

          if (!audioDevice || !videoDevice) {
            const audioDeviceToUse = audioDevice ? { deviceId: { exact: audioDevice } } : false;
            const videoDeviceToUse = videoDevice ? { deviceId: { exact: videoDevice } } : false;
            this.refreshStream(audioDeviceToUse, videoDeviceToUse);
          }
        }
        
        this.setState({
          audioDevice,
          videoDevice,
          audioDevices,
          videoDevices
        });
      })
      .catch(error => {
        console.error(error);
      });
  }

  componentDidMount() {
    this.initDevices();
  }

  componentWillUnmount() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
    }
  }

  refreshStream(audioDevice, videoDevice) {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
    }

    navigator.mediaDevices.getUserMedia({ audio: audioDevice, video: videoDevice })
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

  handleVideoInputChange(e) {
    this.setState({
      videoDevice: e.target.value
    });
    if (e.target.value) {
      const audioDevice = this.state.audioDevice ? { deviceId: { exact: this.state.audioDevice } } : false;
      const videoDevice = { deviceId: { exact: e.target.value } };

      this.refreshStream(audioDevice, videoDevice);
    }
  }

  handleAudioInputChange(e) {
    this.setState({
      audioDevice: e.target.value
    });
    if (e.target.value) {
      const videoDevice = this.state.videoDevice ? { deviceId: { exact: this.state.videoDevice } } : false;
      const audioDevice = { deviceId: { exact: e.target.value } };

      this.refreshStream(audioDevice, videoDevice);
    }
  }

  handleVideoCamOff(off = true) {
    this.setState({
      videoCamOff: off
    });
  }

  handleMicOff(off = true) {
    this.setState({
      micOff: off
    });
  }

  makeCall() {
    this.props.onClose(
      this.state.audioDevice,
      this.state.videoDevice,
      this.state.videoCamOff,
      this.state.micOff
    );
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
              <Clear onClick={this.props.onClose} className={classes.icon} />
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
          <video className={classes.video} ref={this.videoRef} autoPlay controls={false}></video>
          <Grid container justify="center" alignItems="center" spacing={2}>
            <Grid item>
              {/* Video Cam Off */}
              { this.state.videoCamOff && <Fab color="secondary" aria-label="videoCamOff" onClick={() => this.handleVideoCamOff(false)}>
                <VideocamOff />
              </Fab> }

              {/* Video Cam On */}
              { !this.state.videoCamOff && <Fab aria-label="videoCamOn" onClick={() => this.handleVideoCamOff(true)}>
                <Videocam />
              </Fab> }
            </Grid>
            <Grid item>
              {/* Mic Off */}
              { this.state.micOff && <Fab color="secondary" aria-label="micOff" onClick={() => this.handleMicOff(false)}>
                <MicOff />
              </Fab> }

              {/* Mic On */}
              { !this.state.micOff && <Fab aria-label="micOn" onClick={() => this.handleMicOff(true)}>
                <Mic />
              </Fab> }
            </Grid>
            <Grid item>
              <Fab aria-label="call" onClick={this.makeCall} className={classes.greenCallBtn}>
                <Call />
              </Fab>
            </Grid>
          </Grid>
        </Grid>
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
    marginBottom: '1rem'
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
