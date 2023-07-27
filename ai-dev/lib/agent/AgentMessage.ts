import type { AgentAction, ChainValues } from 'langchain/schema';

import type { AgentRequest } from './AgentRequest.js';

export type AgentRequestMessage = {
  type: 'request';
  requestId: string;
  request: AgentRequest;
};

export type AgentUpdateTaskMessage = {
  type: 'update-task';
  taskDescription: string;
};

export type AgentActionMessage = {
  type: 'action';
  action: AgentAction;
};

export type AgentErrorMessage = { type: 'error'; error: string };

export type AgentCompleteMessage = {
  type: 'complete';
  result: {
    chain: ChainValues;
    diff: string;
  };
};

export type AgentMessage =
  | AgentRequestMessage
  | AgentUpdateTaskMessage
  | AgentActionMessage
  | AgentErrorMessage
  | AgentCompleteMessage;
