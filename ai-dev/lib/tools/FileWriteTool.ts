import { promises as fs } from 'fs';

import { z } from 'zod';

import { AgentStructuredTool } from '../agent/AgentStructuredTool';

// Define the Zod schema for the input
const FileWriteSchema = z.object({
  path: z.string(),
  content: z.string(),
});

type FileWriteType = z.infer<typeof FileWriteSchema>;

// Define the tool
class FileWriteTool extends AgentStructuredTool<typeof FileWriteSchema> {
  // Implement the required properties
  name = 'FileWriteTool';

  description = "A tool that creates a file or overwrites a file's contents";

  schema = FileWriteSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileWriteType): Promise<string> {
    const { path } = arg;
    const content = arg.content || ''; // If no content provided, create an empty file

    try {
      await fs.writeFile(path, content);
      return `File written at ${path}`;
    } catch (error) {
      return `Error writing file at ${path}: "${(error as Error).message}".`;
    }
  }
}

export default FileWriteTool;
