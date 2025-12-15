import { Injectable, Logger } from "@nestjs/common";
import { MessageEntity } from "src/core/domain/entities/message.entity";

interface UserMessage {
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

interface ChannelContext {
  channelId: string;
  messages: UserMessage[]
  lastActivity: Date;
}

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name)

  private userMemories = new Map<string, MessageEntity[]>()
  private channelContexts = new Map<string, ChannelContext>()

  private readonly MAX_USER_MESSAGES = 15;
  private readonly MAX_CHANNEL_MESSAGES = 20;
  private readonly CONTEXT_TIMEOUT_MS = 30 * 60 * 1000

  /**
   * Adiciona Mensagem do usuário à memória
   */
  addUserMessage(userId: string, userName: string, message: string): void {
    if (!this.userMemories.has(userId)) {
      this.userMemories.set(userId, [])
    }

    const memories = this.userMemories.get(userId)!;
    memories.push(new MessageEntity('user', message))

    if (memories.length > this.MAX_USER_MESSAGES) {
      memories.shift();
    }

    this.logger.debug(`Memória do usuário ${userName}^: ${memories.length} mensagens.`);
  }

  /**
   *  Adiciona resposda do bot á memória do usuário
   */
  addBotResponse(userId: string, response: string): void {
    if (!this.userMemories.has(userId)) {
      this.userMemories.set(userId, []);
    }

    const memories = this.userMemories.get(userId)!;
    memories.push(new MessageEntity('assistant', response));

    if (memories.length > this.MAX_USER_MESSAGES) {
      memories.shift();
    }
  }

  /**
   * Adiciona mensagem ao contexto do canal
   */
  addChannelMessage(
    channelId: string,
    userId: string,
    userName: string,
    content: string
  ): void {
    if (!this.channelContexts.has(channelId)) {
      this.channelContexts.set(channelId, {
        channelId,
        messages: [],
        lastActivity: new Date(),
      });
    }

    const context = this.channelContexts.get(channelId)!;
    context.messages.push({
      userId,
      userName,
      content,
      timestamp: new Date(),
    });
    context.lastActivity = new Date();

    if (context.messages.length > this.MAX_CHANNEL_MESSAGES) {
      context.messages.shift()
    }

    this.logger.debug(`Contexto do canal: ${channelId}: ${context.messages.length} mensagens.`)
  }

  /**
   * Obtém memória do usuário
   */
  getUserMemory(userId: string): MessageEntity[] {
    return this.userMemories.get(userId) || [];
  }

  /**
   * Obtém contexto do canal formatado pela IA
   */
  getChannelContext(channelId: string): string {
    const context = this.channelContexts.get(channelId)

    if (!context || context.messages.length === 0) {
      return '';
    }

    const recentMessages = context.messages.slice(-10);
    const formatted = recentMessages
      .map(m => `@${m.userName}: ${m.content}`)
      .join('\n')

    return `\n\n[Contexto recente do canal]\n${formatted}\n[Fim do contexto]`;
  }

  /**
   * Limpa memória de um usuário
   */
  clearuserMemory(userId: string): void {
    this.userMemories.delete(userId);
    this.logger.debug(`Memória do usuário ${userId} limpa`);
  }

  /**
   * Limpa contexto de um canal
   */
  clearChannelContext(channelId: string): void {
    this.channelContexts.delete(channelId);
    this.logger.debug(`Contexto do canal ${channelId} limpo`);
  }

  /**
   * Obtém estatísticas de Memória
   */
  getStats(): {
    totalUsers: number;
    totalChannels: number;
    totalMessages: number;
  } {
    let totalMessages = 0;

    this.userMemories.forEach(memories => {
      totalMessages += memories.length;
    });

    this.channelContexts.forEach(context => {
      totalMessages += context.messages.length;
    });

    return {
      totalUsers: this.userMemories.size,
      totalChannels: this.channelContexts.size,
      totalMessages,
    };

  }
  /**
   * Limpa mensagens antigas (chamado periodicamente)
   */

  cleanUpOldMemories(): void {
    const now = Date.now();
    let cleaned = 0;

    this.channelContexts.forEach((context, channelId) => {
      const timeSinceLastActivity = now - context.lastActivity.getTime();
      if (timeSinceLastActivity > this.CONTEXT_TIMEOUT_MS) {
        this.channelContexts.delete(channelId);
        cleaned++
      }
    });

    if (cleaned > 0) {
      this.logger.debug(`Limpou ${cleaned} contextos de canal inativos. `)
    }
  }
}
