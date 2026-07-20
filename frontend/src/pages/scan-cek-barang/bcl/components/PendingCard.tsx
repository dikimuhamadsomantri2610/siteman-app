// ─── PendingCard ─────────────────────────────────────────────────────────────
// Tampilan saat phase === 'pending': info load, statistik, dan tombol mulai.

import { ArrowRight, Calendar, ClipboardCheck, FileText, MapPin } from 'lucide-react';
import { GoodsItem } from '../types';

interface Stats {
  total: number;
  checked: number;
  pending: number;
  completionRate: number;
}

interface Metadata {
  dnDate: string;
  loadNum: string;
  store: string;
  storeName: string;
}

interface PendingCardProps {
  metadata: Metadata;
  stats: Stats;
  totalContainers: number;
  items: GoodsItem[];
  onStartReview: () => void;
}

export default function PendingCard({
  metadata,
  stats,
  totalContainers,
  items,
  onStartReview,
}: PendingCardProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
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

      {/* Pending Card */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
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
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm font-semibold">{metadata.dnDate}</span>
              </div>
              <span className="text-zinc-200 dark:text-zinc-700">·</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm font-semibold truncate">{metadata.storeName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="text-sm font-bold text-[#5294FF] dark:text-blue-400">
                  {metadata.store}
                </span>
              </div>
            </div>
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
            className="shrink-0 flex items-center gap-2.5 px-7 py-3.5 rounded-md bg-[#5294FF] hover:bg-[#3578e5] active:translate-x-0.5 active:translate-y-0.5 text-white font-bold text-sm transition-all border-2 border-zinc-950 dark:border-zinc-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
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
