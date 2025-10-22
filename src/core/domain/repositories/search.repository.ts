import { SearchResultEntity } from '../entities/search-result.entity';
import { SearchQuery } from '../value-objects/search-query.vo';

export abstract class SearchRepository {
  abstract search(query: SearchQuery): Promise<SearchResultEntity[]>;
}
