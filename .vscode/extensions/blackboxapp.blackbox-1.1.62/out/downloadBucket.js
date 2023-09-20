const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { decompress } = require('./compressFolder');

const downloadUrl = ``;

module.exports.downloadFile = async function downloadFile(extensionPath, filename = 'node_modules.tgz', dec = true) {
  const localFilePath = path.join(extensionPath, 'out', 'browser-renderer', filename);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    console.log('error to download the file');
    return;
  }
  return new Promise((resolve, reject) => {
    try {
      const fileStream = fs.createWriteStream(localFilePath);
      response.body.pipe(fileStream);

      fileStream.on('finish', () => {
        console.log('File downloaded successfully.');

      if (dec) {
          return resolve(decompress(extensionPath, filename));
        }
        return resolve();
      });

      fileStream.on('error', err => {
        console.error('Error writing to file:', err);
        return reject(err);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  });
};

// const extensionPath = process.argv[2];
// module.exports.downloadFile(extensionPath||process.cwd(), 'node_modules.tgz', true);
// module.exports.downloadFile(process.cwd(), 'node.exe.tgz', true);
