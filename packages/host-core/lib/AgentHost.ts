import FormData from 'form-data';
import axios from 'axios';
import { createDirectorySource } from './sources/createDirectorySource';
import { AgentHostTask } from './AgentHostTask';

export class AgentHost {
  hostname: string;
  port: number;
  tasks: Record<string, AgentHostTask> = {};

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
    modelName: string,
    openAIApiKey: string
  ): AgentHostTask {
    return new AgentHostTask(
      `ws://${this.hostname}:${this.port}/agent`,
      repoName,
      taskDescription,
      modelName,
      openAIApiKey
    );
  }
}
