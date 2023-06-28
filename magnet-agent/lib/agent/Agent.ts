import {
  AgentExecutor,
  initializeAgentExecutorWithOptions,
} from 'langchain/agents';
import { CallbackManager } from 'langchain/callbacks';
import { v4 as uuid } from 'uuid';

import { AgentCallbackHandler } from './AgentCallbackHandler';
import type { AgentContext } from './AgentContext';
import type { AgentMessage } from './AgentMessage';
import { AgentModel } from './AgentModel';
import type { AgentRepos } from './AgentRepos';
import type {
  AgentRequest,
  AgentRequestResponse,
  AgentAskHumanRequest,
  AgentRequestAskHumanResponse,
} from './AgentRequest';
import type { AgentStructuredTool } from './AgentStructuredTool';
import type {
  HostMessage,
  HostResponseMessage,
  HostStartMessage,
} from '../host/HostMessage';
import {
  createTaskAgentInput,
  createTaskClarifyingQuestions,
  createClarifiedTask,
} from './AgentTasks';
export class Agent {
  repos: AgentRepos;

  tools: (typeof AgentStructuredTool<any>)[];

  executor: AgentExecutor | null = null;

  sendMessage: (message: AgentMessage) => void;

  requests: {
    [requestId: string]: {
      resolve: (result: any) => void;
      reject: (error: Error) => void;
    };
  } = {};

  constructor(
    tools: (typeof AgentStructuredTool<any>)[],
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
      default:
        throw new Error(
          `Unknown message type "${(message as { type: string }).type}"`
        );
    }
  }

  private async handleStartMessage(message: HostStartMessage) {
    if (this.executor) {
      throw new Error('Agent is already running');
    }

    const {
      repoName,
      taskDescription: initialTaskDescription,
      clarify,
    } = message;
    const workspaceDir = await this.repos.createWorkspace(repoName);
    const context: AgentContext = {
      sendRequest: (request) => this.sendRequest(request),
    };
    const tools = this.tools.map((tool) => new (tool as any)(context));
    const model = new AgentModel({ context });

    let taskDescription = initialTaskDescription;
    if (clarify) {
      const questions = await createTaskClarifyingQuestions(
        initialTaskDescription,
        model
      );
      let clarifications: [string, string][] = [];
      for (const question of questions) {
        const answer = await this.sendRequest<
          AgentAskHumanRequest,
          AgentRequestAskHumanResponse
        >({
          type: 'ask_human',
          question,
        });
        clarifications.push([question, answer]);
      }
      taskDescription = await createClarifiedTask(
        initialTaskDescription,
        clarifications,
        model
      );
      this.sendMessage({
        type: 'update-task',
        taskDescription,
      });
    }

    const [executor, input] = await Promise.all([
      initializeAgentExecutorWithOptions(tools, model, {
        agentType: 'structured-chat-zero-shot-react-description',
        returnIntermediateSteps: true,
        verbose: true,
      }),
      createTaskAgentInput(workspaceDir, taskDescription),
    ]);
    this.executor = executor;

    const callbacks = new CallbackManager();
    callbacks.addHandler(
      new AgentCallbackHandler((...args) => this.sendMessage(...args))
    );

    try {
      const chain = await this.executor.call({ input }, callbacks);
      const diff = await this.repos.getWorkspaceDiff(workspaceDir);
      this.sendMessage({
        type: 'complete',
        result: {
          chain,
          diff,
        },
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

  private sendRequest<
    TRequest extends AgentRequest,
    TResponse extends AgentRequestResponse
  >(request: TRequest): Promise<TResponse> {
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
