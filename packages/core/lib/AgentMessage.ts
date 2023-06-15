import type { AgentAction, ChainValues } from 'langchain/schema';

export type AgentRequestMessage = {
  type: 'request';
  requestId: string;
  request: any;
};

export type AgentActionMessage = {
  type: 'action';
  action: AgentAction;
};

export type AgentErrorMessage = { type: 'error'; error: string };

export type AgentCompleteMessage = { type: 'complete'; result: ChainValues };

export type AgentMessage =
  | AgentRequestMessage
  | AgentActionMessage
  | AgentErrorMessage
  | AgentCompleteMessage;
