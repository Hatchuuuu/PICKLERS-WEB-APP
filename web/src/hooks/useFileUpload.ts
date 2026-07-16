import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseFileUploadOptions {
  bucket: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function useFileUpload({ bucket, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] }: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Validation
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      if (allowedTypes && !allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // 2. Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      return publicUrlData.publicUrl;
      
    } catch (err: unknown) {
      console.error('Upload Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during upload');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, progress, error };
}
