import { PostHog } from 'posthog-node';
import { v4 as uuidv4 } from 'uuid';

const client = new PostHog('phc_LSJBGqkXZaJReo5P71pYEVBgNuyDYd5cmJcGW640onR', {
  host: 'https://app.posthog.com',
});

type AgentResultFeedback = 'positive' | 'negative' | 'error';

export async function sendAgentResultFeedback(
  feedback: AgentResultFeedback,
  details: any | null = null
) {
  client.capture({
    distinctId: uuidv4(),
    event: 'agent_result_feedback',
    properties: { feedback, details },
  });
  await client.shutdownAsync();
}
