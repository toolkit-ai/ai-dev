export type AgentHostStartMessage = {
  type: 'start';
  repoName: string;
  taskDescription: string;
};

export type AgentHostResponseMessage = {
  type: 'response';
  requestId: string;
  response?: any;
  error?: string;
};

export type AgentHostMessage = AgentHostStartMessage | AgentHostResponseMessage;
