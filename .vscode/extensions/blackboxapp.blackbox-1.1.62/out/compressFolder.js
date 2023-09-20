const path = require('path');
const tar = require('tar');

module.exports.compress = async function compress(file = 'node_modules') {
  const inputFolder = path.join('out', 'browser-renderer', file, '');
  const outputFolder = path.join('out', 'browser-renderer', `${file}.tgz`);
  await tar.c(
    {
      gzip: true,
      file: outputFolder.toString(),
    },
    [inputFolder.toString()]
  );
};
module.exports.decompress = async function decompress(extensionPath, filename) {
  const inputFolder = path.join(extensionPath, 'out', 'browser-renderer', filename);
  const outputFolder = path.join(extensionPath);
  await tar.x({
    gzip: true,
    file: inputFolder.toString(),
    cwd: outputFolder,
    preserveOwner: true,
  });

  console.log('File decompressed successfully');
};

// module.exports.decompress(process.cwd(),'node_modules.tgz').catch(console.error);
// module.exports.compress('node.exe').catch(console.error);
