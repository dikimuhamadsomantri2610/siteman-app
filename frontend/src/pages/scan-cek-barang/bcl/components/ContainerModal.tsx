// ─── ContainerModal ───────────────────────────────────────────────────────────
// Modal untuk scan item per-container, edit qty PCK/PCS, dan konfirmasi.

import React from 'react';
import {
  Barcode,
  CheckCircle2,
  Package,
  X,
} from 'lucide-react';
import { GoodsItem } from '../types';

interface ContainerModalProps {
  isOpen: boolean;
  containerId: string;
  modalItems: GoodsItem[];
  revealedItems: GoodsItem[];
  allModalChecked: boolean;
  modalScannedIds: Set<string>;
  modalItemsChecked: Set<string>;
  modalEditedQty: Record<string, { pck: number; pcs: number }>;
  modalItemScanInput: string;
  modalItemScanRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onDone: () => void;
  onItemScanChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onItemScanSubmit: (e: React.FormEvent) => void;
  onItemToggle: (id: string) => void;
  onEditQty: (id: string, field: 'pck' | 'pcs', val: string) => void;
  onCheckAll: () => void;
}

export default function ContainerModal({
  isOpen,
  containerId,
  modalItems,
  revealedItems,
  allModalChecked,
  modalScannedIds,
  modalItemsChecked,
  modalEditedQty,
  modalItemScanInput,
  modalItemScanRef,
  onClose,
  onDone,
  onItemScanChange,
  onItemScanSubmit,
  onItemToggle,
  onEditQty,
  onCheckAll,
}: ContainerModalProps) {
  if (!isOpen) return null;

  const scanProgress = modalItems.length > 0
    ? Math.round((modalScannedIds.size / modalItems.length) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border-2 border-zinc-950 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#5294FF] rounded-t-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/20">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Container ID</p>
              <p className="text-xl font-extrabold text-white tracking-widest">{containerId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-zinc-950 bg-rose-400 hover:bg-rose-500 text-zinc-950 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar + check-all button */}
        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-none h-2 overflow-hidden">
              <div
                className="bg-green-500 h-2 rounded-none transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
              {modalScannedIds.size}/{modalItems.length} ITEM
            </span>
          </div>
          {revealedItems.length > 0 && (
            <button
              onClick={onCheckAll}
              className="text-xs font-bold px-3 py-1.5 rounded-md border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
            >
              {allModalChecked ? 'Batal Semua' : 'Pilih Semua'}
            </button>
          )}
        </div>

        {/* Item Scan Input */}
        <form onSubmit={onItemScanSubmit} className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950 text-[#5294FF] dark:text-blue-400">
              <Barcode className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <input
                ref={modalItemScanRef}
                type="text"
                placeholder="SCAN BARCODE ITEM"
                value={modalItemScanInput}
                onChange={onItemScanChange}
                className="w-full h-9 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-2 focus:ring-[#5294FF]/20 rounded-md text-sm font-semibold px-3 text-zinc-900 dark:text-white placeholder-zinc-400 transition-all"
              />
            </div>
          </div>
          {modalItems.length - modalScannedIds.size > 0 && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 ml-[52px]">
              {modalItems.length - modalScannedIds.size} item belum discan dalam container ini
            </p>
          )}
        </form>

        {/* Column Headers */}
        {revealedItems.length > 0 && (
          <div className="px-6 py-2.5 bg-zinc-100/60 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <div className="col-span-1" />
              <div className="col-span-5">Item / Deskripsi</div>
              <div className="col-span-2 text-center">PCK</div>
              <div className="col-span-2 text-center">PCS</div>
              <div className="col-span-2 text-center">Total PC</div>
            </div>
          </div>
        )}

        {/* Revealed Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
          {revealedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950">
                <Barcode className="h-8 w-8 text-blue-400 dark:text-blue-500" />
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
                Arahkan scanner ke barcode pada item atau ketik Item Code di kotak scan di atas.
              </p>
            </div>
          ) : (
            revealedItems.map((item) => {
              const isChecked = modalItemsChecked.has(item.id);
              const eq = modalEditedQty[item.id] || { pck: item.pck, pcs: item.pcs };
              const computedTotal = eq.pck * item.coef + eq.pcs;
              return (
                <div
                  key={item.id}
                  className={`px-6 py-4 grid grid-cols-12 gap-2 items-center transition-colors animate-in fade-in slide-in-from-top-2 duration-300 ${
                    isChecked ? 'bg-green-50 dark:bg-green-950' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => onItemToggle(item.id)}
                    className={`col-span-1 flex h-7 w-7 items-center justify-center rounded-md border-2 transition-all ${
                      isChecked
                        ? 'bg-green-500 border-green-500'
                        : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-[#5294FF]'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </button>

                  {/* Item Info */}
                  <div className="col-span-5 min-w-0">
                    <p className="font-bold text-sm leading-tight whitespace-normal wrap-break-word text-zinc-900 dark:text-white">
                      {item.itemDesc}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{item.item}</span>
                      <span className="text-zinc-200 dark:text-zinc-700">·</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Aisle {item.aisle}</span>
                    </div>
                  </div>

                  {/* PCK editable */}
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="number"
                      min={0}
                      value={eq.pck}
                      onChange={(e) => onEditQty(item.id, 'pck', e.target.value)}
                      className="w-16 h-9 text-center text-sm font-extrabold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-1 focus:ring-[#5294FF]/20 rounded-md text-zinc-900 dark:text-white transition-all"
                    />
                  </div>

                  {/* PCS editable */}
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="number"
                      min={0}
                      value={eq.pcs}
                      onChange={(e) => onEditQty(item.id, 'pcs', e.target.value)}
                      className="w-16 h-9 text-center text-sm font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-1 focus:ring-[#5294FF]/20 rounded-md text-zinc-900 dark:text-white transition-all"
                    />
                  </div>

                  {/* Total Piece */}
                  <div className="col-span-2 text-center">
                    <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                      {computedTotal}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onDone}
            className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-green-600 hover:bg-green-700 active:translate-x-0.5 active:translate-y-0.5 text-white text-sm font-bold transition-all border-2 border-zinc-950 dark:border-zinc-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
