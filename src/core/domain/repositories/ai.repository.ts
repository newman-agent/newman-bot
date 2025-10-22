import { MessageEntity } from '../entities/message.entity';

export abstract class AiRepository {
  abstract chat(
    messages: MessageEntity[],
    context?: string,
  ): Promise<string>;
}
