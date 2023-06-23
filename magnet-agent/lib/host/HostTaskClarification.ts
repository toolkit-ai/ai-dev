import type { BaseLLM } from 'langchain/llms/base';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { z } from 'zod';

export async function createClarifyingQuestions(
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

export async function createClarifiedTaskDescription(
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
