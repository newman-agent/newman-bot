import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { ChatWithAiUseCase } from '../../../core/use-cases/chat-with-ai.usecase';
import { DiscordCommand } from '../decorators/discord-command.decorator';
import { DiscordUtils } from '../../../shared/utils/discord.util';
import { MessageEntity } from '../../../core/domain/entities/message.entity';
import { ChatWithWebSearchUseCase } from 'src/core/use-cases/chat-with-search.usecase';
import { ImageProcessorUtil } from '../../../shared/utils/image-processor.util';

@Injectable()
@DiscordCommand({
  name: 'chat',
  description: 'Conversa com a IA (suporta imagens)',
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
      await message.reply(
        'Use: `!chat sua mensagem aqui` (você pode anexar imagens também!)',
      );
      return;
    }

    const userMessage = args.join(' ');

    try {
      // Verifica se tem imagens anexadas
      const attachments = Array.from(message.attachments.values());
      const imageAttachments = attachments.filter((att) =>
        att.contentType?.startsWith('image/'),
      );

      let images: string[] | undefined;

      if (imageAttachments.length > 0) {
        this.logger.log(
          `Processing message with ${imageAttachments.length} image(s)`,
        );
        images = [];

        for (const att of imageAttachments) {
          try {
            const base64 =
              await ImageProcessorUtil.downloadAndConvertToBase64(att.url);
            images.push(base64);
          } catch (error) {
            this.logger.error(`Failed to process image ${att.url}:`, error);
          }
        }

        if (images.length === 0) {
          images = undefined; // Se falhou todas, não passa imagens
        }
      }

      const userMemory: MessageEntity[] = (message as any).userMemory || [];
      const channelContext: string = (message as any).channelContext || '';

      let contextInfo = '';
      if (channelContext) {
        contextInfo = `\n\n${channelContext}\n\nLembre-se: você pode referenciar mensagens anteriores do canal usando @usuario quando relevante.`;
      }

      // Se tiver imagens, usa chat direto (sem web search)
      // Web search com imagens fica muito complexo
      let response: string;

      if (images && images.length > 0) {
        this.logger.log('Using direct chat with images');
        response = await this.chatUseCase.execute(
          userMessage,
          userMemory,
          contextInfo,
          images,
        );
      } else {
        // Sem imagens, pode usar web search
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

        response = result.response;
      }

      await DiscordUtils.replyLong(message, response);
    } catch (error) {
      this.logger.error('Chat command error:', error);
      await message.reply('❌ Erro ao processar sua mensagem.');
    }
  }
}
