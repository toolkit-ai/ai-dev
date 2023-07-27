import { PostHog } from 'posthog-node';
import { v4 as uuidv4 } from 'uuid';

import { version } from '../version.js';

type AgentResultFeedback = 'positive' | 'negative';

export const analyticsDisabled = process.env['AI_DEV_TELEMETRY'];

class DisabledPostHog {
  capture() {}

  shutdownAsync() {}
}

const distinctId = uuidv4();
const client = analyticsDisabled
  ? new DisabledPostHog()
  : new PostHog('phc_LSJBGqkXZaJReo5P71pYEVBgNuyDYd5cmJcGW640onR', {
      host: 'https://app.posthog.com',
    });

function sendEvent(event: string, properties: Record<string, any> = {}) {
  client.capture({
    distinctId,
    event,
    properties: { ...properties, version },
  });
}

export function sendStart() {
  sendEvent('start', {});
}

export function sendDockerDesktopNotInstalled() {
  sendEvent('docker_desktop_not_installed', {});
}

export async function measureAndSendPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  properties: any = {}
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  sendEvent('performance', { name, duration: end - start, ...properties });
  return result;
}

export function sendInterrupt() {
  sendEvent('interrupt', {});
}

export function sendComplete() {
  sendEvent('complete', {});
}

export function sendError(error: any) {
  sendEvent('error', {
    error: error instanceof Error ? error.message : String(error),
  });
}

export function sendReviewAgentResult(option: string) {
  sendEvent('review_agent_result', { option });
}

export function sendApplyAgentResult() {
  sendEvent('apply_agent_result');
}

export function sendAgentResultFeedback(
  feedback: AgentResultFeedback,
  options: { model: string; clarify: boolean },
  details: any | null = null,
  email: string | null = null
) {
  sendEvent('agent_result_feedback', { feedback, details, email, ...options });
}

export async function shutdownAsync() {
  await client.shutdownAsync();
}
