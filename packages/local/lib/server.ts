import {
  createServer,
  FileReadTool,
  DirectoryReadTool,
  SearchTool,
  FileCreationTool,
  FileDeleteLinesTool,
  FileInsertTextTool,
  FileReplaceLinesTool,
  FileDeletionTool,
} from '@magnet-agent/core';

const server = createServer({
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

server.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
  console.log('Server running on port 8080');
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
