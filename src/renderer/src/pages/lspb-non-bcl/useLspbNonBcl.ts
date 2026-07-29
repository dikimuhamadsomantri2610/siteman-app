import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { BclReportItem } from "@shared/types/types";
import { useSite } from "@/hooks/useSite";
import { matchesActiveSite } from "@/components/SiteModal";

import { safeSetLocalStorage } from "@/lib/storage";

const ITEMS_PER_PAGE = 15;

export function useLspbNonBcl() {
  const { site } = useSite();

  const loadStoredReports = (): BclReportItem[] => {
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
  };

  const [reports, setReports] = useState<BclReportItem[]>(loadStoredReports);

  useEffect(() => {
    const reload = () => setReports(loadStoredReports());
    reload();
    window.addEventListener("focus", reload);
    window.addEventListener("dataset_updated", reload);
    return () => {
      window.removeEventListener("focus", reload);
      window.removeEventListener("dataset_updated", reload);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof BclReportItem | null>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const lspbItems = useMemo(() => {
    return reports.filter(
      (r) => r.diffTotalPiece !== 0 && r.type === "non-bcl" && matchesActiveSite(r, site)
    );
  }, [reports, site]);

  const handleDeleteItem = (itemToDelete: BclReportItem) => {
    if (!confirm("Anda yakin ingin menghapus data selisih ini ?")) return;

    const updated = reports.filter(
      (r) => !(r.id === itemToDelete.id && r.submittedAt === itemToDelete.submittedAt)
    );
    setReports(updated);
    safeSetLocalStorage("bcl_reports", JSON.stringify(updated));
    toast.success("Data selisih berhasil dihapus dari LSPB Non-BCL.");
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...lspbItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.item.toLowerCase().includes(q) ||
          i.itemDesc.toLowerCase().includes(q) ||
          i.containerId.toLowerCase().includes(q) ||
          i.loadNum.toLowerCase().includes(q)
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [lspbItems, searchQuery, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  const toggleSort = (field: keyof BclReportItem) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExportExcel = async () => {
    if (filteredAndSorted.length === 0) {
      toast.error("Tidak ada data selisih untuk di-export.");
      return;
    }

    const headers = [
      "No",
      "Tanggal DN",
      "No Load",
      "Toko",
      "Barcode Koli",
      "Kode Item",
      "Deskripsi Item",
      "Coef",
      "Original Total Pcs",
      "Checked Total Pcs",
      "Selisih Pcs",
      "Status",
      "Tanggal Cek",
    ];

    const rows = filteredAndSorted.map((item, index) => [
      index + 1,
      `"${item.dnDate}"`,
      `"${item.loadNum}"`,
      `"${item.store} - ${item.storeName}"`,
      `"${item.containerId}"`,
      `"${item.item}"`,
      `"${item.itemDesc.replace(/"/g, '""')}"`,
      item.coef,
      item.originalTotalPiece,
      item.checkedTotalPiece,
      item.diffTotalPiece,
      `"${item.diffTotalPiece > 0 ? "LEBIH" : "KURANG"}"`,
      `"${new Date(item.submittedAt).toLocaleString("id-ID")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const fileName = `LSPB_NON_BCL_${new Date().toISOString().slice(0, 10)}.csv`;

    if (window.electronAPI?.saveSitemanFile) {
      try {
        const res = await window.electronAPI.saveSitemanFile("lspbNonBcl", fileName, csvContent);
        toast.success("Export Excel Berhasil!", {
          description: `File tersimpan di: ${res.path || fileName}`,
        });
        return;
      } catch (err) {
        console.error("Failed saving file to siteman dir:", err);
      }
    }

    // Fallback: Web browser blob download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export Excel Berhasil!", { description: `Downloaded ${fileName}` });
  };

  return {
    reports,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    sortField,
    sortDirection,
    toggleSort,
    filteredAndSorted,
    paginatedItems,
    totalPages,
    handleDeleteItem,
    handleExportExcel,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}
