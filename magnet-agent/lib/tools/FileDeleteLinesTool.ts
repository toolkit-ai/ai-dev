import { promises as fs } from 'fs';

import { z } from 'zod';
import { AgentStructuredTool } from '../agent/AgentStructuredTool';

// Define the Zod schema for the input
const FileDeleteLinesSchema = z.object({
  path: z.string(),
  startLine: z.number(),
  endLine: z.number(),
});

type FileDeleteLinesType = z.infer<typeof FileDeleteLinesSchema>;

// Define the tool
class FileDeleteLinesTool extends AgentStructuredTool<
  typeof FileDeleteLinesSchema
> {
  // Implement the required properties
  name = 'FileDeleteLinesTool';

  description = 'A tool that deletes lines from a file';

  schema = FileDeleteLinesSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileDeleteLinesType): Promise<string> {
    const { path, startLine, endLine } = arg;

    try {
      const data = await fs.readFile(path, 'utf-8');
      const lines = data.split('\n');

      if (startLine < 1 || startLine > endLine || endLine > lines.length) {
        return 'Line numbers are out of range of the file.';
      }

      lines.splice(startLine - 1, endLine - startLine + 1); // Remove lines in range
      await fs.writeFile(path, lines.join('\n'), 'utf-8');

      return `Lines ${startLine} to ${endLine} in file at ${path} have been deleted.`;
    } catch (error) {
      return `Error deleting lines from file at ${path}: "${
        (error as Error).message
      }".`;
    }
  }
}

export default FileDeleteLinesTool;
