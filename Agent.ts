
import { OpenAI } from "langchain/llms/openai";
import { DynamicTool } from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

import DirectoryReadTool from "./tools/DirectoryReadTool";
import FileReadTool from "./tools/FileReadTool";
import SearchTool from "./tools/SearchTool";


export const run = async ({
    path
}:{
    path: string
}) => {
  const model = new OpenAI({ });
  const tools:DynamicTool[] = [
    // new FileReadTool(),
    // new DirectoryReadTool(),
    // new SearchTool(),    
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "zero-shot-react-description",
  });


  console.log("Loaded agent.");

  const input = `You're a coding assistant. I want to know What files are react components, given the starting directory we're in which is ${path}`;

  console.log(`Executing with input "${input}"...`);

  const result = await executor.call({ input });

  console.log(`Got output ${result.output}`);
};


class Agent {


}

export default Agent