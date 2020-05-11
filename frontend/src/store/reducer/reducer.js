const initialState = {
  roomName: '',
  userName: '',
  joinedRoom: false
};

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ROOM_USER_NAME_CHANGE':
      return {
        roomName: action.data.roomName,
        userName: action.data.userName,
        joinedRoom: true
      }
    default:
      return state;
  }
}
