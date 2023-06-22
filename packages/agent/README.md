# Magnet Agent Core

Magent Agent is a tool-enabled coding assistant that can perform open-ended tasks on your codebase:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can add your own tasks by writing plugins with LangChain.

This package contains the implementation of the agent, core tools, and an implementation of a wire protocol for communicating with agents running in a container from a container host. You'll use it if you want to build your own agent server or tool.

## Install

**Generally, you won't work with this package directly. You'll want to use it via a host tailord to a specific specific container API, such as `@magnet-agent/host-local` or `@magnet-agent/host-aws`.**

However, if you want to use this package directly, you can install it with:

```bash
npm install @magnet-agent/agent
```

## Usage

Once this package is installed, you can use it to build custom agent servers or tools. What do we mean by this?

With Magnet Agent, there's a few layers of abstraction:

1. **Agent**. The agent is the core logic that runs tasks. An agent is spawned for each task.
2. **Agent Server**. The agent server is the server that runs in the container, exposing the agent to the host over a WebSockets wire protocol.
2. **Host**. The host is the process that runs the agent. It's responsible for communicating between the agent and the user.
3. **Host Container API**. The host container API is the interface that boots the container that the agent server runs in.

This package contains the agent, agent server, and wire protocol. You can use it to build your own agent server, or a container API that uses the agent server:

```js
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
} from '@magnet-agent/agent';
import { HOST, PORT } from './config';

// Add tools to the agent server
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
    // Add your custom tools to the custom agent server
    new MyCustomTool(),
  ],
});

server.listen({ port: PORT, host: HOST }, (err) => {
  // Indicate to the parent process that the server is ready
  console.log(`Server running on port ${PORT}`);
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});
```

## Development

See the [development section in the root readme](../../README.md).

## License

[Apache 2.0](./LICENSE)
