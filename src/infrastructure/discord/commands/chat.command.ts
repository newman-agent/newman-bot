import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { ChatWithAiUseCase } from '../../../core/use-cases/chat-with-ai.usecase';
import { DiscordCommand } from '../decorators/discord-command.decorator';
import { DiscordUtils } from '../../../shared/utils/discord.util';
import { MessageEntity } from '../../../core/domain/entities/message.entity';

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
      // Obtém memória do usuário (injetada pelo DiscordService)
      const userMemory: MessageEntity[] = (message as any).userMemory || [];

      // Obtém contexto do canal (injetada pelo DiscordService)
      const channelContext: string = (message as any).channelContext || '';

      // Prepara contexto adicional para a IA
      let contextInfo = '';

      if (channelContext) {
        contextInfo = `\n\n${channelContext}\n\nLembre-se: você pode referenciar mensagens anteriores do canal usando @usuario quando relevante.`;
      }

      const response = await this.chatUseCase.execute(
        userMessage,
        userMemory,
        contextInfo
      );

      await DiscordUtils.replyLong(message, response);
    } catch (error) {
      this.logger.error('Chat command error:', error);
      await message.reply('❌ Erro ao processar sua mensagem.');
    }
  }
}
