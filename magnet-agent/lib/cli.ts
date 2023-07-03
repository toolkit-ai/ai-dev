#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';

import { Command } from 'commander';
import indentString from 'indent-string';
import kleur from 'kleur';
import { OpenAI } from 'langchain/llms/openai';
import prompts from 'prompts';
import { z } from 'zod';

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
} from './containers/local';
import { HOST, PORT } from './defaultAgentServerConfig';
import { Host } from './host';
import {
  analyticsDisabled,
  sendAgentError,
  sendAgentResultFeedback,
} from './host/HostTelemetry';
import { applyAgentResult } from './host/result/applyAgentResult';
import { formatAgentResult } from './host/result/formatAgentResult';
import { formatAgentResultOutput } from './host/result/formatAgentResultOutput';
import { version } from './version';

const program = new Command();
program
  .version(version)
  .option('-f, --folder <repo>', 'Specify the folder/repository')
  .option(
    '-o, --outfile <outfile>',
    "Specify a file to output the agent's results in"
  )
  .option('-t, --task <task>', 'Specify the task')
  .option('-tf, --taskfile <taskfile>', 'Specify the task as an input file')
  .option('-m, --model <model>', 'Specify the OpenAI model to use')
  .option('-r, --rebuild', 'Rebuild the image and container before running')
  .option('-c, --clarify', 'Clarify the task description before running')
  .option('-a, --apply', 'Apply the task description before running');

const optionSchema = z.object({
  folder: z.string(),
  outfile: z.string(),
  taskDescription: z.string(),
  model: z.string(),
  clarify: z.boolean(),
  openAIApiKey: z.string(),
});

const settingsPath = path.join(os.homedir(), '.magnetrc.json');

const settingsSchema = z.object({
  openAIApiKey: z.string(),
});

function logContainer(message: string) {
  console.log(`${kleur.inverse().bold('Container')} ${message}`);
}

function logAgent(message: string) {
  console.log(`${kleur.blue().inverse().bold('Agent')} ${message}`);
}

function logError(message: any) {
  const messageString =
    message instanceof Error ? message.message : String(message);

  console.log(`${kleur.red().inverse().bold('Error')} ${messageString}`);
}

async function writeSettings(settings: z.infer<typeof settingsSchema>) {
  await writeFile(settingsPath, JSON.stringify(settings, null, 2));
}

async function readSettings(): Promise<z.infer<typeof settingsSchema> | null> {
  try {
    const settings = JSON.parse(
      await readFile(settingsPath, { encoding: 'utf-8' })
    );
    return settingsSchema.parse(settings);
  } catch (e) {
    return null;
  }
}

async function handleAskHuman(question: string): Promise<string> {
  const { askHuman } = await prompts.prompt({
    type: 'text',
    name: 'askHuman',
    message: question,
  });
  return askHuman;
}

