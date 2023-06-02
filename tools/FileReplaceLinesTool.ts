import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

// Define the Zod schema for the input
const FileReplaceLinesSchema = z.object({
  path: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  newText: z.string(),
});

type FileReplaceLinesType = z.infer<typeof FileReplaceLinesSchema>;

// Define the tool
class FileReplaceLinesTool extends StructuredTool<typeof FileReplaceLinesSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'FileReplaceLinesTool';
  description = 'A tool that replaces lines in a file';
  schema = FileReplaceLinesSchema;

  // Implement the protected abstract method
  protected async _call(arg: FileReplaceLinesType): Promise<string> {
    const path = arg.path;
    const startLine = arg.startLine;
    const endLine = arg.endLine;
    const newText = arg.newText;

    try {
      const data = await fs.readFile(path, 'utf-8');
      let lines = data.split('\n');

      if (startLine < 1 || startLine > endLine || endLine > lines.length) {
        throw new Error('Line numbers are out of range');
      }

      const newLines = newText.split('\n');
      lines.splice(startLine - 1, endLine - startLine + 1, ...newLines); // Replace lines with new text
      await fs.writeFile(path, lines.join('\n'), 'utf-8');

      return `Lines ${startLine} to ${endLine} in file at ${path} have been replaced.`;
    } catch (error) {
      console.error(`Error replacing lines in file at ${path}`, error);
      throw error;
    }
  }
}

export default FileReplaceLinesTool;
