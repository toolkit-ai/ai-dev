export type HostStartMessage = {
  type: 'start';
  repoName: string;
  taskDescription: string;
};

export type HostResponseMessage = {
  type: 'response';
  requestId: string;
  response?: any;
  error?: string;
};

export type HostMessage = HostStartMessage | HostResponseMessage;
