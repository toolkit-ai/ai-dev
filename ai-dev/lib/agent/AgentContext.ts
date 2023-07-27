import type { AgentRequest, AgentRequestResponse } from './AgentRequest';

export type AgentContext = {
  sendRequest<T extends AgentRequestResponse>(
    request: AgentRequest
  ): Promise<T>;
};
