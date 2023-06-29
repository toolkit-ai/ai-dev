import { readFile, readdir } from 'fs/promises';
import path from 'path';

import type { BaseLLM } from 'langchain/llms/base';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { z } from 'zod';

export async function createTaskClarifyingQuestions(
  taskDescription: string,
  model: BaseLLM
): Promise<string[]> {
  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      questions: z
        .array(z.string())
        .describe(
          'questions to the product manager about what they mean by the task description.'
        ),
    })
  );
  const formatInstructions = parser.getFormatInstructions();
  const prompt = new PromptTemplate({
    template:
      "You're an expert engineer and just received a task from a product manager: '{task_description}'. Ask some clarifying questions about the technical specification of the task so you can write the correct code for it. Don't worry about timing or abstract requirements. Feel free to ask about the code involved. Ask no more than 4 questions, fewer if the task is clear. \n{format_instructions}",
    inputVariables: ['task_description'],
    partialVariables: { format_instructions: formatInstructions },
  });

  const input = await prompt.format({
    task_description: taskDescription,
  });

  const response = await model.call(input);
  const { questions } = await parser.parse(response);
  return questions;
}

export async function createClarifiedTask(
  taskDescription: string,
  clarifications: [string, string][],
  model: BaseLLM
): Promise<string> {
  const clarificationsString = clarifications.reduce(
    (acc, [question, answer]) => `${acc}Q: ${question}\nA: ${answer}\n\n`,
    ''
  );

  const prompt = new PromptTemplate({
    template:
      "You're an expert engineer and just received a task from a product manager: '{task_description}'. Write an updated task description incorporating the clarifications you received. \n{clarifications}",
    inputVariables: ['task_description', 'clarifications'],
  });

  const input = await prompt.format({
    task_description: taskDescription,
    clarifications: clarificationsString,
  });

  const response = await model.call(input);
  return response;
}

export async function createTaskAgentInput(
  workspaceDir: string,
  taskDescription: string
) {
  const files = await readdir(workspaceDir);
  const readmePath = files.filter((file) =>
    ['README.md', 'README.txt', 'README'].includes(file)
  )[0];
  const readme = readmePath
    ? await readFile(path.join(workspaceDir, readmePath), 'utf-8')
    : null;
  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      explanation: z
        .string()
        .describe(
          'A description of the code change made, an answer to the question in the task, or explanation of why the agent gave up.'
        ),
    })
  );
  const formatInstructions = parser.getFormatInstructions();
  const prompt = new PromptTemplate({
    template:
      "You're an expert engineer. The codebase you're working with is located in the {workspace_dir} directory. I'm the product manager and need you to implement this task: '{task_description}'. Here's a listing of the first 10 files in the {workspace_dir} directory: {files}. Explore the codebase, and based on what you understand, complete the task. If the task is unclear, you can ask me via AskHumanTool. {readme} \n{format_instructions}",
    inputVariables: ['task_description', 'workspace_dir', 'files', 'readme'],
    partialVariables: { format_instructions: formatInstructions },
  });

  const input = await prompt.format({
    task_description: taskDescription,
    workspace_dir: workspaceDir,
    files: JSON.stringify(files.slice(0, 10)),
    readme: readme
      ? `Here's an excerpt of the README:\n"""\n${readme.slice(0, 500)}\n"""\n`
      : '',
  });

  return input;
}
