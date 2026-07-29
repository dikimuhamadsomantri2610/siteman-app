// ─── EditItemModal ────────────────────────────────────────────────────────────
// Modal edit qty PCK / PCS untuk item yang sudah ada di rekap.

import { CheckCircle2, Package, X } from 'lucide-react';
import { GoodsItem } from '@shared/types/types';

interface EditItemModalProps {
  item: GoodsItem | null;
  editPck: number;
  editPcs: number;
  onPckChange: (val: number) => void;
  onPcsChange: (val: number) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EditItemModal({
  item,
  editPck,
  editPcs,
  onPckChange,
  onPcsChange,
  onSave,
  onClose,
}: EditItemModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex flex-col overflow-hidden border-2 border-zinc-950 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#5294FF] rounded-t-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/20">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-extrabold text-white">Edit Item Qty</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-zinc-950 bg-rose-400 hover:bg-rose-500 text-zinc-950 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Item / Deskripsi
            </p>
            <p className="text-sm font-extrabold text-zinc-900 dark:text-white mt-1 leading-tight">
              {item.itemDesc}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              {item.item} · Aisle {item.aisle} · Coef: {item.coef}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                PCK
              </label>
              <input
                type="number"
                min={0}
                value={editPck}
                onChange={(e) => onPckChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-2 focus:ring-[#5294FF]/20 rounded-md text-center text-lg font-extrabold text-zinc-900 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                PCS
              </label>
              <input
                type="number"
                min={0}
                value={editPcs}
                onChange={(e) => onPcsChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-2 focus:ring-[#5294FF]/20 rounded-md text-center text-lg font-bold text-zinc-900 dark:text-white transition-all"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Total Pieces:
            </span>
            <span className="text-lg font-extrabold text-[#5294FF] dark:text-blue-400">
              {editPck * item.coef + editPcs} pcs
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all border-2 border-zinc-950 dark:border-zinc-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
