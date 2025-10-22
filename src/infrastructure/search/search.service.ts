import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SearchRepository } from '../../core/domain/repositories/search.repository';
import { SearchResultEntity } from '../../core/domain/entities/search-result.entity';
import { SearchQuery } from '../../core/domain/value-objects/search-query.vo';
import { BraveAdapter } from './adapters/brave.adapter';
import { DuckDuckGoAdapter } from './adapters/duckduckgo.adapter';

@Injectable()
export class SearchService implements SearchRepository {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly braveAdapter: BraveAdapter,
    private readonly duckDuckGoAdapter: DuckDuckGoAdapter,
  ) { }

  asy  async search(query: SearchQuery): Promise<SearchResultEntity[]> {
    const braveApiKey = this.configService.get<string>('BRAVE_API_KEY');

    try {
      if (braveApiKey) {
        this.logger.debug(`Searching with Brave ${query.getValue()}`);
        const results = await this.braveAdapter.search(query.getValue());
        if (results.length > 0) return results;
      }

      // Fallback to DuckDuckGo
      this.logger.debug(`Searching with DuckDuckGo ${query.getValue()}`);
      return await this.duckDuckGoAdapter.search(query.getValue());
    } catch (error) {
      this.logger.error('Search error: ', error.message);
      throw error;
    }
  }
}
