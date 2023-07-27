/**
 * This file is based on code from Langchain, which is (c) Harrison Chase, and
 * licensed under the MIT License.
 */

import type { CallbackManagerForLLMRun } from 'langchain/callbacks';
import { BaseChatModel } from 'langchain/chat_models/base';
import { type BaseLLMParams } from 'langchain/llms/base';
import type { BaseChatMessage, ChatResult } from 'langchain/schema';
import type { ChatCompletionFunctions } from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';

import type { AgentContext } from './AgentContext';
import type { AgentRequestModelResponse } from './AgentRequest';
import type { AgentStructuredTool } from './AgentStructuredTool';
import { mapStoredMessageToChatMessage } from '../util/mapStoredMessageToChatMessage';

function formatToOpenAIFunction(
  tool: AgentStructuredTool
): ChatCompletionFunctions {
  return {
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.schema),
  };
}

interface TokenUsage {
  completionTokens?: number;
  promptTokens?: number;
  totalTokens?: number;
}

interface OpenAILLMOutput {
  tokenUsage: TokenUsage;
}

export class AgentChatProxyModel extends BaseChatModel {
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
    messages: BaseChatMessage[],
    options: this['ParsedCallOptions'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _?: CallbackManagerForLLMRun | undefined
  ): Promise<ChatResult> {
    // @ts-expect-error 6133
    const { tools, ...otherOptions } = options;
    const functions = (tools || []).map((tool: AgentStructuredTool) =>
      formatToOpenAIFunction(tool)
    );
    const result = await this.context.sendRequest<AgentRequestModelResponse>({
      type: 'model',
      messages: messages.map((m) => m.toJSON()),
      // @ts-expect-error 6133
      options: {
        // OpenAI errors if you pass an empty array of functions
        functions: functions.length ? functions : undefined,
        ...otherOptions,
      },
    });

    const { generations, ...otherResult } = result;

    return {
      generations: generations.map((generation) => ({
        ...generation,
        message: mapStoredMessageToChatMessage(generation.message),
      })),
      ...otherResult,
    };
  }

  override _combineLLMOutput(
    ...llmOutputs: OpenAILLMOutput[]
  ): OpenAILLMOutput {
    return llmOutputs.reduce<{
      [key in keyof OpenAILLMOutput]: Required<OpenAILLMOutput[key]>;
    }>(
      (acc, llmOutput) => {
        if (llmOutput && llmOutput.tokenUsage) {
          acc.tokenUsage.completionTokens +=
            llmOutput.tokenUsage.completionTokens ?? 0;
          acc.tokenUsage.promptTokens += llmOutput.tokenUsage.promptTokens ?? 0;
          acc.tokenUsage.totalTokens += llmOutput.tokenUsage.totalTokens ?? 0;
        }
        return acc;
      },
      {
        tokenUsage: {
          completionTokens: 0,
          promptTokens: 0,
          totalTokens: 0,
        },
      }
    );
  }

  override _modelType(): string {
    return 'base_chat_model';
  }

  override _llmType(): string {
    return 'openai';
  }
}
