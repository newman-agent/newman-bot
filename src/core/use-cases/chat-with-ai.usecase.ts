import { Injectable } from '@nestjs/common';
import { AiRepository } from '../domain/repositories/ai.repository';
import { MessageEntity } from "../domain/entities/message.entity";

@Injectable()
export class ChatWithAiUseCase {
  constructor(private readonly aiRepository: AiRepository) { }

  async execute(userMessage: string): Promise<string> {
    const messages = [new MessageEntity('user', userMessage)];
    return this.aiRepository.chat(messages);
  }
}
