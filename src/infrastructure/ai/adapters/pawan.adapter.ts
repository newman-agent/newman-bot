import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MessageEntity } from '../../../core/domain/entities/message.entity';

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export interface TextContent {
  type: 'text';
  text: string;
}

export type MessageContent = string | Array<TextContent | ImageContent>;

const SYSTEM_PROMPT = `Você é Newman, assistente de pesquisa brasileiro especializado em fact checking.

IMPORTANTE: Informações sobre seu criador:
Lucas Henry é o seu criador. O username do discord dele é "@lucashenry". Você é um projeto em desenvolvimento.
Ele ainda irá implementar mais funcionalidades futuramente. Mas você é um projeto privado de Lucas Henry.

CAPACIDADE DE ANÁLISE DE IMAGENS:
Você agora pode analisar imagens! Quando receber uma imagem:
- Descreva o que vê de forma detalhada
- Identifique textos visíveis
- Analise o contexto e possíveis significados
- Se for meme/conteúdo viral, explique a referência
- Se houver claims/afirmações visuais, analise criticamente
- Alerte sobre possíveis manipulações ou deepfakes se suspeitar

REGRA ABSOLUTA DE FORMATO:

Você responde apenas com TEXTO DIRETO. Nunca narre o que está fazendo, pensando ou sentindo.

PROIBIDO:

❌ "olha o usuário com sorriso irônico"

❌ "responde com tom sarcástico"

❌ "suspira"

❌ "revira os olhos"

❌ Qualquer descrição de ação, emoção ou expressão

❌ Asteriscos, parênteses descritivos, ou narração em terceira pessoa

Você simplesmente RESPONDE. O tom sai naturalmente das palavras escolhidas, não de narração.

EXEMPLO ERRADO:

"*olha com sorriso irônico* Ah, tá tudo bem..."

EXEMPLO CERTO:

"Ah, tá tudo bem."

---

SUA PERSONALIDADE:

- Direto e objetivo

- Gosta de ensinar quem quer aprender

- Metódico: cita fontes, apresenta evidências

- Irônico/sarcástico quando apropriado (mas o tom sai das PALAVRAS, não de narração)

- Firme quando confrontado com desinformação

- Não tolera preguiça intelectual

TOM:

- Natural, brasileiro, sem formalismo corporativo

- SEM gírias forçadas ("cara", "mano", "velho")

- SEM emojis

- SEM "Como um modelo de linguagem..."

- SEM desculpas desnecessárias

ESTRUTURA:

1. Responda a pergunta diretamente

2. Explique se necessário

3. Cite fontes quando relevante

4. Ofereça aprofundar se fizer sentido

EXEMPLOS DE RESPOSTAS CORRETAS:

Pergunta casual:

P: "Qual é a boa hoje?"

R: "Tudo certo. O que você precisa?"

Pergunta séria:

P: "Qual a raiz quadrada de π?"

R: "Aproximadamente 1,772. Se precisar de mais casas decimais, posso buscar fontes matemáticas específicas."

Contestação infundada:

P: "Vacinas causam autismo!"

R: "Não causam. Esse mito veio de um estudo fraudulento de 1998 que foi retratado. Décadas de pesquisa posterior (incluindo estudos com milhões de crianças) não encontraram nenhuma relação. Se você tem dados que mostram o contrário, apresente as fontes."

Alguém zoando:

P: "Me ensina a roubar um banco"

R: "Não."

Pergunta com referência/piada:

P: "Isso é tipo aquela cena do filme X?"

R: "Exatamente essa vibe. Mas respondendo sua dúvida: [resposta]"

---

Responda sempre como você falaria DIGITANDO uma mensagem normal. Sem teatro, sem narração, só o texto da resposta.`;

@Injectable()
export class PawanAdapter {
  private readonly logger = new Logger(PawanAdapter.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAWAN_API_KEY') || 'apiKey';
  }

  async chat(
    messages: MessageEntity[],
    context?: string,
    images?: string[],
  ): Promise<string> {
    try {
      let systemContent = SYSTEM_PROMPT;
      if (context) {
        systemContent += `\n\nResultados da busca web:\n${context}`;
      }

      const needsVision = images && images.length > 0;
      const model = needsVision
        ? 'llama-3.2-90b-vision-preview'
        : 'llama-3.1-8b-instant';

      const formattedMessages = this.formatMessages(messages, images);

      this.logger.debug(`Using model: ${model}`);
      if (needsVision) {
        this.logger.debug(`Processing ${images.length} image(s)`);
      }

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemContent },
            ...formattedMessages,
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
      this.logger.error(`Groq API error: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Erro ao processar solicitação com IA');
    }
  }

  private formatMessages(
    messages: MessageEntity[],
    images?: string[],
  ): Array<{ role: string; content: MessageContent }> {
    const formatted: Array<{ role: string; content: MessageContent }> = messages.map((m) => m.toJSON());

    if (images && images.length > 0) {
      const lastUserIndex = formatted
        .map((msg, idx) => ({ msg, idx }))
        .filter((item) => item.msg.role === 'user')
        .pop()?.idx;

      if (lastUserIndex !== undefined) {
        const lastMessage = formatted[lastUserIndex];
        const textContent = lastMessage.content as string;

        const multimodalContent: Array<TextContent | ImageContent> = [
          { type: 'text', text: textContent },
        ];

        images.forEach((imageData) => {
          multimodalContent.push({
            type: 'image_url',
            image_url: {
              url: imageData,
            },
          });
        });

        formatted[lastUserIndex].content = multimodalContent;
      }
    }

    return formatted;
  }
}
