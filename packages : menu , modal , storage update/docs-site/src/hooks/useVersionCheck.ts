// src/hooks/useVersionCheck.ts
import { useState, useCallback } from 'react';
import type { VersionCheckResult } from '../types/manifest';

interface UseVersionCheckReturn {
  result:  VersionCheckResult | null;
  loading: boolean;
  check:   (id: string, version: string, token: string) => Promise<void>;
  reset:   () => void;
}

export function useVersionCheck(): UseVersionCheckReturn {
  const [result,  setResult]  = useState<VersionCheckResult | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => { setResult(null); }, []);

  const check = useCallback(async (id: string, version: string, token: string) => {
    setLoading(true); setResult(null);
    try {
      const res  = await fetch(`/api/check-version?id=${encodeURIComponent(id)}&version=${encodeURIComponent(version)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setResult(data as VersionCheckResult);
    } catch {
      setResult({ status: 'ok', message: 'Could not reach registry — proceeding.' });
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, check, reset };
}