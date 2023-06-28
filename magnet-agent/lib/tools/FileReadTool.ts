import { promises as fs } from 'fs';

import { z } from 'zod';
import { AgentStructuredTool } from '../agent/AgentStructuredTool';

// Define the Zod schema for the input
const FilePathSchema = z.object({
  path: z.string(),
});

type FilePathType = z.infer<typeof FilePathSchema>;

// Define the tool
class FileReadTool extends AgentStructuredTool<typeof FilePathSchema> {
  // Implement the required properties
  name = 'FileReadTool';

  description = 'A tool that reads a file';

  schema = FilePathSchema;

  // Implement the protected abstract method
  protected async _call(arg: FilePathType): Promise<string> {
    const { path } = arg;

    console.log(`Reading file at ${path}`);
    try {
      const data = await fs.readFile(path);
      return data.toString();
    } catch (error) {
      return `Error reading file at ${path}: "${(error as Error).message}".`;
    }
  }
}

export default FileReadTool;
