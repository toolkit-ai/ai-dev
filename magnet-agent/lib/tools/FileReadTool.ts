import { promises as fs } from 'fs';

import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';

// Define the Zod schema for the input
const FilePathSchema = z.object({
  path: z.string().optional(),
});
// TODO add a linter to ensure all paths are optional and add a npm script to run the linter

type FilePathType = z.infer<typeof FilePathSchema>;

// Define the tool
class FileReadTool extends StructuredTool<typeof FilePathSchema> {
  // Implement the required properties
  name = 'FileReadTool';

  description = 'A tool that reads a file';

  schema = FilePathSchema;

  // Implement the protected abstract method
  protected async _call(arg: FilePathType): Promise<string> {
    const { path } = arg;
    if (!path) {
      return `No path provided. Make sure to follow the JSON schema for this tool.`;
    }

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
