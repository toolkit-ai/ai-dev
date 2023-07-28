import { exec as execCallback } from 'child_process';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const exec = promisify(execCallback);

export async function createGitHubSource(
  owner: string,
  repo: string,
  branch: string
): Promise<NodeJS.ReadableStream> {
  const tmpdir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-'));
  await exec(
    `curl -L https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip -o ${tmpdir}/repo.zip -f`
  );
  return createReadStream(path.join(tmpdir, 'repo.zip'));
}
