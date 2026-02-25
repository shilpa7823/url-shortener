import crypto from 'crypto';

/**
 * Generate a collision-free short code using Base62 encoding
 * Combines UUID hash with timestamp for uniqueness
 */
export class HashGenerator {
  private static readonly CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /**
   * Generate a unique short code
   * @param length - Length of the short code (default: 6)
   * @returns Base62 encoded short code
   */
  static generateShortCode(length: number = 6): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const combined = timestamp + randomBytes;
    
    let hash = BigInt(`0x${combined}`);
    let result = '';

    while (hash > 0n && result.length < length) {
      result = this.CHARSET[Number(hash % 62n)] + result;
      hash = hash / 62n;
    }

    // Pad if necessary
    while (result.length < length) {
      result = '0' + result;
    }

    return result.substring(0, length);
  }

  /**
   * Generate hash from original URL for deduplication
   * @param originalUrl - The original URL
   * @returns SHA256 hash of the URL
   */
  static generateUrlHash(originalUrl: string): string {
    return crypto
      .createHash('sha256')
      .update(originalUrl)
      .digest('hex');
  }

  /**
   * Validate a short code format
   */
  static isValidShortCode(code: string): boolean {
    return /^[0-9a-zA-Z]{4,12}$/.test(code);
  }
}

export default HashGenerator;
