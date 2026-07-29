"use client";

import React, { useMemo } from "react";
import {
  ClipboardX,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  TrendingDown,
  ArrowUpDown,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { useLspbNonBcl } from "./useLspbNonBcl";
import { BclReportItem } from "@shared/types/types";

export default function LspbNonBclPage() {
  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    sortField,
    toggleSort,
    filteredAndSorted,
    paginatedItems,
    totalPages,
    handleDeleteItem,
    handleExportExcel,
    itemsPerPage,
  } = useLspbNonBcl();

  // Statistics
  const stats = useMemo(() => {
    const totalDiffItems = filteredAndSorted.length;
    const totalMinus = filteredAndSorted.filter((r) => r.diffTotalPiece < 0).length;
    const totalPlus = filteredAndSorted.filter((r) => r.diffTotalPiece > 0).length;
    const sumPieceDiff = filteredAndSorted.reduce((acc, curr) => acc + curr.diffTotalPiece, 0);

    return { totalDiffItems, totalMinus, totalPlus, sumPieceDiff };
  }, [filteredAndSorted]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <div className="bg-white border-[2.5px] border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0d9488] border-[2px] border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <ClipboardX className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
              LSPB BARANG NON-BCL
            </h2>
            <p className="text-sm font-medium text-slate-600">
              Laporan selisih pengecekan barang kategori Non-BCL (Lebih / Kurang).
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Item Selisih */}
        <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d9488]">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
              Total Item Selisih
            </span>
          </div>
          <p className="text-3xl font-extrabold text-zinc-950 dark:text-white">{stats.totalDiffItems}</p>
          <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">
            Item dengan checking qty tidak sesuai
          </span>
        </div>

        {/* Kurang (Minus) */}
        <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d9488]">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
              Item Kurang (Minus)
            </span>
          </div>
          <p className="text-3xl font-extrabold">{stats.totalMinus}</p>
          <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">
            Checking qty &lt; original qty
          </span>
        </div>

        {/* Lebih (Plus) */}
        <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d9488]">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
              Item Lebih (Plus)
            </span>
          </div>
          <p className="text-3xl font-extrabold">{stats.totalPlus}</p>
          <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">
            Checking qty &gt; original qty
          </span>
        </div>

        {/* Akumulasi Selisih PC */}
        <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d9488]">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-zinc-950 dark:text-white text-xs font-semibold uppercase tracking-wider">
              Akumulasi Selisih PC
            </span>
          </div>
          <p className="text-3xl font-extrabold text-zinc-950 dark:text-white">
            {stats.sumPieceDiff > 0 ? `+${stats.sumPieceDiff}` : stats.sumPieceDiff}
          </p>
          <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">
            Total net unit selisih
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ClipboardX className="h-5 w-5 text-[#0d9488] dark:text-teal-400" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">
              TABLE DETAIL SELISIH BARANG NON-BCL
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari item, container, load..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#0d9488] focus:ring-0 text-sm pl-9 pr-3 rounded-md text-zinc-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="border-[2px] border-black rounded-lg px-3 py-1.5 bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-extrabold text-xs uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-black shrink-0" />
              <span>EXCEL</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 text-[11px] tracking-wider uppercase select-none">
                <th className="py-3 px-4 font-bold">NO</th>
                <th
                  onClick={() => toggleSort("submittedAt")}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    TANGGAL CEK
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "submittedAt" ? "text-[#0d9488]" : "text-zinc-400"}`} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("loadNum")}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    NO LOAD
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "loadNum" ? "text-[#0d9488]" : "text-zinc-400"}`} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("containerId")}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    CONTAINER ID
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "containerId" ? "text-[#0d9488]" : "text-zinc-400"}`} />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">KODE ITEM</th>
                <th className="py-3 px-4 font-bold">DESKRIPSI ITEM</th>
                <th className="py-3 px-4 font-bold text-center">COEF</th>
                <th className="py-3 px-4 font-bold text-center bg-blue-50/50 dark:bg-blue-950/20">ORIGINAL (PCK/PCS)</th>
                <th className="py-3 px-4 font-bold text-center bg-green-50/50 dark:bg-green-950/20">CHECKED (PCK/PCS)</th>
                <th className="py-3 px-4 font-bold text-center bg-amber-50/50 dark:bg-amber-950/20">SELISIH PC</th>
                <th className="py-3 px-4 font-bold text-center">STATUS</th>
                <th className="py-3 px-4 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardX className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
                      <p className="font-semibold text-sm text-zinc-400 dark:text-zinc-500">
                        Tidak ada selisih yang ditemukan pada riwayat pengecekan Non-BCL.
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Semua item yang dicek memiliki jumlah quantity yang sesuai.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const isPlus = item.diffTotalPiece > 0;
                  return (
                    <tr
                      key={`${item.id}-${item.submittedAt}-${index}`}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors bg-amber-50/5 dark:bg-amber-950/5"
                    >
                      <td className="py-3.5 px-4 font-bold text-zinc-400 text-xs">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap text-zinc-500">
                        {new Date(item.submittedAt).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-950 dark:text-zinc-200 text-xs whitespace-nowrap">
                        {item.loadNum}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0d9488] dark:text-teal-400 text-xs whitespace-nowrap">
                        {item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">{item.item}</td>
                      <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-white wrap-break-word min-w-50">
                        {item.itemDesc}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500">{item.coef}</td>
                      <td className="py-3.5 px-4 text-center bg-blue-50/20 dark:bg-blue-950/5 font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.originalPck} / {item.originalPcs} ({item.originalTotalPiece})
                      </td>
                      <td className="py-3.5 px-4 text-center bg-green-50/20 dark:bg-green-950/5 font-bold text-zinc-900 dark:text-white">
                        {item.checkedPck} / {item.checkedPcs} ({item.checkedTotalPiece})
                      </td>
                      <td
                        className={`py-3.5 px-4 text-center bg-amber-50/20 dark:bg-amber-950/5 font-extrabold text-sm ${
                          isPlus ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isPlus ? `+${item.diffTotalPiece}` : item.diffTotalPiece}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPlus
                              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                              : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {isPlus ? "LEBIH" : "KURANG"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          title="Hapus Data Selisih"
                          className="p-1.5 rounded-lg border-[1.5px] border-black bg-red-500 hover:bg-red-600 text-white transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer inline-flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-white" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Menampilkan {paginatedItems.length} dari {filteredAndSorted.length} baris selisih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Hal. {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
