import React from 'react';
import { Grid, Snackbar, Typography, Fab } from '@material-ui/core';
import { createStyles, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { Clear, Publish } from '@material-ui/icons';
import Dropzone from 'react-dropzone';
import FileUpload from './FileUpload';

class FileUploadPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      fileSize: null,
      showAlert: false,
      showAlertMessage: '',
      disableUploadButton: true
    };
    this.allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc',
      'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mp3', 'm4a', 'wav', 'mp4',
      'm4v', 'mpg', 'wmv', 'mov', 'avi', 'swf', 'xml', 'zip', 'csv', 'txt',
      'tar', 'tar.gz', 'tgz', 'log', 'json', 'log'];

    this.onDrop = this.onDrop.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  getSize(size) {
    const MB = 1024 * 1024;
    const KB = 1024;
    let sizeString = '';

    if (size >= MB) {
      const mb = parseInt(size / MB);
      size = size - (MB * mb);

      const kb = parseInt(size / KB);
      sizeString = `${mb}.${kb} MB`;
    } else if (size >= KB) {
      const kb = parseInt(size / KB);
      size = size - (KB * kb);

      sizeString = `${kb}.${size} KB`;
    } else {
      sizeString = `${size} B`;
    }

    return sizeString;
  }

  onDrop(files) {
    if (files && files.length > 0) {
      const file = files[0];
      const index = file.name.indexOf('.');
      if (index > -1) {
        const extension = file.name.substring(index + 1);
        if (this.allowedExtensions.indexOf(extension.toLowerCase()) < 0) {
          this.setState({
            file: null,
            fileSize: null,
            disableUploadButton: true,
            showAlert: true,
            showAlertMessage: `File with extension ${extension} not allowed`
          });
          return;
        }
      }
      if (file.name && file.name.length > 64) {
        this.setState({
          file: null,
          fileSize: null,
          disableUploadButton: true,
          showAlert: true,
          showAlertMessage: `File name must be less than 64 characters`
        });
        return;
      }
      const fileSize = this.getSize(file.size);
      this.setState({
        file,
        fileSize,
        disableUploadButton: false
      });
    } else {
      this.setState({
        file: null,
        fileSize: null,
        disableUploadButton: true
      });
    }
  };

  handleAlertClose() {
    this.setState({
      showAlert: false
    });
  }

  uploadFile() {
    this.setState({
      disableUploadButton: true
    });

    const formData = new FormData();
    formData.append('file', this.state.file);

    FileUpload(this.state.file, this.state.fileSize, this.props.roomName, this.props.onUploaded, this.props.onFileUploadError);

    this.setState({
      file: null,
      fileSize: null
    });
    this.props.onClose();
  }

  render() {
    const { classes } = this.props;
    return (
      <Grid container justify="center" alignItems="center" className={classes.container}>
        <Grid item xs={11} sm={9} md={5} lg={4} xl={3} className={classes.box}>
          <Grid container>
            <Grid item className={classes.title}>
              <Typography>Upload File</Typography>
            </Grid>
            <Grid item>
              <Clear onClick={this.props.onClose} className={classes.icon} />
            </Grid>
          </Grid>
          <Grid container justify="center" alignItems="center" className={classes.selectContainer}>
            <Dropzone onDrop={this.onDrop} multiple={false} maxSize={52428800}>
              {({getRootProps, getInputProps}) => (
                <section className={classes.fileContainer}>
                  <div {...getRootProps({className: classes.fileDropZone})}>
                    <input {...getInputProps()} />
                    <p>Drag 'n' drop some files here, or click to select files</p>
                  </div>
                  <Typography variant="caption" className={classes.caption}>File Size Limit: 50MB</Typography>
                  <aside className={classes.selectedFile}>
                    { this.state.file && <Typography>{this.state.file.name} - {this.state.fileSize}</Typography> }
                  </aside>
                </section>
              )}
            </Dropzone>
          </Grid>
          <Grid container justify="center" alignItems="center" spacing={2}>
            <Grid item>
              <Fab aria-label="publish" onClick={this.uploadFile} className={classes.greenCallBtn} disabled={this.state.disableUploadButton}>
                <Publish className={classes.uploadButton} />
              </Fab>
            </Grid>
          </Grid>
        </Grid>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          key={`top,center`}
          open={this.state.showAlert}
          onClose={this.handleAlertClose}
          message={this.state.showAlertMessage}
        />
      </Grid>
    )
  }
}

const style = reactTheme => createStyles({
  container: {
    width: '100%',
    height: '100%',
    color: '#FFFFFF',
    fontFamily: '"Ubuntu", sans-serif',
    textAlign: 'center'
  },
  box: {
    boxShadow: '8px 8px 8px 1px #666666',
    backgroundColor: '#333333',
    padding: '1rem'
  },
  title: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    flexGrow: '1'
  },
  icon: {
    cursor: 'pointer'
  },
  selectContainer: {
    textAlign: 'left',
    marginBottom: '1rem'
  },
  greenCallBtn: {
    backgroundColor: '#4caf50'
  },
  fileContainer: {
    width: 'calc(100% - 2rem)',
    padding: '1rem'
  },
  fileDropZone: {
    border: '1px dotted #000000',
    width: '100%',
    padding: '1rem',
    boxSizing: 'border-box'
  },
  selectedFile: {
    marginTop: '1rem'
  },
  caption: {
    textAlign: 'right',
    display: 'block'
  },
  uploadButton: {
    color: '#FFFFFF'
  }
});

const mapStateToProps = state => {
  return {
    roomName: state.roomName
  };
};

const mapDispatchToProps = dispatch => {
  return {}
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(style)(FileUploadPicker));
