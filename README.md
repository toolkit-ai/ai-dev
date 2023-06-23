# Magnet Agent

Magent Agent is a tool-enabled coding assistant that can perform open-ended tasks on your codebase:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can add your own tasks by writing plugins with LangChain.
## Install

**The easiest way to try Magnet Agent is to download [Magnet](https://magnet.run), our desktop app that comes with Magnet Agent pre-installed.**

However, you can try Magnet Agent without Magnet with our CLI:

```bash
npm install magnet-agent
```

## Usage

You'll need to have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

You can run Magnet Agent with our CLI by calling:

```bash
OPENAI_API_KEY=your_openai_api_key_here npx magnet-agent -f ./ -t "Your task here." -o ./output
```

- `-f` is the path to the folder you want to run the task on.
- `-t` is the task description.
- `-o` is the path to the file where the agent will output the results.

## Development

This is a monorepo managed with Lerna. To get started, run:

```bash
pnpm install -g lerna
pnpm install
```

Then, you can build all of the packages using `lerna run build`.

Or, you can build a specific package using `lerna run build --scope package-name`.

Once you've built the packages, you can run the CLI by calling:

```bash
cd magnet-agent
OPENAI_API_KEY=your_openai_api_key_here  npx magnet-agent -f ./ --task "Browse and understand the codebase / packaging here, and then based on what you learn, edit the README.md to show how to use npx magnet-agent, documenting all of the different parameters in defined in cmd.ts" -o ./test.md -r -of md -m gpt-4
```

You can also add a `.env` file in `magnet-agent` with your `OPENAI_API_KEY` if you don't want to pass it in as an environment variable.

## License

[Apache 2.0](./LICENSE)
