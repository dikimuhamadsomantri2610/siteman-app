import React, { useState, useEffect, useMemo } from 'react';
import { Barcode, Search, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

const ITEMS_PER_PAGE = 15;

interface MasterItemRecord {
  barcode: string;
  skuFull: string;
  sku11: string;
  fileName: string;
}

/**
 * Smart Parser for master barcode item (handles rows like: 0|2| 8999111613051|00000199021001|0|0|0|0)
 * Detects SKU (00000199021001 -> 11 digits: 00000199021) and Barcode Item (8999111613051)
 */
export function parseBarcodeMasterList(rawText: string, defaultFileName: string = ''): MasterItemRecord[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const records: MasterItemRecord[] = [];

  // Detect delimiter among |, ;, \t, ,
  const sampleLine = lines.find((l) => l.includes('|') || l.includes(';') || l.includes('\t') || l.includes(',')) || lines[0];
  let delimiter = ',';
  if (sampleLine.includes('|')) delimiter = '|';
  else if (sampleLine.includes(';')) delimiter = ';';
  else if (sampleLine.includes('\t')) delimiter = '\t';
  else if (sampleLine.includes(',')) delimiter = ',';

  // Check header row for column indices
  const firstLineCells = lines[0].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, '').toLowerCase());
  let colBarcodeIdx = firstLineCells.findIndex(c => c.includes('barcode'));
  let colSkuIdx = firstLineCells.findIndex(c => c.includes('sku') || c.includes('item') || c.includes('kd'));

  const isHeaderPresent = colBarcodeIdx >= 0 || colSkuIdx >= 0;
  const startIdx = isHeaderPresent ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (row.length < 2) continue;

    let barcodeRaw = '';
    let skuRaw = '';

    if (colBarcodeIdx >= 0 && colSkuIdx >= 0 && row.length > Math.max(colBarcodeIdx, colSkuIdx)) {
      barcodeRaw = row[colBarcodeIdx];
      skuRaw = row[colSkuIdx];
    } else {
      // Smart detection across row cells:
      // SKU starts with '00' & length >= 13 (e.g. 00000199021001)
      // Barcode is 8-15 numeric digits (e.g. 8999111613051)
      const skuCell = row.find(c => c.length >= 13 && c.startsWith('00')) || '';
      const barcodeCell = row.find(c => c !== skuCell && /^\d{8,15}$/.test(c)) || '';

      if (skuCell && barcodeCell) {
        skuRaw = skuCell;
        barcodeRaw = barcodeCell;
      } else if (row.length >= 4) {
        // Positional fallback for 0|2|8999111613051|00000199021001|...
        barcodeRaw = row[2];
        skuRaw = row[3];
      } else if (row.length >= 2) {
        barcodeRaw = row[0];
        skuRaw = row[1];
      }
    }

    if (!barcodeRaw || !skuRaw) continue;

    const cleanBarcode = barcodeRaw.trim();
    const cleanSku = skuRaw.trim();

    if (cleanBarcode.toLowerCase().includes('barcode') || cleanSku.toLowerCase().includes('sku')) {
      continue;
    }

    // Take 11 digits from front/left for SKU (00000199021001 -> 00000199021)
    const sku11 = cleanSku.slice(0, 11);

    if (cleanBarcode && sku11) {
      records.push({
        barcode: cleanBarcode,
        skuFull: cleanSku,
        sku11,
        fileName: defaultFileName,
      });
    }
  }

  return records;
}

