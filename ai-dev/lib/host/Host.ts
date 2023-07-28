import axios from 'axios';
import FormData from 'form-data';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

import { HostTask } from './HostTask.js';

export class Host {
  hostname: string;

  port: number;

  constructor(hostname: string, port: number) {
    this.hostname = hostname;
    this.port = port;
  }

  async uploadSource(repoName: string, stream: NodeJS.ReadableStream) {
    const form = new FormData();
    form.append('repoName', repoName);
    form.append('archive', stream);

    await axios.post(`http://${this.hostname}:${this.port}/upload`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  startTask(
    repoName: string,
    taskDescription: string,
    model: ChatOpenAI,
    handleAskHuman: (question: string) => Promise<string>,
    clarify: boolean = false
  ): HostTask {
    return new HostTask(
      `ws://${this.hostname}:${this.port}/agent`,
      repoName,
      taskDescription,
      model,
      handleAskHuman,
      clarify
    );
  }
}
