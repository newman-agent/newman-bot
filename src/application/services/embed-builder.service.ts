import { Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { SearchWithFactCheckResult } from '../../core/use-cases/search-with-fact-check.usecase';
import { FactCheckEntity } from '../../core/domain/entities/fact-check.entity';

@Injectable()
export class EmbedBuilderService {
  buildSearchEmbed(
    query: string,
    result: SearchWithFactCheckResult,
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`🔍 Resultados: ${query}`)
      .setDescription(this.truncate(result.analysis, 4000))
      .setFooter({ text: 'Verifique sempre múltiplas fontes' })
      .setTimestamp();

    // Adiciona até 3 fontes principais
    result.sources.slice(0, 3).forEach((source, i) => {
      embed.addFields({
        name: `[${i + 1}] ${this.truncate(source.title, 256)}`,
        value: `[Link](${source.url})`,
        inline: false,
      });
    });

    return embed;
  }

  buildFactCheckEmbed(factCheck: FactCheckEntity): EmbedBuilder {
    const statusEmoji = this.getStatusEmoji(factCheck.status);
    const color = this.getStatusColor(factCheck.status);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${statusEmoji} Verificação de Fato`)
      .setDescription(`**Afirmação:** ${this.truncate(factCheck.claim, 1000)}`)
      .addFields(
        {
          name: 'Status',
          value: this.getStatusText(factCheck.status),
          inline: true,
        },
        {
          name: 'Confiança',
          value: `${factCheck.confidence}%`,
          inline: true,
        },
        {
          name: 'Análise',
          value: this.truncate(factCheck.explanation, 1000),
        },
      )
      .setFooter({
        text: 'Esta é uma análise automatizada. Sempre verifique múltiplas fontes.',
      })
      .setTimestamp();

    // Adiciona fontes
    if (factCheck.sources.length > 0) {
      const sources = factCheck.sources
        .slice(0, 3)
        .map((s, i) => `[${i + 1}] [${s.title}](${s.url})`)
        .join('\n');

      embed.addFields({
        name: 'Fontes Consultadas',
        value: this.truncate(sources, 1000),
      });
    }

    return embed;
  }

  private getStatusEmoji(status: string): string {
    const emojis = {
      true: '✅',
      false: '❌',
      partially_true: '⚠️',
      insufficient_data: '❓',
    };
    return emojis[status] || '❓';
  }

  private getStatusColor(status: string): number {
    const colors = {
      true: 0x00ff00, // Verde
      false: 0xff0000, // Vermelho
      partially_true: 0xff9900, // Laranja
      insufficient_data: 0x999999, // Cinza
    };
    return colors[status] || 0x999999;
  }

  private getStatusText(status: string): string {
    const texts = {
      true: 'Verdadeira',
      false: 'Falsa',
      partially_true: 'Parcialmente Verdadeira',
      insufficient_data: 'Dados Insuficientes',
    };
    return texts[status] || 'Desconhecido';
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
