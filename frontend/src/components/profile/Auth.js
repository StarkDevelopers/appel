import React from 'react';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { connect } from 'react-redux';
import Lottie from 'react-lottie';
import loaderData from '../../styles/loader.json';
import fetchServer from '../../utils/fetchServer';

export default function CheckAuth(Component, authenticationRequire) {
  class Auth extends React.Component {
    constructor() {
      super();

      this.state = {
        loading: true
      };

      this.defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: loaderData,
      };

      this.redirectToComponent = this.redirectToComponent.bind(this);
    }

    componentDidMount() {
      if (this.props.isAuthenticated) {
        this.redirectToComponent();
      } else {
        fetchServer({ path: '/api/isAuthenticated',
          method: 'GET',
          headers:{
            "accepts":"application/json"
          }
        })
        .then(response => {
          console.log('Authentication Successful', response);
          this.props.updateAuthentication(true, response);
          this.redirectToComponent();
        })
        .catch(error => {
          console.error(`Authentication Failed: ${error.message}`);
          if (!authenticationRequire) {
            this.setState({
              loading: false
            });
          } else {
            this.props.history.replace('/');
          }
        });
      }
    }

    redirectToComponent() {
      if (authenticationRequire) {
        this.setState({
          loading: false
        });
      } else {
        this.props.history.replace('/profile');
      }
    }

    render() {
      if (this.state.loading) {
        return <Grid
          container
          direction="row"
          justify="center"
          alignItems="center"
          style={{ height: '100vh' }}
        >
          <Lottie options={this.defaultOptions}
            height={150}
            width={150}
            isStopped={false}
          />
        </Grid>;
      }

      return <Component {...this.props} />;
    }
  }

  const style = reactTheme => createStyles({
  });

  const mapStateToProps = state => {
    return {
      isAuthenticated: state.isAuthenticated
    };
  };

  const mapDispatchToProps = dispatch => {
    return {
      updateAuthentication: (isAuthenticated, profile) => dispatch({ type: 'IS_AUTHENTICATED', isAuthenticated, profile })
    }
  };

  return connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(Auth));
}
