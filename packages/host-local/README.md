# Magnet Agent Local

Magent Agent is a tool-enabled coding assistant that can perform open-ended tasks on your codebase:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can add your own tasks by writing plugins with LangChain.

This package provides the container API and CLI for running Magnet Agent in a local Docker container.

## Install

**The easiest way to try Magnet Agent is to download [Magnet](https://magnet.run), our desktop app that comes with Magnet Agent pre-installed.**

However, you can try Magnet Agent without Magnet with our CLI:

```bash
npm install @magnet-agent/host-local
```

You'll need to have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

## Usage

You can run Magnet Agent with our CLI by calling:

```bash
OPENAI_API_KEY=your_openai_api_key_here npx magnet-agent -f ./ -t "Your task here." -o ./output
```

Options shown above:

- `-f` is the path to the folder you want to run the task on.
- `-t` is the task description.
- `-o` is the path to the file where the agent will output the results.

Other useful options:

- `-of` is the output format for the results. Default is `json`. Can also be `md` for Markdown.
- `-m` is the model to use. Default is `gpt-3.5-turbo`. Can be other models on the [OpenAI website](https://platform.openai.com/docs/models) as well.

## API

This package provides an API for running Magnet Agent in a local Docker container.

```ts
import {Host, createImage, createContainer, waitForContainer} from '@magnet-agent/host-local';

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
