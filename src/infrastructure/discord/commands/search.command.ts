import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { SearchWithFactCheckUseCase } from '../../../core/use-cases/search-with-fact-check.usecase';
import { EmbedBuilderService } from '../../../application/services/embed-builder.service';
import { DiscordCommand } from '../decorators/discord-command.decorator';

@Injectable()
@DiscordCommand({
  name: 'search',
  description: 'Busca informações na web com análise e fact-checking',
  category: 'search',
  cooldown: 5,
  aliases: ['buscar', 's'],
})
export class SearchCommand implements ICommand {
  private readonly logger = new Logger(SearchCommand.name);

  constructor(
    private readonly searchUseCase: SearchWithFactCheckUseCase,
    private readonly embedBuilder: EmbedBuilderService,
  ) { }

  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length === 0) {
      await message.reply('Use: `!search sua pergunta aqui`');
      return;
    }

    const query = args.join(' ');
    await message.reply('🔍 Buscando informações e analisando fontes...');

    try {
      const result = await this.searchUseCase.execute(query);
      const embed = this.embedBuilder.buildSearchEmbed(query, result);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Search command error:', error);
      await message.reply(' Não consegui encontrar resultados para essa busca.');
    }
  }
}
