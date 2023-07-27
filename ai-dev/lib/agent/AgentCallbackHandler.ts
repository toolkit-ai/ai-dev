import { BaseCallbackHandler } from 'langchain/callbacks';
import type { AgentAction } from 'langchain/schema';

import type { AgentMessage } from './AgentMessage.js';

export class AgentCallbackHandler extends BaseCallbackHandler {
  name = 'AgentCallbackHandler';

  sendMessage: (message: AgentMessage) => void;

  constructor(sendMessage: (message: AgentMessage) => void) {
    super();
    this.sendMessage = sendMessage;
  }

  override async handleAgentAction(action: AgentAction) {
    this.sendMessage({
      type: 'action',
      action,
    });
  }
}
