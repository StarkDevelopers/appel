function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function getStream(getAudio, getVideo) {
  return navigator.mediaDevices.getUserMedia({ audio: getAudio, video: getVideo })
}

export default async () => {
  let stream = null;

  const devices = await getDevices();
  const audioDevices = devices.filter(d => d.kind === 'audioinput');
  const videoDevices = devices.filter(d => d.kind === 'videoinput');

  let audioDoesNotExist = false;
  let videoDoesNotExist = false;

  if (audioDevices.length === 0 && videoDevices.length === 0) {
    audioDoesNotExist = true;
    videoDoesNotExist = true;
  } else if (audioDevices.length === 0) {
    audioDoesNotExist = true;
    videoDoesNotExist = false;
  } else if (videoDevices.length === 0) {
    audioDoesNotExist = false;
    videoDoesNotExist = true;
  }

  if (!audioDoesNotExist || !videoDoesNotExist) {
    // Permission to access
    stream = await getStream(!audioDoesNotExist, !videoDoesNotExist);
  }

  return {
    audioDevices,
    videoDevices,
    audioDoesNotExist,
    videoDoesNotExist,
    stream
  };
}