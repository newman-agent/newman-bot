import { Injectable } from '@nestjs/common';
import { Message, EmbedBuilder } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HelpCommand implements ICommand {
  private readonly prefix: string;

  constructor(private readonly configService: ConfigService) {
    this.prefix = this.configService.get<string>('BOT_PREFIX', '!');
  }

  async execute(message: Message, args: string[]): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Comandos do Newman-bot')
      .setDescription('Bot de busca inteligente e combate à desinformação')
      .addFields(
        {
          name: `${this.prefix}search <query>`,
          value: 'Busca e analisa informações na web com fact-checking',
        },
        {
          name: `${this.prefix}chat <mensagem>`,
          value: 'Conversa normal com a IA',
        },
        {
          name: `${this.prefix}verify <afirmação>`,
          value: 'Verifica se uma afirmação é verdadeira',
        },
        {
          name: `${this.prefix}help`,
          value: 'Mostra esta mensagem',
        },
      )
      .setFooter({ text: 'Sempre verifique múltiplas fontes!' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
}
