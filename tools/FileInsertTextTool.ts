import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Define the Zod schema for the input
const FileInsertTextSchema = z.object({
  path: z.string(),
  lineNumber: z.number(),
  text: z.string(),
});

type FileInsertTextType = z.infer<typeof FileInsertTextSchema>;

// Define the tool
class FileInsertTextTool extends StructuredTool<typeof FileInsertTextSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'FileInsertTextTool';
  description = 'A tool that inserts text at a specific line in a file';
  schema = FileInsertTextSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileInsertTextType): Promise<string> {
    const path = arg.path;
    const lineNumber = arg.lineNumber;
    const text = arg.text;

    try {
      const data = await fs.readFile(path, 'utf-8');
      let lines = data.split('\n');

      if (lineNumber < 1 || lineNumber > lines.length + 1) {
        throw new Error('Line number is out of range');
      }

      lines.splice(lineNumber - 1, 0, text); // Insert text at line
      await fs.writeFile(path, lines.join('\n'), 'utf-8');

      return `Text inserted at line ${lineNumber} in file at ${path}.`;
    } catch (error) {
      console.error(`Error inserting text in file at ${path}`, error);
      throw error;
    }
  }
}

export default FileInsertTextTool;
