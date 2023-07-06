import type { AgentRequest, AgentRequestResponse } from './AgentRequest';

export type AgentContext = {
  workspaceDir: string;

  sendRequest<T extends AgentRequestResponse>(
    request: AgentRequest
  ): Promise<T>;
};
