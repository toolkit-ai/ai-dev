import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import readline from 'readline';

import { z } from 'zod';

import { AgentStructuredTool } from '../agent/AgentStructuredTool.js';

// Define the Zod schema for the input
const SearchSchema = z.object({
  directory: z.string(),
  searchString: z.string(),
});

type SearchType = z.infer<typeof SearchSchema>;

// Define the tool
class SearchTool extends AgentStructuredTool<typeof SearchSchema> {
  // Implement the required properties
  name = 'SearchTool';

  description =
    'A tool that searches for a string in file names or contents within a directory';

  schema = SearchSchema;

  // Implement the protected abstract method
  protected async _call(arg: SearchType): Promise<string> {
    const { searchString, directory } = arg;

    let result = '';
    try {
      const files = await this.getFiles(directory);
      result = await files.reduce<Promise<string>>(async (accPromise, file) => {
        let acc = await accPromise;
        const match = await this.fileContainsString(file, searchString);
        if (match || file.includes(searchString)) {
          acc += `${file}\n`;
        }
        return acc;
      }, Promise.resolve(result));
    } catch (error) {
      return `Error searching for "${searchString}" in ${directory}: "${
        (error as Error).message
      }".`;
    }

    return result;
  }

  private async getFiles(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? this.getFiles(res) : res;
      })
    );
    return Array.prototype.concat(...files);
  }

  private async fileContainsString(
    file: string,
    str: string
  ): Promise<boolean> {
    const readStream = createReadStream(file);
    const rl = readline.createInterface({
      input: readStream,
    });

    // eslint-disable-next-line no-restricted-syntax
    for await (const line of rl) {
      // Make the search case-insensitive
      if (line.toLowerCase().includes(str.toLowerCase())) {
        return true;
      }
    }

    return false;
  }
}

export default SearchTool;
