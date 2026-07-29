import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, Upload, Check, AlertCircle, X, CheckCircle2, FolderOpen, RefreshCw, CloudDownload } from 'lucide-react';
import { toast } from 'sonner';
import { GoodsItem } from '@shared/types/types';
import { SiteInfo, getStoredSite, cleanSku } from '@/components/SiteModal';
import { determineItemBclType } from '@shared/types/bcl';

export function parseCSVToGoodsItems(csvText: string): GoodsItem[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  // Detect delimiter (, or ; or \t)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes('\t')) delimiter = '\t';

  const firstRowCols = firstLine.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));

  // STRICT RULE: If CSV header has less than 17 columns, DO NOT READ
  if (firstRowCols.length < 17) {
    console.warn('[CSV Parser] Ignored CSV: header column count is less than 17 (found:', firstRowCols.length, ')');
    return [];
  }

  const headers = firstRowCols.map(h => h.toLowerCase());

  const getColIdx = (names: string[]): number => {
    // 1. Exact match first
    const exact = headers.findIndex(h => names.some(n => h.toLowerCase() === n.toLowerCase()));
    if (exact >= 0) return exact;
    // 2. Exact word / boundary match
    return headers.findIndex(h => names.some(n => {
      const lowerH = h.toLowerCase();
      const lowerN = n.toLowerCase();
      return lowerH === lowerN || lowerH.startsWith(lowerN + '_') || lowerH.endsWith('_' + lowerN) || lowerH.includes('_' + lowerN + '_');
    }));
  };

  const idxDnDate = getColIdx(['actual_ship_date_time', 'dndate', 'dn_date', 'tgl', 'date']);
  const idxWarehouse = getColIdx(['warehouse', 'wh', 'dc']);
  const idxLoadNum = getColIdx(['shipping_load_num', 'loadnum', 'load_num', 'load', 'no_load']);
  const idxStoreName = getColIdx(['customer', 'storename', 'store_name', 'toko', 'nama_toko']);
  const idxStore = getColIdx(['store', 'kd_toko', 'kdtoko']);
  const idxErpOrder = getColIdx(['erp_order', 'erporder', 'order']);
  const idxAisle = getColIdx(['aisle', 'lorong', 'rak']);
  const idxContainerId = getColIdx(['parent_container_id', 'containerid', 'container_id', 'container', 'barcode_koli', 'koli']);
  const idxItem = getColIdx(['item', 'kd_brg', 'kode_barang', 'sku']);
  const idxItemDesc = getColIdx(['item_desc', 'itemdesc', 'nama_barang', 'desc']);
  const idxCoef = getColIdx(['coef', 'konversi', 'ctn']);
  const idxPck = getColIdx(['pck', 'pack', 'karton']);
  const idxPcs = getColIdx(['pcs', 'pc', 'satuan']);
  const idxTotalPiece = getColIdx(['total_piece', 'totalpiece', 'qty_total']);
  const idxTotalKg = getColIdx(['total_kg', 'totalkg', 'berat']);
  const idxExpDate = getColIdx(['lot', 'expdate', 'exp_date', 'exp']);
  const idxStatus = getColIdx(['status']);
  const idxType = getColIdx(['type', 'kategori', 'jenis']);

  const parsedItems: GoodsItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''));
    // STRICT RULE: If row has less than 17 columns, DO NOT DISPLAY / SKIP
    if (row.length < 17) continue;

    const rawItemCode = idxItem >= 0 && row[idxItem] ? row[idxItem] : (row[9] || `ITEM-${i}`);
    const itemCode = cleanSku(rawItemCode);
    const rawType = idxType >= 0 && row[idxType] ? row[idxType].toLowerCase() : '';

    const coefIdx = idxCoef >= 0 ? idxCoef : 11;
    const pckIdx = idxPck >= 0 ? idxPck : 12;
    const pcsIdx = idxPcs >= 0 ? idxPcs : 13;
    const totalPieceIdx = idxTotalPiece >= 0 ? idxTotalPiece : 14;

    const coefVal = parseFloat(row[coefIdx]) || 1;
    const pckVal = parseInt(row[pckIdx], 10) || 0;
    const pcsVal = parseInt(row[pcsIdx], 10) || 0;
    const totalPieceVal = parseInt(row[totalPieceIdx], 10) || (pckVal * coefVal + pcsVal);

    const activeSite = typeof window !== 'undefined' ? getStoredSite() : { dcPengirim: 'GBG', siteToko: '48438' };
    const fallbackWarehouse = activeSite.dcPengirim || 'GBG';
    const fallbackStore = activeSite.siteToko || '48438';

    const dnDateVal = (idxDnDate >= 0 && row[idxDnDate]) ? row[idxDnDate] : (row[1] || new Date().toISOString().slice(0, 10));
    const warehouseVal = (idxWarehouse >= 0 && row[idxWarehouse]) ? row[idxWarehouse] : (row[2] || fallbackWarehouse);
    const loadNumVal = (idxLoadNum >= 0 && row[idxLoadNum]) ? row[idxLoadNum] : (row[3] || 'LOAD-CSV-01');
    const storeNameVal = (idxStoreName >= 0 && row[idxStoreName]) ? row[idxStoreName] : (row[4] || 'YOMART SITE');
    const storeVal = (idxStore >= 0 && row[idxStore]) ? row[idxStore] : (row[5] || fallbackStore);
    const erpOrderVal = (idxErpOrder >= 0 && row[idxErpOrder]) ? row[idxErpOrder] : (row[6] || `ERP-${i}`);
    const aisleVal = (idxAisle >= 0 && row[idxAisle]) ? row[idxAisle] : (row[7] || 'A-01');
    const containerIdVal = (idxContainerId >= 0 && row[idxContainerId]) ? row[idxContainerId] : (row[8] || `KOLI-${String(i).padStart(4, '0')}`);
    const itemDescVal = (idxItemDesc >= 0 && row[idxItemDesc]) ? row[idxItemDesc] : (row[10] || `BARANG CSV #${i}`);
    const totalKgVal = (idxTotalKg >= 0 && row[idxTotalKg]) ? parseFloat(row[idxTotalKg]) || 0 : (parseFloat(row[15]) || 0);
    const expDateVal = (idxExpDate >= 0 && row[idxExpDate]) ? row[idxExpDate] : (row[16] || '-');

    const type = determineItemBclType(warehouseVal, aisleVal, rawType);

    parsedItems.push({
      id: `${i}-${itemCode}`,
      dnDate: dnDateVal,
      loadNum: loadNumVal,
      warehouse: warehouseVal,
      store: storeVal,
      storeName: storeNameVal,
      erpOrder: erpOrderVal,
      aisle: aisleVal,
      containerId: containerIdVal,
      item: itemCode,
      itemDesc: itemDescVal,
      coef: coefVal,
      pck: pckVal,
      pcs: pcsVal,
      totalPiece: totalPieceVal,
      totalKg: totalKgVal,
      expDate: expDateVal,
      status: idxStatus >= 0 && row[idxStatus] ? row[idxStatus] : 'pending',
      type: type,
      originalPck: pckVal,
      originalPcs: pcsVal,
      originalTotalPiece: totalPieceVal,
    });
  }

  return parsedItems;
}

