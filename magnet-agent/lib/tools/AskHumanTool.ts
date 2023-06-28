import { z } from 'zod';

import { AgentStructuredTool } from '../agent/AgentStructuredTool';

// Define the Zod schema for the input
const AskHumanSchema = z.object({
  question: z.string(),
});

type AskHumanType = z.infer<typeof AskHumanSchema>;

// Define the tool
class AskHumanTool extends AgentStructuredTool<typeof AskHumanSchema> {
  // Implement the required properties
  name = 'AskHumanTool';

  description = 'A tool that asks the human that wrote the task a question';

  schema = AskHumanSchema;

  // Implement the protected abstract method
  protected async _call(arg: AskHumanType): Promise<string> {
    return await this.context.sendRequest({
      type: 'ask_human',
      question: arg.question,
    });
  }
}

export default AskHumanTool;
