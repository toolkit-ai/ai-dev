import { promises as fs } from 'fs';

import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';

// Define the Zod schema for the input
const FileCreationSchema = z.object({
  path: z.string(),
  content: z.string().optional(),
});

type FileCreationType = z.infer<typeof FileCreationSchema>;

// Define the tool
class FileCreationTool extends StructuredTool<typeof FileCreationSchema> {
  // Implement the required properties
  name = 'FileCreationTool';

  description = 'A tool that creates a new file';

  schema = FileCreationSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileCreationType): Promise<string> {
    const { path } = arg;
    const content = arg.content || ''; // If no content provided, create an empty file
    try {
      await fs.writeFile(path, content);
      return `File created at ${path}`;
    } catch (error) {
      return `Error creating file at ${path}: "${(error as Error).message}".`;
    }
  }
}

export default FileCreationTool;
