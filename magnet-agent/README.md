# Magnet Agent

Magent Agent is a tool-enabled coding assistant that can perform open-ended tasks on your codebase:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can add your own tasks by writing plugins with LangChain.

This package contains the implementation of the agent, core tools, and an implementation of a wire protocol for communicating with agents running in a container from a container host. You'll use it if you want to build your own agent server or tool.

## Install

```bash
npm install magnet-agent
```

## Usage

You can run Magnet Agent with our CLI by calling:

```bash
OPENAI_API_KEY=your_openai_api_key_here npx magnet-agent -f ./ -t "Your task here." -o ./output
```

- `-f` is the path to the folder you want to run the task on.
- `-t` is the task description.
- `-o` is the path to the file where the agent will output the results.

You'll need to have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.


## API

You can build custom services that use Magnet Agent to run tasks on codebases.

### Overview

With Magnet Agent, there's a few layers of abstraction:

1. **Agent Server**. The agent server is the server that runs in the container, exposing agents to the host over a WebSockets wire protocol.
2. **Container API**. The container API is the interface that boots the container that the agent server runs in.
3. **Host**. The host is the process that runs the agent. It's responsible for communicating between the agent server and the user.

### Creating an agent server

If you are building a custom agent server, you can use the `createAgentServer` function to create an agent server with a set of tools.

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

### Performing tasks with your agent server

Then, you can use the Magnet Agent API to boot your container, and run tasks on it:

```ts
import {Host} = from '@magnet-agent';
import {createImage, createContainer, waitForContainer} from 'magnet-agent/containers/local';

(async function runAgent() {
  // Boot the Docker container.
  createImage();
  createContainer();
  await waitForContainer();

  // Connect to a local Docker daemon.
  const host = new AgentHost(HOST, PORT, modelName, openAIApiKey);

  // Upload the folder to the local Docker daemon for use in coding projects by agents.
  await host.uploadDirectory(folderName, folder);

  // Create an agent to perform a task.
  const session = host.runTask(folderName, task, /* ...snip... */);
  session.on('action', (action) => {
    // Stream the agent's actions to the console.
  });

  // Wait for the agent to finish.
  try {
    const result = await session.getResult();
    // Print the result or apply it to the codebase.
  } catch (e) {
    // Handle errors.
  }
})();
```

## Development

See the [development section in the root readme](../../README.md).

## License

[Apache 2.0](./LICENSE)
