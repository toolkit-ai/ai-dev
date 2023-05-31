import { StructuredTool, ToolParams } from 'langchain/tools';
import { z } from 'zod';
import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import readline from 'readline';

// Define the Zod schema for the input
const SearchSchema = z.object({
  directory: z.string().optional(),
  searchString: z.string(),
});

type SearchType = z.infer<typeof SearchSchema>;

// Define the tool
class SearchTool extends StructuredTool<typeof SearchSchema> {
  constructor(fields?: ToolParams) {
    super(fields);
  }

  // Implement the required properties
  name = 'SearchTool';
  description = 'A tool that searches for a string in all files within a directory';
  schema = SearchSchema;

  // Implement the protected abstract method
  protected async _call(arg: SearchType): Promise<string> {
    const directory = arg.directory || process.cwd(); // Use provided directory or current working directory
    const searchString = arg.searchString;
    let result = '';

    try {
      const files = await this.getFiles(directory);
      for (const file of files) {
        const match = await this.fileContainsString(file, searchString);
        if (match) {
          result += `${file}\n`;
        }
      }
    } catch (error) {
      console.error(`Error during search in directory ${directory}`, error);
      throw error;
    }

    return result;
  }

  private async getFiles(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = join(dir, dirent.name);
      return dirent.isDirectory() ? this.getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
  }

  private async fileContainsString(file: string, str: string): Promise<boolean> {
    const readStream = createReadStream(file);
    const rl = readline.createInterface({
      input: readStream,
    });

    for await (const line of rl) {
      if (line.includes(str)) {
        return true;
      }
    }

    return false;
  }
}

export default SearchTool;
