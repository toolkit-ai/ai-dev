/**
 * This file is based on code from Langchain, which is (c) Harrison Chase, and
 * licensed under the MIT License.
 */

import {
  AIChatMessage,
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
  type StoredMessage,
  ChatMessage,
  FunctionChatMessage,
} from 'langchain/schema';

export function mapStoredMessageToChatMessage(
  message: StoredMessage
): BaseChatMessage {
  switch (message.type) {
    case 'human':
      return new HumanChatMessage(message.data.content);
    case 'ai':
      return new AIChatMessage(
        message.data.content,
        message.data.additional_kwargs
      );
    case 'system':
      return new SystemChatMessage(message.data.content);
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
      return new FunctionChatMessage(message.data.content, message.data.name);
    default:
      throw new Error(`Got unexpected type: ${message.type}`);
  }
}
