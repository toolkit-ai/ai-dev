import type { AgentStep } from 'langchain/schema';

export interface AgentResult {
  chain: {
    output: { explanation: string } | string;
    intermediateSteps: AgentStep[];
  };
  diff: string;
}
