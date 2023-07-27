import { exec } from 'child_process';

import { z } from 'zod';

import { AgentStructuredTool } from '../agent/AgentStructuredTool';

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
  protected _call(arg: ExecType): Promise<string> {
    const { command, cwd } = arg;

    return new Promise((resolve) => {
      exec(
        command,
        {
          cwd: cwd || this.context.workspaceDir,
        },
        (error, stdout, stderr) => {
          if (error) {
            resolve(
              `non-zero status code:${error.code}\nstdout: ${stdout}\nstderr: ${stderr}`
            );
          } else {
            resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
          }
        }
      );
    });
  }
}

export default ExecTool;
