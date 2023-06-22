import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';

import decompress from 'decompress';

export class AgentRepos {
  repos: { [repoName: string]: string } = {};

  async createRepo(repoName: string, stream: any) {
    const tempDir = await fs.mkdtemp('/tmp/repo-');
    const tempFilePath = path.join(tempDir, 'repo.zip');
    await pipeline(stream, createWriteStream(tempFilePath));

    this.repos[repoName] = tempFilePath;
  }

  async cloneRepo(repoName: string) {
    const repoPath = this.repos[repoName];
    if (!repoPath) {
      throw new Error(`No path found for repo ${repoName}`);
    }

    const workspaceDir = await fs.mkdtemp('/tmp/agent-');
    await decompress(repoPath, workspaceDir);
    return workspaceDir;
  }
}
