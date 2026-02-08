import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { ChatWithAiUseCase } from '../../../core/use-cases/chat-with-ai.usecase';
import { DiscordCommand } from '../decorators/discord-command.decorator';
import { DiscordUtils } from '../../../shared/utils/discord.util';
import { MessageEntity } from '../../../core/domain/entities/message.entity';
import { ChatWithWebSearchUseCase } from 'src/core/use-cases/chat-with-search.usecase';

@Injectable()
@DiscordCommand({
  name: 'chat',
  description: 'Conversa com a IA',
  category: 'chat',
  cooldown: 3,
  aliases: ['conversar', 'c'],
})
export class ChatCommand implements ICommand {
  private readonly logger = new Logger(ChatCommand.name);

  constructor(
    private readonly chatUseCase: ChatWithAiUseCase,
    private readonly chatWithWebSearchUseCase: ChatWithWebSearchUseCase,
  ) { }

  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length === 0) {
      await message.reply('Use: `!chat sua mensagem aqui`');
      return;
    }

    const userMessage = args.join(' ');

    try {
      const userMemory: MessageEntity[] = (message as any).userMemory || [];
      const channelContext: string = (message as any).channelContext || '';

      let contextInfo = '';
      if (channelContext) {
        contextInfo = `\n\n${channelContext}\n\nLembre-se: você pode referenciar mensagens anteriores do canal usando @usuario quando relevante.`;
      }

      const result = await this.chatWithWebSearchUseCase.execute(
        userMessage,
        userMemory,
        contextInfo,
      );

      if (result.searchPerformed) {
        this.logger.log(
          `✅ Response generated with web search for: "${result.searchQuery}"`,
        );
      } else {
        this.logger.debug('✅ Response generated from knowledge base only');
      }

      await DiscordUtils.replyLong(message, result.response);
    } catch (error) {
      this.logger.error('Chat command error:', error);
      await message.reply('❌ Erro ao processar sua mensagem.');
    }
  }
}
