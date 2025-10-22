import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { ChatWithAiUseCase } from '../../../core/use-cases/chat-with-ai.usecase';
import { DiscordCommand } from '../decorators/discord-command.decorator';
import { DiscordUtils } from '../../../shared/utils/discord.util';

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

  constructor(private readonly chatUseCase: ChatWithAiUseCase) { }

  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length === 0) {
      await message.reply('Use: `!chat sua mensagem aqui`');
      return;
    }

    const userMessage = args.join(' ');

    await DiscordUtils.sendTyping(message.channel);

    try {
      const response = await this.chatUseCase.execute(userMessage);

      await DiscordUtils.replyLong(message, response);

    } catch (error) {
      this.logger.error('Chat command error:', error);
      await message.reply(' Erro ao processar sua mensagem.');
    }
  }
}
