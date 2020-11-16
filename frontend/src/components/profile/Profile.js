import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography, Button, Snackbar, Grid, Avatar, Container, InputBase } from '@material-ui/core';
import { connect } from 'react-redux';
import fetchServer from '../../utils/fetchServer';
import { STYLES } from '../../styles/styles';

class Room extends React.Component {
  constructor() {
    super();

    this.state = {
      showAlert: false,
      showAlertMessage: '',
      roomName: ''
    };
    this.roomNameRegex = new RegExp(/^\w[0-9a-zA-Z-_]{4,22}\w$/);
    this.roomNameMessage = 'Room name should only contain letters, numbers, hyphen(-) & underscore(_) and length should be between 6 to 24.';

    this.logout = this.logout.bind(this);
    this.roomNameChange = this.roomNameChange.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
  }

  logout(e) {
    e.stopPropagation();
    e.preventDefault();

    fetchServer({ path: '/api/logout',
      method: 'GET',
      headers:{
        "accepts":"application/json"
      }
    })
    .then(response => {
      console.log('Logged out');
    })
    .catch(error => {
      console.error(`Failed to logout: ${error.message}`);
      this.setState({
        showAlert: true
      });
    });
  }

  roomNameChange(event) {
    this.setState({
      roomName: event.target.value
    });
  }

  joinRoom() {
    const { roomName } = this.state;
    if (!this.roomNameRegex.test(roomName)) {
      roomName && this.setState({
        showAlert: true,
        showAlertMessage: this.roomNameMessage
      });
      return;
    }
    this.props.history.replace(`/room/${this.state.roomName}`);
    this.props.onRoomUserNameChange(roomName, this.props.profile.name);
  }

  handleAlertClose() {
    this.setState({
      showAlert: false,
      showAlertMessage: ''
    });
  }

  render() {
    const { classes, profile } = this.props;
    return (
      <React.Fragment>
        <AppBar position="static" className={classes.appBar}>
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              xPert.ly
            </Typography>
            {
              profile.picture &&
              <Avatar alt={profile.name} src={profile.picture} />
            }
            <Button color="inherit">
              <a href="/api/logout" className={classes.logoutLink}>Logout</a>
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md">
          <Grid
            className={classes.profileContainer}
            container
            direction="row"
            justify="center"
            alignItems="flex-start"
          >
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                Hello, {profile.name}
              </Typography>
            </Grid>
          </Grid>
          {/* JOIN ROOM */}
          <Grid container justify="flex-start" alignItems="flex-start" className={classes.roomContainer}>
            <Grid item xs={11} sm={9} md={6} className={classes.box}>
              <Grid container justify="center">
                <Grid item xs={12} className={classes.roomInput}>
                  <InputBase
                    className={classes.roomField}
                    type="text"
                    value={this.state.roomName}
                    onChange={this.roomNameChange}
                    placeholder="Room Name" />
                </Grid>
                <Grid item xs={12} className={classes.roomInput}>
                  <Typography className={classes.buttonField} onClick={this.joinRoom}>
                    Join
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          key={`top,center`}
          open={this.state.showAlert}
          onClose={this.handleAlertClose}
          message={this.state.showAlertMessage}
        />
      </React.Fragment>
    );
  }
}

const style = reactTheme => createStyles({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: reactTheme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  logoutLink: {
    textDecoration: 'none',
    color: '#FFFFFF'
  },
  appBar: {
    backgroundColor: '#333333'
  },
  profileContainer: {
    marginTop: '8px'
  },
  box: {
    padding: '1rem',
    backgroundColor: '#333333',
    boxShadow: '8px 8px 8px 1px #666666'
  },
  roomContainer: {
    color: '#FFFFFF',
    marginTop: '0.75rem'
  },
  roomInput: {
    marginTop: '0.75rem'
  },
  roomField: Object.assign({
    marginBottom: '1rem'
  }, STYLES.inputField),
  buttonField: Object.assign({
    marginBottom: '0.25rem'
  }, STYLES.buttonField)
});

const mapStateToProps = state => {
  return {
    profile: state.profile
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onRoomUserNameChange: (roomName, userName) => dispatch({ type: 'ROOM_USER_NAME_CHANGE', data: { roomName, userName } }),
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(Room));
