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
} from '../host/HostMessage';
import { AgentModel } from './AgentModel';
import type { AgentRepos } from './AgentRepos';
import { AgentCallbackHandler } from './AgentCallbackHandler';
import { CallbackManager } from 'langchain/callbacks';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { PromptTemplate } from 'langchain';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

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
    const workspaceDir = await this.repos.createWorkspace(repoName);
    const [executor, files] = await Promise.all([
      initializeAgentExecutorWithOptions(
        this.tools,
        new AgentModel({ sendRequest: (...args) => this.sendRequest(...args) }),
        {
          agentType: 'structured-chat-zero-shot-react-description',
          returnIntermediateSteps: true,
          verbose: true,
        }
      ),
      readdir(workspaceDir),
    ]);
    this.executor = executor;

    // Fetch common readme files using fs
    const readmePath = files.filter((file) =>
      ['README.md', 'README.txt', 'README'].includes(file)
    )[0];
    const readme = readmePath
      ? await readFile(path.join(workspaceDir, readmePath), 'utf-8')
      : null;

    const callbacks = new CallbackManager();
    callbacks.addHandler(
      new AgentCallbackHandler((...args) => this.sendMessage(...args))
    );

    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        explanation: z
          .string()
          .describe(
            'A description of the code change made, an answer to the question in the task, or explanation of why the agent gave up.'
          ),
      })
    );
    const formatInstructions = parser.getFormatInstructions();
    const prompt = new PromptTemplate({
      template:
        "You're an expert engineer. The codebase you're working with is located in the {workspace_dir} directory. I'm product manager and need you to implement this task: '{task_description}'. Here's a listing of the first 50 files in the {workspace_dir} directory: {files}. Explore the codebase, and based on what you understand, complete the task. {readme} \n{format_instructions}",
      inputVariables: ['task_description', 'workspace_dir', 'files', 'readme'],
      partialVariables: { format_instructions: formatInstructions },
    });

    const input = await prompt.format({
      task_description: taskDescription,
      workspace_dir: workspaceDir,
      files: JSON.stringify(files.slice(0, 50)),
      readme: readme
        ? `Here's an excerpt of the README:\n"""\n${readme.slice(
            0,
            1000
          )}\n"""\n`
        : '',
    });

    console.log('input', input);

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
