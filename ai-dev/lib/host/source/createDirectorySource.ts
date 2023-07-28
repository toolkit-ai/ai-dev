import { existsSync, createWriteStream, createReadStream, lstatSync } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import archiver from 'archiver';
import ignore from 'ignore';
import walkDir from 'walkdir';

const { sync: walkSync } = walkDir;

function findGitignore(currentDir: string): string | null {
  const gitignorePath = path.join(currentDir, '.gitignore');

  if (existsSync(gitignorePath)) {
    return gitignorePath;
  }

  const parentDir = path.dirname(currentDir);

  if (parentDir === currentDir) {
    // Reached the root directory, return null
    return null;
  }

  return findGitignore(parentDir);
}

export async function createDirectorySource(
  directoryPath: string
): Promise<NodeJS.ReadableStream> {
  const resolved = path.resolve(directoryPath);
  const gitignorePath = findGitignore(resolved);
  const gitignoreList = gitignorePath
    ? (await fs.readFile(gitignorePath, 'utf8')).split('\n')
    : [];
  // @ts-expect-error TS2349
  const gitignore = ignore().add([...gitignoreList, '.git']);
  const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));

  return new Promise((resolve, reject) => {
    const tmpfile = path.join(tmpdir, 'archive.zip');

    const tmp = createWriteStream(tmpfile);
    tmp.on('close', () => {
      resolve(createReadStream(tmpfile));
    });

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(tmp);
    archive.on('error', (err) => {
      reject(err);
    });

    walkSync(resolved)
      .map((absolute) => path.relative(resolved, absolute))
      .filter(gitignore.createFilter())
      .forEach((relative) => {
        const absolute = path.join(resolved, relative);
        const stat = lstatSync(absolute);
        if (stat.isSymbolicLink()) {
          archive.symlink(absolute, relative);
        } else if (stat.isFile()) {
          archive.file(absolute, { name: relative });
        }
      });

    archive.finalize();
  });
}
