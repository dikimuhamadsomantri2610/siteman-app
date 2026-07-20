// ─── ScanBox ─────────────────────────────────────────────────────────────────
// Form input untuk scan Container ID dan tombol CEK ITEM.

import React from 'react';
import { ScanLine } from 'lucide-react';

interface ScanBoxProps {
  scanInput: string;
  onScanInputChange: (val: string) => void;
  scanError: string | null;
  onClearError: () => void;
  scanInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ScanBox({
  scanInput,
  onScanInputChange,
  scanError,
  onClearError,
  scanInputRef,
  onSubmit,
}: ScanBoxProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            ref={scanInputRef}
            type="text"
            autoFocus
            placeholder="SCAN NO CONTAINER ID"
            value={scanInput}
            onChange={(e) => {
              onScanInputChange(e.target.value);
              if (scanError) onClearError();
            }}
            className={`flex-1 w-full h-12 bg-zinc-50 dark:bg-zinc-800 border ${
              scanError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-[#5294FF]/20'
            } focus:ring-2 rounded-md text-base font-semibold px-4 text-zinc-900 dark:text-white placeholder-zinc-400 transition-all`}
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-8 h-12 bg-[#5294FF] hover:bg-[#3578e5] active:translate-x-0.5 active:translate-y-0.5 text-white text-sm font-bold rounded-md transition-all border-2 border-zinc-950 dark:border-zinc-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0 flex items-center justify-center gap-2"
          >
            <ScanLine className="h-5 w-5" />
            CEK ITEM
          </button>
        </div>
        {scanError && (
          <p className="text-sm font-bold text-red-500 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200 pl-1 mt-1">
            {scanError}
          </p>
        )}
      </div>
    </form>
  );
}
