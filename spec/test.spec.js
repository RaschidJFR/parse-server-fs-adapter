'use strict';
let filesAdapterTests = require('parse-server-conformance-tests').files;

let FileSystemAdapter = require('../index.js');

describe('Local File System Tests', () => {
  var fsAdapter = new FileSystemAdapter({
    filesSubDirectory: 'sub1/sub2'
  });

  filesAdapterTests.testAdapter("FileSystemAdapter", fsAdapter);
});

describe('Remote Files Test', () => {
  var fsAdapter = new FileSystemAdapter({
    filesSubDirectory: 'https://example.com'
  });

  filesAdapterTests.testAdapter("FileSystemAdapter", fsAdapter);
});
