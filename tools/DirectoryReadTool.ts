import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Define the Zod schema for the input
const DirectoryPathSchema = z.object({
  path: z.string().optional(),
});

type DirectoryPathType = z.infer<typeof DirectoryPathSchema>;

// Define the tool
class DirectoryReadTool extends StructuredTool<typeof DirectoryPathSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'DirectoryReadTool';
  description = 'A tool that reads a directory';
  schema = DirectoryPathSchema;

  // Implement the protected abstract method
  protected async _call(arg: DirectoryPathType): Promise<string> {
    const path:string = arg.path || process.cwd(); // Use provided path or current working directory
    try {
      const files = await fs.readdir(path);
      return files.join(', ');
    } catch (error) {
      console.error(`Error reading directory at ${path}`, error);
      throw error;
    }
  }
}

export default DirectoryReadTool;