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
} from './container';
import { AgentHost, formatAsMarkdown } from '@magnet-agent/host-core';
import { HOST, PORT } from './config';
import { writeFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';
import indentString from 'indent-string';

dotenv.config();

const program = new Command();
program
  .requiredOption('-f, --folder <repo>', 'Specify the folder/repository')
  .requiredOption('-t, --task <task>', 'Specify the task')
  .requiredOption('-o, --outfile <outfile>', 'Specify the outfile')
  .option(
    '-of, --outputFormat <format>',
    'Specify the output format json or md',
    'md'
  )
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
    outputFormat,
    task,
    rebuild,
    model: modelName,
  } = program.opts();

  const openAIApiKey = process.env['OPENAI_API_KEY'];
  if (!openAIApiKey) {
    console.error(
      'No OPENAI_API_KEY found in environment. Set it in your .env file.'
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
    createImage(path.join(__dirname, '..', '..'), 'local/Dockerfile');
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

  const host = new AgentHost(HOST, PORT);
  await host.uploadDirectory(folder, folder);

  const session = host.startTask(folder, task, modelName, openAIApiKey);
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

    switch (outputFormat) {
      case 'md':
        await writeFile(path.resolve(outfile), formatAsMarkdown(result));
        break;
      case 'json':
        await writeFile(path.resolve(outfile), JSON.stringify(result, null, 2));
        break;
      default:
        console.error(`Unknown output format: ${outputFormat}`);
        process.exit(1);
    }

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
