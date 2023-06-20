#!/usr/bin/env node

import { Command } from 'commander';
import {
  containerExists,
  createContainer,
  createImage,
  deleteContainer,
  imageExists,
  waitForServer,
} from './container';
import { Host } from '@magnet-agent/core';
import { HOST, PORT } from './config';
import { writeFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { formatResultsToMarkdown } from './format-agent-output';

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
    task,
    outfile,
    rebuild,
    model: modelName,
    outputFormat,
  } = program.opts();

  const openAIApiKey = process.env['OPENAI_API_KEY'];
  if (!openAIApiKey) {
    console.error(
      'No OPENAI_API_KEY found in environment. Set it in your .env file.'
    );
    process.exit(1);
  }

  if (!imageExists() || rebuild) {
    console.log('Creating image...');
    createImage();
  }

  if (!containerExists() || rebuild) {
    console.log('Creating container...');
    if (containerExists()) deleteContainer();
    createContainer();
  }

  await waitForServer();

  console.log('Running task...');

  const host = new Host(HOST, PORT, modelName, openAIApiKey);
  await host.uploadDirectory(folder, folder);

  const session = host.createAgent(folder, task);
  session.on('action', (action) => {
    console.log(`Action: ${JSON.stringify(action)}`);
  });

  try {
    const result = await session.getResult();
    
    /*
      Should the formatting be done in the script here
      or should the agent itself has that as a parameter?
    */
    const outputData =
      outputFormat === 'md' ? formatResultsToMarkdown(result) : JSON.stringify(result, null, 2);

    await writeFile(path.resolve(outfile), outputData);
    console.log('Done running task!');
  } catch (e) {
    console.error(`Error running task: ${e}`);
  }
}

runAsyncTask();
