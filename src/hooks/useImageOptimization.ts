import { useState, useCallback, useMemo } from "react";

interface UseImageOptimizationOptions {
  maxImages?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  compressionQuality?: number;
}

interface ImageData {
  file: File;
  preview: string;
  compressed?: File;
}

export const useImageOptimization = (options: UseImageOptimizationOptions = {}) => {
  const {
    maxImages = 10,
    maxFileSize = 5, // 5MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    compressionQuality = 0.8
  } = options;

  const [images, setImages] = useState<ImageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Compress image using Canvas API
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 1200;
        const maxHeight = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          compressionQuality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [compressionQuality]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WEBP';
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `حجم الملف كبير جداً. الحد الأقصى ${maxFileSize}MB`;
    }
    
    return null;
  }, [allowedTypes, maxFileSize]);

  // Add images with validation and compression
  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxImages) {
      throw new Error(`لا يمكن إضافة أكثر من ${maxImages} صورة`);
    }
    
    setIsProcessing(true);
    
    try {
      const newImages: ImageData[] = [];
      
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          throw new Error(error);
        }
        
        // Create preview
        const preview = URL.createObjectURL(file);
        
        // Compress image
        const compressed = await compressImage(file);
        
        newImages.push({
          file,
          preview,
          compressed
        });
      }
      
      setImages(prev => [...prev, ...newImages]);
    } finally {
      setIsProcessing(false);
    }
  }, [images.length, maxImages, validateFile, compressImage]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      // Cleanup preview URL
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  }, []);

  // Clear all images
  const clearImages = useCallback(() => {
    // Cleanup all preview URLs
    images.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setImages([]);
  }, [images]);

  // Get files for upload (compressed versions)
  const getFilesForUpload = useCallback(() => {
    return images.map(img => img.compressed || img.file);
  }, [images]);

  // Get preview URLs
  const previewUrls = useMemo(() => {
    return images.map(img => img.preview);
  }, [images]);

  // Statistics
  const stats = useMemo(() => {
    const originalSize = images.reduce((total, img) => total + img.file.size, 0);
    const compressedSize = images.reduce((total, img) => total + (img.compressed?.size || img.file.size), 0);
    
    return {
      count: images.length,
      maxImages,
      remaining: maxImages - images.length,
      originalSize,
      compressedSize,
      savedBytes: originalSize - compressedSize,
      compressionRatio: originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0
    };
  }, [images, maxImages]);

  return {
    images,
    previewUrls,
    isProcessing,
    stats,
    addImages,
    removeImage,
    clearImages,
    getFilesForUpload
  };
};