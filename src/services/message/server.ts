/* eslint-disable @typescript-eslint/no-unused-vars */
import { INBOX_SESSION_ID } from '@/const/session';
import { MessageItem } from '@/database/schemas';
import { lambdaClient } from '@/libs/trpc/client';
import {
  ChatMessage,
  ChatMessageError,
  ChatTTS,
  ChatTranslate,
  CreateMessageParams,
} from '@/types/message';

import { IMessageService } from './type';

export class ServerService implements IMessageService {
  createMessage({ sessionId, ...params }: CreateMessageParams): Promise<string> {
    return lambdaClient.message.createMessage.mutate({
      ...params,
      sessionId: this.toDbSessionId(sessionId),
    });
  }

  batchCreateMessages(messages: MessageItem[]): Promise<any> {
    return lambdaClient.message.batchCreateMessages.mutate(messages);
  }

  getMessages = async (sessionId?: string, topicId?: string | undefined) => {
    const data = await lambdaClient.message.getMessages.query({
      sessionId: this.toDbSessionId(sessionId),
      topicId,
    });

    return data as unknown as ChatMessage[];
  };

  getAllMessages(): Promise<ChatMessage[]> {
    return lambdaClient.message.getAllMessages.query();
  }

  getAllMessagesInSession(sessionId: string): Promise<ChatMessage[]> {
    return lambdaClient.message.getAllMessagesInSession.query({
      sessionId: this.toDbSessionId(sessionId),
    });
  }

  countMessages(): Promise<number> {
    return lambdaClient.message.count.query();
  }
  countTodayMessages(): Promise<number> {
    return lambdaClient.message.countToday.query();
  }

  updateMessageError(id: string, error: ChatMessageError): Promise<any> {
    return lambdaClient.message.update.mutate({ id, value: { error } });
  }

  async updateMessagePluginError(id: string, error: ChatMessageError): Promise<any> {
    return lambdaClient.message.update.mutate({ id, value: { pluginError: error } });
  }

  async updateMessagePluginArguments(
    id: string,
    value: string | Record<string, any>,
  ): Promise<any> {
    const args = typeof value === 'string' ? value : JSON.stringify(value);

    return lambdaClient.message.updateMessagePlugin.mutate({ id, value: { arguments: args } });
  }

  updateMessage(id: string, message: Partial<MessageItem>): Promise<any> {
    return lambdaClient.message.update.mutate({ id, value: message });
  }

  updateMessageTranslate(id: string, translate: Partial<ChatTranslate> | false): Promise<any> {
    return lambdaClient.message.updateTranslate.mutate({ id, value: translate as ChatTranslate });
  }

  updateMessageTTS(id: string, tts: Partial<ChatTTS> | false): Promise<any> {
    return lambdaClient.message.updateTTS.mutate({ id, value: tts });
  }

  updateMessagePluginState(id: string, value: any): Promise<any> {
    return lambdaClient.message.updatePluginState.mutate({ id, value });
  }

  removeMessage(id: string): Promise<any> {
    return lambdaClient.message.removeMessage.mutate({ id });
  }

  removeMessages(ids: string[]): Promise<any> {
    return lambdaClient.message.removeMessages.mutate({ ids });
  }

  removeMessagesByAssistant(sessionId: string, topicId?: string | undefined): Promise<any> {
    return lambdaClient.message.removeMessagesByAssistant.mutate({
      sessionId: this.toDbSessionId(sessionId),
      topicId,
    });
  }
  removeAllMessages(): Promise<any> {
    return lambdaClient.message.removeAllMessages.mutate();
  }

  private toDbSessionId(sessionId: string | undefined) {
    return sessionId === INBOX_SESSION_ID ? null : sessionId;
  }

  async hasMessages() {
    const number = await this.countMessages();
    return number > 0;
  }

  async messageCountToCheckTrace() {
    const number = await this.countMessages();
    return number >= 4;
  }
}
