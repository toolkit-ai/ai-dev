import { server } from '@magnet-agent/core';

server.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
  console.log('Server running on port 8080');
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
