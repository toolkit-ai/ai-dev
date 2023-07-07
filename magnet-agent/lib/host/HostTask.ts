import EventEmitter from 'events';

import type { ChatOpenAI } from 'langchain/chat_models/openai';
import WebSocket from 'ws';

import type { HostMessage } from './HostMessage';
import type {
  AgentMessage,
  AgentRequestMessage,
  AgentErrorMessage,
  AgentCompleteMessage,
  AgentActionMessage,
  AgentUpdateTaskMessage,
} from '../agent/AgentMessage';
import type { AgentResult } from '../agent/AgentResult';
import { mapStoredMessageToChatMessage } from '../util/mapStoredMessageToChatMessage';

export class HostTask extends EventEmitter {
  socket: WebSocket;

  model: ChatOpenAI;

  handleAskHuman: (question: string) => Promise<string>;

  constructor(
    url: string,
    repoName: string,
    taskDescription: string,
    model: ChatOpenAI,
    handleAskHuman: (question: string) => Promise<string>,
    clarify: boolean = false
  ) {
    super();
    this.model = model;
    this.handleAskHuman = handleAskHuman;
    this.socket = new WebSocket(url);
    this.socket.on('open', () => {
      this.sendMessage({
        type: 'start',
        repoName,
        taskDescription,
        clarify,
      });
    });
    this.socket.on('message', (message: string) => {
      this.handleMessage(JSON.parse(message));
    });
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
    this.socket.on('close', (code) => {
      if (code !== 1000) {
        this.emit('error', new Error(`The agent server crashed.`));
      }
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
      case 'update-task':
        this.handleUpdateTaskMessage(message);
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
          message.request.messages.map(mapStoredMessageToChatMessage),
          message.request.options
        );
        const { generations, ...otherResults } = result;
        this.sendMessage({
          type: 'response',
          requestId: message.requestId,
          response: {
            generations: generations.map((generation) => ({
              ...generation,
              message: generation.message.toJSON(),
            })),
            ...otherResults,
          },
        });
        break;
      }
      case 'ask_human':
        this.sendMessage({
          type: 'response',
          requestId: message.requestId,
          response: await this.handleAskHuman(message.request.question),
        });
        break;
      default:
        throw new Error(
          `Unknown request type: ${(message.request as any).type}`
        );
    }
  }

  private async handleActionMessage(message: AgentActionMessage) {
    this.emit('action', message.action);
  }

  private async handleUpdateTaskMessage(message: AgentUpdateTaskMessage) {
    this.emit('update-task', message.taskDescription);
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
