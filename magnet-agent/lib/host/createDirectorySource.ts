import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import archiver from 'archiver';
import ignore from 'ignore';
import { sync as walkSync } from 'walkdir';

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

export async function createDirectorySource(directoryPath: string) {
  const gitignorePath = findGitignore(path.resolve(directoryPath));
  const gitignoreList = gitignorePath
    ? (await fs.readFile(gitignorePath, 'utf8')).split('\n')
    : [];
  const gitignore = ignore().add(gitignoreList);

  const archive = archiver('zip', { zlib: { level: 9 } });
  walkSync(directoryPath)
    .map((absolute) => path.relative(path.resolve(directoryPath), absolute))
    .filter(gitignore.createFilter())
    .forEach((relative) => {
      archive.file(path.resolve(relative), { name: relative });
    });

  await archive.finalize();
  return archive;
}
