import { promises as fs } from 'fs';

import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';

// Define the Zod schema for the input
const FileDeleteLinesSchema = z.object({
  path: z.string(),
  startLine: z.number(),
  endLine: z.number(),
});

type FileDeleteLinesType = z.infer<typeof FileDeleteLinesSchema>;

// Define the tool
class FileDeleteLinesTool extends StructuredTool<typeof FileDeleteLinesSchema> {
  // Implement the required properties
  name = 'FileDeleteLinesTool';

  description = 'A tool that deletes lines from a file';

  schema = FileDeleteLinesSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileDeleteLinesType): Promise<string> {
    const { path } = arg;
    const { startLine } = arg;
    const { endLine } = arg;

    try {
      const data = await fs.readFile(path, 'utf-8');
      const lines = data.split('\n');

      if (startLine < 1 || startLine > endLine || endLine > lines.length) {
        throw new Error('Line numbers are out of range');
      }

      lines.splice(startLine - 1, endLine - startLine + 1); // Remove lines in range
      await fs.writeFile(path, lines.join('\n'), 'utf-8');

      return `Lines ${startLine} to ${endLine} in file at ${path} have been deleted.`;
    } catch (error) {
      console.error(`Error deleting lines from file at ${path}`, error);
      throw error;
    }
  }
}

export default FileDeleteLinesTool;
