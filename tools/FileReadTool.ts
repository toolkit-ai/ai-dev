import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Define the Zod schema for the input
const FilePathSchema = z.object({
  path: z.string(),
});

type FilePathType = z.infer<typeof FilePathSchema>;

// Define the tool
class FileReadTool extends StructuredTool<typeof FilePathSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'FileReadTool';
  description = 'A tool that reads a file';
  schema = FilePathSchema;

  // Implement the protected abstract method
  protected async _call(arg: FilePathType): Promise<string> {
    const { path } = arg;
    console.log(`Reading file at ${path}`)
    try {
      const data = await fs.readFile(path);
      return data.toString();
    } catch (error) {
      console.error(`Error reading file at ${path}`, error);
      return "Error reading file at ${path}"
      throw error;
    }
  }
}

export default FileReadTool;