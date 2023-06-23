#!/usr/bin/env node

import { Command } from 'commander';
import {
  containerExists,
  createContainer,
  createImage,
  deleteContainer,
  imageExists,
  isDockerDesktopInstalled,
  isDockerDesktopRunning,
  launchDockerDesktop,
  waitForDockerDesktop,
  waitForServer,
} from '../containers/local';
import { Host } from '../host/Host';
import { HOST, PORT } from './config';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';
import indentString from 'indent-string';
import { formatAgentResult } from '../agent/formatAgentResult';

dotenv.config();

const program = new Command();
program
  .requiredOption('-f, --folder <repo>', 'Specify the folder/repository')
  .requiredOption('-o, --outfile <outfile>', 'Specify the outfile')
  .option('-t, --task <task>', 'Specify the task')
  .option('-tf, --taskfile <taskfile>', 'Specify the task as an input file')
  .option(
    '-m, --model <model>',
    'Specify the OpenAI model to use',
    'gpt-3.5-turbo'
  )
  .option('-r, --rebuild', 'Rebuild the image and container before running');

program.parse(process.argv);

async function runAsyncTask() {
  const {
    folder,
    outfile,
    taskfile,
    task,
    rebuild,
    model: modelName,
  } = program.opts();

  let taskDescription: string = task;
  if (taskfile) {
    taskDescription = await readFile(path.resolve(taskfile), 'utf-8');
  }

  if (!taskDescription) {
    console.error(
      'No task or taskfile specified. Please specify one with the `-t` or `-tf` flag.'
    );
    process.exit(1);
  }

  const openAIApiKey = process.env['OPENAI_API_KEY'];
  if (!openAIApiKey) {
    console.error(
      'No OPENAI_API_KEY found in environment. Set it in your shell environment by passing `OPENAI_API_KEY=[key] npx magnet-agent...`'
    );
    process.exit(1);
  }

  if (!isDockerDesktopInstalled()) {
    console.error(
      'Docker Desktop is not installed. Please visit https://www.docker.com/products/docker-desktop to install it.'
    );
    process.exit(1);
  }

  if (!isDockerDesktopRunning()) {
    logContainer('Docker Desktop is not running, launching it now...');
    launchDockerDesktop();
    await waitForDockerDesktop();
  }

  if (!imageExists() || rebuild) {
    logContainer('Creating image...');
    createImage(path.join(__dirname, '..', '..'), 'Dockerfile');
  }

  if (!containerExists() || rebuild) {
    if (containerExists()) {
      logContainer('Deleting existing container...');
      deleteContainer();
    }

    logContainer('Creating container...');
    createContainer();
  }

  logContainer('Waiting for container...');
  await waitForServer();
  logContainer(chalk.green('Container ready! ✅'));

  logAgent('Running task...');

  const host = new Host(HOST, PORT);
  await host.uploadDirectory(folder, folder);

  const session = host.startTask(
    folder,
    taskDescription,
    modelName,
    openAIApiKey
  );
  session.on('action', (action) => {
    logAgent(
      chalk.blue.bold('Performed action...\n\n') +
        indentString(
          `${chalk.bold.underline('Tool')}: ${action.tool}\n\n` +
            `${chalk.bold.underline('Tool Input')}:\n${indentString(
              JSON.stringify(action.toolInput, null, 2),
              2
            )}\n\n` +
            `${chalk.bold.underline('Log')}:\n${indentString(action.log)}`,
          2
        )
    );
  });

  try {
    const result = await session.getResult();
    await writeFile(path.resolve(outfile), formatAgentResult(result));
    logAgent(
      chalk.green.bold('Complete! Output written to: ') + `${outfile} ✅`
    );
  } catch (e) {
    logAgent(chalk.red.bold('Error!') + '\n\n' + indentString(e as any, 2));
  }
}

function logContainer(message: string) {
  console.log(chalk.inverse.bold('Container') + ' ' + message);
}

function logAgent(message: string) {
  console.log(chalk.blue.inverse.bold('Agent') + ' ' + message);
}

runAsyncTask();
