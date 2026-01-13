/**
 * Image Compression Utility for MEUGRIND System
 * Handles intelligent image compression based on power state and upload requirements
 */

import { powerManager } from './power-management';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
}

class ImageCompressionService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  /**
   * Compress an image file with automatic quality adjustment based on power state
   */
  async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not available for image compression');
    }

    // Get power-aware compression settings
    const powerOptimizations = powerManager.getResourceOptimizations();
    
    const defaultOptions: CompressionOptions = {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: powerOptimizations.imageQuality,
      format: 'jpeg',
      maintainAspectRatio: true
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Load image
      const img = await this.loadImage(file);
      
      // Calculate new dimensions
      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        finalOptions.maxWidth!,
        finalOptions.maxHeight!,
        finalOptions.maintainAspectRatio!
      );

      // Set canvas size
      this.canvas.width = width;
      this.canvas.height = height;

      // Clear canvas and draw image
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      const blob = await this.canvasToBlob(
        this.canvas,
        finalOptions.format!,
        finalOptions.quality!
      );

      // Create compressed file
      const compressedFile = new File(
        [blob],
        this.generateFileName(file.name, finalOptions.format!),
        { type: blob.type }
      );

      return {
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: file.size > 0 ? compressedFile.size / file.size : 1,
        format: finalOptions.format!
      };

    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error(`Image compression failed: ${error}`);
    }
  }

  /**
   * Compress multiple images with progress callback
   */
  async compressImages(
    files: File[],
    options: CompressionOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.compressImage(files[i], options);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, files.length);
        }
      } catch (error) {
        console.error(`Failed to compress image ${files[i].name}:`, error);
        // Continue with other images
      }
    }

    return results;
  }

  /**
   * Get recommended compression settings based on use case
   */
  getRecommendedSettings(useCase: 'profile' | 'content' | 'document' | 'thumbnail'): CompressionOptions {
    const powerOptimizations = powerManager.getResourceOptimizations();
    const baseQuality = powerOptimizations.imageQuality;

    switch (useCase) {
      case 'profile':
        return {
          maxWidth: 400,
          maxHeight: 400,
          quality: Math.max(baseQuality, 0.8),
          format: 'jpeg'
        };

      case 'content':
        return {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: baseQuality,
          format: 'jpeg'
        };

      case 'document':
        return {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: Math.max(baseQuality, 0.9),
          format: 'jpeg'
        };

      case 'thumbnail':
        return {
          maxWidth: 200,
          maxHeight: 200,
          quality: Math.max(baseQuality * 0.8, 0.6),
          format: 'jpeg'
        };

      default:
        return {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: baseQuality,
          format: 'jpeg'
        };
    }
  }

  /**
   * Check if image needs compression
   */
  shouldCompress(file: File, maxSize: number = 2 * 1024 * 1024): boolean {
    // Always compress if file is larger than maxSize (default 2MB)
    if (file.size > maxSize) return true;

    // Compress in eco mode for files larger than 500KB
    const powerState = powerManager.getPowerState();
    if (powerState.ecoModeActive && file.size > 500 * 1024) return true;

    return false;
  }

  /**
   * Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate new dimensions maintaining aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Scale down if larger than max dimensions
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Convert canvas to blob with specified format and quality
   */
  private canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = `image/${format}`;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Generate new filename with correct extension
   */
  private generateFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = format === 'jpeg' ? 'jpg' : format;
    return `${nameWithoutExt}_compressed.${extension}`;
  }

  /**
   * Estimate compression savings
   */
  estimateCompressionSavings(
    file: File,
    options: CompressionOptions = {}
  ): Promise<{ estimatedSize: number; estimatedSavings: number }> {
    // This is a rough estimation based on typical compression ratios
    const powerOptimizations = powerManager.getResourceOptimizations();
    const quality = options.quality || powerOptimizations.imageQuality;
    
    // Rough estimation: JPEG compression typically achieves these ratios
    let estimatedRatio = 0.3; // Default 30% of original size
    
    if (quality > 0.9) estimatedRatio = 0.6;
    else if (quality > 0.8) estimatedRatio = 0.4;
    else if (quality > 0.6) estimatedRatio = 0.3;
    else estimatedRatio = 0.2;

    const estimatedSize = Math.round(file.size * estimatedRatio);
    const estimatedSavings = file.size - estimatedSize;

    return Promise.resolve({ estimatedSize, estimatedSavings });
  }
}

// Create singleton instance
export const imageCompression = new ImageCompressionService();

export default imageCompression;