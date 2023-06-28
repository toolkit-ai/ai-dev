import type { LLMResult } from 'langchain/schema';

import type { AgentModel } from './AgentModel';

export type AgentModelRequest = {
  type: 'model';
  prompts: string[];
  options: AgentModel['ParsedCallOptions'];
};

export type AgentAskHumanRequest = {
  type: 'ask_human';
  question: string;
};

export type AgentRequest = AgentModelRequest | AgentAskHumanRequest;

export type AgentRequestModelResponse = LLMResult;

export type AgentRequestAskHumanResponse = string;

export type AgentRequestResponse =
  | AgentRequestModelResponse
  | AgentRequestAskHumanResponse;
