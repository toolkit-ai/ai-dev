/**
 * This file is based on code from Langchain, which is (c) Harrison Chase, and
 * licensed under the MIT License.
 */

import {
  type StoredMessage,
  ChatMessage,
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
  FunctionMessage,
} from 'langchain/schema';

export function mapStoredMessageToChatMessage(
  message: StoredMessage
): BaseMessage {
  switch (message.type) {
    case 'human':
      return new HumanMessage(message.data.content);
    case 'ai':
      return new AIMessage(
        message.data.content,
        message.data.additional_kwargs
      );
    case 'system':
      return new SystemMessage(message.data.content);
    case 'chat':
      if (message.data?.additional_kwargs?.['role'] === undefined) {
        throw new Error('Role must be defined for chat messages');
      }
      return new ChatMessage(
        message.data.content,
        message.data.additional_kwargs['role']
      );
    case 'function':
      if (message.data.name === undefined) {
        throw new Error('Function name is undefined');
      }
      return new FunctionMessage(message.data.content, message.data.name);
    default:
      throw new Error(`Got unexpected type: ${message.type}`);
  }
}
