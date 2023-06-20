# Magnet Agent

Magent Agent is a tool-enabled coding assistant that can perform open-ended tasks on your codebase:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can add your own tasks by writing plugins with LangChain.
## Install

**The easiest way to try Magnet Agent is to download [Magnet](https://magnet.run), our desktop app that comes with Magnet Agent pre-installed.**

However, you can try Magnet Agent without Magnet with our CLI:

```bash
npm install @magnet-agent/local
```

You'll need to have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

## Usage

You can run Magnet Agent with our CLI by calling:

```bash
OPENAI_API_KEY=your_openai_api_key_here npx magnet-agent -f ./ -t "Your task here." -o ./output
```

- `-f` is the path to the folder you want to run the task on.
- `-t` is the task description.
- `-o` is the path to the file where the agent will output the results.

There's APIs for local and cloud environments that you can use to run the agent programmatically.

## Packages

This repository is a monorepo that we manage using Lerna. That means that we actually publish several packages to npm from the same codebase, including:

| Package | Description 
| --- | ---
| [`@magnet-agent/core`](./packages/core/README.md) | Core logic for running tasks.
| [`@magnet-agent/local`](./packages/local/README.md) | Local container API and CLI.
| `@magnet-agent/cloud-aws` | AWS container API (coming soon).

See readmes in the respective packages for more info.

## Development

This is a monorepo managed with Lerna. To get started, run:

```bash
pnpm install -g lerna
pnpm install
cd packages/core; pnpm install; cd ../..
cd packages/local; pnpm install; cd ../..
```

Then, you can build all of the packages using `lerna run build`.

## License

[Apache 2.0](./LICENSE)