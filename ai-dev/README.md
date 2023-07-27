# AI Dev

**AI Dev is a coding assistant that uses tools to perform open-ended tasks on your codebase.**

It’s like your very own dedicated engineer:

- **Isolated**. It spins up a Docker sandbox for coding tasks so it's isolated from your local environment.
- **Portable**. We're making container APIs for local and cloud environments.
- **Extensible**. You can give the agent your own tools with LangChain.

Examples of open-ended tasks you can run with AI Dev:

- “Update my README.md to describe how X feature works”
- “Find and fix TODO comments in my codebase”
- “Install Sentry in my project”

See our [Showcase](https://toolkitai.notion.site/efeb25d741cb47839c1c4c826991e42c?v=61b53bc227194acdad26419e7c706ab4) for more task ideas.

## Usage

The easiest way to use AI Dev is with our CLI. You can run it with:

```bash
npx ai-dev@latest
```

Then, you'll be prompted to enter a folder, task description, and output file. The agent will run the task on the folder and output the results to the file.

For more information, see [CLI](https://toolkitai.notion.site/CLI-e7368c0447fb4e4ba6c0fbcbcf94879a?pvs=4).

## Documentation

See [Documentation](https://toolkitai.notion.site/AI-Dev-55cd2321039443d695235cadb884cabb?pvs=4).

## Contributing

See [Contributing](https://toolkitai.notion.site/Contributing-d6ff3008d5664da8ba3cd59efe1f5511?pvs=4).

## Telemetry

See [Telemetry](./TELEMETRY.md) for details on how we collect telemetry data, and how to opt out if desired.

## License

[Apache 2.0](./LICENSE)
