#!/usr/bin/env node

import {
  createAgentServer,
  FileReadTool,
  DirectoryReadTool,
  SearchTool,
  FileCreationTool,
  FileDeleteLinesTool,
  FileInsertTextTool,
  FileReplaceLinesTool,
  FileDeletionTool,
} from '../../agent/dist';
import { HOST, PORT } from './config';

const server = createAgentServer({
  tools: [
    new FileReadTool(),
    new DirectoryReadTool(),
    new SearchTool(),
    new FileCreationTool(),
    new FileDeleteLinesTool(),
    new FileInsertTextTool(),
    new FileReplaceLinesTool(),
    new FileDeletionTool(),
  ],
});

server.listen({ port: PORT, host: HOST }, (err) => {
  console.log(`Server running on port ${PORT}`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
