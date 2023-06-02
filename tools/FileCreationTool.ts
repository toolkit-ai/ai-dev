import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Define the Zod schema for the input
const FileCreationSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
});

type FileCreationType = z.infer<typeof FileCreationSchema>;

// Define the tool
class FileCreationTool extends StructuredTool<typeof FileCreationSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'FileCreationTool';
  description = 'A tool that creates a new file';
  schema = FileCreationSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileCreationType): Promise<string> {
    const path = arg.path;
    const content = arg.content || ""; // If no content provided, create an empty file
    try {
      await fs.writeFile(path, content);
      return `File created at ${path}`;
    } catch (error) {
      console.error(`Error creating file at ${path}`, error);
      throw error;
    }
  }
}

export default FileCreationTool;
