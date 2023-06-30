import { PostHog } from 'posthog-node';
import { v4 as uuidv4 } from 'uuid';

import { version } from '../version';

type AgentResultFeedback = 'positive' | 'negative';

export const analyticsDisabled = process.env['MAGNET_AGENT_TELEMETRY'];

async function sendEvent(event: string, properties: any) {
  if (analyticsDisabled) {
    return;
  }

  const client = new PostHog(
    'phc_LSJBGqkXZaJReo5P71pYEVBgNuyDYd5cmJcGW640onR',
    {
      host: 'https://app.posthog.com',
    }
  );
  client.capture({
    distinctId: uuidv4(),
    event,
    properties: { ...properties, version },
  });
  await client.shutdownAsync();
}

export async function sendAgentError(error: any) {
  await sendEvent('agent_error', {
    error: error instanceof Error ? error.message : String(error),
  });
}

export async function sendAgentResultFeedback(
  feedback: AgentResultFeedback,
  details: any | null = null
) {
  await sendEvent('agent_result_feedback', { feedback, details });
}
