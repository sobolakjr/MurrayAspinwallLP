'use client';

import { createClient } from './client';

const BUCKET_NAME = 'documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please upload PDF, images, or Office documents.' };
  }

  return { valid: true };
}

export async function uploadFile(
  file: File,
  propertyId?: string | null,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const supabase = createClient();

  // Create a unique file path
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const folder = propertyId || 'general';
  const filePath = `${folder}/${timestamp}-${sanitizedFileName}`;

  try {
    // For progress tracking, we use XMLHttpRequest since Supabase SDK doesn't support progress
    if (onProgress) {
      const url = await uploadWithProgress(file, filePath, onProgress);
      return {
        success: true,
        url,
        fileName: file.name,
        fileSize: file.size,
      };
    }

    // Standard upload without progress
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}

async function uploadWithProgress(
  file: File,
  filePath: string,
  onProgress: (progress: UploadProgress) => void
): Promise<string> {
  const supabase = createClient();

  // Use Supabase upload since XMLHttpRequest requires CORS setup
  // Progress simulation for better UX
  const totalSize = file.size;
  let simulatedProgress = 0;

  const progressInterval = setInterval(() => {
    simulatedProgress = Math.min(simulatedProgress + 10, 90);
    onProgress({
      loaded: (simulatedProgress / 100) * totalSize,
      total: totalSize,
      percentage: simulatedProgress,
    });
  }, 100);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  clearInterval(progressInterval);

  if (error) {
    throw error;
  }

  // Complete progress
  onProgress({
    loaded: totalSize,
    total: totalSize,
    percentage: 100,
  });

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteFile(fileUrl: string): Promise<boolean> {
  const supabase = createClient();

  // Extract file path from URL
  const urlParts = fileUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
  if (urlParts.length !== 2) {
    console.error('Invalid file URL format');
    return false;
  }

  const filePath = decodeURIComponent(urlParts[1]);

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
