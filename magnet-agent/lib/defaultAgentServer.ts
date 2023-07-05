#!/usr/bin/env node

import { createAgentServer } from './agent/createAgentServer';
import { HOST, PORT } from './defaultAgentServerConfig';
import {
  FileReadTool,
  DirectoryReadTool,
  SearchTool,
  FileWriteTool,
  FileDeleteTool,
} from './tools';
import AskHumanTool from './tools/AskHumanTool';

const server = createAgentServer({
  tools: [
    FileReadTool,
    DirectoryReadTool,
    SearchTool,
    FileWriteTool,
    FileDeleteTool,
    AskHumanTool,
  ],
});

server.listen({ port: PORT, host: HOST }, (err) => {
  console.log(`Server running on port ${PORT}`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
