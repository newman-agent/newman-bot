import { Injectable, Logger } from '@nestjs/common';
import { Message } from 'discord.js';
import { ICommand } from '../../../shared/interfaces/command.interface';
import { VerifyClaimUseCase } from '../../../core/use-cases/verify-claim.usecase';
import { EmbedBuilderService } from '../../../application/services/embed-builder.service';

@Injectable()
export class VerifyCommand implements ICommand {
  private readonly logger = new Logger(VerifyCommand.name);

  constructor(
    private readonly verifyUseCase: VerifyClaimUseCase,
    private readonly embedBuilder: EmbedBuilderService,
  ) { }

  async execute(message: Message, args: string[]): Promise<void> {
    if (args.length === 0) {
      await message.reply('Use: `!verify afirmação que você quer verificar`');
      return;
    }

    const claim = args.join(' ');
    await message.reply('Verificando a afirmação em múltiplas fontes...');

    try {
      const factCheck = await this.verifyUseCase.execute(claim);
      const embed = this.embedBuilder.buildFactCheckEmbed(factCheck);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      this.logger.error('Verify command error:', error);
      await message.reply('Erro ao verificar a afirmação.');
    }
  }
}
