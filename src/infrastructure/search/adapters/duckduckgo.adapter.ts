import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { SearchResultEntity } from '../../../core/domain/entities/search-result.entity';

@Injectable()
export class DuckDuckGoAdapter {
  private readonly logger = new Logger(DuckDuckGoAdapter.name);

  async search(query: string): Promise<SearchResultEntity[]> {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const results: SearchResultEntity[] = [];

      $('.result')
        .slice(0, 5)
        .each((i, elem) => {
          const title = $(elem).find('.result__title').text().trim();
          const snippet = $(elem).find('.result__snippet').text().trim();
          const link = $(elem).find('.result__url').attr('href');

          if (title && snippet && link) {
            results.push(
              new SearchResultEntity(title, snippet, link, 'duckduckgo'),
            );
          }
        });

      return results;
    } catch (error) {
      this.logger.error(`DuckDuckGo search error: ${error.message}`);
      return [];
    }
  }
}
