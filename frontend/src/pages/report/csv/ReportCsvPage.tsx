"use client";

import React, { useState, useMemo } from "react";
import {
  FileBarChart2,
  Download,
  Trash2,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { BclReportItem } from "../../scan-cek-barang/bcl/types";

interface BclReportBatch {
  loadNum: string;
  dnDate: string;
  store: string;
  storeName: string;
  submittedAt: string;
  items: BclReportItem[];
}

export default function ReportCsvPage() {
  const [reports, setReports] = useState<BclReportItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bcl_reports");
      if (saved) {
        try {
          return JSON.parse(saved) as BclReportItem[];
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Group reports into batches
  const batches = useMemo(() => {
    const map = new Map<string, BclReportItem[]>();
    reports.forEach((item) => {
      // Group by loadNum and submittedAt timestamp
      const key = `${item.loadNum}_${item.submittedAt}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });

    const list: BclReportBatch[] = [];
    map.forEach((items) => {
      const first = items[0];
      list.push({
        loadNum: first.loadNum,
        dnDate: first.dnDate,
        store: first.store,
        storeName: first.storeName,
        submittedAt: first.submittedAt,
        items,
      });
    });

    // Sort by submittedAt descending (newest first)
    return list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [reports]);

  // Delete a specific batch
  const handleDeleteBatch = (loadNum: string, submittedAt: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus laporan Load ${loadNum} ini?`)) {
      const updated = reports.filter(
        (r) => !(r.loadNum === loadNum && r.submittedAt === submittedAt)
      );
      localStorage.setItem("bcl_reports", JSON.stringify(updated));
      setReports(updated);
      toast.success(`Laporan Load ${loadNum} berhasil dihapus.`);
    }
  };

  // Export specific batch to CSV
  const handleExportBatchCsv = (batch: BclReportBatch) => {
    const escapeCsvValue = (val: unknown) => {
      const stringVal = String(val === null || val === undefined ? "" : val);
      if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const headers = [
      "No",
      "Tanggal DN",
      "No Load",
      "Kode Toko",
      "Nama Toko",
      "Container ID",
      "Aisle",
      "Kode Item",
      "Deskripsi Item",
      "Coef",
      "Qty Original PCK",
      "Qty Original PCS",
      "Total Original PC",
      "Qty Checked PCK",
      "Qty Checked PCS",
      "Total Checked PC",
      "Selisih PCK",
      "Selisih PCS",
      "Selisih Total PC",
      "Tanggal Submit Cek",
    ];

    const rows = batch.items.map((r, i) => [
      i + 1,
      r.dnDate,
      r.loadNum,
      r.store,
      r.storeName,
      r.containerId,
      r.aisle,
      r.item,
      r.itemDesc,
      r.coef,
      r.originalPck,
      r.originalPcs,
      r.originalTotalPiece,
      r.checkedPck,
      r.checkedPcs,
      r.checkedTotalPiece,
      r.diffPck,
      r.diffPcs,
      r.diffTotalPiece,
      new Date(r.submittedAt).toLocaleString("id-ID"),
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM
      [headers.join(","), ...rows.map((row) => row.map(escapeCsvValue).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const dateFormatted = new Date(batch.submittedAt).toISOString().slice(0, 10);
    const fileName = `${batch.loadNum}_${dateFormatted}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`File ${fileName} berhasil diunduh.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#5294FF] text-white shadow-sm">
          <FileBarChart2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase">
            REPORT CSV
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Daftar riwayat laporan pengecekan barang yang siap diekspor ke file CSV.
          </p>
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
                Silakan lakukan proses pengecekan barang terlebih dahulu pada menu scan item dan klik "SELESAI CEK".
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

            return (
              <div
                key={`${batch.loadNum}-${batch.submittedAt}-${index}`}
                className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                {/* Status badge */}
                <div className="px-6 pt-5 pb-0 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider border border-green-300 dark:border-green-800">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    Pengecekan Selesai
                  </span>
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
                        {batch.loadNum}
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
                      onClick={() => handleDeleteBatch(batch.loadNum, batch.submittedAt)}
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
