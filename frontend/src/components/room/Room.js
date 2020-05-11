import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import JoinRoom from './join-room/JoinRoom';
import ChatRoom from './chat-room/ChatRoom';

class Room extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        { !this.props.joinedRoom && <JoinRoom props={this.props} />}
        { this.props.joinedRoom && <ChatRoom />}
      </React.Fragment>
    );
  }
}

const style = reactTheme => createStyles({
});

const mapStateToProps = state => {
  return {
    joinedRoom: state.joinedRoom
  };
};

const mapDispatchToProps = dispatch => {
  return {
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(Room));
