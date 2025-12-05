import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { validateUrlSecurity } from '../utils/urlSecurity';

/**
 * Service to extract dominant color from images
 * Uses sharp to analyze images and extract the most prominent color
 */

const TIMEOUT_MS = 10000; // 10 seconds
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const FALLBACK_COLOR = '#808080'; // Gray fallback color

/**
 * Convert RGB values to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Security check
    const securityCheck = validateUrlSecurity(url);
    if (!securityCheck.valid) {
      return reject(new Error(securityCheck.error || 'URL security validation failed'));
    }

    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/*',
      },
      timeout: TIMEOUT_MS,
    };

    const req = client.request(options, (res) => {
      // Check content type
      const contentType = res.headers['content-type'] || '';
      if (!contentType.startsWith('image/')) {
        return reject(new Error('URL does not point to an image'));
      }

      // Check content length
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);
      if (contentLength > 10 * 1024 * 1024) { // 10MB limit
        return reject(new Error('Image too large'));
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        totalSize += chunk.length;
        
        // Prevent memory issues
        if (totalSize > 10 * 1024 * 1024) { // 10MB limit
          res.destroy();
          return reject(new Error('Image too large'));
        }
      });

      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Extract dominant color from image buffer
 * Uses sharp to resize and get color statistics
 */
async function extractColorFromBuffer(imageBuffer: Buffer): Promise<string> {
  try {
    // Resize image to smaller size for faster processing (max 100x100)
    // This is sufficient for color extraction and much faster
    const resized = await sharp(imageBuffer)
      .resize(100, 100, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const { width, height, channels } = info;

    // Calculate color frequencies
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Round to reduce color space (group similar colors)
      const roundedR = Math.round(r / 8) * 8;
      const roundedG = Math.round(g / 8) * 8;
      const roundedB = Math.round(b / 8) * 8;
      
      const colorKey = `${roundedR},${roundedG},${roundedB}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    // Find most frequent color (excluding very dark/light colors for better results)
    let maxCount = 0;
    let dominantColor = { r: 128, g: 128, b: 128 }; // Default gray

    for (const [colorKey, count] of colorMap.entries()) {
      const [r, g, b] = colorKey.split(',').map(Number);
      
      // Skip very dark colors (likely shadows/borders)
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      if (brightness < 30) continue;
      
      // Skip very light colors (likely backgrounds)
      if (brightness > 240) continue;

      if (count > maxCount) {
        maxCount = count;
        dominantColor = { r, g, b };
      }
    }

    return rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
  } catch (error) {
    logger.error('[ColorExtractionService] Error extracting color from buffer:', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Extract dominant color from image URL
 * Downloads the image and extracts its dominant color
 * 
 * @param imageUrl - URL to the image
 * @returns Hex color string (e.g., "#FF5733") or fallback color on error
 */
export async function extractDominantColor(imageUrl: string | null | undefined): Promise<string> {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
    logger.debug('[ColorExtractionService] No image URL provided, using fallback');
    return FALLBACK_COLOR;
  }

  try {
    // Download image
    const imageBuffer = await downloadImage(imageUrl);
    
    // Extract color
    const color = await extractColorFromBuffer(imageBuffer);
    
    logger.debug('[ColorExtractionService] Extracted color:', { imageUrl, color });
    return color;
  } catch (error) {
    logger.warn('[ColorExtractionService] Failed to extract color, using fallback:', {
      imageUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return FALLBACK_COLOR;
  }
}

/**
 * Extract dominant color from image buffer (useful for direct buffer processing)
 * 
 * @param imageBuffer - Image buffer
 * @returns Hex color string (e.g., "#FF5733") or fallback color on error
 */
export async function extractDominantColorFromBuffer(imageBuffer: Buffer): Promise<string> {
  try {
    const color = await extractColorFromBuffer(imageBuffer);
    logger.debug('[ColorExtractionService] Extracted color from buffer:', { color });
    return color;
  } catch (error) {
    logger.warn('[ColorExtractionService] Failed to extract color from buffer, using fallback:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return FALLBACK_COLOR;
  }
}

