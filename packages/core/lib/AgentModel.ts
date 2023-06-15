import type { CallbackManagerForLLMRun } from 'langchain/callbacks';
import { BaseLLM, type BaseLLMParams } from 'langchain/llms/base';
import type { LLMResult } from 'langchain/schema';

export type AgentModelRequest = {
  prompts: string[];
  options: AgentModel['ParsedCallOptions'];
};

export type AgentModelResponse = LLMResult;

export class AgentModel extends BaseLLM {
  sendRequest: (request: AgentModelRequest) => Promise<AgentModelResponse>;

  constructor(
    fields: BaseLLMParams & {
      sendRequest: (request: AgentModelRequest) => Promise<AgentModelResponse>;
    }
  ) {
    super(fields);
    this.sendRequest = fields.sendRequest;
  }

  override async _generate(
    prompts: string[],
    options: this['ParsedCallOptions'],
    _?: CallbackManagerForLLMRun | undefined
  ): Promise<LLMResult> {
    return this.sendRequest({
      prompts,
      options,
    });
  }

  override _llmType(): string {
    return 'agent_model';
  }
}
