import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Define the Zod schema for the input
const FileDeletionSchema = z.object({
  path: z.string(),
});

type FileDeletionType = z.infer<typeof FileDeletionSchema>;

// Define the tool
class FileDeletionTool extends StructuredTool<typeof FileDeletionSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'FileDeletionTool';
  description = 'A tool that deletes a file';
  schema = FileDeletionSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileDeletionType): Promise<string> {
    const path = arg.path;
    try {
      await fs.unlink(path);
      return `File deleted at ${path}`;
    } catch (error) {
      console.error(`Error deleting file at ${path}`, error);
      throw error;
    }
  }
}

export default FileDeletionTool;

