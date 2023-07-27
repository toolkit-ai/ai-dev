const { execSync } = require('child_process');
const { writeFile } = require('fs/promises');
const path = require('path');

(async () => {
  const versionFile = path.join(__dirname, '..', 'lib', 'version.ts');
  const version = execSync('git rev-parse --short HEAD').toString().trim();
  const versionFileContent = `export const version = '${version}';\n`;
  await writeFile(versionFile, versionFileContent);
})();
