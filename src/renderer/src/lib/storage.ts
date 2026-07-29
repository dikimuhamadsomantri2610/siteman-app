import { toast } from 'sonner';

/**
 * Safely set item in localStorage with error handling for quota limits.
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.error(`[Storage] Failed to save key "${key}" to localStorage:`, err);
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      toast.error('Memori lokal penuh! Mohon bersihkan riwayat laporan lama.', {
        duration: 6000,
      });
    } else {
      toast.error(`Gagal menyimpan data ke memori lokal: ${err?.message || 'Storage error'}`);
    }
    return false;
  }
}

/**
 * Safely set item in sessionStorage with error handling.
 */
export function safeSetSessionStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.error(`[Storage] Failed to save key "${key}" to sessionStorage:`, err);
    return false;
  }
}