interface SitemanFolderFile {
  name: string;
  path: string;
  size: number;
  content?: string;
}

export function OfflineCsv(): React.ReactNode {
  const [modalOpen, setModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<GoodsItem[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [sitemanPath, setSitemanPath] = useState<string>('');
  const [folderFiles, setFolderFiles] = useState<SitemanFolderFile[]>([]);
  const [isDownloadingFtp, setIsDownloadingFtp] = useState(false);
  const [rawFileText, setRawFileText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalOpen) {
      loadSitemanFolderInfo();
    }
  }, [modalOpen]);

  const loadSitemanFolderInfo = async () => {
    if (window.electronAPI && typeof (window.electronAPI as any).getSitemanDirs === 'function') {
      try {
        const dirs = await (window.electronAPI as any).getSitemanDirs();
        if (dirs?.loadNumberCsv) {
          setSitemanPath(dirs.loadNumberCsv);
        }
        if (typeof (window.electronAPI as any).readSitemanFolderFiles === 'function') {
          const files = await (window.electronAPI as any).readSitemanFolderFiles('loadNumberCsv');
          setFolderFiles(files || []);
        }
      } catch (err) {
        console.error('Failed reading siteman folder info:', err);
      }
    }
  };

  const handleOpenSitemanFolder = async () => {
    if (window.electronAPI && typeof (window.electronAPI as any).openSitemanFolder === 'function') {
      await (window.electronAPI as any).openSitemanFolder('loadNumberCsv');
    }
  };

  const handleDownloadFtpCsv = async () => {
    const site = getStoredSite();
    const dcFolder = (site.dcPengirim || 'GBG').toUpperCase();
    setIsDownloadingFtp(true);
    toast.info(`Mengunduh CSV dari FTP databasedcy.yogya.com/${dcFolder}...`);

    try {
      if (window.electronAPI && typeof (window.electronAPI as any).downloadSitemanCsvFtp === 'function') {
        const res = await (window.electronAPI as any).downloadSitemanCsvFtp(dcFolder);
        if (res && res.success) {
          toast.success('Selesai mengunduh file CSV dari FTP!');
          await loadSitemanFolderInfo();
          window.dispatchEvent(new Event('dataset_updated'));
        } else {
          toast.error(res?.error || `Gagal terhubung ke FTP databasedcy.yogya.com/${dcFolder}`);
        }
      } else {
        toast.error('Fitur FTP hanya tersedia di aplikasi desktop Electron.');
      }
    } catch (err: any) {
      console.error('FTP Error:', err);
      toast.error('Gagal mengunduh FTP: ' + (err?.message || 'Error koneksi'));
    } finally {
      setIsDownloadingFtp(false);
    }
  };

  const handleSelectFolderFile = (fileItem: SitemanFolderFile) => {
    if (!fileItem.content) {
      toast.error('File CSV kosong atau tidak terbaca.');
      return;
    }
    setFileName(fileItem.name);
    setRawFileText(fileItem.content);
    setErrorMsg('');
    try {
      const items = parseCSVToGoodsItems(fileItem.content);
      if (items.length === 0) {
        setErrorMsg('File CSV tidak memenuhi syarat 17 kolom atau format baris tidak valid.');
        setParsedData(null);
      } else {
        setParsedData(items);
        toast.info(`Berhasil membaca file: ${fileItem.name} (${items.length} items)`);
      }
    } catch {
      setErrorMsg('Gagal membaca file CSV. Pastikan format file 17 kolom benar.');
      setParsedData(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setRawFileText(text);
        const items = parseCSVToGoodsItems(text);
        if (items.length === 0) {
          setErrorMsg('File CSV kurang dari 17 kolom atau format baris tidak valid.');
          setParsedData(null);
        } else {
          setParsedData(items);
        }
      } catch {
        setErrorMsg('Gagal membaca file CSV. Pastikan format file 17 kolom benar.');
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyCsv = async () => {
    if (!parsedData || parsedData.length === 0) return;

    // Save physical copy of CSV file to D:\siteman\load-number-csv\
    if (fileName && window.electronAPI && typeof (window.electronAPI as any).saveSitemanFile === 'function') {
      try {
        let contentToSave = rawFileText;
        if (!contentToSave) {
          const headerRow = "dnDate,loadNum,warehouse,store,storeName,erpOrder,aisle,containerId,item,itemDesc,coef,pck,pcs,totalPiece,totalKg,expDate,status,type\n";
          const bodyRows = parsedData.map(i => `${i.dnDate},${i.loadNum},${i.warehouse || ''},${i.store},${i.storeName},${i.erpOrder},${i.aisle},${i.containerId},${i.item},"${i.itemDesc}",${i.coef},${i.pck},${i.pcs},${i.totalPiece},${i.totalKg},${i.expDate},${i.status},${i.type}`).join("\n");
          contentToSave = headerRow + bodyRows;
        }
        await (window.electronAPI as any).saveSitemanFile('loadNumberCsv', fileName, contentToSave);
        console.log(`[OfflineCsv] Saved physical CSV file to loadNumberCsv: ${fileName}`);
      } catch (err) {
        console.error('Failed saving to siteman folder:', err);
      }
    }

    // Retrieve existing custom dataset or fallback to default raw dataset
    const existingStr = localStorage.getItem('siteman_custom_dataset');
    let existingItems: GoodsItem[] = [];
    if (existingStr) {
      try {
        existingItems = JSON.parse(existingStr);
      } catch {
        existingItems = [];
      }
    }
    if (existingItems.length === 0) {
      existingItems = [];
    }

    // Merge: Filter out existing items that share the same containerId or loadNum from parsedData
    const newContainerIds = new Set(parsedData.map(i => i.containerId));
    const keptItems = existingItems.filter(i => !newContainerIds.has(i.containerId));
    const combinedDataset = [...parsedData, ...keptItems];

    localStorage.setItem('siteman_custom_dataset', JSON.stringify(combinedDataset));
    sessionStorage.setItem('all_checking_items', JSON.stringify(combinedDataset));

    // Dispatch global event so all pages reload dataset dynamically
    window.dispatchEvent(new Event('dataset_updated'));

    toast.success(`Berhasil menyimpan file ke D:\\siteman\\load-number-csv\\ dan memuat dataset "${fileName}"!`, {
      description: `${parsedData.length} items ditambahkan ke daftar PENDING CARD.`
    });

    setModalOpen(false);
    setParsedData(null);
    setFileName('');
    setRawFileText('');
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('siteman_custom_dataset');
    sessionStorage.removeItem('all_checking_items');
    window.dispatchEvent(new Event('dataset_updated'));
    toast.success('Dataset dikembalikan ke data default.');
    setModalOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-black bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
        title="Upload file CSV offline (No. Load / Item) atau ambil dari FTP"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        <span>CSV OFFLINE</span>
      </button>

      {/* Modal Portal */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="relative w-full max-w-xl bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 bg-amber-400 border-b-[2.5px] border-black select-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-black text-white rounded-lg">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase text-black tracking-wide">
                      IMPORT / DOWNLOAD CSV MASTER
                    </h2>
                    <p className="text-[11px] font-bold text-slate-800">
                      Ambil FTP Server atau Upload CSV (Wajib 17 Kolom)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 bg-white hover:bg-red-500 hover:text-white border-[2px] border-black rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4 overflow-y-auto">
                {/* Local Folder Info */}
                <div className="bg-slate-50 border-[2px] border-black rounded-xl p-3 text-xs space-y-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold">Folder CSV Tersimpan:</span>
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] text-blue-900 font-mono">
                      {sitemanPath || 'D:\\siteman\\load-number-csv'}
                    </code>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">
                      File di folder ({folderFiles.length} file):
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenSitemanFolder}
                      className="text-[#0052cc] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <FolderOpen className="h-3.5 w-3.5" /> BUKA FOLDER
                    </button>
                  </div>

                  {folderFiles.length > 0 && (
                    <div className="max-h-28 overflow-y-auto space-y-1 pt-1 border-t border-slate-200">
                      {folderFiles.map((file, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectFolderFile(file)}
                          className="flex items-center justify-between p-1.5 bg-white border border-slate-300 rounded hover:border-black hover:bg-amber-50 cursor-pointer transition-colors text-[11px]"
                        >
                          <span className="font-mono font-bold truncate text-slate-800">{file.name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold shrink-0 ml-2">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload File Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    PILIH FILE CSV MANUAL (WAJIB 17 KOLOM):
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl border-[2px] border-black bg-amber-50 hover:bg-amber-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border-dashed"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{fileName ? `File terpilih: ${fileName}` : 'Klik untuk memilih file CSV dari Komputer (Wajib 17 Kolom)'}</span>
                  </button>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 bg-red-100 border-[2px] border-red-500 rounded-xl text-red-900 text-xs font-bold">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Parsed Preview Banner */}
                {parsedData && parsedData.length > 0 && (
                  <div className="p-3 bg-emerald-100 border-[2px] border-emerald-600 rounded-xl text-emerald-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-emerald-950">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      <span>{parsedData.length} item berhasil divalidasi (17 Kolom)!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Sampel Container ID: <code className="font-mono font-bold bg-emerald-200 px-1 rounded">{parsedData[0].containerId}</code> | Load: <code className="font-mono font-bold bg-emerald-200 px-1 rounded">{parsedData[0].loadNum}</code>
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-100 border-t-[2.5px] border-black flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black bg-white hover:bg-slate-200 text-black text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!parsedData || parsedData.length === 0}
                  onClick={handleApplyCsv}
                  className="px-4 py-2 rounded-xl border-[2px] border-black bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>GUNAKAN DATASET INI</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
