import axios from 'axios';

export class ImageProcessorUtil {
  /**
   * Downloads image from URL and convers to base64 data URL
   */
  static async downloadAndConvertToBase64(url: string): Promise<string> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    const contentType = response.headers['content-type'] || 'image/png';
    const base64 = Buffer.from(response.data, 'binary').toString('base64');

    return `data:${contentType};base64,${base64}`;
  }

  /**
   * Validates URL
   */
  static isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some((ext) => lowerUrl.includes(ext));
  }

  /**
   * Export URLs from image texts
   */
  static extractImageUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp))/gi;
    return text.match(urlRegex) || [];
  }

  /**
   * Validates image content type
   */
  static isImageContentType(contentType: string | null): boolean {
    if (!contentType) return false;
    return contentType.startsWith('image/');
  }
}
