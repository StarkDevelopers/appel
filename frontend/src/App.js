import React from 'react';
import './App.css';
import Profile from './components/profile/Profile';
import Room from './components/room/Room';
import { Route, Redirect, Switch } from 'react-router-dom';
import CheckAuth from './components/profile/Auth';

class App extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Switch>
          <Route path="/" exact component={CheckAuth(Room, false)} />
          <Route path="/profile" exact component={CheckAuth(Profile, true)} />
          <Route path="/room/:roomName" exact component={Room} />
          <Route path="/room/:roomName/:userName" exact component={Room} />
          <Redirect to ="/" />
        </Switch>
      </React.Fragment>
    );
  }
}

export default App;
