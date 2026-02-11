import { Injectable } from '@nestjs/common';
import { MessageEntity } from 'src/core/domain/entities/message.entity';
import { LLMAdapter } from './adapters/llm.adapter';
import { AiRepository } from 'src/core/domain/repositories/ai.repository';

@Injectable()
export class AiService implements AiRepository {
  constructor(private readonly LLMAdapter: LLMAdapter) { }

  async chat(
    messages: MessageEntity[],
    context?: string,
    images?: string[],
  ): Promise<string> {
    return this.LLMAdapter.chat(messages, context, images);
  }
}
