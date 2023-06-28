import type { CallbackManagerForLLMRun } from 'langchain/callbacks';
import { BaseLLM, type BaseLLMParams } from 'langchain/llms/base';
import type { LLMResult } from 'langchain/schema';

import type { AgentContext } from './AgentContext';
import type { AgentRequestModelResponse } from './AgentRequest';

export class AgentModel extends BaseLLM {
  context: AgentContext;

  constructor(
    fields: BaseLLMParams & {
      context: AgentContext;
    }
  ) {
    super(fields);
    this.context = fields.context;
  }

  override async _generate(
    prompts: string[],
    options: this['ParsedCallOptions'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: CallbackManagerForLLMRun | undefined
  ): Promise<LLMResult> {
    return this.context.sendRequest<AgentRequestModelResponse>({
      type: 'model',
      prompts,
      options,
    });
  }

  override _llmType(): string {
    return 'agent_model';
  }
}
