import { CallbackManager, type Callbacks } from 'langchain/callbacks';
import { StructuredTool } from 'langchain/tools';
import { z } from 'zod';

import type { AgentContext } from './AgentContext';

export abstract class AgentStructuredTool<
  T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>
> extends StructuredTool<T> {
  context: AgentContext;

  constructor(context: AgentContext) {
    super();
    this.context = context;
  }

  override async call(
    arg: (z.output<T> extends string ? string : never) | z.input<T>,
    callbacks?: Callbacks,
    tags?: string[]
  ): Promise<string> {
    let parsed: z.output<T>;
    try {
      parsed = await this.schema.parseAsync(arg);
    } catch (e) {
      return `Could not parse the input. Please make sure it matches the JSON schema for this tool.`;
    }

    const callbackManager = await CallbackManager.configure(
      callbacks,
      this.callbacks,
      tags,
      this.tags,
      { verbose: this.verbose }
    );
    const runManager = await callbackManager?.handleToolStart(
      this.toJSON(),
      typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
    );
    let result;
    try {
      result = await this._call(parsed, runManager);
    } catch (e) {
      await runManager?.handleToolError(e);
      throw e;
    }
    await runManager?.handleToolEnd(result);
    return result;
  }
}
