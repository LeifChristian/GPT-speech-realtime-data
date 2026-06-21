const path = require('path');

const pkg = require(path.join(__dirname, '..', '..', 'package.json'));

/** App release version (major.minor). Bump in root package.json. */
const APP_VERSION = pkg.version;

module.exports = { APP_VERSION };
