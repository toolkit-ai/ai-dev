import type { Generation, StoredMessage } from 'langchain/schema';

import type { AgentChatProxyModel } from './AgentChatProxyModel';

type StoredChatGeneration = Generation & {
  message: StoredMessage;
};

export type AgentModelRequest = {
  type: 'model';
  messages: StoredMessage[];
  options: AgentChatProxyModel['ParsedCallOptions'];
};

export type AgentAskHumanRequest = {
  type: 'ask_human';
  question: string;
};

export type AgentRequest = AgentModelRequest | AgentAskHumanRequest;

export type AgentRequestModelResponse = {
  generations: StoredChatGeneration[];
  llmOutput?: Record<string, any>;
};

export type AgentRequestAskHumanResponse = string;

export type AgentRequestResponse =
  | AgentRequestModelResponse
  | AgentRequestAskHumanResponse;
