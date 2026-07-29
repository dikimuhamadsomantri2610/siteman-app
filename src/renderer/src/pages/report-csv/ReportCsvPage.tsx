"use client";

import React from "react";
import {
  FileBarChart2,
  Download,
  Trash2,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useReportCsv } from "./useReportCsv";

export default function ReportCsvPage() {
  const { batches, handleDeleteBatch, handleExportBatchCsv } = useReportCsv();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <div className="bg-white border-[2.5px] border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0052cc] border-[2px] border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <FileBarChart2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
              REPORT PENGECEKAN CSV
            </h2>
            <p className="text-sm font-medium text-slate-600">
              Daftar riwayat laporan pengecekan barang (BCL & NON-BCL) yang siap diekspor ke file CSV.
            </p>
          </div>
        </div>
      </div>

      {/* Batch Cards List */}
      <div className="space-y-6">
        {batches.length === 0 ? (
          <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <FileBarChart2 className="h-16 w-16 text-zinc-200 dark:text-zinc-700" />
              <p className="font-extrabold text-lg text-zinc-800 dark:text-zinc-200">
                Belum Ada Laporan Hasil Cek
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                Silakan lakukan proses pengecekan barang terlebih dahulu pada menu Scan & Cek Barang dan klik "SELESAI CEK".
              </p>
            </div>
          </div>
        ) : (
          batches.map((batch, index) => {
            const totalItems = batch.items.length;
            const itemsWithDiff = batch.items.filter((i) => i.diffTotalPiece !== 0).length;
            const uniqueContainers = new Set(batch.items.map((i) => i.containerId)).size;

            const dateStr = new Date(batch.submittedAt).toLocaleDateString("id-ID", {
              dateStyle: "medium",
            });
            const timeStr = new Date(batch.submittedAt).toLocaleTimeString("id-ID", {
              timeStyle: "short",
            });

            const isNonBcl = batch.type === 'non-bcl';

            return (
              <div
                key={`${batch.loadNum}-${batch.submittedAt}-${batch.type}-${index}`}
                className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                {/* Status badge */}
                <div className="px-6 pt-5 pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider border border-green-300 dark:border-green-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      Pengecekan Selesai
                    </span>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                        isNonBcl
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isNonBcl ? 'NON BCL' : 'BCL'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">
                    Disubmit: {dateStr} · {timeStr}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 px-6 py-5">
                  {/* Left: Load info */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        Load Number
                      </p>
                      <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5 truncate">
                        {batch.loadNum} - <span className={isNonBcl ? "text-purple-600" : "text-emerald-600"}>{isNonBcl ? "NON BCL" : "BCL"}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm font-semibold">{batch.dnDate}</span>
                      </div>
                      <span className="text-zinc-200 dark:text-zinc-700">·</span>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm font-semibold truncate">{batch.storeName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[#5294FF]" />
                        <span className="text-sm font-bold text-[#5294FF] dark:text-blue-400">
                          {batch.store}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Stats */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <p className="text-4xl font-extrabold text-[#5294FF] dark:text-blue-400">
                        {uniqueContainers}
                      </p>
                      <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                        Container
                      </p>
                    </div>
                    <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-700" />
                    <div className="text-center">
                      <p className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                        {totalItems}
                      </p>
                      <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                        Item Dicek
                      </p>
                    </div>
                    {itemsWithDiff > 0 && (
                      <>
                        <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-700" />
                        <div className="text-center">
                          <p className="text-4xl font-extrabold text-rose-500">
                            {itemsWithDiff}
                          </p>
                          <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
                            Selisih
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: Export & Actions */}
                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleDeleteBatch(batch.loadNum, batch.submittedAt, batch.type)}
                      className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                      title="Hapus Laporan Load Ini"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleExportBatchCsv(batch)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-md bg-[#5294FF] hover:bg-[#3578e5] active:translate-x-0.5 active:translate-y-0.5 text-white font-bold text-sm transition-all border-2 border-zinc-950 dark:border-zinc-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                      EXPORT CSV
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
