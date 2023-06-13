import { execSync } from 'child_process';
import fs, { readdirSync } from 'fs';
import path from 'path';

import dotenv from 'dotenv';
import fastify from 'fastify';
import FileReadTool from 'tools/FileReadTool';

import { run } from './Agent';

dotenv.config();

const server = fastify({
  // logger: {
  //   level:
  // },
});

server.post('/task', async (request) => {
  const {
    githubToken,
    githubUsername,
    githubUserEmail,
    githubRepoOwner,
    githubRepoName,
    githubBranch,
    taskDescription,
  } = request.body as {
    githubToken: string;
    githubUsername: string;
    githubUserEmail: string;

    taskDescription: string;
    githubRepoOwner: string;
    githubRepoName: string;
    githubBranch: string;
  };

  console.log('starting');
  console.log('received request', request.body);

  // Create a unique temp directory for each request
  const tempDir = fs.mkdtempSync('/tmp/repo-');

  // Call the git_operations.sh script with the required arguments
  const gitOperationsScript = path.resolve(__dirname, 'git_operations.sh');
  execSync(
    `bash ${gitOperationsScript} ${githubToken} ${githubUsername} ${githubUserEmail} ${githubRepoOwner} ${githubRepoName} ${githubBranch} ${tempDir}`
  );

  // Get the list of files in the cloned repository
  const files = readdirSync(tempDir).map((file) => path.resolve(tempDir, file));

  console.log('File path:', files[0]);
  const filePath = files[4];
  if (!filePath) {
    throw new Error('File not defined');
  }

  try {
    fs.accessSync(filePath, fs.constants.R_OK);

    // Navigate to the tempDir that was created
    process.chdir(tempDir);

    const fileReadTool = new FileReadTool();
    const content = await fileReadTool.call({ path: filePath });
    // console.log({ content })
    const result = await run({
      path: tempDir,
      taskDescription,
    });

    return { status: 'success', result, files, content };
  } catch (err) {
    console.error(err);
    return { status: 'failure' };
  }
});

server.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
