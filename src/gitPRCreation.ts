import { execSync } from 'child_process';

import { Octokit } from '@octokit/rest';

export const createPR = async ({
  githubPRBranch,
  githubToken,
}: {
  githubPRBranch: string;
  githubToken: string;
}) => {
  const octokit = new Octokit({
    auth: githubToken,
  });

  const repoInfo = execSync('git config --get remote.origin.url')
    .toString()
    .trim();

  const matches = repoInfo.match(/github\.com[:/](.+)\/(.+)\.git$/) || [];
  const [, owner, repo] = matches;
  if (!owner || !repo) {
    throw new Error('Could not parse repo info');
  }

  execSync(`git add .`);
  execSync(`git commit -m "Coded by magnet"`);
  execSync(`git push origin ${githubPRBranch}`);

  // Create the PR
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: 'coded by magnet PR',
    head: githubPRBranch,
    base: 'main', // Change this to the appropriate base branch if needed
  });

  return {
    pr,
  };
};
