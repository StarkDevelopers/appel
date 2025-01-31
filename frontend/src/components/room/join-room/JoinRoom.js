import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { Grid, InputBase, Typography, Snackbar } from '@material-ui/core';
import { STYLES } from '../../../styles/styles';
import { connect } from 'react-redux';

class JoinRoom extends React.Component {
  constructor(props) {
    super(props);
    let roomName;
    let userName;
    try {
      roomName = props.props.match.params.roomName || '';
    } catch (error) {
      console.warn('Error while getting Route Param', error);
      roomName = '';
    }
    try {
      userName = props.props.match.params.userName || '';
    } catch (error) {
      console.warn('Error while getting Route Param', error);
      userName = '';
    }
    this.state = {
      roomName,
      userName,
      showAlert: false,
      showAlertMessage: ''
    };
    this.roomNameRegex = new RegExp(/^\w[0-9a-zA-Z-_]{4,22}\w$/);
    this.userNameRegex = new RegExp(/^\w[0-9a-zA-Z-_ ]{1,34}\w$/);
    this.roomNameMessage = 'Room name should only contain letters, numbers, hyphen(-) & underscore(_) and length should be between 6 to 24.';
    this.userNameMessage = 'User name should only contain letters, numbers, space, hyphen(-) & underscore(_) and length should be between 3 to 36.';
    this.roomNameChange = this.roomNameChange.bind(this);
    this.userNameChange = this.userNameChange.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);

    this.joinRoom();
  }

  componentDidMount() {
    if (this.props.roomFull) {
      this.setState({
        showAlert: true,
        showAlertMessage: 'Room is full'
      });
      this.props.roomFullReset();
    }
    if (this.props.chatTimeout) {
      this.setState({
        showAlert: true,
        showAlertMessage: 'Time limit of 1 Hour exceeded'
      });
      this.props.chatTimeoutReset();
    }
  }

  roomNameChange(event) {
    this.setState({
      roomName: event.target.value
    });
  }

  userNameChange(event) {
    this.setState({
      userName: event.target.value
    });
  }

  joinRoom() {
    const { roomName, userName } = this.state;
    if (!this.roomNameRegex.test(roomName)) {
      roomName && this.setState({
        showAlert: true,
        showAlertMessage: this.roomNameMessage
      });
      return;
    }
    if (!this.userNameRegex.test(userName)) {
      userName && this.setState({
        showAlert: true,
        showAlertMessage: this.userNameMessage
      });
      return;
    }
    this.props.props.history.replace(`/room/${this.state.roomName}`);
    this.props.onRoomUserNameChange(roomName, userName);
  }

  handleAlertClose() {
    this.setState({
      showAlert: false
    });
  }

  render() {
    const { classes } = this.props;
    return (
      <Grid container justify="center" alignItems="center" className={classes.container}>
        <Grid item xs={11} sm={9} md={5} lg={4} xl={3} className={classes.box}>
          <Grid container justify="center">
            <Grid item xs={12} className={classes.title}>
              Xpert.ly
            </Grid>
            <Grid item xs={12} className={classes.room}>
              <InputBase
                className={classes.roomField}
                type="text"
                value={this.state.roomName}
                onChange={this.roomNameChange}
                placeholder="Room Name" />
            </Grid>
            <Grid item xs={12} className={classes.room}>
              <InputBase
                className={classes.roomField}
                type="text"
                value={this.state.userName}
                onChange={this.userNameChange}
                placeholder="Join As" />
            </Grid>
            <Grid item xs={12} className={classes.room}>
              <Typography className={classes.buttonField} onClick={this.joinRoom}>
                Join
              </Typography>
            </Grid>
            {
              !this.props.isAuthenticated &&
              <Grid item xs={12} className={classes.room}>
                <Typography className={classes.buttonField}>
                  <a href="/api/sign-in" className={classes.signInLink}>Sign in with Google</a>
                </Typography>
              </Grid>
            }
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
    );
  }
}

const style = reactTheme => createStyles({
  container: {
    height: '100%',
    color: '#FFFFFF'
  },
  box: STYLES.box,
  title: STYLES.title,
  room: {
    marginTop: '0.75rem'
  },
  roomField: Object.assign({
    marginBottom: '1rem'
  }, STYLES.inputField),
  buttonField: Object.assign({
    marginBottom: '0.25rem'
  }, STYLES.buttonField),
  signInLink: {
    textDecoration: 'none',
    color: '#333333'
  }
});

const mapStateToProps = state => {
  return {
    roomName: state.roomName,
    userName: state.userName,
    roomFull: state.roomFull,
    chatTimeout: state.chatTimeout,
    isAuthenticated: state.isAuthenticated,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onRoomUserNameChange: (roomName, userName) => dispatch({ type: 'ROOM_USER_NAME_CHANGE', data: { roomName, userName } }),
    roomFullReset: () => dispatch({ type: 'ROOM_FULL_UNSET' }),
    chatTimeoutReset: () => dispatch({ type: 'TIMEOUT_UNSET' })
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(JoinRoom));
