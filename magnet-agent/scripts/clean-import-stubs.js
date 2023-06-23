const { unlink, readdir, rmdir } = require('fs/promises');
const path = require('path');

const { sync: walkSync } = require('walkdir');

const BASE_PATH = path.resolve(__dirname, '..');

const STUB_DIRECTORIES = ['.', 'containers'].map((dir) =>
  path.resolve(BASE_PATH, dir)
);
const STUB_EXTENSIONS = ['.js', '.d.ts'];

function getExtension(filePath) {
  const parts = filePath.split('.');
  if (parts.length > 1) {
    return `.${parts.slice(1).join('.')}`;
  }
  return '';
}

(async () => {
  const paths = walkSync(BASE_PATH).filter((p) => {
    const ext = getExtension(p);
    const dir = path.dirname(p);
    return STUB_DIRECTORIES.includes(dir) && STUB_EXTENSIONS.includes(ext);
  });

  await Promise.all(paths.map((p) => unlink(p)));

  await Promise.all(
    STUB_DIRECTORIES.map(async (dir) => {
      try {
        const files = await readdir(dir);
        if (files.length === 0) {
          await rmdir(dir);
        }
      } catch (e) {
        // Directory exists
      }
    })
  );
})();
