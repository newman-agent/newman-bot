import { Injectable } from '@nestjs/common';
import { AiRepository } from '../domain/repositories/ai.repository';
import { MessageEntity } from '../domain/entities/message.entity';

@Injectable()
export class ChatWithAiUseCase {
  constructor(private readonly aiRepository: AiRepository) { }

  async execute(
    userMessage: string,
    history: MessageEntity[] = [],
    additionalContext?: string,
    images?: string[],
  ): Promise<string> {
    const messages = [...history];

    // Adiciona mensagem do usuário se ainda não estiver no histórico
    if (
      messages.length === 0 ||
      messages[messages.length - 1].content !== userMessage
    ) {
      messages.push(new MessageEntity('user', userMessage));
    }

    return this.aiRepository.chat(messages, additionalContext, images);
  }
}
