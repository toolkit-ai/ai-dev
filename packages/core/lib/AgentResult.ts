import type { AgentStep } from 'langchain/schema';

export interface AgentResult {
  output: string;
  intermediateSteps: AgentStep[];
}
