import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SearchResultEntity } from '../../../core/domain/entities/search-result.entity';

@Injectable()
export class BraveAdapter {
  private readonly logger = new Logger(BraveAdapter.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BRAVE_API_KEY');
  }

  async search(query: string): Promise<SearchResultEntity[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(
        'https://api.search.brave.com/res/v1/web/search',
        {
          params: { q: query },
          headers: { 'X-Subscription-Token': this.apiKey },
          timeout: 10000,
        },
      );

      return (
        response.data.web?.results?.slice(0, 5).map(
          (r: any) =>
            new SearchResultEntity(
              r.title,
              r.description,
              r.url,
              'brave',
            ),
        ) || []
      );
    } catch (error) {
      this.logger.error(`Brave search error: ${error.message}`);
      return [];
    }
  }
}
