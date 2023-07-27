#!/usr/bin/env node

import { createAgentServer } from './agent/createAgentServer.js';
import { HOST, PORT } from './defaultAgentServerConfig.js';
import {
  FileReadTool,
  DirectoryReadTool,
  SearchTool,
  FileWriteTool,
  FileDeleteTool,
  ExecTool,
  AskHumanTool,
} from './tools/index.js';

const server = createAgentServer({
  tools: [
    FileReadTool,
    DirectoryReadTool,
    SearchTool,
    FileWriteTool,
    FileDeleteTool,
    AskHumanTool,
    ExecTool,
  ],
});

server.listen({ port: PORT, host: HOST }, (err) => {
  console.log(`Server running on port ${PORT}`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
