import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

import { z } from 'zod';

import { AgentStructuredTool } from '../agent/AgentStructuredTool';

const exec = promisify(execCallback);

// Define the Zod schema for the input
const ExecSchema = z.object({
  command: z.string(),
  cwd: z.string().optional(),
});

type ExecType = z.infer<typeof ExecSchema>;

// Define the tool
class ExecTool extends AgentStructuredTool<typeof ExecSchema> {
  // Implement the required properties
  name = 'ExecTool';

  description = 'A tool that executes a shell command';

  schema = ExecSchema;

  // Implement the protected abstract method
  protected async _call(arg: ExecType): Promise<string> {
    const { command, cwd } = arg;

    try {
      const { stdout } = await exec(command, {
        cwd: cwd || this.context.workspaceDir,
      });
      return stdout;
    } catch (error) {
      return `Error running command: "${(error as Error).message}".`;
    }
  }
}

export default ExecTool;
