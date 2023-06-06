import { promises as fs } from 'fs';

import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';

// Define the Zod schema for the input
const FilePathSchema = z.object({
  path: z.string(),
});

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
    console.log(`Reading file at ${path}`);
    try {
      const data = await fs.readFile(path);
      return data.toString();
    } catch (error) {
      const message = `Error reading file at ${path}`;
      console.error(message, error);
      return message;
    }
  }
}

export default FileReadTool;
