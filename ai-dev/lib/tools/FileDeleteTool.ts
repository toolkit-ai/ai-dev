import { promises as fs } from 'fs';

import { z } from 'zod';

import { AgentStructuredTool } from '../agent/AgentStructuredTool.js';

// Define the Zod schema for the input
const FileDeleteSchema = z.object({
  path: z.string(),
});

type FileDeleteType = z.infer<typeof FileDeleteSchema>;

// Define the tool
class FileDeleteTool extends AgentStructuredTool<typeof FileDeleteSchema> {
  // Implement the required properties
  name = 'FileDeleteTool';

  description = 'A tool that deletes a file';

  schema = FileDeleteSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileDeleteType): Promise<string> {
    const { path } = arg;

    try {
      await fs.unlink(path);
      return `File deleted at ${path}`;
    } catch (error) {
      return `Error deleting file at ${path}: "${(error as Error).message}".`;
    }
  }
}

export default FileDeleteTool;
