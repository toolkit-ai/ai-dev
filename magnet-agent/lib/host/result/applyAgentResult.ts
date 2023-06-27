import { exec as execCallback } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

import type { AgentResult } from '../../agent';

const exec = promisify(execCallback);

export async function applyAgentResult(result: AgentResult, folder: string) {
  const tmpdir = await fs.mkdtemp('/tmp/result-');
  const diffFile = path.join(tmpdir, 'diff.patch');
  await fs.writeFile(diffFile, result.diff);
  await exec(`patch -p1 < ${diffFile}`, { cwd: folder });
  await fs.rm(tmpdir, { recursive: true });
}
