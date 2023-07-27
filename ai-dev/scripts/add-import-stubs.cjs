const { writeFile, mkdir } = require('fs/promises');
const path = require('path');

const BASE_PATH = path.join(__dirname, '..');
const STUBS = [
  ['agent.js', './dist/agent/index.js'],
  ['agent.d.ts', './dist/agent/index.js'],
  ['containers/local.js', '../dist/containers/local.js'],
  ['containers/local.d.ts', '../dist/containers/local.js'],
];

(async () => {
  await Promise.all(
    STUBS.map(async ([stubPath, targetPath]) => {
      if (path.dirname(stubPath) !== '.') {
        await mkdir(path.dirname(stubPath), { recursive: true });
      }
      await writeFile(
        path.join(BASE_PATH, stubPath),
        `export * from '${targetPath}';\n`
      );
    })
  );
})();
