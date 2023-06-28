import EventEmitter from 'events';

import type { BaseLLM } from 'langchain/llms/base';
import WebSocket from 'ws';

import type { HostMessage } from './HostMessage';
import type {
  AgentMessage,
  AgentRequestMessage,
  AgentErrorMessage,
  AgentCompleteMessage,
  AgentActionMessage,
} from '../agent/AgentMessage';
import type { AgentResult } from '../agent/AgentResult';

export class HostTask extends EventEmitter {
  socket: WebSocket;

  model: BaseLLM;

  constructor(
    url: string,
    repoName: string,
    taskDescription: string,
    model: BaseLLM
  ) {
    super();
    this.model = model;
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
      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  }

  private async handleRequestMessage(message: AgentRequestMessage) {
    switch (message.request.type) {
      case 'model': {
        const result = await this.model._generate(
          message.request.prompts,
          message.request.options
        );
        this.sendMessage({
          type: 'response',
          requestId: message.requestId,
          response: result,
        });
        break;
      }
      default:
        throw new Error(
          `Unknown request type: ${(message.request as any).type}`
        );
    }
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

  private sendMessage(message: HostMessage) {
    this.socket.send(JSON.stringify(message));
  }
}
