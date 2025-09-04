import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { optimizeImage, validateImageFile, generateResponsiveImages } from '@/utils/imageOptimization';

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'optimizing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export const useOptimizedImageUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadOptimizedImages = useCallback(async (
    files: File[],
    bucket: string = 'property-images',
    folder: string = ''
  ): Promise<string[]> => {
    if (!files.length) return [];

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'pending'
    }));
    setUploadProgress(initialProgress);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress: validating
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'pending', progress: 10 } : item
        ));

        // Validate file
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          setUploadProgress(prev => prev.map((item, index) => 
            index === i ? { ...item, status: 'error', error: validation.error } : item
          ));
          continue;
        }

        // Update progress: optimizing
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'optimizing', progress: 30 } : item
        ));

        // Optimize image
        const optimizedFile = await optimizeImage(file, {
          maxWidth: 1200,
          maxHeight: 900,
          quality: 0.85,
          format: 'jpeg'
        });

        // Update progress: uploading
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'uploading', progress: 60 } : item
        ));

        // Generate unique filename
        const fileExt = optimizedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, optimizedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          setUploadProgress(prev => prev.map((item, index) => 
            index === i ? { ...item, status: 'error', error: error.message } : item
          ));
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);

        // Update progress: completed
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'completed', progress: 100 } : item
        ));
      }

      // Show success message
      const successCount = uploadedUrls.length;
      const errorCount = files.length - successCount;

      if (successCount > 0) {
        toast({
          title: "تم رفع الصور بنجاح",
          description: `تم رفع ${successCount} صورة${errorCount > 0 ? ` (فشل في رفع ${errorCount})` : ''}`,
        });
      }

      if (errorCount === files.length) {
        toast({
          title: "فشل في رفع الصور",
          description: "لم يتم رفع أي صورة بنجاح. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }

      return uploadedUrls;

    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "خطأ في رفع الصور",
        description: "حدث خطأ غير متوقع أثناء رفع الصور",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const uploadSingleOptimizedImage = useCallback(async (
    file: File,
    bucket: string = 'property-images',
    folder: string = ''
  ): Promise<string | null> => {
    const urls = await uploadOptimizedImages([file], bucket, folder);
    return urls[0] || null;
  }, [uploadOptimizedImages]);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    uploadOptimizedImages,
    uploadSingleOptimizedImage,
    uploadProgress,
    isUploading,
    clearProgress,
  };
};