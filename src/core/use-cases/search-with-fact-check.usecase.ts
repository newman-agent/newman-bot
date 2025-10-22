import { Injectable } from '@nestjs/common';
import { SearchRepository } from '../domain/repositories/search.repository';
import { AiRepository } from '../domain/repositories/ai.repository';
import { SearchQuery } from '../domain/value-objects/search-query.vo';
import { MessageEntity } from '../domain/entities/message.entity';
import { SearchResultEntity } from '../domain/entities/search-result.entity';

export interface SearchWithFactCheckResult {
  analysis: string;
  sources: SearchResultEntity[];
}

@Injectable()
export class SearchWithFactCheckUseCase {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly aiRepository: AiRepository,
  ) {}

  async execute(queryString: string): Promise<SearchWithFactCheckResult> {
    // 1. Validate
    const query = SearchQuery.create(queryString);

    // 2. Search Information
    const searchResults = await this.searchRepository.search(query);

    if (searchResults.length === 0) {
      throw new Error('No search results found.');
    }

    // 3. Prepare messages for AI
    const context = this.formatSearchResultsForAi(searchResults);

    // 4. AI Analysis
    const messages = [
      new MessageEntity(
        'user',
        `Analise as informações sobre: ${query.getValue()}. Forneça um resumo objetivo, destaque consensos e divergências entre as fontes, e avalie a confiabilidade. Cite as fontes usando [1], [2], etc.`,
      ),
    ];

    const analysis = await this.aiRepository.chat(messages, context);

    return {
      analysis,
      sources: searchResults,
    };
  }

  private formatSearchResultsForAi(results: SearchResultEntity[]): string {
    return results
      .map((r, i) => `[${i + 1}] $s{r.title}\n${r.snippet}\nFonte: ${r.url}\n`)
      .join('\n');
  }
}
