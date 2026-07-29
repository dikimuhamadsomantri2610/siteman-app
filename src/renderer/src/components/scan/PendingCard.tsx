// ─── PendingCard ─────────────────────────────────────────────────────────────
// Tampilan saat phase === 'pending': info load, statistik, dan tombol mulai.

import { ArrowRight, Calendar, ClipboardCheck, FileText, MapPin, CheckCircle2, Building2, Trash2, LayoutGrid } from 'lucide-react';
import { GoodsItem } from '@shared/types/types';
import { determineItemBclType } from '@shared/types/bcl';

interface Stats {
  total: number;
  checked: number;
  pending: number;
  completionRate: number;
}

interface Metadata {
  dnDate: string;
  loadNum: string;
  warehouse?: string;
  store: string;
  storeName: string;
}

interface PendingCardProps {
  metadata: Metadata;
  stats: Stats;
  totalContainers: number;
  items: GoodsItem[];
  onStartReview: () => void;
  onDeleteLoad?: (loadNum: string) => void;
  showTitle?: boolean;
  cardTitle?: string;
}

export default function PendingCard({
  metadata,
  stats,
  totalContainers,
  items,
  onStartReview,
  onDeleteLoad,
  showTitle = true,
  cardTitle = "BARANG CEK LANGSUNG",
}: PendingCardProps) {
  if (stats.total === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        {showTitle && (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#5294FF] text-white shadow-sm">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                CEK ITEM - {cardTitle.toUpperCase()}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Semua pengecekan selesai.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 border-2 border-[#5294FF] mb-2">
              <CheckCircle2 className="h-8 w-8 text-[#5294FF] dark:text-blue-400" />
            </div>
            <p className="font-extrabold text-lg text-zinc-800 dark:text-zinc-200 uppercase">
              Semua Pengecekan {cardTitle} Selesai!
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              Tidak ada data {cardTitle} yang menunggu pengecekan. Silakan lihat riwayat hasil cek di halaman <strong>Report Cek</strong> atau <strong>LSPB</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={showTitle ? "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" : ""}>
      {/* Header */}
      {showTitle && (
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#5294FF] text-white shadow-sm">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              CEK ITEM - BARANG CEK LANGSUNG
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {totalContainers} container · {items.length} item menunggu untuk dicek.
            </p>
          </div>
        </div>
      )}

      {/* Pending Card */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
        {/* Trash button on absolute top-right corner */}
        {onDeleteLoad && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteLoad(metadata.loadNum);
            }}
            title={`Hapus Load ${metadata.loadNum}`}
            className="absolute right-3.5 top-3.5 z-10 p-2 rounded-lg bg-red-500 hover:bg-red-600 active:translate-x-0.5 active:translate-y-0.5 text-white font-bold transition-all border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center shrink-0"
          >
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        )}

        {/* Status badge */}
        <div className="px-6 pt-5 pb-0">
          {stats.checked > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider border border-amber-300 dark:border-amber-800">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pengecekan Ditunda
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Menunggu Pengecekan
            </span>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 px-6 py-5">
          {/* Left: Load info */}
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Load Number
              </p>
              <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5 truncate">
                {metadata.loadNum}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#5294FF] dark:text-blue-400" />
                <span className="text-sm font-semibold">{metadata.dnDate}</span>
              </div>
              {metadata.warehouse && metadata.warehouse !== "-" && (
                <>
                  <span className="text-zinc-200 dark:text-zinc-700">·</span>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-[#5294FF] dark:text-blue-400" />
                    <span className="text-sm font-semibold">{metadata.warehouse}</span>
                  </div>
                </>
              )}
              <span className="text-zinc-200 dark:text-zinc-700">·</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#5294FF] dark:text-blue-400" />
                <span className="text-sm font-semibold truncate">{metadata.storeName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-[#5294FF] dark:text-blue-400" />
                <span className="text-sm font-bold text-[#5294FF] dark:text-blue-400">
                  {metadata.store}
                </span>
              </div>
            </div>

            {/* Aisle BCL */}
            {(() => {
              const warehouse = metadata.warehouse || '';
              const uniqueAisles = [...new Set(items.map((i) => i.aisle).filter(Boolean))].sort();
              if (uniqueAisles.length === 0) return null;

              const bclAisles = uniqueAisles.filter(
                (aisle) => determineItemBclType(warehouse, aisle, '') === 'bcl'
              );

              if (bclAisles.length === 0) return null;

              return (
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <div className="flex items-center gap-1 shrink-0">
                    <LayoutGrid className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Aisle BCL:</span>
                  </div>
                  {bclAisles.map((aisle) => (
                    <span
                      key={aisle}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300"
                    >
                      {aisle}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Middle: Stats */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-[#5294FF] dark:text-blue-400">
                {totalContainers}
              </p>
              <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                Total Container
              </p>
            </div>
            <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
              <p className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                {items.length}
              </p>
              <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                Total Item
              </p>
            </div>
          </div>

          {/* Right: Review button */}
          <button
            onClick={onStartReview}
            className="shrink-0 flex items-center gap-2.5 px-7 py-3.5 rounded-md bg-[#5294FF] hover:bg-[#3578e5] active:translate-x-0.5 active:translate-y-0.5 text-white font-bold text-sm transition-all border-2 border-zinc-950 dark:border-zinc-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            {stats.checked > 0 ? 'DILANJUTKAN' : 'REVIEW'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar (only if progress exists) */}
        {stats.checked > 0 && (
          <div className="px-6 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Progress sebelumnya: {stats.checked} dari {stats.total} item
              </span>
              <span className="text-xs font-extrabold text-[#5294FF] dark:text-blue-400">
                {stats.completionRate}%
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-none h-2 overflow-hidden">
              <div
                className="bg-[#5294FF] h-2 rounded-none transition-all duration-700"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
