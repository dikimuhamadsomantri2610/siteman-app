// ─── StatsCards ──────────────────────────────────────────────────────────────
// 4 kartu statistik: Total Item, Sudah Cek, Belum Cek, Completion %.

import { AlertCircle, Boxes, CheckCircle2, TrendingUp } from 'lucide-react';

interface Stats {
  total: number;
  checked: number;
  pending: number;
  completionRate: number;
}

interface StatsCardsProps {
  stats: Stats;
  totalContainers: number;
}

export default function StatsCards({ stats, totalContainers }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Item */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5294FF]">
            <Boxes className="h-4 w-4 text-white" />
          </div>
          <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
            Total Item
          </span>
        </div>
        <p className="text-3xl font-extrabold text-zinc-950 dark:text-white">{stats.total}</p>
        <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">
          {totalContainers} container
        </span>
      </div>

      {/* Sudah Cek */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-500">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
            Sudah Cek
          </span>
        </div>
        <p className="text-3xl font-extrabold text-zinc-950 dark:text-white">{stats.checked}</p>
        <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">
          Telah dikonfirmasi dan cek
        </span>
      </div>

      {/* Belum Cek */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
            Belum Cek
          </span>
        </div>
        <p className="text-3xl font-extrabold text-zinc-950 dark:text-white">{stats.pending}</p>
        <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">Menunggu scan</span>
      </div>

      {/* Completion */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
              Completion
            </span>
          </div>
          <p className="text-3xl font-extrabold text-zinc-950 dark:text-white">
            {stats.completionRate}%
          </p>
        </div>
        <div className="w-full bg-zinc-300 dark:bg-zinc-700 rounded-none h-2.5 mt-3 overflow-hidden">
          <div
            className="bg-[#5294FF] h-2.5 rounded-none transition-all duration-700 ease-out"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
