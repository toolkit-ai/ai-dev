#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';

import { Command } from 'commander';
import indentString from 'indent-string';
import kleur from 'kleur';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import prompts, { type PromptObject } from 'prompts';
import { z } from 'zod';

import {
  containerExists,
  createContainer,
  createImage,
  deleteContainer,
  deleteOldContainerIfExists,
  imageExists,
  isContainerRunning,
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
  sendError,
  sendAgentResultFeedback,
  sendStart,
  shutdownAsync,
  sendDockerDesktopNotInstalled,
  measureAndSendPerformance,
  sendComplete,
  sendInterrupt,
  sendReviewAgentResult,
  sendApplyAgentResult,
} from './host/HostTelemetry';
import { applyAgentResult } from './host/result/applyAgentResult';
import { formatAgentResult } from './host/result/formatAgentResult';
import { formatAgentResultOutput } from './host/result/formatAgentResultOutput';
import { openFile } from './util/openFile';
import { version } from './version';

const program = new Command();
program
  .version(version)
  .option(
    '-f, --folder <repo>',
    'Specify the folder/repository with the code to edit'
  )
  .option(
    '-o, --outfolder <outfolder>',
    "Specify a folder to output the agent's patch and results in"
  )
  .option('-t, --task <task>', 'Specify the coding task')
  .option(
    '-tf, --taskfile <taskfile>',
    'Specify the coding task as a path to an input file'
  )
  .option('-m, --model <model>', 'Specify the OpenAI model to use')
  .option('-r, --rebuild', 'Rebuild the image and container before running')
  .option('-c, --clarify', 'Clarify the task description before running')
  .option('-a, --apply', 'Apply the task description before running');

