import { promises as fs } from 'fs';

import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';

// Define the Zod schema for the input
const FileDeletionSchema = z.object({
  path: z.string().optional(),
});

type FileDeletionType = z.infer<typeof FileDeletionSchema>;

// Define the tool
class FileDeletionTool extends StructuredTool<typeof FileDeletionSchema> {
  // Implement the required properties
  name = 'FileDeletionTool';

  description = 'A tool that deletes a file';

  schema = FileDeletionSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileDeletionType): Promise<string> {
    const { path } = arg;
    if (!path) {
      return `No path provided. Make sure to follow the JSON schema for this tool.`;
    }

    try {
      await fs.unlink(path);
      return `File deleted at ${path}`;
    } catch (error) {
      return `Error deleting file at ${path}: "${(error as Error).message}".`;
    }
  }
}

export default FileDeletionTool;
