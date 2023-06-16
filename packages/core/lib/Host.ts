import FormData from 'form-data';
import axios from 'axios';
import { createDirectorySource } from './sources/createDirectorySource';
import { HostAgentSession } from './HostAgentSession';

export class Host {
  hostname: string;
  port: number;
  modelName: string;
  openAIApiKey: string;

  constructor(
    hostname: string,
    port: number,
    modelName: string,
    openAIApiKey: string
  ) {
    this.hostname = hostname;
    this.port = port;
    this.modelName = modelName;
    this.openAIApiKey = openAIApiKey;
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

  createAgent(repoName: string, taskDescription: string): HostAgentSession {
    return new HostAgentSession(
      `ws://${this.hostname}:${this.port}/agent`,
      repoName,
      taskDescription,
      this.modelName,
      this.openAIApiKey
    );
  }
}
