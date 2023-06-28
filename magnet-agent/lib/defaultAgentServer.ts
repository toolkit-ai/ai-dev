#!/usr/bin/env node

import { createAgentServer } from './agent/createAgentServer';
import {
  FileReadTool,
  DirectoryReadTool,
  SearchTool,
  FileCreationTool,
  FileDeleteLinesTool,
  FileInsertTextTool,
  FileReplaceLinesTool,
  FileDeletionTool,
} from './tools';
import { HOST, PORT } from './defaultAgentServerConfig';

const server = createAgentServer({
  tools: [
    FileReadTool,
    DirectoryReadTool,
    SearchTool,
    FileCreationTool,
    FileDeleteLinesTool,
    FileInsertTextTool,
    FileReplaceLinesTool,
    FileDeletionTool,
  ],
});

server.listen({ port: PORT, host: HOST }, (err) => {
  console.log(`Server running on port ${PORT}`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
