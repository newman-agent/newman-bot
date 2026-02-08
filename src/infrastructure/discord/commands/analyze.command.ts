import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { ChatWithAiUseCase } from '../../../core/use-cases/chat-with-ai.usecase';
import { DiscordCommand } from '../decorators/discord-command.decorator';
import { DiscordUtils } from '../../../shared/utils/discord.util';
import { MessageEntity } from '../../../core/domain/entities/message.entity';
import { ImageProcessorUtil } from '../../../shared/utils/image-processor.util';

@Injectable()
@DiscordCommand({
  name: 'analyze',
  description: 'Analisa imagens e seu contexto',
  category: 'chat',
  cooldown: 5,
  aliases: ['analisar', 'img', 'image'],
})
export class AnalyzeCommand implements ICommand {
  private readonly logger = new Logger(AnalyzeCommand.name);

  constructor(private readonly chatUseCase: ChatWithAiUseCase) { }

  async execute(message: Message, args: string[]): Promise<void> {
    const attachments = Array.from(message.attachments.values());
    const imageAttachments = attachments.filter((att) =>
      att.contentType?.startsWith('image/'),
    );

    if (imageAttachments.length === 0) {
      await message.reply(
        'Envie uma imagem junto com o comando `!analyze` ou `!analyze sua pergunta sobre a imagem`',
      );
      return;
    }

    const question = args.join(' ') || 'O que você vê nesta imagem?';

    await message.reply('🔍 Analisando imagem...');

    try {
      const images: string[] = [];
      for (const att of imageAttachments) {
        try {
          const base64 = await ImageProcessorUtil.downloadAndConvertToBase64(
            att.url,
          );
          images.push(base64);
        } catch (error) {
          this.logger.error(`Failed to process image ${att.url}:`, error);
        }
      }

      if (images.length === 0) {
        await message.reply('❌ Não consegui processar as imagens.');
        return;
      }

      const userMemory: MessageEntity[] = (message as any).userMemory || [];

      const response = await this.chatUseCase.execute(
        question,
        userMemory,
        undefined,
        images,
      );

      await DiscordUtils.replyLong(message, response);
    } catch (error) {
      this.logger.error('Analyze command error:', error);
      await message.reply('❌ Erro ao analisar a imagem.');
    }
  }
}
