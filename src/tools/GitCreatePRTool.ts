import { execSync } from 'child_process';

import { Octokit } from '@octokit/rest';
import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';

// Define the Zod schema for the input
const RepoSchema = z.object({
  branch: z.string(),
  commitMessage: z.string(),
  repoPath: z.string().optional(),
});

type RepoType = z.infer<typeof RepoSchema>;

// Define the tool
class GitCreatePRTool extends StructuredTool<typeof RepoSchema> {
  // Implement the required properties
  name = 'GitCreatePRTool';

  description =
    'A tool that creates a new git branch, commits changes, and opens a PR. To be used when you are finished with a task and want to open a PR for review.';

  schema = RepoSchema;

  // Implement the protected abstract method
  protected async _call(arg: RepoType): Promise<string> {
    const repoPath = arg.repoPath || process.cwd(); // Use provided path or current working directory
    const branchName = arg.branch;
    const { commitMessage } = arg;
    try {
      execSync(`git add .`, { cwd: repoPath });
      execSync(`git commit -m "${commitMessage}"`, { cwd: repoPath });
      execSync(`git push --set-upstream origin ${branchName}`, {
        cwd: repoPath,
      });

      // PR creation goes here.
      // As explained above, it should be done with the octokit/rest.js library or similar,
      // and requires GitHub authentication.
      // Get the current repository information
      const repoInfo = execSync('git config --get remote.origin.url', {
        cwd: repoPath,
      })
        .toString()
        .trim();
      const matches = repoInfo.match(/github\.com[:/](.+)\/(.+)\.git$/);
      if (!matches) {
        throw new Error('Could not parse repo info');
      }
      const [, owner, repo] = matches;

      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

      // Create the PR
      const { data: pr } = await octokit.pulls.create({
        owner,
        repo,
        title: commitMessage,
        head: branchName,
        base: 'main', // Change this to the appropriate base branch if needed
      });

      return `PR created at ${pr.html_url}`;
    } catch (error) {
      console.error(`Error working with git at ${repoPath}`, error);
      throw error;
    }
  }
}

export default GitCreatePRTool;
