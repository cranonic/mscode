// src/hooks/useUpload.ts
import { useState, useCallback } from 'react';
import type { ExtractedExtension } from '../types/manifest';
import { supabase } from './useAuth'; // Supabase ইমপোর্ট করা হলো

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UseUploadReturn {
  status: UploadStatus;
  fileName: string | null;
  error: string | null;
  upload: (ext: ExtractedExtension) => Promise<void>;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle'); 
    setFileName(null); 
    setError(null);
  }, []);

  const upload = useCallback(async (ext: ExtractedExtension) => {
    setStatus('uploading'); 
    setError(null); 
    setFileName(null);
    
    try {
      // সিকিউরিটির জন্য ইউজারের বর্তমান সেশন টোকেন নেওয়া হচ্ছে
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to upload.");
      }

      const form = new FormData();
      form.append('file', ext.rawFile);
      form.append('manifest', JSON.stringify(ext.manifest));

      // API রিকোয়েস্টের সাথে Authorization হেডার পাঠানো হচ্ছে
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: form,
        headers: {
          'Authorization': `Bearer ${session.access_token}` // JWT অ্যাক্সেস টোকেন
        }
      });
      
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error ?? 'Upload failed.');
      }
      
      setFileName(result.fileName);
      setStatus('success');
    } catch (err: any) {
      setError(err.message ?? 'Unknown error during upload.');
      setStatus('error');
    }
  }, []);

  return { status, fileName, error, upload, reset };
}