export default function PreviewMasterItemPage() {
  const [folderPath, setFolderPath] = useState('D:\\siteman\\barcode-master-item');
  const [records, setRecords] = useState<MasterItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    let loadedRecords: MasterItemRecord[] = [];
    let masterFileObj: any = null;

    if (window.electronAPI && typeof (window.electronAPI as any).getSitemanDirs === 'function') {
      try {
        const dirs = await (window.electronAPI as any).getSitemanDirs();
        if (dirs?.barcodeMasterItem) {
          setFolderPath(dirs.barcodeMasterItem);
        }

        if (typeof (window.electronAPI as any).readSitemanFolderFiles === 'function') {
          const files = await (window.electronAPI as any).readSitemanFolderFiles('barcodeMasterItem');
          if (files && files.length > 0) {
            masterFileObj = files.find((f: any) => f.content && f.content.length > 0) || files[0];
            if (masterFileObj && masterFileObj.content) {
              loadedRecords = parseBarcodeMasterList(masterFileObj.content, masterFileObj.name);

              // Update cache map for scanner lookup
              const map: Record<string, string> = {};
              loadedRecords.forEach(r => { map[r.barcode] = r.sku11; });
              localStorage.setItem('siteman_barcode_master_map', JSON.stringify(map));
            }
          }
        }
      } catch (err) {
        console.error('Failed reading barcode master files:', err);
      }
    }

    // Fallback to localStorage if electronAPI returned empty
    if (loadedRecords.length === 0) {
      try {
        const cachedMapStr = localStorage.getItem('siteman_barcode_master_map');
        if (cachedMapStr) {
          const cachedMap = JSON.parse(cachedMapStr);
          loadedRecords = Object.entries(cachedMap).map(([barcode, sku11]) => ({
            barcode,
            skuFull: String(sku11),
            sku11: String(sku11).slice(0, 11),
            fileName: 'Cache Lokal',
          }));
        }
      } catch {
        // ignore
      }
    }

    let lastUp = localStorage.getItem('siteman_barcode_master_last_update');
    if (!lastUp && masterFileObj?.mtime) {
      const d = new Date(masterFileObj.mtime);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      lastUp = `${dd}/${mm}/${yyyy} ${hh}:${min}`;
      localStorage.setItem('siteman_barcode_master_last_update', lastUp);
    }
    setLastUpdate(lastUp || '');

    setRecords(loadedRecords);
    setLoading(false);
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.barcode.toLowerCase().includes(q) ||
        r.sku11.toLowerCase().includes(q) ||
        r.skuFull.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Card */}
      <div className="bg-white border-[2.5px] border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 border-[2px] border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <Barcode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
              PREVIEW MASTER ITEM & BARCODE
            </h2>
            <p className="text-sm font-medium text-slate-600">
              Daftar mapping Barcode Item ke Kode SKU (11 Digit & Full SKU) dari master file.
            </p>
          </div>
        </div>
      </div>

      {/* Info & Status Banner */}
      <div className="bg-slate-50 border-[2.5px] border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
        <div className="space-y-1">
          {records.length > 0 ? (
            <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                File Master Tersedia - {lastUpdate ? `Last Update : ${lastUpdate}` : ''}
              </span>
            </p>
          ) : (
            <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Belum ada file master barcode terdeteksi di folder <code>{folderPath}</code>.
            </p>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Barcode className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">
              TABLE MAPPING BARCODE & SKU
            </h3>
          </div>

          <div className="relative w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari Barcode atau Kode SKU..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-purple-600 focus:ring-0 text-sm pl-9 pr-3 rounded-md text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 text-[11px] tracking-wider uppercase select-none">
                <th className="py-3 px-4 font-bold w-14">NO</th>
                <th className="py-3 px-4 font-bold">BARCODE ITEM</th>
                <th className="py-3 px-4 font-bold">KODE SKU (11 DIGIT)</th>
                <th className="py-3 px-4 font-bold">SKU FULL (ORIGINAL)</th>
                <th className="py-3 px-4 font-bold">FILE SUMBER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 font-medium">
                    Memuat data master barcode...
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileSpreadsheet className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                      <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">
                        {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada data mapping barcode master.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item, index) => (
                  <tr
                    key={`${item.barcode}-${index}`}
                    className="hover:bg-purple-50/50 dark:hover:bg-zinc-850 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-zinc-400 text-xs">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {item.barcode}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-purple-700 dark:text-purple-400 text-xs">
                      <span className="bg-purple-100 dark:bg-purple-950/60 border border-purple-300 px-2 py-0.5 rounded">
                        {item.sku11}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.skuFull}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-zinc-500">
                      {item.fileName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Menampilkan {paginatedRecords.length} dari {filteredRecords.length} data barcode
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
