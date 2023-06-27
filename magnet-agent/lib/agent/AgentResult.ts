import type { AgentStep } from 'langchain/schema';

export interface AgentResult {
  chain: {
    output: string;
    intermediateSteps: AgentStep[];
  };
  diff: string;
}
