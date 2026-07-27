"use client";

import React, { useState, useMemo } from "react";
import {
  ClipboardX,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  TrendingDown,
  ArrowUpDown,
} from "lucide-react";
import { BclReportItem } from "../../../scan-cek-barang/bcl/types";

const ITEMS_PER_PAGE = 15;

export default function LspbBclPage() {
  const [reports] = useState<BclReportItem[]>(() => {
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

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof BclReportItem | null>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const lspbItems = useMemo(() => {
    return reports.filter((r) => r.diffTotalPiece !== 0);
  }, [reports]);

  // Handle sorting
  const toggleSorting = (field: keyof BclReportItem) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter + Sort LSPB items
  const filteredAndSorted = useMemo(() => {
    const filtered = lspbItems.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.item.toLowerCase().includes(q) ||
        item.itemDesc.toLowerCase().includes(q) ||
        item.containerId.toLowerCase().includes(q) ||
        item.loadNum.toLowerCase().includes(q) ||
        item.storeName.toLowerCase().includes(q)
      );
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      });
    }

    return filtered;
  }, [lspbItems, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const totalDiffItems = lspbItems.length;
    const totalMinus = lspbItems.filter((r) => r.diffTotalPiece < 0).length;
    const totalPlus = lspbItems.filter((r) => r.diffTotalPiece > 0).length;
    
    // Sum total piece difference value
    const sumPieceDiff = lspbItems.reduce((acc, curr) => acc + curr.diffTotalPiece, 0);

    return { totalDiffItems, totalMinus, totalPlus, sumPieceDiff };
  }, [lspbItems]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#5294FF] text-white shadow-sm">
            <ClipboardX className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              LSPB BARANG CEK LANGSUNG (BCL)
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Laporan selisih pengecekan barang (Lebih / Kurang).
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Item Selisih */}
        <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5294FF]">
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5294FF]">
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5294FF]">
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
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#5294FF]">
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
            <ClipboardX className="h-5 w-5 text-[#5294FF] dark:text-blue-400" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">
              TABLE DETAIL SELISIH BARANG
            </h3>
          </div>
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
              className="w-full h-9 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-0 text-sm pl-9 pr-3 rounded-md text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 text-[11px] tracking-wider uppercase select-none">
                <th className="py-3 px-4 font-bold">NO</th>
                <th
                  onClick={() => toggleSorting("submittedAt")}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    TANGGAL CEK
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "submittedAt" ? "text-[#5294FF]" : "text-zinc-400"}`} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSorting("loadNum")}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    NO LOAD
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "loadNum" ? "text-[#5294FF]" : "text-zinc-400"}`} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSorting("containerId")}
                  className="py-3 px-4 font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    CONTAINER ID
                    <ArrowUpDown className={`h-3 w-3 ${sortField === "containerId" ? "text-[#5294FF]" : "text-zinc-400"}`} />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">KODE ITEM</th>
                <th className="py-3 px-4 font-bold">DESKRIPSI ITEM</th>
                <th className="py-3 px-4 font-bold text-center">COEF</th>
                <th className="py-3 px-4 font-bold text-center bg-blue-50/50 dark:bg-blue-950/20">ORIGINAL (PCK/PCS)</th>
                <th className="py-3 px-4 font-bold text-center bg-green-50/50 dark:bg-green-950/20">CHECKED (PCK/PCS)</th>
                <th className="py-3 px-4 font-bold text-center bg-amber-50/50 dark:bg-amber-950/20">SELISIH PC</th>
                <th className="py-3 px-4 font-bold text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardX className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
                      <p className="font-semibold text-sm text-zinc-400 dark:text-zinc-500">
                        Tidak ada selisih yang ditemukan pada riwayat pengecekan.
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
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
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
                      <td className="py-3.5 px-4 font-extrabold text-[#5294FF] dark:text-blue-400 text-xs whitespace-nowrap">
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
