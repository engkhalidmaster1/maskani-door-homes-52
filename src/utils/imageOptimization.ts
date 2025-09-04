// Image optimization utilities

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Compress and resize an image file
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = Math.min(width, opts.maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, opts.maxHeight);
          width = height * aspectRatio;
        }
      }

      // Set canvas size and draw image
      canvas.width = width;
      canvas.height = height;
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: `image/${opts.format}`,
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Failed to optimize image'));
          }
        },
        `image/${opts.format}`,
        opts.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate multiple sizes of an image for responsive loading
 */
export const generateResponsiveImages = async (
  file: File
): Promise<{ small: File; medium: File; large: File; original: File }> => {
  const [small, medium, large] = await Promise.all([
    optimizeImage(file, { maxWidth: 400, maxHeight: 300, quality: 0.7 }),
    optimizeImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.8 }),
    optimizeImage(file, { maxWidth: 1200, maxHeight: 900, quality: 0.85 }),
  ]);

  return {
    small,
    medium,
    large,
    original: file
  };
};

/**
 * Check if file is an image and validate size
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPEG، PNG، أو WebP'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت'
    };
  }

  return { isValid: true };
};

/**
 * Get optimized image URL based on screen size
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  screenSize: 'small' | 'medium' | 'large' = 'medium'
): string => {
  if (!baseUrl) return '';
  
  // If using Supabase storage, we can add transformations
  if (baseUrl.includes('supabase')) {
    const transformations: Record<string, string> = {
      small: 'width=400,height=300,resize=cover,quality=70',
      medium: 'width=800,height=600,resize=cover,quality=80',
      large: 'width=1200,height=900,resize=cover,quality=85'
    };
    
    return `${baseUrl}?${transformations[screenSize]}`;
  }
  
  return baseUrl;
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};