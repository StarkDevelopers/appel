import { STYLES } from '../../../styles/styles';

export default (reactTheme) => {
  return {
    container: {
      height: '100%'
    },
    box: {
      height: '100%',
      padding: '1rem',
      [reactTheme.breakpoints.down('md')]: {
        padding: '0'
      }
    },
    chatContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      color: '#FFFFFF',
      boxShadow: '8px 8px 8px 1px #666666'
    },
    titleBox: {
      backgroundColor: '#333333',
      height: '3rem'
    },
    roomTitleFlex: {
      flexGrow: '1',
      padding: '0.75rem'
    },
    roomTitle: {
      display: 'inline',
      fontSize: '1rem',
      marginRight: '0.5rem'
    },
    roomDeactivateStatus: {
      display: 'inline',
      fontSize: '0.75rem',
      color: '#b96959'
    },
    roomActivateStatus: {
      display: 'inline',
      fontSize: '0.75rem',
      color: '#a3c463'
    },
    messagesBox: {
      backgroundColor: '#999999',
      flex: '1 1 auto',
      overflowY: 'auto',
      minHeight: '0px',
      height: 'calc(100% - 6rem)'
    },
    messagesContainer: {
      height: '100%'
    },
    messages: {
      alignSelf: 'flex-end',
      width: '100%'
    },
    messageInputBox: {
      backgroundColor: '#333333',
      height: '3rem'
    },
    messageInput: {
      flexGrow: '1'
    },
    roomField: Object.assign(
      {},
      STYLES.inputField,
      {
        fontSize: '1rem',
        padding: '1rem'
      }
    ),
    submitButton: {
      padding: '0',
      color: '#FFFFFF',
      '&:disabled': {
        color: '#999999'
      }
    },
    icon: {
      height: '2rem',
      padding: '0.5rem'
    },
    mBox: {
      margin: '0rem 1.5rem 0.5rem 1.5rem'
    },
    peerJoinedStatus: {
      textAlign: 'center',
      fontSize: '0.75rem'
    },
    senderName: {
      color: '#333333',
      fontSize: '0.75rem',
      fontWeight: 'bold'
    },
    messageContent: {
      color: '#999999',
      backgroundColor: '#333333',
      padding: '0.25rem 1rem',
      fontSize: '1rem',
      borderRadius: '1rem',
      display: 'inline-block'
    },
    videoActionBox: {
      backgroundColor: '#999999',
      height: '5rem',
      paddingTop: '0.5rem',
      paddingBottom: '0.5rem'
    },
    videoAction: {
      width: '3rem',
      height: '3rem',
      margin: '0 1rem'
    },
    videoBox: {
      backgroundColor: '#999999',
      flex: '1 1 auto',
      overflowY: 'auto',
      minHeight: '0px',
      height: 'calc(100% - 8rem)',
      position: 'relative'
    },
    videoContainer: {
      height: '100%',
      position: 'relative'
    },
    videoItem: {
      width: '100%',
      padding: '0.5rem',
      position: 'relative'
    },
    pictureInPicture: {
      width: '100%',
      padding: '0.5rem',
      position: 'relative',
      [reactTheme.breakpoints.down('xs')]: {
        position: 'absolute',
        bottom: '0.5rem',
        right: '0.5rem',
        width: '40%',
        height: '8rem',
        zIndex: '100'
      }
    },
    video: {
      width: '100%',
      height: '100%',
      transform: 'scaleX(-1)',
      pointerEvents: 'none'
    },
    videoOverlay: { 
      position: 'absolute',
      top: '0.5rem',
      left: '0.5rem',
      backgroundColor: '#000000',
      width: 'calc(100% - 1rem)',
      height: 'calc(100% - 1rem)'
    },
    videoUserName: {
      position: 'absolute',
      top: '0.5rem',
      left: '0.5rem',
      fontSize: '1rem',
      backgroundColor: '#333333',
      padding: '0.25rem',
      [reactTheme.breakpoints.down('xs')]: {
        display: 'none'
      }
    },
    remoteVideoUserName: {
      position: 'absolute',
      top: '0.5rem',
      left: '0.5rem',
      fontSize: '1rem',
      backgroundColor: '#333333',
      padding: '0.25rem'
    },
    pickupButton: {
      width: '36px',
      height: '36px',
      backgroundColor: '#4caf50',
      marginRight: '0.5rem'
    },
    snackbarContent: {
      backgroundColor: '#666666'
    },
    callingButton: {
      width: '36px',
      height: '36px'
    },
    callingIcon: {
      fontSize: '1rem'
    },
    videoMessagesBox: {
      position: 'absolute',
      bottom: '3rem',
      opacity: '0.85',
      backgroundColor: 'rgba(153, 153, 153, 0.6)',
      overflowY: 'auto',
      height: '33%',
      width: '100%'
    },
    videoMessageInputBox: {
      position: 'absolute',
      bottom: '0',
      backgroundColor: '#333333',
      height: '3rem',
      width: '100%'
    },
    fileContainer: {
      color: '#999999',
      backgroundColor: '#333333',
      padding: '0.25rem 1rem',
      fontSize: '1rem',
      borderRadius: '1rem',
      display: 'inline-block'
    },
    fileName: {
      display: 'inline',
      marginRight: '1rem'
    },
    fileSize: {
      display: 'inline',
      fontSize: '0.8rem',
      marginRight: '2rem'
    },
    fileDownload: {
      display: 'inline',
      padding: '0',
      color: '#FFFFFF'
    },
    downloadIcon: {
      color: '#FFFFFF',
      height: '2rem',
      padding: '0.25rem'
    }
  }
}
