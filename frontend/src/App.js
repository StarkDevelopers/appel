import React from 'react';
import './App.css';
import Room from './components/room/Room';
import { Route } from 'react-router-dom';

class App extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Route path="/" exact component={Room} />
        <Route path="/:roomName" exact component={Room} />
      </React.Fragment>
    );
  }
}

export default App;
