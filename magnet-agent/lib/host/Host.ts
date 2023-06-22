import FormData from 'form-data';
import axios from 'axios';
import { createDirectorySource } from './createDirectorySource';
import { HostTask } from './HostTask';

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
    modelName: string,
    openAIApiKey: string
  ): HostTask {
    return new HostTask(
      `ws://${this.hostname}:${this.port}/agent`,
      repoName,
      taskDescription,
      modelName,
      openAIApiKey
    );
  }
}
