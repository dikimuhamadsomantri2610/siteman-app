import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Building2, Check, FolderOpen, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface SiteInfo {
  dcPengirim: string;
  siteToko: string;
  code?: string;
  name?: string;
}

export const PRESET_DCS = [
  { code: 'GBG', name: 'GEDEBAGE' },
  { code: 'D53', name: 'JL JAKARTA' },
  { code: 'DYS', name: 'MEKAR RAYA' },
  { code: 'DCG', name: 'FRESH' },
];

export const getStoredSite = (): SiteInfo => {
  if (typeof window === 'undefined') return { dcPengirim: '', siteToko: '', code: '', name: '' };
  const saved = localStorage.getItem('siteman_active_site');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        dcPengirim: parsed.dcPengirim || parsed.code || '',
        siteToko: parsed.siteToko || parsed.name || '',
        code: parsed.dcPengirim || parsed.code || '',
        name: parsed.siteToko || parsed.name || '',
      };
    } catch {
      // fallback
    }
  }
  return { dcPengirim: '', siteToko: '', code: '', name: '' };
};

export const setStoredSite = (site: SiteInfo) => {
  const data = {
    dcPengirim: site.dcPengirim,
    siteToko: site.siteToko,
    code: site.dcPengirim,
    name: site.siteToko,
  };
  localStorage.setItem('siteman_active_site', JSON.stringify(data));
  window.dispatchEvent(new Event('site_changed'));
};

export function matchesActiveSite(
  item: { warehouse?: string; store?: string; storeName?: string },
  site?: SiteInfo
): boolean {
  const activeSite = site || getStoredSite();
  if (!activeSite || !activeSite.dcPengirim || !activeSite.siteToko) return true;

  const targetDc = activeSite.dcPengirim.trim().toUpperCase();
  const targetSite = activeSite.siteToko.trim();
  const cleanTargetSite = targetSite.replace(/^0+/, '');

  // 1. Check warehouse / DC Pengirim
  if (item.warehouse) {
    const itemDc = item.warehouse.trim().toUpperCase();
    if (itemDc && itemDc !== targetDc && !itemDc.includes(targetDc) && !targetDc.includes(itemDc)) {
      return false;
    }
  }

  // 2. Strict match store / CUSTOMER against active Site Toko
  const rawStore = (item.store || '').trim();
  const rawCustomer = (item.storeName || '').trim();
  const cleanStore = rawStore.replace(/^0+/, '');
  const cleanCustomer = rawCustomer.replace(/^0+/, '');

  if (rawStore || rawCustomer) {
    const matchesStore = cleanStore === cleanTargetSite;
    const matchesCustomer = cleanCustomer === cleanTargetSite;
    if (!matchesStore && !matchesCustomer) {
      return false;
    }
  }

  return true;
}

/**
 * Normalises an SKU item code:
 * 1. Strips suffix starting with '_' (e.g. 0000000030616_1 -> 0000000030616)
 * 2. 14-digit master SKU (e.g. 00000030616001) -> slice(0, 11) -> 00000030616
 * 3. 13-digit CSV load SKU (e.g. 0000000030616) -> strip leading zeros -> padStart 11 -> 00000030616
 */
export function cleanSku(rawSku: string): string {
  if (!rawSku) return '';
  const noSuffix = rawSku.split('_')[0].trim();
  if (!noSuffix) return '';

  // 14-digit master SKU like 00000030616001 or 00000199021001: take first 11 digits
  if (noSuffix.length === 14 && noSuffix.startsWith('00')) {
    return noSuffix.slice(0, 11);
  }

  // Strip leading zeros and pad to standard 11 digits
  const digitsOnly = noSuffix.replace(/^0+/, '');
  if (!digitsOnly) return '0'.padStart(11, '0');

  if (digitsOnly.length <= 11) {
    return digitsOnly.padStart(11, '0');
  }

  return noSuffix.slice(0, 11);
}

/**
 * Smart Parser for master barcode item (handles rows like: 0|2| 8999111613051|00000199021001|0|0|0|0)
 * Detects SKU (00000199021001 -> 11 digits: 00000199021) and Barcode Item (8999111613051)
 */
export function parseBarcodeMasterContent(rawText: string): Record<string, string> {
  if (!rawText || !rawText.trim()) return {};

  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return {};

  const barcodeMap: Record<string, string> = {};

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
      const skuCell = row.find(c => c.length >= 10 && (c.startsWith('00') || c.includes('_'))) || '';
      const barcodeCell = row.find(c => c !== skuCell && /^\d{5,15}$/.test(c)) || '';

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

    if (cleanBarcode.toLowerCase().includes('barcode') || skuRaw.toLowerCase().includes('sku')) {
      continue;
    }

    const sku11 = cleanSku(skuRaw);

    if (cleanBarcode && sku11) {
      barcodeMap[cleanBarcode] = sku11;
    }
  }

  return barcodeMap;
}

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (site: SiteInfo) => void;
  isForced?: boolean;
}

