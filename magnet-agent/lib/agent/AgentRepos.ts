import { exec as execCallback } from 'child_process';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';

import decompress from 'decompress';

const exec = promisify(execCallback);

export class AgentRepos {
  repos: { [repoName: string]: string } = {};

  async createRepo(repoName: string, stream: any) {
    const tempDir = await fs.mkdtemp('/tmp/repo-');
    const tempFilePath = path.join(tempDir, 'repo.zip');
    await pipeline(stream, createWriteStream(tempFilePath));

    this.repos[repoName] = tempFilePath;
  }

  async createWorkspace(repoName: string) {
    const repoPath = this.repos[repoName];
    if (!repoPath) {
      throw new Error(`No path found for repo ${repoName}`);
    }

    const workspaceDir = await fs.mkdtemp('/tmp/agent-');
    await decompress(repoPath, workspaceDir);
    await exec('git init && git add .', { cwd: workspaceDir });
    return workspaceDir;
  }

  async getWorkspaceDiff(workspaceDir: string) {
    const { stdout } = await exec('git diff', { cwd: workspaceDir });
    return stdout;
  }
}
