import type { AgentRequestResponse } from '../agent/AgentRequest.js';

export type HostModelResponse = string[];

export type HostResponse = HostModelResponse;

export type HostStartMessage = {
  type: 'start';
  repoName: string;
  taskDescription: string;
  clarify: boolean;
};

export type HostResponseMessage = {
  type: 'response';
  requestId: string;
  response?: AgentRequestResponse;
  error?: string;
};

export type HostMessage = HostStartMessage | HostResponseMessage;
