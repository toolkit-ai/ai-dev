# Telemetry in AI Dev

Telemetry is a crucial part of the AI Dev. It allows us to understand how the agent is used, identify issues and areas for improvement, and ensure the best possible user experience. The data we collect includes performance metrics, errors, and usage patterns.

## Types of Telemetry

Here's a table of common events that we send with `sendEvent`:

| Event                        | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| start                        | The agent has started                            |
| docker_desktop_not_installed | Docker Desktop is not installed                  |
| performance                  | Performance metrics for various operations       |
| interrupt                    | The agent was interrupted                        |
| complete                     | The agent has completed its task                 |
| error                        | An error occurred                                |
| review_agent_result          | The user reviewed the agent's result             |
| apply_agent_result           | The user applied the agent's result              |
| agent_result_feedback        | The user provided feedback on the agent's result |

Each event contains additional properties that provide more context about the event.

## Opting Out of Telemetry

If you prefer not to send telemetry data, you can opt out by setting the `AI_DEV_TELEMETRY` environment variable. Please note that this may limit our ability to improve the agent and provide support.
