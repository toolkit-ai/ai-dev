import fastify from 'fastify';
import { Agent } from './Agent';
import type { StructuredTool } from 'langchain/tools';
import fastifyWebsocketPlugin from '@fastify/websocket';
import fastifyMulitpartPlugin from '@fastify/multipart';
import { AgentRepos } from './AgentRepos';

export type ServerConfig = {
  tools: StructuredTool[];
};

export function createAgentServer(config: ServerConfig) {
  const repos = new AgentRepos();

  const server = fastify();

  server.register(fastifyMulitpartPlugin);
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

  server.register(async (server) => {
    server.get('/agent', { websocket: true }, async (connection, _) => {
      const agent = new Agent(config.tools, repos, (message) => {
        connection.socket.send(JSON.stringify(message));
      });

      connection.socket.on('message', (rawMessage: any) => {
        console.log('received message', rawMessage.toString());
        const message = JSON.parse(rawMessage.toString());
        agent.handleMessage(message);
      });
    });
  });

  return server;
}
