import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, CheckCircle2, Server, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { parseCSVToGoodsItems } from './OfflineCsv';
import { getStoredSite, matchesActiveSite } from './SiteModal';

interface CsvFileItem {
  name: string;
  size: number;
  source: 'ftp' | 'local';
  mtime?: string;
  content?: string;
  matchCount?: number; // how many rows match active site
}

export function CsvFileList(): React.ReactNode {
  const [localFiles, setLocalFiles] = useState<CsvFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeFileName, setActiveFileName] = useState('');
  const [dcFolder, setDcFolder] = useState('GBG');

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await loadLocalFiles();
      const shouldTriggerFtp =
        sessionStorage.getItem('siteman_ftp_trigger_download') === 'true' ||
        !sessionStorage.getItem('siteman_ftp_downloaded_session');

      if (shouldTriggerFtp) {
        sessionStorage.removeItem('siteman_ftp_trigger_download');
        sessionStorage.setItem('siteman_ftp_downloaded_session', 'true');
        if (isMounted) {
          await handleDownloadAllFromFtp();
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  /** Load only local files (already downloaded) and filter by active site */
  const loadLocalFiles = async () => {
    setLoading(true);
    const site = getStoredSite();
    const currentDc = (site.dcPengirim || 'GBG').toUpperCase();
    setDcFolder(currentDc);

    if (!window.electronAPI || typeof (window.electronAPI as any).readSitemanFolderFiles !== 'function') {
      setLoading(false);
      return;
    }

    // Step 1: Backend deletes all CSV files that don't contain siteToko (fast grep in Node.js)
    if (site.siteToko && typeof (window.electronAPI as any).cleanupSitemanCsvForSite === 'function') {
      await (window.electronAPI as any).cleanupSitemanCsvForSite(site.siteToko).catch(() => {});
    }

    try {
      const localRaw = await (window.electronAPI as any).readSitemanFolderFiles('loadNumberCsv');
      if (!localRaw || localRaw.length === 0) {
        setLocalFiles([]);
        setLoading(false);
        return;
      }

      const result: CsvFileItem[] = [];
      let deletedCount = 0;
      for (const lf of localRaw) {
        if (!lf.content) continue;
        // Validate 17 columns
        const parsed = parseCSVToGoodsItems(lf.content);
        if (parsed.length === 0) continue; // skip files with < 17 cols
        // Filter by active site (CUSTOMER / store)
        const matchingRows = site.siteToko
          ? parsed.filter(item => matchesActiveSite(item, site))
          : parsed;
        if (matchingRows.length === 0) {
          // Auto-delete files that have no rows for this site
          if (window.electronAPI && typeof (window.electronAPI as any).deleteLocalSitemanCsv === 'function') {
            (window.electronAPI as any).deleteLocalSitemanCsv(lf.name).catch(() => {});
            deletedCount++;
            console.log(`[CsvFileList] Auto-deleted non-matching file: ${lf.name}`);
          }
          continue;
        }
        result.push({
          name: lf.name,
          size: lf.size || 0,
          source: 'local',
          mtime: lf.mtime ? new Date(lf.mtime).toISOString() : undefined,
          content: lf.content,
          matchCount: matchingRows.length,
        });
      }
      if (deletedCount > 0) {
        console.log(`[CsvFileList] Auto-deleted ${deletedCount} file(s) not matching site ${site.siteToko}`);
      }
      setLocalFiles(result);
    } catch (err) {
      console.error('[CsvFileList] Error loading local files:', err);
    }
    setLoading(false);
  };

  /** Bulk download ALL CSV files from FTP for this DC, then re-filter */
  const handleDownloadAllFromFtp = async () => {
    if (downloading) return;
    const site = getStoredSite();
    const currentDc = (site.dcPengirim || 'GBG').toUpperCase();
    setDownloading(true);
    try {
      if (window.electronAPI && typeof (window.electronAPI as any).downloadSitemanCsvFtp === 'function') {
        const res = await (window.electronAPI as any).downloadSitemanCsvFtp(currentDc);
        if (res && res.success) {
          // Auto-delete all files that don't contain siteToko (runs silently in background)
          if (site.siteToko && typeof (window.electronAPI as any).cleanupSitemanCsvForSite === 'function') {
            await (window.electronAPI as any).cleanupSitemanCsvForSite(site.siteToko).catch(() => {});
          }
          // Cleanup any leftover subdirectories created by FTP client
          if (typeof (window.electronAPI as any).cleanupSitemanCsvFolder === 'function') {
            const cleanRes = await (window.electronAPI as any).cleanupSitemanCsvFolder();
            if (cleanRes?.cleaned > 0) {
              console.log(`[CsvFileList] Cleaned up ${cleanRes.cleaned} leftover subfolder(s) from FTP download`);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[CsvFileList] Auto FTP download error:', err);
    } finally {
      setDownloading(false);
      await loadLocalFiles();
      window.dispatchEvent(new Event('dataset_updated'));
    }
  };

  /** Load file content into PENDING PHASE */
  const handleSelectFile = (fileItem: CsvFileItem) => {
    if (!fileItem.content) {
      toast.error('File CSV tidak memiliki konten. Coba DOWNLOAD ulang dari FTP.');
      return;
    }
    const site = getStoredSite();
    try {
      const allItems = parseCSVToGoodsItems(fileItem.content);
      if (allItems.length === 0) {
        toast.error('File CSV tidak memenuhi syarat 17 kolom.');
        return;
      }
      const matchedItems = site.siteToko
        ? allItems.filter(item => matchesActiveSite(item, site))
        : allItems;

      if (matchedItems.length === 0) {
        toast.error(`Tidak ada data site ${site.siteToko} di file ini.`);
        return;
      }

      localStorage.setItem('siteman_custom_dataset', JSON.stringify(matchedItems));
      sessionStorage.setItem('all_checking_items', JSON.stringify(matchedItems));
      setActiveFileName(fileItem.name);
      window.dispatchEvent(new Event('dataset_updated'));

      toast.success(`Memuat ${fileItem.name}`, {
        description: `${matchedItems.length} items untuk site ${site.siteToko} dimuat ke PENDING PHASE.`,
      });
    } catch {
      toast.error('Gagal membaca file CSV.');
    }
  };

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  const filteredFiles = useMemo(() => {
    const now = Date.now();
    let result = localFiles;
    // 3-day filter
    result = result.filter(f => {
      if (!f.mtime) return true;
      const t = new Date(f.mtime).getTime();
      return !isNaN(t) && (now - t) <= THREE_DAYS_MS;
    });
    return result;
  }, [localFiles]);

  const site = getStoredSite();

  return (
    <div className="bg-white border-[2.5px] border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-400 border border-black rounded-lg text-black font-bold">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase text-slate-900 tracking-wider">
              DAFTAR FILE CSV MASTER LOAD
            </h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              Hanya menampilkan SITE : <span className="font-extrabold text-blue-900">{site.siteToko || '-'}</span> DC : <span className="font-extrabold text-blue-900">{dcFolder}</span> - 3 Hari kebelakang
            </p>
          </div>
        </div>
      </div>

      {/* Skeleton Loading State */}
      {downloading || loading ? (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 animate-pulse">
            <span>Mengunduh & Memindai Data FTP Terkini (SITE: {site.siteToko || '-'}, DC: {dcFolder})...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border-[2px] border-slate-200 bg-slate-100/90 animate-pulse space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 w-3/4">
                    <div className="h-4 w-4 bg-slate-300 rounded shrink-0" />
                    <div className="h-3.5 bg-slate-300 rounded w-full" />
                  </div>
                  <div className="h-4 w-4 bg-slate-300 rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-300 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-3">
          <XCircle className="h-8 w-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-slate-600">
              Tidak ada file CSV untuk site {site.siteToko || '-'} (DC: {dcFolder}) - 3 Hari kebelakang
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Sistem secara otomatis menyinkronkan file CSV terbaru dari server FTP (databasedcy.yogya.com/{dcFolder})
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleDownloadAllFromFtp}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-[2px] border-black bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${downloading ? 'animate-spin' : ''}`} />
              <span>{downloading ? 'MENYINKRONKAN...' : 'Sinkron Ulang ?'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {filteredFiles.map((file, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border-[2px] border-black bg-slate-50 text-slate-900 flex flex-col justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-mono font-bold text-xs truncate">{file.name}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-200/60">
                <span>{(file.size / 1024).toFixed(1)} KB · <span className="text-emerald-700 font-bold">{file.matchCount} rows</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
