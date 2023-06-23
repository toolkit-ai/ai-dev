const { writeFile } = require('fs/promises');
const path = require('path');

const { version } = require('../package.json');

(async () => {
  const versionFile = path.join(__dirname, '..', 'lib', 'version.ts');
  const versionFileContent = `export const version = '${version}';\n`;
  await writeFile(versionFile, versionFileContent);
})();
