import EventEmitter from 'events';
import type {
  AgentActionMessage,
  AgentCompleteMessage,
  AgentErrorMessage,
  AgentMessage,
  AgentRequestMessage,
  AgentResult,
} from '@magnet-agent/agent';
import WebSocket from 'ws';
import type { AgentHostMessage } from '@magnet-agent/agent';
import { OpenAI } from 'langchain/llms/openai';

export class AgentHostTask extends EventEmitter {
  socket: WebSocket;
  model: OpenAI;

  constructor(
    url: string,
    repoName: string,
    taskDescription: string,
    modelName: string,
    openAIApiKey: string
  ) {
    super();
    this.model = new OpenAI({
      modelName,
      openAIApiKey,
    });
    this.socket = new WebSocket(url);
    this.socket.on('open', () => {
      this.sendMessage({
        type: 'start',
        repoName,
        taskDescription,
      });
    });
    this.socket.on('message', (message: string) => {
      this.handleMessage(JSON.parse(message));
    });
  }

  async getResult(): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      this.on('complete', (result) => {
        resolve(result);
      });
      this.on('error', (error) => {
        reject(error);
      });
    });
  }

  private handleMessage(message: AgentMessage) {
    switch (message.type) {
      case 'request':
        this.handleRequestMessage(message);
        break;
      case 'action':
        this.handleActionMessage(message);
        break;
      case 'error':
        this.handleErrorMessage(message);
        break;
      case 'complete':
        this.handleCompleteMessage(message);
        break;
    }
  }

  private async handleRequestMessage(message: AgentRequestMessage) {
    const result = await this.model._generate(
      message.request.prompts,
      message.request.options
    );
    this.sendMessage({
      type: 'response',
      requestId: message.requestId,
      response: result,
    });
  }

  private async handleActionMessage(message: AgentActionMessage) {
    this.emit('action', message.action);
  }

  private async handleCompleteMessage(message: AgentCompleteMessage) {
    this.emit('complete', message.result);
  }

  private async handleErrorMessage(message: AgentErrorMessage) {
    this.emit('error', message.error);
  }

  private sendMessage(message: AgentHostMessage) {
    this.socket.send(JSON.stringify(message));
  }
}
