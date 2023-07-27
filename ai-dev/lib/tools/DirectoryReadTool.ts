import { promises as fs } from 'fs';

import { z } from 'zod';

import { AgentStructuredTool } from '../agent/AgentStructuredTool.js';

// Define the Zod schema for the input
const DirectoryPathSchema = z.object({
  path: z.string(),
});

type DirectoryPathType = z.infer<typeof DirectoryPathSchema>;

// Define the tool
class DirectoryReadTool extends AgentStructuredTool<
  typeof DirectoryPathSchema
> {
  // Implement the required properties
  name = 'DirectoryReadTool';

  description = 'A tool that reads a directory';

  schema = DirectoryPathSchema;

  // Implement the protected abstract method
  protected async _call(arg: DirectoryPathType): Promise<string> {
    const { path } = arg;
    try {
      const files = await fs.readdir(path);
      return files.join(', ');
    } catch (error) {
      return `Error reading directory at ${path}: "${
        (error as Error).message
      }".`;
    }
  }
}

export default DirectoryReadTool;
