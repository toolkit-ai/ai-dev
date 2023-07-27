import { exec as callbackExec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const exec = promisify(callbackExec);

export async function openFile(filePath: string): Promise<void> {
  let command: string;

  switch (platform()) {
    case 'darwin': // Mac OS
      command = `open ${filePath}`;
      break;
    case 'win32': // Windows
      command = `start ${filePath}`;
      break;
    case 'linux': // Linux
      command = `xdg-open ${filePath}`;
      break;
    default:
      throw new Error(`Unsupported platform: ${platform()}`);
  }

  try {
    await exec(command);
  } catch (error) {
    throw new Error(`Failed to open file: ${(error as Error).message}`);
  }
}
