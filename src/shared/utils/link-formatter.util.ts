export class LinkFormatterUtil {
  /**
   * Formats DuckDuckGo redirect links into clean, clickable URLs
   */
  static formatDuckDuckGoLink(url: string): string {
    try {
      const cleanUrl = url.replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '');

      const decodedUrl = decodeURIComponent(cleanUrl);

      const finalUrl = decodedUrl.split('&rut=')[0];

      if (!finalUrl.startsWith('http')) {
        return `https://${finalUrl}`;
      }

      return finalUrl;
    } catch (error) {
      return url;
    }
  }

  /**
   * Extracts domain from URL for display
   */
  static extractDomain(url: string): string {
    try {
      const cleanUrl = this.formatDuckDuckGoLink(url);
      const urlObj = new URL(cleanUrl);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'Link';
    }
  }

  /**
   * Creates a human-readable markdown link
   */
  static createMarkdownLink(title: string, url: string): string {
    const cleanUrl = this.formatDuckDuckGoLink(url);
    const domain = this.extractDomain(url);

    return `**[${title}](${cleanUrl})**\n_${domain}_`;
  }

  /**
   * Formats search results with numbered, clickable links
   */
  static formatSearchResultLinks(
    results: Array<{ title: string; url: string; snippet: string }>,
  ): string {
    return results
      .map((r, i) => {
        const cleanUrl = this.formatDuckDuckGoLink(r.url);
        const domain = this.extractDomain(r.url);

        return `**[${i + 1}] [${r.title}](${cleanUrl})**
_${domain}_
${r.snippet}
`;
      })
      .join('\n');
  }

  /**
   * Formats inline citation links
   */
  static formatInlineCitation(index: number, url: string): string {
    const cleanUrl = this.formatDuckDuckGoLink(url);
    const domain = this.extractDomain(url);

    return `[[${index}]](${cleanUrl} "${domain}")`;
  }
}
