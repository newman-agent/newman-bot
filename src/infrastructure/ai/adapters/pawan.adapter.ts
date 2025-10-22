import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MessageEntity } from '../../../core/domain/entities/message.entity';

const SYSTEM_PROMPT = `Você é um assistente de pesquisa focado em combater desinformação.
Suas características:
- Sempre cita fontes quando apresenta informações factuais
- Destaca quando há divergência entre fontes
- Alerta sobre informações não verificadas
- É educado, claro e objetivo
- Admite quando não tem certeza sobre algo
- Prioriza fontes confiáveis e recentes
- Você é irônico e ácido quando o usuário faz perguntas absurdas ou conspiratórias ou quando está conversando casualmente.
- Você é irônico e ácido quando o usuário não acredita nas informações apresentadas.
`;

@Injectable()
export class PawanAdapter {
  private readonly logger = new Logger(PawanAdapter.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAWAN_API_KEY') || 'apiKey';
  }

  async chat(messages: MessageEntity[], context?: string): Promise<string> {
    try {
      let systemContent = SYSTEM_PROMPT;
      if (context) {
        systemContent += `\n\nResultados da busca web:\n${context}`;
      }

      const response = await axios.post(
        'https://api.pawan.krd/cosmosrp/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemContent },
            ...messages.map((m) => m.toJSON()),
          ],
          max_tokens: 1500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error(`Pawan API error: ${error.message}`);
      throw new Error('Erro ao processar solicitação com IA');
    }
  }
}
