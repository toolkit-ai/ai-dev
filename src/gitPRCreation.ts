import { execSync } from 'child_process';

import { Octokit } from '@octokit/rest';

export const createPR = async ({
  githubPrBranch,
  githubToken,
}: {
  githubPrBranch: string;
  githubToken: string;
}) => {
  console.log('CREATING PR');
  const octokit = new Octokit({
    auth: githubToken,
  });

  const repoInfo = execSync('git config --get remote.origin.url')
    .toString()
    .trim();

  const matches = repoInfo.match(/github\.com[:/](.+)\/(.+)\.git$/);
  if (!matches) {
    throw new Error('Could not parse repo info');
  }
  const [, owner, repo] = matches;

  execSync(`git add .`);
  execSync(`git commit -m "Coded by magnet"`);
  execSync(`git push origin ${githubPrBranch}`);
  console.log('Committed code');

  // Create the PR
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: 'coded by magnet PR',
    head: githubPrBranch,
    base: 'main', // Change this to the appropriate base branch if needed
  });
  console.log('PR created', { pr });

  return {
    pr,
  };
};
