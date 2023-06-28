import { promises as fs } from 'fs';

import { z } from 'zod';
import { AgentStructuredTool } from '../agent/AgentStructuredTool';

// Define the Zod schema for the input
const FileInsertTextSchema = z.object({
  path: z.string(),
  lineNumber: z.number(),
  text: z.string(),
});

type FileInsertTextType = z.infer<typeof FileInsertTextSchema>;

// Define the tool
class FileInsertTextTool extends AgentStructuredTool<
  typeof FileInsertTextSchema
> {
  // Implement the required properties
  name = 'FileInsertTextTool';

  description = 'A tool that inserts text at a specific line in a file';

  schema = FileInsertTextSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileInsertTextType): Promise<string> {
    const { path, lineNumber, text } = arg;

    try {
      const data = await fs.readFile(path, 'utf-8');
      const lines = data.split('\n');

      if (lineNumber < 1 || lineNumber > lines.length + 1) {
        throw new Error('Line number is out of range');
      }

      lines.splice(lineNumber - 1, 0, text); // Insert text at line
      await fs.writeFile(path, lines.join('\n'), 'utf-8');

      return `Text inserted at line ${lineNumber} in file at ${path}.`;
    } catch (error) {
      return `Error inserting text at ${lineNumber} in file ${path}: "${
        (error as Error).message
      }".`;
    }
  }
}

export default FileInsertTextTool;
