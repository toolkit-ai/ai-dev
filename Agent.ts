
import { OpenAI } from "langchain/llms/openai";

import { initializeAgentExecutorWithOptions } from "langchain/agents";

import DirectoryReadTool from "./tools/DirectoryReadTool";
import FileReadTool from "./tools/FileReadTool";
import SearchTool from "./tools/SearchTool";

import dotenv from 'dotenv';
import FileCreationTool from "./tools/FileCreationTool";
import FileDeleteLinesTool from "./tools/FileDeleteLinesTool";
import FileInsertTextTool from "./tools/FileInsertTextTool";
import GitCreatePRTool from "./tools/GitCreatePRTool";
import FileReplaceLinesTool from "./tools/FileReplaceLinesTool";
import FileDeletionTool from "./tools/FileDeletionTool";
dotenv.config();

export const run = async ({
    path,
    taskDescription
}:{
    path: string
    taskDescription: string
}) => {
    try{
    
  const model = new OpenAI({ 
    modelName: 'gpt-4',
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  const tools = [
    new FileReadTool(),
    new DirectoryReadTool(),
    new SearchTool(),
    new FileCreationTool(),
    new FileDeleteLinesTool(),
    new FileInsertTextTool(),
    new GitCreatePRTool(),
    new FileReplaceLinesTool(),
    new FileDeletionTool()
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    returnIntermediateSteps: true,
    verbose: true,
    
  });


  console.log("Loaded agent.");

  console.log(`Executing agent on task "${taskDescription}"...`);

  const result = await executor.call({ 
    input: `You're a coding assistant. The codebase you're working with is located in the ${path} directory so do your work in the context of to that path. I need your help with: ` + taskDescription
    
  });
  return result;
  
} catch (error) {
    console.error(`Error running agent`, error);
    throw error;
  }
};


class Agent {


}

export default Agent