import type { LLMResult } from 'langchain/schema';

import type { AgentModel } from './AgentModel';

export type AgentModelRequest = {
  type: 'model';
  prompts: string[];
  options: AgentModel['ParsedCallOptions'];
};

export type AgentRequest = AgentModelRequest;

export type AgentRequestModelResponse = LLMResult;

export type AgentRequestResponse = AgentRequestModelResponse;
