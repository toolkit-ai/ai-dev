# Magnet Agent Host Core

Magent Agent is a tool-enabled coding assistant that can perform open-ended tasks on your codebase:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can add your own tasks by writing plugins with LangChain.

This package contains the core tools and an implementation of a wire protocol for communicating with agents running in a container from a container host. You'll use it if you want to build your own container API.
## Install

**You'll generally not want to use this package directly, but instead a specific container API, such as `@magnet-agent/host-local` or `@magnet-agent/host-aws`.**

Regardless, you can install this with:

```bash
npm install @magnet-agent/host
```
## API

This package provides an API for building Host container APIs for other environments. It's used by the CLI.

```ts
import {Host} from '@magnet-agent/host-core';

(async function runAgent() {
  // Write code to boot a docker container in your environment
  // and connect to it here.
  // ...snip...

  // Connect to a local Docker daemon.
  const host = new AgentHost(HOST, PORT);

  // Upload the folder to the local Docker daemon for use in coding projects by agents.
  await host.uploadDirectory(folderName, folder, /* ...snip... */);

  // Create an agent to perform a task.
  const session = host.runTask(folderName, task);
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
