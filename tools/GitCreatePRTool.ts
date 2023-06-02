import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { execSync } from 'child_process';

// Define the Zod schema for the input
const RepoSchema = z.object({
  branch: z.string(),
  commitMessage: z.string(),
  repoPath: z.string().optional(),
});

type RepoType = z.infer<typeof RepoSchema>;

// Define the tool
class GitCreatePRTool extends StructuredTool<typeof RepoSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'GitTool';
  description = 'A tool that creates a new git branch, commits changes, and opens a PR. To be used when you are finished with a task and want to open a PR for review.';
  schema = RepoSchema;

  // Implement the protected abstract method
  protected async _call(arg: RepoType): Promise<string> {
    const repoPath = arg.repoPath || process.cwd(); // Use provided path or current working directory
    const branchName = arg.branch;
    const commitMessage = arg.commitMessage;
    try {
      execSync(`git checkout -b ${branchName}`, { cwd: repoPath });
      execSync(`git add .`, { cwd: repoPath });
      execSync(`git commit -m "${commitMessage}"`, { cwd: repoPath });
      execSync(`git push --set-upstream origin ${branchName}`, { cwd: repoPath });

      // PR creation goes here. 
      // As explained above, it should be done with the octokit/rest.js library or similar, 
      // and requires GitHub authentication.

      return `Branch ${branchName} created and changes committed with message: ${commitMessage}`;
    } catch (error) {
      console.error(`Error working with git at ${repoPath}`, error);
      throw error;
    }
  }
}

export default GitCreatePRTool;
