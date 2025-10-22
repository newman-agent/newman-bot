import { Message, TextBasedChannel } from 'discord.js';

/**
 * Utilitários para trabalhar com Discord.js de forma type-safe
 */
export class DiscordUtils {
  /**
   * Envia indicador de digitação se o canal suportar
   * @param channel - Canal do Discord
   */
  static async sendTyping(channel: TextBasedChannel): Promise<void> {
    try {
      if ('sendTyping' in channel && typeof channel.sendTyping === 'function') {
        await channel.sendTyping();
      }
    } catch (error) {
      // Silenciosamente ignora erros de typing
      // (não é crítico se falhar)
    }
  }

  /**
   * Divide texto longo em chunks respeitando o limite do Discord
   * @param text - Texto a ser dividido
   * @param maxLength - Tamanho máximo (padrão: 2000)
   * @returns Array de chunks
   */
  static splitMessage(text: string, maxLength: number = 2000): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    // Divide por linhas para manter formatação
    const lines = text.split('\n');

    for (const line of lines) {
      // Se a linha sozinha é maior que o limite
      if (line.length > maxLength) {
        // Salva chunk atual se não estiver vazio
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        // Divide a linha em partes menores
        const lineParts = line.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
        chunks.push(...lineParts);
        continue;
      }

      // Verifica se adicionar esta linha ultrapassa o limite
      if (currentChunk.length + line.length + 1 > maxLength) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    // Adiciona último chunk
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Responde a uma mensagem com texto longo, dividindo se necessário
   * @param message - Mensagem original
   * @param text - Texto da resposta
   */
  static async replyLong(message: Message, text: string): Promise<void> {
    const chunks = this.splitMessage(text);

    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        // Primeira mensagem sempre usa reply
        await message.reply(chunks[i]);
      } else {
        // Mensagens subsequentes: tenta usar send() se disponível
        try {
          if ('send' in message.channel && typeof message.channel.send === 'function') {
            await message.channel.send(chunks[i]);
          } else {
            // Fallback: usa reply novamente
            await message.reply(chunks[i]);
          }
        } catch (error) {
          // Se falhar, usa reply como fallback
          await message.reply(chunks[i]);
        }
      }
    }
  }

  /**
   * Envia mensagem no canal (type-safe)
   * @param message - Mensagem original para contexto
   * @param text - Texto a enviar
   */
  static async sendMessage(message: Message, text: string): Promise<void> {
    if ('send' in message.channel && typeof message.channel.send === 'function') {
      await message.channel.send(text);
    } else {
      // Fallback para reply se send não estiver disponível
      await message.reply(text);
    }
  }

  /**
   * Verifica se usuário é administrador
   * @param message - Mensagem
   */
  static isAdmin(message: Message): boolean {
    if (!message.member) return false;
    return message.member.permissions.has('Administrator');
  }

  /**
   * Verifica se usuário é dono do servidor
   * @param message - Mensagem
   */
  static isOwner(message: Message): boolean {
    if (!message.guild) return false;
    return message.author.id === message.guild.ownerId;
  }

  /**
   * Obtém nome seguro do usuário
   * @param message - Mensagem
   */
  static getUserName(message: Message): string {
    return message.member?.displayName || message.author.username;
  }

  /**
   * Formata timestamp para Discord
   * @param date - Data
   * @param style - Estilo de formatação
   * @returns String formatada para Discord
   */
  static formatTimestamp(
    date: Date,
    style: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' = 'f'
  ): string {
    const timestamp = Math.floor(date.getTime() / 1000);
    return `<t:${timestamp}:${style}>`;
  }

  /**
   * Trunca texto adicionando reticências
   * @param text - Texto
   * @param maxLength - Tamanho máximo
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Escapa caracteres especiais do markdown do Discord
   * @param text - Texto
   */
  static escapeMarkdown(text: string): string {
    return text.replace(/([*_~`|>])/g, '\\$1');
  }

  /**
   * Remove menções de usuários/roles do texto
   * @param text - Texto
   */
  static removeMentions(text: string): string {
    return text
      .replace(/<@!?\d+>/g, '@usuário')
      .replace(/<@&\d+>/g, '@cargo')
      .replace(/<#\d+>/g, '#canal');
  }
}
