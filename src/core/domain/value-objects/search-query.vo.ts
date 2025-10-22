export class SearchQuery {
  private constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Search query cannot be empty.');
    }

    if (this.value.length > 500) {
      throw new Error('Search query is too loong.');
    }
  }

  static create(query: string): SearchQuery {
    return new SearchQuery(query.trim());
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}
