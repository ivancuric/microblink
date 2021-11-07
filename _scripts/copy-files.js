const fs = require('fs-extra');

fs.copy('node_modules/@microblink/blinkid-in-browser-sdk/resources', 'public')
  .then(() => console.log('Copied supporting files to /public'))
  .catch((err) => console.error(err));
