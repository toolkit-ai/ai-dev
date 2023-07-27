# AI Dev

AI Dev is a tool-enabled coding assistant that can perform open-ended tasks on your codebase:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can add your own tasks by writing plugins with LangChain.

## Usage

AI Dev is published on npm.

```bash
npm install ai-dev
```

See the [package README](./ai-dev/README.md) for more information.

## Development

This is a monorepo managed with Lerna. For now, there's a single `ai-dev` package that contains the CLI and tools to embed AI Dev in other applications.

Over time, we'll add more packages to this repo demonstrating embedding use-cases.

### Setup

To get started, run:

```bash
pnpm install -g lerna
pnpm install
```

### Building

Then, you can build all of the packages using `lerna run build`.

### Running Locally

To test the CLI, you can link it via pnpm, and then call it using npx:

```bash
cd ai-dev
pnpm link .
npx ai-dev
```

## License

[Apache 2.0](./LICENSE)
