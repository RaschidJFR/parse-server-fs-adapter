'use strict';
// FileSystemAdapter
//
// Stores files in local file system
// Requires write access to the server's file system.

var fs = require('fs');
var path = require('path');
var pathSep = require('path').sep;
var axios = require('axios');

function FileSystemAdapter(options) {
  options = options || {};
  let filesSubDirectory = options.filesSubDirectory || '';
  this._filesDir = filesSubDirectory;
  this._isHttp = new RegExp(/^https?:/).test(this._filesDir);

  if(!this._isHttp) {
    this._mkdir(this._getApplicationDir());
    if(!this._applicationDirExist()) {
      throw "Files directory doesn't exist.";
    }
  }
}

FileSystemAdapter.prototype.createFile = function(filename, data) {
  return new Promise((resolve, reject) => {
    if(this._isHttp) {
      reject(new Error('Not implemented in http'));
    }

    let filepath = this._getFilePath(filename);
    fs.writeFile(filepath, data, (err) => {
      if(err !== null) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

FileSystemAdapter.prototype.deleteFile = function(filename) {
  return new Promise((resolve, reject) => {
    if(this._isHttp) {
      reject(new Error('Not implemented in http'));
    }

    let filepath = this._getFilePath(filename);
    fs.readFile( filepath , function (err, data) {
      if(err !== null) {
        return reject(err);
      }
      fs.unlink(filepath, (unlinkErr) => {
      if(err !== null) {
          return reject(unlinkErr);
        }
        resolve(data);
      });
    });

  });
}

FileSystemAdapter.prototype.getFileData = function(filename) {
  return new Promise((resolve, reject) => {
    let filepath = this._getFilePath(filename);

    if(this._isHttp){
      return axios.get(filepath, { responseType: 'arraybuffer' })
        .then(function (response) {
          resolve(Buffer.from(response.data, 'binary'));
        })
        .catch(reject);

    }else{
      fs.readFile( filepath , function (err, data) {
        if(err !== null) {
          return reject(err);
        }
        resolve(data);
      });
    }
  });
}

FileSystemAdapter.prototype.getFileLocation = function(config, filename) {
  return config.mount + '/files/' + config.applicationId + '/' + encodeURIComponent(filename);
}

/*
  Helpers
 --------------- */
FileSystemAdapter.prototype._getApplicationDir = function() {
  if(this._isHttp){
    return this._filesDir;
  } else if (this._filesDir) {
    return path.join('files', this._filesDir);
  } else {
    return 'files';
  }
}

FileSystemAdapter.prototype._applicationDirExist = function() {
  if(this._isHttp) {
    throw new Error('Not implemented in http');
  }
  return fs.existsSync(this._getApplicationDir());
}

FileSystemAdapter.prototype._getFilePath = function(filename) {
  let applicationDir = this._getApplicationDir();
  if(this._isHttp){
    return (applicationDir + '/').replace(/\/\/$/,'/') + encodeURIComponent(filename);
  } else {
    if (!fs.existsSync(applicationDir)) {
      this._mkdir(applicationDir);
    }
    return path.join(applicationDir, encodeURIComponent(filename));
  }
}

FileSystemAdapter.prototype._mkdir = function(dirPath) {
  if(this._isHttp) {
    throw new Error('mkdir cannot be called for http');
  }

  // snippet found on -> https://gist.github.com/danherbert-epam/3960169
  let dirs = dirPath.split(pathSep);
  var root = "";

  while (dirs.length > 0) {
    var dir = dirs.shift();
    if (dir === "") { // If directory starts with a /, the first path will be an empty string.
      root = pathSep;
    }
    if (!fs.existsSync(path.join(root, dir))) {
      try {
        fs.mkdirSync(path.join(root, dir));
      }
      catch (e) {
        if ( e.code == 'EACCES' ) {
          throw new Error("PERMISSION ERROR: In order to use the FileSystemAdapter, write access to the server's file system is required.");
        }
      }
    }
    root = path.join(root, dir, pathSep);
  }
}

module.exports = FileSystemAdapter;
module.exports.default = FileSystemAdapter;
