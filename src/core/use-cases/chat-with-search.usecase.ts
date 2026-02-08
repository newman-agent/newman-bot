import { Injectable, Logger } from '@nestjs/common';
import { AiRepository } from '../domain/repositories/ai.repository';
import { SearchRepository } from '../domain/repositories/search.repository';
import { MessageEntity } from '../domain/entities/message.entity';
import { SearchQuery } from '../domain/value-objects/search-query.vo';

export interface ChatWithWebSearchResult {
  response: string;
  searchPerformed: boolean;
  searchQuery?: string;
}

@Injectable()
export class ChatWithWebSearchUseCase {
  private readonly logger = new Logger(ChatWithWebSearchUseCase.name);

  constructor(
    private readonly aiRepository: AiRepository,
    private readonly searchRepository: SearchRepository,
  ) { }

  async execute(
    userMessage: string,
    history: MessageEntity[] = [],
    additionalContext?: string,
  ): Promise<ChatWithWebSearchResult> {
    const messages = [...history];

    if (
      messages.length === 0 ||
      messages[messages.length - 1].content !== userMessage
    ) {
      messages.push(new MessageEntity('user', userMessage));
    }

    const decision = await this.shouldPerformWebSearch(userMessage, messages);

    if (decision.needsSearch) {
      this.logger.log(`🔍 LLM decided to search: "${decision.searchQuery}"`);
      this.logger.debug(`💭 Reasoning: ${decision.thought}`);

      try {
        const query = SearchQuery.create(decision.searchQuery);
        const searchResults = await this.searchRepository.search(query);

        if (searchResults.length > 0) {
          const searchContext = this.formatSearchResults(searchResults);

          const enhancedContext = `${additionalContext || ''}\n\n[DADOS ATUALIZADOS DA WEB - USE PARA RESPONDER]\n${searchContext}\n[FIM DOS DADOS]\n\nResponda à pergunta do usuário usando estes dados atualizados. Seja natural e conversacional. Cite fontes quando relevante usando [1], [2], etc.`;

          const response = await this.aiRepository.chat(
            messages,
            enhancedContext,
          );

          return {
            response,
            searchPerformed: true,
            searchQuery: decision.searchQuery,
          };
        } else {
          this.logger.warn('Search returned no results, proceeding without web data');
        }
      } catch (error) {
        this.logger.error('Web search failed:', error);
      }
    } else {
      this.logger.debug(`💬 LLM decided no search needed`);
      this.logger.debug(`💭 Reasoning: ${decision.thought}`);
    }

    const response = await this.aiRepository.chat(messages, additionalContext);

    return {
      response,
      searchPerformed: false,
    };
  }

  private async shouldPerformWebSearch(
    message: string,
    history: MessageEntity[],
  ): Promise<{ needsSearch: boolean; searchQuery: string; thought: string }> {
    const contextHistory = history
      .slice(-4)
      .map((m) => `${m.reole}: ${m.content}`)
      .join('\n');

    const decisionPrompt = `Você é um sistema de raciocínio que decide se precisa de informações atualizadas da web.

HISTÓRICO DA CONVERSA:
${contextHistory || '[Sem histórico - primeira mensagem]'}

MENSAGEM ATUAL DO USUÁRIO:
"${message}"

SEU CONHECIMENTO:
- Cutoff de conhecimento: Janeiro de 2025
- Hoje é: ${new Date().toLocaleDateString('pt-BR')}
- Você não tem dados após janeiro de 2025

PROCESSO DE DECISÃO:

1. ANALISE a mensagem do usuário
2. PENSE sobre o que ele está pedindo
3. PERGUNTE a si mesmo:
   - Isso muda com o tempo?
   - Isso aconteceu depois de janeiro de 2025?
   - Eu tenho ABSOLUTA certeza da resposta?
   - O usuário precisa de dados específicos/atuais?
   - É uma conversa casual ou pergunta factual?

4. DECIDA honestamente se você precisa de ajuda da web

EXEMPLOS DE QUANDO BUSCAR:
 "qual o preço do bitcoin agora?" → SIM (muda constantemente)
 "quem ganhou o jogo de ontem?" → SIM (evento específico recente)
 "notícias sobre eleições 2026" → SIM (em desenvolvimento)
 "quanto está o dólar hoje?" → SIM (dados em tempo real)
 "o que aconteceu hoje no Brasil?" → SIM (eventos recentes)

EXEMPLOS DE QUANDO NÃO BUSCAR:
 "oi, tudo bem?" → NÃO (social/casual)
 "explica recursão" → NÃO (conceito atemporal)
 "qual a capital da França?" → NÃO (fato estável, tenho certeza)
 "me ajuda com Python" → NÃO (programação genérica)
 "o que você acha de..." → NÃO (opinião)

REGRA DE OURO: Se você NÃO tem certeza absoluta ou se os dados podem ter mudado, BUSQUE.

Responda APENAS com JSON válido (SEM markdown, SEM texto extra):
{
  "thought": "Raciocínio detalhado: o que o usuário quer + por que preciso/não preciso buscar + minha confiança",
  "needsSearch": true ou false,
  "searchQuery": "query otimizada para busca (se needsSearch=true)" ou "",
  "confidence": número de 0 a 100
}

RESPONDA AGORA:`;

    try {
      const decisionMessages = [new MessageEntity('user', decisionPrompt)];

      const rawResponse = await this.aiRepository.chat(decisionMessages);

      const cleanJson = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*({.*})[^}]*$/s, '$1')
        .trim();

      const parsed = JSON.parse(cleanJson);

      const emoji = parsed.needsSearch ? '🔍' : '💬';
      const decision = parsed.needsSearch ? 'SEARCH' : 'NO SEARCH';

      this.logger.log(
        `${emoji} Decision: ${decision} (confidence: ${parsed.confidence}%)`,
      );
      this.logger.debug(`💭 Thought: ${parsed.thought}`);
      if (parsed.needsSearch) {
        this.logger.debug(`📝 Query: "${parsed.searchQuery}"`);
      }

      if (parsed.needsSearch && (!parsed.searchQuery || parsed.searchQuery.trim() === '')) {
        this.logger.warn('⚠️ LLM said needsSearch=true but provided empty searchQuery, using original message');
        parsed.searchQuery = message;
      }

      return {
        needsSearch: parsed.needsSearch === true,
        searchQuery: parsed.searchQuery || message,
        thought: parsed.thought || 'No reasoning provided',
      };
    } catch (error) {
      this.logger.error(' LLM decision parsing failed:', error);

      throw new Error(
        'Não consegui processar sua pergunta. Tente reformular de forma mais clara.',
      );
    }
  }

  private formatSearchResults(results: any[]): string {
    return results
      .map((r, i) => {
        const cleanUrl = r.url.replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '');
        const decodedUrl = decodeURIComponent(cleanUrl).split('&')[0];

        return `[${i + 1}] ${r.title}
${r.snippet}
Link: ${decodedUrl}
`;
      })
      .join('\n');
  }
}
