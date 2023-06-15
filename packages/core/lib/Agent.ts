import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { OpenAI } from 'langchain/llms/openai';
import type { StructuredTool } from 'langchain/tools';

export const run = async ({
  tools,
  path,
  taskDescription,
  openAIApiKey,
}: {
  path: string;
  taskDescription: string;
  openAIApiKey: string;
  tools: StructuredTool[];
}) => {
  try {
    const model = new OpenAI({
      modelName: 'gpt-4',
      openAIApiKey,
    });

    const executor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: 'structured-chat-zero-shot-react-description',
      returnIntermediateSteps: true,
      verbose: true,
    });

    console.log('Loaded agent.');

    console.log(`Executing agent on task "${taskDescription}"...`);

    const result = await executor.call({
      input: `You're a coding assistant. The codebase you're working with is located in the ${path} directory so do your work in the context of to that path. I need your help with: ${taskDescription}. When you're finished return the following data in this format type result = { filesChagned: string[], commitMessage: string }`,
    });
    return result;
  } catch (error) {
    console.error(`Error running agent`, error);
    throw error;
  }
};
