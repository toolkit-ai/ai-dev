import axios from 'axios';
import FormData from 'form-data';
import type { BaseLLM } from 'langchain/llms/base';

import { HostTask } from './HostTask';
import { createDirectorySource } from './createDirectorySource';

export class Host {
  hostname: string;

  port: number;

  constructor(hostname: string, port: number) {
    this.hostname = hostname;
    this.port = port;
  }

  async uploadDirectory(repoName: string, directoryPath: string) {
    const form = new FormData();
    form.append('repoName', repoName);
    form.append('archive', await createDirectorySource(directoryPath));

    await axios.post(`http://${this.hostname}:${this.port}/upload`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  startTask(
    repoName: string,
    taskDescription: string,
    model: BaseLLM,
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
