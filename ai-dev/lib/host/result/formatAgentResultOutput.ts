import type { AgentResult } from '../../agent';

export function formatAgentResultOutput(result: AgentResult) {
  const { output } = result.chain;
  if (typeof output === 'string') {
    return output;
  }
  return output.explanation;
}
