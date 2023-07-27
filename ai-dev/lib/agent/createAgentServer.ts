import fastifyMulitpartPlugin from '@fastify/multipart';
import fastifyWebsocketPlugin from '@fastify/websocket';
import fastify from 'fastify';

import { Agent } from './Agent';
import { AgentRepos } from './AgentRepos';
import type { AgentStructuredTool } from './AgentStructuredTool';

export type ServerConfig = {
  tools: (typeof AgentStructuredTool<any>)[];
};

export function createAgentServer(config: ServerConfig) {
  const repos = new AgentRepos();

  const server = fastify();

  server.register(fastifyMulitpartPlugin, {
    limits: {
      fileSize: 1024 ** 3,
    },
  });
  server.register(fastifyWebsocketPlugin);

  server.post('/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      throw new Error('No file uploaded');
    }
    if (data.file.truncated) {
      throw new Error('File too large');
    }

    // @ts-expect-error 2339
    const repoName = data.fields['repoName']?.value;
    if (!repoName) {
      throw new Error('No repo name provided');
    }

    await repos.createRepo(repoName, data.file);

    reply.send({ success: true });
  });

  server.register(async (srv) => {
    srv.get('/agent', { websocket: true }, async (connection) => {
      const agent = new Agent(config.tools, repos, (message) => {
        connection.socket.send(JSON.stringify(message));
      });

      connection.socket.on('message', (rawMessage: any) => {
        const message = JSON.parse(rawMessage.toString());
        agent.handleMessage(message);
      });
    });
  });

  return server;
}