async function runAsyncTask() {
  const externalOptions = program.parse(process.argv).opts();
  const settings = await readSettings();

  prompts.override({
    folder: externalOptions['folder'],
    taskDescription: externalOptions['taskfile']
      ? await readFile(path.resolve(externalOptions['taskfile']), 'utf-8')
      : externalOptions['task'],
    outfile: externalOptions['outfile'],
    model: externalOptions['model'],
    clarify: externalOptions['clarify'],
    openAIApiKey: process.env['OPENAI_API_KEY'] || settings?.openAIApiKey,
  });

  const options = await prompts([
    {
      type: 'text',
      name: 'folder',
      initial: process.cwd(),
      message: 'Specify the folder/repository:',
      validate: (value: string) => (value ? true : 'This field is required'),
    },
    {
      type: 'text',
      name: 'taskDescription',
      message: 'Specify the task:',
      validate: (value: string) => (value ? true : 'This field is required'),
    },
    {
      type: 'text',
      name: 'outfile',
      message: "Specify a file to output the agent's results in:",
      initial: 'results.md',
      validate: (value: string) => (value ? true : 'This field is required'),
    },
    {
      type: 'select',
      name: 'model',
      message: 'Specify the OpenAI model to use:',
      initial: 0,
      choices: [
        { title: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
        { title: 'GPT-4', value: 'gpt-4' },
      ],
    },
    {
      type: 'toggle',
      name: 'clarify',
      message: 'Clarify the task description before starting?',
      initial: false,
      active: 'yes',
      inactive: 'no',
    },
    {
      type: 'password',
      name: 'openAIApiKey',
      message:
        "Paste your OpenAI API key (we'll save this in ~/.magnetrc.json):",
      validate: (value: string) => (value ? true : 'This field is required'),
    },
  ]);

  optionSchema.parse(options);

  if (
    !process.env['OPENAI_API_KEY'] &&
    settings?.openAIApiKey !== options.openAIApiKey
  ) {
    await writeSettings({ openAIApiKey: options.openAIApiKey });
  }

  const { rebuild } = externalOptions;
  const {
    folder,
    outfile,
    taskDescription,
    clarify,
    model: modelName,
    openAIApiKey,
  } = options;

  if (!(await isDockerDesktopInstalled())) {
    console.error(
      'Docker Desktop is not installed. Please visit https://www.docker.com/products/docker-desktop to install it.'
    );
    process.exit(1);
  }

  if (!(await isDockerDesktopRunning())) {
    logContainer('Docker Desktop is not running, launching it now...');
    await launchDockerDesktop();
    await waitForDockerDesktop();
  }

  if (!(await imageExists()) || rebuild) {
    logContainer('Creating image! This may take a while the first time...');
    if (await containerExists()) {
      logContainer('Deleting existing container...');
      await deleteContainer();
    }
    await createImage(path.join(__dirname, '..'), 'Dockerfile');
  }

  const hasContainer = await containerExists();
  if (!hasContainer || rebuild) {
    if (hasContainer) {
      logContainer('Deleting existing container...');
      await deleteContainer();
    }

    logContainer('Creating container...');
    await createContainer(PORT);
  }

  logContainer('Waiting for container...');
  await waitForServer(PORT);
  logContainer(kleur.green('Container ready! ✅'));

  const model = new OpenAI({ modelName, openAIApiKey });

  logAgent('Starting agent...');

  const host = new Host(HOST, PORT);
  await host.uploadDirectory(folder, folder);

  logAgent('Agent running task...');

  const session = host.startTask(
    folder,
    taskDescription,
    model,
    handleAskHuman,
    clarify
  );

  session.on('update-task', (newTaskDescription: any) => {
    logAgent(
      kleur.blue().bold('Task revised by agent...\n\n') +
        indentString(`${kleur.bold().underline('Task')}: ${newTaskDescription}`)
    );
  });

  session.on('action', (action: any) => {
    logAgent(
      kleur.blue().bold('Performed action...\n\n') +
        indentString(
          `${kleur.bold().underline('Tool')}: ${action.tool}\n\n` +
            `${kleur.bold().underline('Tool Input')}:\n${indentString(
              JSON.stringify(action.toolInput, null, 2),
              2
            )}\n\n` +
            `${kleur.bold().underline('Log')}:\n${indentString(action.log)}`,
          2
        )
    );
  });

  const result = await session.getResult();
  await writeFile(path.resolve(outfile), formatAgentResult(result));
  logAgent(kleur.green().bold('Complete! ') + formatAgentResultOutput(result));
  logAgent(`${kleur.green().bold('Output written to: ')}${outfile} ✅`);

  const { feedback } = analyticsDisabled
    ? { feedback: 'skip' }
    : await prompts.prompt({
        type: 'select',
        name: 'feedback',
        message: 'Did the agent do a good job? (Sends feedback to Toolkit AI)',
        initial: 0,
        choices: [
          { title: 'Yes', value: 'positive' },
          { title: 'No', value: 'negative' },
          { title: 'Skip', value: 'skip' },
        ],
      });

  if (feedback === 'positive') {
    await sendAgentResultFeedback('positive');
  }

  if (feedback === 'skip' || feedback === 'positive') {
    const { apply } = await prompts.prompt({
      type: 'toggle',
      name: 'apply',
      message: 'Apply the changes to local copy?',
      initial: false,
      active: 'yes',
      inactive: 'no',
    });
    if (apply) {
      await applyAgentResult(result, folder);
    }
  }

  if (feedback === 'negative') {
    const { details } = await prompts.prompt({
      type: 'text',
      name: 'details',
      message: 'What went wrong?',
    });
    const { email } = await prompts.prompt({
      type: 'text',
      name: 'email',
      message: 'What email can we contact you at?',
    });
    await sendAgentResultFeedback(
      'negative',
      details as string,
      email as string
    );
  }
}

async function runAsyncTaskWithCrashWrapper() {
  try {
    await runAsyncTask();
    process.exit(0);
  } catch (e) {
    logError(e);
    await sendAgentError(e);
    process.exit(1);
  }
}

runAsyncTaskWithCrashWrapper();
