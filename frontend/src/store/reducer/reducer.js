const initialState = {
  roomName: null,
  userName: null,
  peerUserName: null,
  messages: [],
  joinedRoom: false,
  waitingForPeer: true,
  inVideoCall: false,
  audioDeviceId: '',
  videoDeviceId: '',
  videoCamOff: false,
  micOff: false,
  roomFull: false,
  isAuthenticated: false,
  profile: null
};

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ROOM_USER_NAME_CHANGE':
      return {
        ...state,
        roomName: action.data.roomName,
        userName: action.data.userName,
        joinedRoom: true
      }
    case 'PEER_USER_NAME':
      return {
        ...state,
        peerUserName: { socketId: action.data.peerSocketId, userName: action.data.peerUserName }
      }
    case 'PEER_JOINED': {
      const messages = [].concat(state.messages);
      messages.push({
        type: 'PEER_JOINED',
        m: `${state.peerUserName.userName} Joined`
      });
      return {
        ...state,
        messages,
        waitingForPeer: false
      }
    }
    case 'PEER_LEFT': {
      const messages = [].concat(state.messages);
      messages.push({
        type: 'PEER_LEFT',
        m: `${state.peerUserName.userName} Left`
      });
      return {
        ...state,
        messages,
        peerUserName: null,
        waitingForPeer: true
      }
    }
    case 'JOIN_VIDEO_CALL':
      return {
        ...state,
        inVideoCall: action.join
      }
    case 'RECEIVED_MESSAGE': {
      const messages = [].concat(state.messages);
      messages.push({
        from: state.peerUserName.userName,
        m: action.message
      });
      return {
        ...state,
        messages
      }
    }
    case 'SEND_MESSAGE': {
      const messages = [].concat(state.messages);
      messages.push({
        from: 'You',
        m: action.message
      });
      return {
        ...state,
        messages
      }
    }
    case 'MAKE_CALL': {
      return {
        ...state,
        audioDeviceId: action.data.audioDeviceId,
        videoDeviceId: action.data.videoDeviceId,
        videoCamOff: action.data.videoCamOff,
        micOff: action.data.micOff
      }
    }
    case 'ADD_MESSAGE': {
      const messages = [].concat(state.messages);
      messages.push({
        type: 'CALL',
        m: action.message
      });
      return {
        ...state,
        messages
      }
    }
    case 'DISCONNECT_CALL': {
      const messages = [].concat(state.messages);
      messages.push({
        type: 'CALL',
        m: action.message
      });
      return {
        ...state,
        messages,
        inVideoCall: false
      }
    }
    case 'VIDEO_CAM_STATUS':
      return {
        ...state,
        videoCamOff: action.status
      }
    case 'MIC_STATUS':
      return {
        ...state,
        micOff: action.status
      }
    case 'FILE_UPLOADED': {
      const messages = [].concat(state.messages);
      messages.push({
        type: 'FILE',
        from: action.userName,
        originalFileName: action.originalFileName,
        fileName: action.fileName,
        fileSize: action.fileSize
      });
      return {
        ...state,
        messages
      }
    }
    case 'ROOM_FULL': {
      return {
        ...state,
        joinedRoom: false,
        roomName: null,
        userName: null,
        roomFull: true
      }
    }
    case 'ROOM_FULL_UNSET': {
      return {
        ...state,
        roomFull: false
      }
    }
    case 'TIMEOUT': {
      return {
        ...state,
        joinedRoom: false,
        roomName: null,
        userName: null,
        chatTimeout: true
      }
    }
    case 'TIMEOUT_UNSET': {
      return {
        ...state,
        chatTimeout: false
      }
    }
    case 'IS_AUTHENTICATED': {
      return {
        ...state,
        isAuthenticated: action.isAuthenticated,
        profile: action.profile
      }
    }
    default:
      return state;
  }
}
