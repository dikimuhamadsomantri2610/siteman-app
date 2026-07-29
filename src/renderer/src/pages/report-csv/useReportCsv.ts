import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { BclReportItem } from "@shared/types/types";
import { useSite } from "@/hooks/useSite";
import { matchesActiveSite } from "@/components/SiteModal";
import { determineItemBclType } from "@shared/types/bcl";
import { safeSetLocalStorage } from "@/lib/storage";

export interface BclReportBatch {
  loadNum: string;
  dnDate: string;
  store: string;
  storeName: string;
  submittedAt: string;
  type: 'bcl' | 'non-bcl';
  items: BclReportItem[];
}

export function useReportCsv() {
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

  const filteredReports = useMemo(() => {
    return reports.filter((r) => matchesActiveSite(r, site));
  }, [reports, site]);

  const batches = useMemo(() => {
    const map = new Map<string, BclReportItem[]>();
    filteredReports.forEach((item) => {
      const itemType = determineItemBclType(
        item.warehouse || site.dcPengirim || "GBG",
        item.aisle || "",
        item.type
      );
      const key = `${item.loadNum}_${item.submittedAt}_${itemType}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });

    const list: BclReportBatch[] = [];
    map.forEach((items) => {
      const first = items[0];
      const itemType = determineItemBclType(
        first.warehouse || site.dcPengirim || "GBG",
        first.aisle || "",
        first.type
      );
      list.push({
        loadNum: first.loadNum,
        dnDate: first.dnDate,
        store: first.store,
        storeName: first.storeName,
        submittedAt: first.submittedAt,
        type: itemType,
        items,
      });
    });

    return list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [filteredReports, site]);

  const handleDeleteBatch = (loadNum: string, submittedAt: string, batchType: 'bcl' | 'non-bcl') => {
    const typeLabel = batchType === 'non-bcl' ? 'NON BCL' : 'BCL';
    if (window.confirm(`Apakah Anda yakin ingin menghapus laporan Load ${loadNum} (${typeLabel}) ini?`)) {
      const updated = reports.filter((r) => {
        const itemType = determineItemBclType(
          r.warehouse || site.dcPengirim || "GBG",
          r.aisle || "",
          r.type
        );
        return !(r.loadNum === loadNum && r.submittedAt === submittedAt && itemType === batchType);
      });
      safeSetLocalStorage("bcl_reports", JSON.stringify(updated));
      setReports(updated);
      toast.success(`Laporan Load ${loadNum} (${typeLabel}) berhasil dihapus.`);
    }
  };

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
      "Kategori",
      "Tanggal DN",
      "No Load",
      "Gudang (Warehouse)",
      "Kode Toko",
      "Nama Toko",
      "Aisle",
      "Container ID",
      "Kode Item",
      "Deskripsi Item",
      "Coef",
      "Qty Cek PCK",
      "Qty Cek PCS",
      "Total Qty Cek (Pcs)",
      "Waktu Submit",
    ];

    const categoryLabel = batch.type === 'bcl' ? 'BCL' : 'NON BCL';
    const rows = batch.items.map((item, index) => [
      index + 1,
      categoryLabel,
      escapeCsvValue(item.dnDate),
      escapeCsvValue(item.loadNum),
      escapeCsvValue(item.warehouse),
      escapeCsvValue(item.store),
      escapeCsvValue(item.storeName),
      escapeCsvValue(item.aisle),
      escapeCsvValue(item.containerId),
      escapeCsvValue(item.item),
      escapeCsvValue(item.itemDesc),
      item.coef,
      item.checkedPck,
      item.checkedPcs,
      item.checkedTotalPiece,
      escapeCsvValue(item.submittedAt),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const dateFormatted = new Date(batch.submittedAt).toISOString().slice(0, 10);
    const fileName = `Report_Pengecekan_${batch.loadNum}_${categoryLabel}_${dateFormatted}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengunduh ${fileName}`);
  };

  return {
    batches,
    handleDeleteBatch,
    handleExportBatchCsv,
  };
}
