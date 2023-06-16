import {
  AgentExecutor,
  initializeAgentExecutorWithOptions,
} from 'langchain/agents';
import type { StructuredTool } from 'langchain/tools';
import { v4 as uuid } from 'uuid';
import type { AgentMessage } from './AgentMessage';
import type {
  HostMessage,
  HostResponseMessage,
  HostStartMessage,
} from './HostMessage';
import { AgentModel } from './AgentModel';
import type { AgentRepos } from './AgentRepos';
import { AgentCallbackHandler } from './AgentCallbackHandler';
import { CallbackManager } from 'langchain/callbacks';

export class Agent {
  repos: AgentRepos;
  tools: StructuredTool[];
  executor: AgentExecutor | null = null;
  sendMessage: (message: AgentMessage) => void;
  requests: {
    [requestId: string]: {
      resolve: (result: any) => void;
      reject: (error: Error) => void;
    };
  } = {};

  constructor(
    tools: StructuredTool[],
    repos: AgentRepos,
    sendMessage: (message: AgentMessage) => void
  ) {
    this.tools = tools;
    this.repos = repos;
    this.sendMessage = sendMessage;
  }

  handleMessage(message: HostMessage) {
    switch (message.type) {
      case 'start':
        this.handleStartMessage(message);
        break;
      case 'response':
        this.handleResponseMessage(message);
        break;
    }
  }

  private async handleStartMessage(message: HostStartMessage) {
    if (this.executor) {
      throw new Error('Agent is already running');
    }

    const { repoName, taskDescription } = message;
    const workspaceDir = await this.repos.cloneRepo(repoName);

    this.executor = await initializeAgentExecutorWithOptions(
      this.tools,
      new AgentModel({ sendRequest: (...args) => this.sendRequest(...args) }),
      {
        agentType: 'structured-chat-zero-shot-react-description',
        returnIntermediateSteps: true,
        verbose: true,
      }
    );

    const callbacks = new CallbackManager();
    callbacks.addHandler(
      new AgentCallbackHandler((...args) => this.sendMessage(...args))
    );

    try {
      const result = await this.executor.call(
        {
          input: `You're a coding assistant. The codebase you're working with is located in the ${workspaceDir} directory so do your work in the context of to that path. I need your help with: ${taskDescription}. When you're finished return the following data in this format type result = { filesChanged: string[], commitMessage: string }`,
        },
        callbacks
      );
      this.sendMessage({
        type: 'complete',
        result,
      });
    } catch (error) {
      this.sendMessage({
        type: 'error',
        error: (error as any)?.message || 'Unknown error',
      });
    }
  }

  private handleResponseMessage(message: HostResponseMessage) {
    const { requestId, response, error } = message;
    const request = this.requests[requestId];
    if (!request) {
      throw new Error('No request found for response');
    }
    if (error) {
      request.reject(new Error(error));
      return;
    }
    request.resolve(response);
  }

  private sendRequest<TRequest, TResponse>(
    request: TRequest
  ): Promise<TResponse> {
    const requestId = uuid();
    const promise: Promise<TResponse> = new Promise((resolve, reject) => {
      this.requests[requestId] = {
        resolve,
        reject,
      };
    });
    this.sendMessage({
      type: 'request',
      requestId,
      request,
    });
    return promise;
  }
}
