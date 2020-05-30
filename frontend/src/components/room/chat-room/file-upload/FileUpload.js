export default (file, fileSize, roomName, onUploaded, onFileUploadError) => {
  const formData = new FormData();
  formData.append('file', file);

  fetch(`/api/upload-file/${roomName}`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.filename) {
        return onUploaded(file.name, data.filename, fileSize);
      }
      return onFileUploadError();
    })
    .catch(error => {
      console.error('Error while uploading file', error);
      return onFileUploadError();
    });
}