const promptsConfig: PromptObject<any>[] = [
  {
    type: 'text',
    name: 'folder',
    initial: process.cwd(),
    message: 'Specify the folder/repository with the code to edit:',
    validate: (value: string) => (value ? true : 'This field is required'),
  },
  {
    type: 'text',
    name: 'taskDescription',
    message: 'Specify the coding task:',
    validate: (value: string) => (value ? true : 'This field is required'),
  },
  {
    type: 'text',
    name: 'outfolder',
    message: "Specify the folder to output the agent's results and patch in:",
    initial: process.cwd(),
    validate: (value: string) => (value ? true : 'This field is required'),
  },
  {
    type: 'select',
    name: 'model',
    message: 'Specify the OpenAI model to use:',
    initial: 1,
    choices: [
      { title: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo-0613' },
      { title: 'GPT-4 (Recommended)', value: 'gpt-4-0613' },
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
    message: "Paste your OpenAI API key (we'll save this in ~/.aidevrc.json):",
    validate: (value: string) => (value ? true : 'This field is required'),
  },
];

const optionSchema = z.object({
  folder: z.string(),
  outfolder: z.string(),
  taskDescription: z.string(),
  model: z.string(),
  clarify: z.boolean(),
  openAIApiKey: z.string(),
});

const settingsPath = path.join(os.homedir(), '.aidevrc.json');

const settingsSchema = z.object({
  openAIApiKey: z.string(),
});

interface Logger {
  log(message: string): void;
}
class BufferedLogger implements Logger {
  buffer: string[] = [];

  visible: boolean = false;

  show() {
    this.visible = true;
    this.buffer.forEach((message) => console.log(message));
    this.buffer = [];
  }

  log(message: string) {
    if (this.visible) {
      console.log(message);
      return;
    }
    this.buffer.push(message);
  }
}

function logContainer(message: string, logger: Logger = console) {
  logger.log(`${kleur.inverse().bold('Container')} ${message}`);
}

function logAgent(message: string, logger: Logger = console) {
  logger.log(`${kleur.blue().inverse().bold('Agent')} ${message}`);
}

function logError(message: any, logger: Logger = console) {
  const messageString =
    message instanceof Error ? message.message : String(message);
  logger.log(`${kleur.red().inverse().bold('Error')} ${messageString}`);
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

async function setupContainer(logger: Logger, rebuild: boolean) {
  await measureAndSendPerformance('docker-desktop-setup', async () => {
    if (!(await isDockerDesktopRunning())) {
      logContainer(
        'Docker Desktop is not running, launching it now...',
        logger
      );
      await launchDockerDesktop();
      await waitForDockerDesktop();
    }
  });

  await measureAndSendPerformance(
    'image-setup',
    async () => {
      await deleteOldContainerIfExists();

      if (!(await imageExists()) || rebuild) {
        logContainer(
          'Creating image! This may take a while the first time...',
          logger
        );
        if (await containerExists()) {
          logContainer('Deleting existing container...', logger);
          await deleteContainer();
        }
        await createImage(path.join(__dirname, '..'), 'Dockerfile');
      }
    },
    { rebuild }
  );

  await measureAndSendPerformance(
    'container-setup',
    async () => {
      const [hasContainer, isRunning] = await Promise.all([
        containerExists(),
        isContainerRunning(),
      ]);
      if (!(hasContainer && isRunning) || rebuild) {
        if (hasContainer) {
          logContainer('Deleting existing container...', logger);
          await deleteContainer();
        }

        logContainer('Creating container...', logger);
        await createContainer(PORT);
      }

      logContainer('Waiting for container...', logger);
      await waitForServer(PORT);
      logContainer(kleur.green('Container ready! ✅'), logger);
    },
    { rebuild }
  );
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
  const logger = new BufferedLogger();

  if (!(await isDockerDesktopInstalled())) {
    sendDockerDesktopNotInstalled();
    console.error(
      'Docker Desktop is not installed. Please visit https://www.docker.com/products/docker-desktop to install it.'
    );
    await shutdownAsync();
    process.exit(1);
  }

  prompts.override({
    folder: externalOptions['folder'],
    taskDescription: externalOptions['taskfile']
      ? await readFile(path.resolve(externalOptions['taskfile']), 'utf-8')
      : externalOptions['task'],
    outfolder: externalOptions['outfolder'],
    model: externalOptions['model'],
    clarify: externalOptions['clarify'],
    openAIApiKey: process.env['OPENAI_API_KEY'] || settings?.openAIApiKey,
  });

  const [options] = await Promise.all([
    (async () => {
      const optionsInternal = await prompts(promptsConfig);
      logger.show();
      return optionsInternal;
    })(),
    setupContainer(logger, externalOptions['rebuild']),
  ]);

  optionSchema.parse(options);

  if (
    !process.env['OPENAI_API_KEY'] &&
    settings?.openAIApiKey !== options['openAIApiKey']
  ) {
    await writeSettings({ openAIApiKey: options['openAIApiKey'] });
  }

  const {
    folder,
    outfolder,
    taskDescription,
    clarify,
    model: modelName,
    openAIApiKey,
  } = options;

  const model = new ChatOpenAI({ modelName, openAIApiKey, temperature: 0 });
  const host = new Host(HOST, PORT);

  logAgent('Uploading code to agent...');
  await measureAndSendPerformance('upload-code', async () => {
    await host.uploadDirectory(folder, folder);
  });

  logAgent('Agent running task...');
  const result = await measureAndSendPerformance('run-task', async () => {
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
          indentString(
            `${kleur.bold().underline('Task')}: ${newTaskDescription}`
          )
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
              )}\n`,
            2
          )
      );
    });

    return session.getResult();
  });

  await writeFile(
    path.resolve(outfolder, 'results.md'),
    formatAgentResult(taskDescription, result)
  );
  await writeFile(path.resolve(outfolder, 'patch.diff'), result.diff);

  logAgent(kleur.green().bold('Complete! ') + formatAgentResultOutput(result));
  logAgent(
    `${kleur.green().bold('Step-by-step results written to: ')}${path.join(
      outfolder,
      'results.md'
    )} ✅`
  );
  logAgent(
    `${kleur.green().bold('Patch file written to: ')}${path.join(
      outfolder,
      'patch.diff'
    )} ✅`
  );
  sendComplete();

  const { review } = await prompts.prompt({
    type: 'select',
    name: 'review',
    message: 'Review the changes from the model?',
    initial: 0,
    choices: [
      { title: 'Open step-by-step results', value: 'results' },
      { title: 'Open patch file', value: 'patch' },
      { title: 'Skip', value: 'skip' },
    ],
  });
  switch (review) {
    case 'results':
      await openFile(path.resolve(outfolder, 'results.md'));
      sendReviewAgentResult('results');
      break;
    case 'patch':
      await openFile(path.resolve(outfolder, 'patch.diff'));
      sendReviewAgentResult('results');
      break;
    default:
      break;
  }

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
    sendApplyAgentResult();
  }

  const agentOptions = { model: options['model'], clarify: options['clarify'] };
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
    sendAgentResultFeedback('positive', agentOptions);
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
    sendAgentResultFeedback(
      'negative',
      agentOptions,
      details as string,
      email as string
    );
  }
}

async function runAsyncTaskWithCrashWrapper() {
  try {
    sendStart();
    await runAsyncTask();
    process.exit(0);
  } catch (e) {
    logError(e);
    sendError(e);
    process.exit(1);
  } finally {
    await shutdownAsync();
  }
}

runAsyncTaskWithCrashWrapper();

process.on('SIGINT', async () => {
  sendInterrupt();
  await shutdownAsync();
  process.exit();
});