export function SiteModal({ isOpen, onClose, onSave, isForced = false }: SiteModalProps): React.ReactNode {
  const [dcPengirim, setDcPengirim] = useState('');
  const [siteToko, setSiteToko] = useState('');
  const [error, setError] = useState('');

  const [barcodeMasterPath, setBarcodeMasterPath] = useState('');
  const [barcodeMasterFile, setBarcodeMasterFile] = useState('');
  const [barcodeMasterCount, setBarcodeMasterCount] = useState(0);
  const [barcodeMasterLastUpdate, setBarcodeMasterLastUpdate] = useState('');

  const formatTimestamp = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  useEffect(() => {
    if (isOpen) {
      const current = getStoredSite();
      setDcPengirim(current.dcPengirim || '');
      setSiteToko(''); // Always start empty
      setError('');

      loadBarcodeMasterInfo();
    }
  }, [isOpen]);

  const loadBarcodeMasterInfo = async () => {
    if (window.electronAPI && typeof (window.electronAPI as any).getSitemanDirs === 'function') {
      try {
        const dirs = await (window.electronAPI as any).getSitemanDirs();
        if (dirs?.barcodeMasterItem) {
          setBarcodeMasterPath(dirs.barcodeMasterItem);
        }
        if (typeof (window.electronAPI as any).readSitemanFolderFiles === 'function') {
          const files = await (window.electronAPI as any).readSitemanFolderFiles('barcodeMasterItem');
          if (files && files.length > 0) {
            // Find file with content
            const masterFile = files.find((f: any) => f.content && f.content.length > 0) || files[0];
            if (masterFile && masterFile.content) {
              const map = parseBarcodeMasterContent(masterFile.content);
              const count = Object.keys(map).length;
              setBarcodeMasterFile(masterFile.name);
              setBarcodeMasterCount(count);
              localStorage.setItem('siteman_barcode_master_map', JSON.stringify(map));

              let lastUp = localStorage.getItem('siteman_barcode_master_last_update');
              if (!lastUp && masterFile.mtime) {
                lastUp = formatTimestamp(new Date(masterFile.mtime));
                localStorage.setItem('siteman_barcode_master_last_update', lastUp);
              }
              setBarcodeMasterLastUpdate(lastUp || '');
            }
          } else {
            setBarcodeMasterFile('');
            setBarcodeMasterCount(0);
            setBarcodeMasterLastUpdate('');
          }
        }
      } catch (err) {
        console.error('Failed reading barcode master info:', err);
      }
    }
  };

  const [isUpdatingSftp, setIsUpdatingSftp] = useState(false);

  const handleUpdateMasterSftp = async () => {
    setIsUpdatingSftp(true);
    try {
      if (window.electronAPI && typeof (window.electronAPI as any).downloadSitemanMasterSftp === 'function') {
        const res = await (window.electronAPI as any).downloadSitemanMasterSftp();
        if (res && res.success) {
          const map = parseBarcodeMasterContent(res.content);
          const count = Object.keys(map).length;
          setBarcodeMasterFile(res.fileName || 'sku_MASTER_ALL_NEW_YM');
          setBarcodeMasterCount(count);
          localStorage.setItem('siteman_barcode_master_map', JSON.stringify(map));

          const lastUp = formatTimestamp(new Date());
          setBarcodeMasterLastUpdate(lastUp);
          localStorage.setItem('siteman_barcode_master_last_update', lastUp);

          alert('Berhasil Update Master');
        } else {
          alert(res?.error || 'Gagal terhubung ke server SFTP central.yogya.com:2254');
        }
      } else {
        alert('Fitur SFTP hanya tersedia di aplikasi desktop Electron.');
      }
    } catch (err: any) {
      console.error('SFTP Error:', err);
      alert('Gagal mengunduh file dari SFTP: ' + (err?.message || 'Error koneksi'));
    } finally {
      setIsUpdatingSftp(false);
    }
  };

  const handleOpenBarcodeFolder = async () => {
    if (window.electronAPI && typeof (window.electronAPI as any).openSitemanFolder === 'function') {
      await (window.electronAPI as any).openSitemanFolder('barcodeMasterItem');
    }
  };

  if (!isOpen) return null;

  const handleSiteTokoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 5);
    setSiteToko(numericOnly);
    if (error) setError('');
  };

  const isFormValid = Boolean(dcPengirim && siteToko.trim().length === 5);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dcPengirim) {
      setError('Silakan pilih DC Pengirim terlebih dahulu.');
      return;
    }
    if (siteToko.trim().length !== 5) {
      setError('Site Toko harus berupa 5 digit angka (contoh: 48401).');
      return;
    }
    const finalSite: SiteInfo = {
      dcPengirim: dcPengirim.toUpperCase(),
      siteToko: siteToko.trim(),
      code: dcPengirim.toUpperCase(),
      name: siteToko.trim(),
    };
    setStoredSite(finalSite);
    onSave(finalSite);
    onClose();
  };

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isForced) {
          onClose();
        }
      }}
    >
      <div className="bg-white border-[2.5px] border-black rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full space-y-6 relative m-auto my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b-[2px] border-black pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300 border-[2px] border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 font-black">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
              PILIH DC PENGIRIM & SITE TOKO
            </h2>
            <p className="text-xs font-bold text-slate-500">
              Pilih DC Pengirim dan masukkan inputan Site Toko Anda.
            </p>
          </div>
        </div>

        {/* Preset Selection Buttons (No pre-selected default; user clicks to select) */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1">
            <span>PILIH DC PENGIRIM :</span>
            {!dcPengirim && <span className="text-red-600 font-black text-base animate-pulse">*</span>}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESET_DCS.map((preset) => {
              const isSelected = dcPengirim.toUpperCase() === preset.code || (preset.code === 'DCG' && dcPengirim.toUpperCase() === 'DGC');
              const isDisabled = preset.code === 'DCG' || preset.code === 'DGC';

              return (
                <button
                  key={preset.code}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setDcPengirim(preset.code)}
                  className={`flex items-center justify-between p-3 rounded-xl border-[2px] border-black font-extrabold text-xs text-left transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    isDisabled
                      ? 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed select-none'
                      : isSelected
                      ? 'bg-[#0052cc] text-white cursor-pointer active:translate-x-[1px] active:translate-y-[1px]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-900 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{preset.code} - {preset.name} {isDisabled && '(OFF)'}</span>
                  </div>
                  {isSelected && !isDisabled && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input Form for SITE TOKO */}
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2 border-t-[1.5px] border-slate-200">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1">
              <span>SITE TOKO :</span>
              {siteToko.trim().length !== 5 && <span className="text-red-600 font-black text-base animate-pulse">*</span>}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={siteToko}
              onChange={handleSiteTokoChange}
              placeholder="48401 (5 Digit Angka)"
              className="w-full px-4 py-2.5 rounded-xl border-[2px] border-black bg-slate-50 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              required
            />
            {siteToko.trim().length > 0 && siteToko.trim().length !== 5 && (
              <p className="text-[11px] font-bold text-red-600 animate-pulse">
                * Inputan harus berupa 5 digit angka (Contoh: 48401)
              </p>
            )}
          </div>

          {/* Barcode Master Item Folder Info & Detection */}
          <div className="space-y-1.5 pt-3 border-t border-slate-200">
            <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
              <span>MASTER BARCODE ITEM (SKU):</span>
    
            </label>

            <div className="bg-slate-50 border-[2px] border-black rounded-xl p-3 text-xs space-y-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              {barcodeMasterFile ? (
                <div className="flex flex-col items-center justify-center p-3 bg-emerald-100 border border-black rounded-lg text-emerald-900 font-extrabold text-[11px] gap-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>
                      File Master Tersedia - {barcodeMasterLastUpdate ? `Last Update : ${barcodeMasterLastUpdate}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdatingSftp}
                    onClick={handleUpdateMasterSftp}
                    className="px-3.5 py-1.5 rounded-lg border border-black bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] mx-auto"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingSftp ? 'animate-spin' : ''}`} />
                    {isUpdatingSftp ? 'DOWNLOADING...' : 'UPDATE MASTER'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 font-bold text-[11px] gap-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Belum ada file master barcode di folder ini.</span>
                  </div>
                  <button
                    type="button"
                    disabled={isUpdatingSftp}
                    onClick={handleUpdateMasterSftp}
                    className="px-3.5 py-1.5 rounded-lg border-[1.5px] border-black bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] mx-auto"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingSftp ? 'animate-spin' : ''}`} />
                    {isUpdatingSftp ? 'MENGUNDUH SFTP...' : 'UPDATE MASTER'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs font-extrabold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-3 border-[2.5px] border-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                isFormValid
                  ? 'bg-[#0052cc] hover:bg-[#0041a8] text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
              }`}
            >
              Simpan
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  ) : null;
}
