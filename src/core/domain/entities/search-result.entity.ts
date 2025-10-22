export class SearchResultEntity {
  constructor(
    public readonly title: string,
    public readonly snippet: string,
    public readonly url: string,
    public readonly source: 'brave' | 'duckduckgo',

  ) { }

  toSJON() {
    return {
      title: this.title,
      snippet: this.snippet,
      url: this.url,
      source: this.source,
    };
  }
}
