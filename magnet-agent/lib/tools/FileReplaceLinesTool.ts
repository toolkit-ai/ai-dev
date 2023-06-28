import { promises as fs } from 'fs';

import { z } from 'zod';
import { AgentStructuredTool } from '../agent/AgentStructuredTool';

// Define the Zod schema for the input
const FileReplaceLinesSchema = z.object({
  path: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  newText: z.string(),
});

type FileReplaceLinesType = z.infer<typeof FileReplaceLinesSchema>;

// Define the tool
class FileReplaceLinesTool extends AgentStructuredTool<
  typeof FileReplaceLinesSchema
> {
  // Implement the required properties
  name = 'FileReplaceLinesTool';

  description = 'A tool that replaces lines in a file';

  schema = FileReplaceLinesSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileReplaceLinesType): Promise<string> {
    const { path, startLine, endLine, newText } = arg;

    try {
      const data = await fs.readFile(path, 'utf-8');
      const lines = data.split('\n');

      if (startLine < 1 || startLine > endLine || endLine > lines.length) {
        throw new Error('Line numbers are out of range');
      }

      const newLines = newText.split('\n');
      lines.splice(startLine - 1, endLine - startLine + 1, ...newLines); // Replace lines with new text
      await fs.writeFile(path, lines.join('\n'), 'utf-8');

      return `Lines ${startLine} to ${endLine} in file at ${path} have been replaced.`;
    } catch (error) {
      return `Error replacing ${startLine} to ${endLine} in file at ${path}: "${
        (error as Error).message
      }".`;
    }
  }
}

export default FileReplaceLinesTool;
