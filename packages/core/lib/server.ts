import { execSync } from 'child_process';
import fs, { readdirSync } from 'fs';
import path from 'path';
import fastify from 'fastify';
import { createPR } from './gitPRCreation';
import { run } from './Agent';
import type { StructuredTool } from 'langchain/tools';

export type ServerConfig = {
  tools: StructuredTool[];
};

export function createServer(config: ServerConfig) {
  const server = fastify();

  server.post('/task', async (request) => {
    const {
      openAIApiKey,
      githubToken,
      githubUsername,
      githubUserEmail,
      githubRepoOwner,
      githubRepoName,
      githubBranchToStartFrom,
      githubPRBranch,
      taskDescription,
    } = request.body as {
      openAIApiKey: string;

      githubToken: string;
      githubUsername: string;
      githubUserEmail: string;

      taskDescription: string;
      githubRepoOwner: string;
      githubRepoName: string;
      githubBranchToStartFrom: string;
      githubPRBranch: string;
    };

    console.log('Starting');
    console.log('Received request', request.body);

    // Create a unique temp directory for each request
    const tempDir = fs.mkdtempSync('/tmp/repo-');

    // Call the git_operations.sh script with the required arguments
    const gitOperationsScript = path.resolve(__dirname, 'git_operations.sh');
    execSync(
      `bash ${gitOperationsScript} ${githubToken} ${githubUsername} ${githubUserEmail} ${githubRepoOwner} ${githubRepoName} ${githubBranchToStartFrom} ${githubPRBranch} ${tempDir}`
    );

    // console.log the branch that is active in the current directory
    console.log(
      'Current branch:',
      execSync('git branch --show-current').toString()
    );

    // Get the list of files in the cloned repository
    const files = readdirSync(tempDir).map((file) =>
      path.resolve(tempDir, file)
    );

    console.log('File path:', files[0]);
    const filePath = files[4];
    if (!filePath) {
      throw new Error('File not defined');
    }

    try {
      fs.accessSync(filePath, fs.constants.R_OK);

      // Navigate to the tempDir that was created
      process.chdir(tempDir);

      const result = await run({
        path: tempDir,
        taskDescription,
        openAIApiKey,
        tools: config.tools,
      });

      /// If agent successfully ran, commit the files and create a pull request
      const pr = await createPR({
        githubToken,
        githubPRBranch,
      });

      return { status: 'success', result, pr };
    } catch (err) {
      console.error(err);
      return { status: 'failure' };
    }
  });

  return server;
}
