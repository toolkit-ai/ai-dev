import { config } from 'dotenv';
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { OpenAI } from 'langchain/llms/openai';

import DirectoryReadTool from './tools/DirectoryReadTool';
import FileCreationTool from './tools/FileCreationTool';
import FileDeleteLinesTool from './tools/FileDeleteLinesTool';
import FileDeletionTool from './tools/FileDeletionTool';
import FileInsertTextTool from './tools/FileInsertTextTool';
import FileReadTool from './tools/FileReadTool';
import FileReplaceLinesTool from './tools/FileReplaceLinesTool';
import SearchTool from './tools/SearchTool';

config();

export const run = async ({
  path,
  taskDescription,
}: {
  path: string;
  taskDescription: string;
}) => {
  try {
    const openaiApiKey = process.env['OPENAI_API_KEY'];
    if (!openaiApiKey) {
      throw new Error('environment variable OPENAI_API_KEY not set');
    }

    const model = new OpenAI({
      modelName: 'gpt-4',
      openAIApiKey: openaiApiKey,
    });

    const tools = [
      new FileReadTool(),
      new DirectoryReadTool(),
      new SearchTool(),
      new FileCreationTool(),
      new FileDeleteLinesTool(),
      new FileInsertTextTool(),
      // new GitCreatePRTool(),
      new FileReplaceLinesTool(),
      new FileDeletionTool(),
    ];

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

class Agent {}

export default Agent;
