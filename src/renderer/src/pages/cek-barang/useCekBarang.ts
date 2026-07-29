// ─── Custom Hook: useItemBcl ──────────────────────────────────────────────────
// Centralises ALL state, derived values, and event handlers for ItemBclPage.

import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GoodsItem, Phase, SortField, SortDirection, BclReportItem, BclActiveBatch } from '@shared/types/types';
import { getStoredSite, matchesActiveSite, SiteInfo, cleanSku, parseBarcodeMasterContent } from '@/components/SiteModal';
import { determineItemBclType } from '@shared/types/bcl';
import { parseCSVToGoodsItems } from '@/components/OfflineCsv';
import { safeSetLocalStorage, safeSetSessionStorage } from '@/lib/storage';

const ITEMS_PER_PAGE = 20;

/** Normalise a container-id string to the last 8 characters. */
export const normaliseCid = (cid: string) =>
  cid.length >= 8 ? cid.slice(-8) : cid;

export function useCekBarang() {
  // ── Phase ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('pending');
  const [activeLoadNum, setActiveLoadNum] = useState<string | null>(null);

  const loadInitialItems = (): GoodsItem[] => {
    if (typeof window === 'undefined') return [];
    const saved = sessionStorage.getItem('all_checking_items');
    if (saved !== null) {
      try {
        return JSON.parse(saved) as GoodsItem[];
      } catch {
        // ignore
      }
    }
    const customCsv = localStorage.getItem('siteman_custom_dataset');
    if (customCsv !== null) {
      try {
        return JSON.parse(customCsv) as GoodsItem[];
      } catch {
        // ignore
      }
    }
    return [];
  };

  const [items, setItems] = useState<GoodsItem[]>(loadInitialItems);

  useEffect(() => {
    autoLoadFolderCsvFiles();
    autoLoadMasterBarcodeMap();

    const handleDatasetUpdate = () => {
      setItems(loadInitialItems());
      setPhase('pending');
      setActiveLoadNum(null);
      autoLoadFolderCsvFiles();
      autoLoadMasterBarcodeMap();
    };
    window.addEventListener('dataset_updated', handleDatasetUpdate);
    return () => {
      window.removeEventListener('dataset_updated', handleDatasetUpdate);
    };
  }, []);

  const autoLoadMasterBarcodeMap = async () => {
    if (typeof window === 'undefined' || !window.electronAPI?.readSitemanFolderFiles) return;
    try {
      const files = await window.electronAPI.readSitemanFolderFiles('barcodeMasterItem');
      if (files && files.length > 0) {
        const masterFile = files.find((f) => f.content && f.content.length > 0) || files[0];
        if (masterFile && masterFile.content) {
          const map = parseBarcodeMasterContent(masterFile.content);
          if (Object.keys(map).length > 0) {
            localStorage.setItem('siteman_barcode_master_map', JSON.stringify(map));
            console.log(`[useCekBarang] Auto-loaded ${Object.keys(map).length} barcodes from ${masterFile.name}`);
          }
        }
      }
    } catch (err) {
      console.error('[useCekBarang] Failed auto loading barcode master map:', err);
    }
  };

  const autoLoadFolderCsvFiles = async () => {
    if (typeof window === 'undefined' || !window.electronAPI?.readSitemanFolderFiles) return;

    try {
      const files = await window.electronAPI.readSitemanFolderFiles('loadNumberCsv');
      if (files && files.length > 0) {
        let allFolderItems: GoodsItem[] = [];
        for (const file of files) {
          if (file.content) {
            const parsed = parseCSVToGoodsItems(file.content);
            if (parsed.length > 0) {
              allFolderItems = [...allFolderItems, ...parsed];
            }
          }
        }
        if (allFolderItems.length > 0) {
          const map = new Map<string, GoodsItem>();
          allFolderItems.forEach(item => {
            const key = `${item.loadNum}_${item.containerId}_${item.item}`;
            if (!map.has(key)) map.set(key, item);
          });
          const uniqueItems = Array.from(map.values());

          setItems((prev) => {
            const checkedStatusMap = new Map<string, string>();
            prev.forEach(p => {
              if (p.status === 'checked') {
                checkedStatusMap.set(`${p.loadNum}_${p.containerId}_${p.item}`, 'checked');
              }
            });

            const merged = uniqueItems.map(item => {
              const key = `${item.loadNum}_${item.containerId}_${item.item}`;
              if (checkedStatusMap.has(key)) {
                return { ...item, status: 'checked' };
              }
              return item;
            });

            safeSetLocalStorage('siteman_custom_dataset', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (err) {
      console.error('[useItemBcl] Failed auto loading folder CSVs:', err);
    }
  };

  // ── Table / pagination ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Scan form ──────────────────────────────────────────────────────────────
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // ── Container modal ────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContainerId, setModalContainerId] = useState('');
  const [modalItemsChecked, setModalItemsChecked] = useState<Set<string>>(new Set());
  const [modalEditedQty, setModalEditedQty] = useState<Record<string, { pck: number; pcs: number }>>({});
  const [modalScannedIds, setModalScannedIds] = useState<Set<string>>(new Set());
  const [modalScannedOrder, setModalScannedOrder] = useState<string[]>([]);
  const [lastScannedItemId, setLastScannedItemId] = useState<string | null>(null);
  const [modalItemScanInput, setModalItemScanInput] = useState('');
  const modalItemScanRef = useRef<HTMLInputElement>(null);

  // ── Edit item modal ────────────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<GoodsItem | null>(null);
  const [editPck, setEditPck] = useState(0);
  const [editPcs, setEditPcs] = useState(0);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // ── Sync to sessionStorage ─────────────────────────────────────────────────
  useEffect(() => {
    safeSetSessionStorage('all_checking_items', JSON.stringify(items));
  }, [items]);

  // ── Site filter ────────────────────────────────────────────────────────────
  const [siteState, setSiteState] = useState<SiteInfo>(() => getStoredSite());

  useEffect(() => {
    const handleSiteChanged = () => {
      setSiteState(getStoredSite());
      setPhase('pending');
      setActiveLoadNum(null);
    };
    window.addEventListener('site_changed', handleSiteChanged);
    return () => {
      window.removeEventListener('site_changed', handleSiteChanged);
    };
  }, []);

  const siteFilteredItems = useMemo(() => {
    return items.filter((item) => matchesActiveSite(item, siteState));
  }, [items, siteState]);

  // ── Derived: All target items (no BCL/non-BCL filter - just site filter) ───
  const targetItems = useMemo(
    () => siteFilteredItems,
    [siteFilteredItems]
  );

  // Group active target items into batches by loadNum
  const bclBatches = useMemo(() => {
    const map = new Map<string, GoodsItem[]>();
    targetItems.forEach((item) => {
      if (!map.has(item.loadNum)) {
        map.set(item.loadNum, []);
      }
      map.get(item.loadNum)!.push(item);
    });

    const list: BclActiveBatch[] = [];
    map.forEach((items, loadNum) => {
      const first = items[0];
      const total = items.length;
      const checked = items.filter((i) => i.status === 'checked').length;
      
      const seen = new Set<string>();
      items.forEach((i) => seen.add(normaliseCid(i.containerId)));

      list.push({
        loadNum,
        dnDate: first.dnDate,
        warehouse: first.warehouse,
        store: first.store,
        storeName: first.storeName,
        items,
        totalContainers: seen.size,
        stats: {
          total,
          checked,
          pending: total - checked,
          completionRate: total > 0 ? Math.round((checked / total) * 100) : 0,
        },
      });
    });

    return list.sort((a, b) => b.loadNum.localeCompare(a.loadNum));
  }, [targetItems]);

  // Current active reviewing items
  const reviewingItems = useMemo(() => {
    if (!activeLoadNum) return [];
    return targetItems.filter((i) => i.loadNum === activeLoadNum);
  }, [targetItems, activeLoadNum]);

  // stats for active load
  const stats = useMemo(() => {
    const total = reviewingItems.length;
    const checked = reviewingItems.filter((i) => i.status === 'checked').length;
    return {
      total,
      checked,
      pending: total - checked,
      completionRate: total > 0 ? Math.round((checked / total) * 100) : 0,
    };
  }, [reviewingItems]);

  // unique container IDs for active load
  const allContainerIds = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of reviewingItems) {
      const cid = normaliseCid(item.containerId);
      if (!seen.has(cid)) {
        seen.add(cid);
        result.push(cid);
      }
    }
    return result;
  }, [reviewingItems]);

  const totalContainers = allContainerIds.length;

  // Metadata from active load
  const metadata = useMemo(() => {
    const s = reviewingItems[0];
    if (!s) return { dnDate: "-", loadNum: "-", warehouse: "-", store: "-", storeName: "-" };
    return { dnDate: s.dnDate, loadNum: s.loadNum, warehouse: s.warehouse, store: s.store, storeName: s.storeName };
  }, [reviewingItems]);

  // ── Derived: modal items for current container ─────────────────────────────
  const modalItems = useMemo(() => {
    if (!modalContainerId) return [];
    return items.filter((item) => normaliseCid(item.containerId) === modalContainerId);
  }, [modalContainerId, items]);

  // ── Derived: revealed (scanned) items inside modal (newest scanned first) ───
  const revealedItems = useMemo(() => {
    const orderMap = new Map<string, number>();
    modalScannedOrder.forEach((id, idx) => orderMap.set(id, idx));

    const scannedOnly = modalItems.filter((item) => modalScannedIds.has(item.id));
    return scannedOnly.sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
      return idxA - idxB;
    });
  }, [modalItems, modalScannedIds, modalScannedOrder]);

  const allModalChecked = useMemo(() => {
    if (revealedItems.length === 0) return false;
    return revealedItems.every((i) => modalItemsChecked.has(i.id));
  }, [revealedItems, modalItemsChecked]);

  // ── Derived: filtered + sorted + paginated checked items (rekap table) ─────
  const checkedItems = useMemo(() => {
    const filtered = reviewingItems.filter((item) => {
      if (item.status !== 'checked') return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.item.toLowerCase().includes(q) ||
        item.itemDesc.toLowerCase().includes(q) ||
        item.containerId.toLowerCase().includes(q)
      );
    });

    if (sortField) {
      filtered.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      });
    }
    return filtered;
  }, [reviewingItems, searchQuery, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(checkedItems.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return checkedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [checkedItems, currentPage]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const saveItems = (updated: GoodsItem[]) => setItems(updated);

  const toggleSorting = (field: keyof GoodsItem) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ── Phase handlers ─────────────────────────────────────────────────────────
  const handleStartReview = (loadNum: string) => {
    setActiveLoadNum(loadNum);
    setPhase('reviewing');
    setTimeout(() => scanInputRef.current?.focus(), 300);
  };

  const handlePendingAndReturn = () => {
    setActiveLoadNum(null);
    setPhase('pending');
    toast.success('Pengecekan ditunda. Progress Anda berhasil disimpan.');
  };

  const handleSelesaiCek = async () => {
    if (reviewingItems.length === 0) {
      toast.error('Tidak ada item aktif yang menunggu diselesaikan.');
      return;
    }

    const currentLoadNum = activeLoadNum;
    const submittedAt = new Date().toISOString();
    const newReports: BclReportItem[] = reviewingItems.map((item) => {
      const oPck = item.originalPck ?? item.pck ?? 0;
      const oPcs = item.originalPcs ?? item.pcs ?? 0;
      const oTotal = item.originalTotalPiece ?? (oPck * item.coef + oPcs);

      const isChecked = item.status === 'checked';
      const cPck = isChecked ? item.pck : 0;
      const cPcs = isChecked ? item.pcs : 0;
      const cTotal = isChecked ? item.totalPiece : 0;

      return {
        id: item.id,
        dnDate: item.dnDate,
        loadNum: item.loadNum,
        warehouse: item.warehouse,
        store: item.store,
        storeName: item.storeName,
        erpOrder: item.erpOrder,
        aisle: item.aisle,
        containerId: item.containerId,
        item: item.item,
        itemDesc: item.itemDesc,
        coef: item.coef,
        originalPck: oPck,
        originalPcs: oPcs,
        originalTotalPiece: oTotal,
        checkedPck: cPck,
        checkedPcs: cPcs,
        checkedTotalPiece: cTotal,
        diffPck: cPck - oPck,
        diffPcs: cPcs - oPcs,
        diffTotalPiece: cTotal - oTotal,
        type: item.type,
        submittedAt,
      };
    });

    let existingReports: BclReportItem[] = [];
    const saved = localStorage.getItem('bcl_reports');
    if (saved) {
      try {
        existingReports = JSON.parse(saved) as BclReportItem[];
      } catch {
        existingReports = [];
      }
    }

    const updatedReports = [...newReports, ...existingReports];
    safeSetLocalStorage('bcl_reports', JSON.stringify(updatedReports));

    // Physically delete CSV file for this finished load from loadNumberCsv folder
    if (currentLoadNum && typeof window !== 'undefined' && window.electronAPI?.readSitemanFolderFiles) {
      try {
        const files = await window.electronAPI.readSitemanFolderFiles('loadNumberCsv');
        if (files && files.length > 0) {
          for (const file of files) {
            let shouldDelete = file.name.includes(currentLoadNum);
            if (!shouldDelete && file.content) {
              if (file.content.includes(currentLoadNum)) {
                shouldDelete = true;
              } else {
                const parsed = parseCSVToGoodsItems(file.content);
                shouldDelete = parsed.some((item) => item.loadNum === currentLoadNum);
              }
            }
            if (shouldDelete) {
              if (window.electronAPI?.deleteLocalSitemanCsv) {
                await window.electronAPI.deleteLocalSitemanCsv(file.name);
                console.log(`[handleSelesaiCek] Physically deleted finished load file: ${file.name}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('[handleSelesaiCek] Error deleting physical CSV file:', err);
      }
    }

    // Remove finished load items from memory & sessionStorage/localStorage
    const remainingItems = items.filter((i) => i.loadNum !== currentLoadNum);
    safeSetLocalStorage('siteman_custom_dataset', JSON.stringify(remainingItems));
    safeSetSessionStorage('all_checking_items', JSON.stringify(remainingItems));
    saveItems(remainingItems);
    
    setActiveLoadNum(null);
    setPhase('pending');
    toast.success(`Pengecekan Load ${currentLoadNum} selesai! Laporan disimpan & file CSV telah dibersihkan.`);
  };

  // ── Edit item handlers ─────────────────────────────────────────────────────
  const handleStartEdit = (item: GoodsItem) => {
    setEditingItem(item);
    setEditPck(item.pck);
    setEditPcs(item.pcs);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const updated = items.map((item) =>
      item.id === editingItem.id
        ? { ...item, pck: editPck, pcs: editPcs, totalPiece: editPck * item.coef + editPcs }
        : item
    );
    saveItems(updated);
    setEditingItem(null);
    toast.success('Data item berhasil diperbarui.');
  };

  const handleDeleteCheckedItem = (itemId: string) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        const origPck = item.originalPck ?? 0;
        const origPcs = item.originalPcs ?? 0;
        return {
          ...item,
          status: 'pending' as const,
          pck: origPck,
          pcs: origPcs,
          totalPiece: item.originalTotalPiece ?? (origPck * item.coef + origPcs),
        };
      }
      return item;
    });
    saveItems(updated);
    toast.success('Item berhasil dihapus dari rekap.');
  };

  // ── Scan (container) handlers ──────────────────────────────────────────────
  const openContainerModalForQuery = (rawInput: string) => {
    const raw = rawInput.trim().toUpperCase();
    if (!raw) return false;
    const query = normaliseCid(raw);
    const containerItems = reviewingItems.filter((item) => normaliseCid(item.containerId) === query);

    if (containerItems.length === 0) {
      return false;
    }

    setScanError(null);
    const prevCheckedIds = new Set<string>(
      containerItems.filter((i) => i.status === 'checked').map((i) => i.id)
    );
    const initialQty: Record<string, { pck: number; pcs: number }> = {};
    containerItems.forEach((i) => { initialQty[i.id] = { pck: i.pck, pcs: i.pcs }; });

    setModalContainerId(query);
    setModalItemsChecked(prevCheckedIds);
    setModalEditedQty(initialQty);
    setModalScannedIds(prevCheckedIds);
    setModalScannedOrder(Array.from(prevCheckedIds));
    setLastScannedItemId(null);
    setModalItemScanInput('');
    setModalOpen(true);
    setScanInput('');
    setTimeout(() => modalItemScanRef.current?.focus(), 200);
    return true;
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openContainerModalForQuery(scanInput)) return;

    const raw = scanInput.trim().toUpperCase();
    if (!raw) {
      setScanError('Tolong masukan no container id yang sesuai');
      return;
    }

    setScanError('Tolong masukan no container id yang sesuai');
    toast.error(`Container ID "${raw}" tidak ditemukan dalam load ${activeLoadNum}!`);
  };

  const handleScanInputChange = (val: string) => {
    setScanInput(val);
    if (scanError) setScanError(null);
    if (val.trim()) {
      openContainerModalForQuery(val);
    }
  };

  // ── Modal item scan handlers ───────────────────────────────────────────────
  const handleItemScanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setModalItemScanInput(val);
    const cleanVal = val.trim().toUpperCase();
    if (!cleanVal || cleanVal.length < 4) return;

    // Check barcode master lookup (resolves barcode -> 11-digit SKU)
    let targetSku = cleanVal;
    try {
      const masterMapStr = localStorage.getItem('siteman_barcode_master_map');
      if (masterMapStr) {
        const masterMap = JSON.parse(masterMapStr);
        if (masterMap[cleanVal]) {
          targetSku = masterMap[cleanVal].toUpperCase();
        }
      }
    } catch {
      // fallback
    }

    const cleanTargetSku = cleanSku(targetSku);
    const matched = modalItems.find(
      (item) =>
        cleanSku(item.item) === cleanTargetSku ||
        item.item.toUpperCase() === targetSku ||
        item.item.replace(/^0+/, '').toUpperCase() === targetSku.replace(/^0+/, '') ||
        item.item.slice(0, 11).toUpperCase() === targetSku.slice(0, 11)
    );
    if (matched) {
      setModalScannedIds((prev) => new Set([...prev, matched.id]));
      setModalItemsChecked((prev) => new Set([...prev, matched.id]));
      setModalScannedOrder((prev) => [matched.id, ...prev.filter((id) => id !== matched.id)]);
      setLastScannedItemId(matched.id);
      toast.success(`✓ ${matched.itemDesc}`);
      setModalItemScanInput('');
      setTimeout(() => modalItemScanRef.current?.focus(), 50);
    }
  };

  const handleModalItemScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = modalItemScanInput.trim().toUpperCase();
    if (!query) return;

    // Check barcode master lookup (resolves barcode -> 11-digit SKU)
    let targetSku = query;
    try {
      const masterMapStr = localStorage.getItem('siteman_barcode_master_map');
      if (masterMapStr) {
        const masterMap = JSON.parse(masterMapStr);
        if (masterMap[query]) {
          targetSku = masterMap[query].toUpperCase();
        }
      }
    } catch {
      // fallback
    }

    const cleanTargetSku = cleanSku(targetSku);
    const matched = modalItems.find(
      (item) =>
        cleanSku(item.item) === cleanTargetSku ||
        item.item.toUpperCase() === targetSku ||
        item.item.replace(/^0+/, '').toUpperCase() === targetSku.replace(/^0+/, '') ||
        item.item.slice(0, 11).toUpperCase() === targetSku.slice(0, 11) ||
        normaliseCid(item.containerId).toUpperCase() === query
    );

    if (!matched) {
      toast.error(`Item "${query}" tidak ditemukan dalam container ${modalContainerId}`);
      setModalItemScanInput('');
      return;
    }
    setModalScannedIds((prev) => new Set([...prev, matched.id]));
    setModalItemsChecked((prev) => new Set([...prev, matched.id]));
    setModalScannedOrder((prev) => [matched.id, ...prev.filter((id) => id !== matched.id)]);
    setLastScannedItemId(matched.id);
    toast.success(`✓ ${matched.itemDesc}`);
    setModalItemScanInput('');
    setTimeout(() => modalItemScanRef.current?.focus(), 50);
  };

  const handleModalItemToggle = (itemId: string) => {
    setModalItemsChecked((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) { next.delete(itemId); } else { next.add(itemId); }
      return next;
    });
  };

  const handleEditQty = (itemId: string, field: 'pck' | 'pcs', valString: string) => {
    const val = Math.max(0, parseInt(valString) || 0);
    setModalEditedQty((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: val } }));
  };

  const handleModalCheckAll = () => {
    if (allModalChecked) {
      setModalItemsChecked((prev) => {
        const next = new Set(prev);
        revealedItems.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setModalItemsChecked((prev) => {
        const next = new Set(prev);
        revealedItems.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const handleModalDone = () => {
    const updated = items.map((item) => {
      if (normaliseCid(item.containerId) !== modalContainerId) return item;
      const isChecked = modalItemsChecked.has(item.id);
      const edited = modalEditedQty[item.id] || { pck: item.pck, pcs: item.pcs };
      return {
        ...item,
        status: isChecked ? 'checked' : 'pending',
        pck: edited.pck,
        pcs: edited.pcs,
        totalPiece: edited.pck * item.coef + edited.pcs,
      };
    });
    saveItems(updated);
    setModalOpen(false);
    toast.success(`Container ${modalContainerId} berhasil dikonfirmasi.`);
  };

  const handleModalClose = () => setModalOpen(false);

  // ── Return all values & handlers ───────────────────────────────────────────
  const deleteLoadBatch = async (loadNumToDelete: string) => {
    if (!confirm(`Anda yakin ingin menghapus Load #${loadNumToDelete} beserta data dan file CSV-nya?`)) return;

    // 1. Physically delete matching CSV file(s) from D:\siteman\load-number-csv
    if (typeof window !== 'undefined' && window.electronAPI?.readSitemanFolderFiles) {
      try {
        const files = await window.electronAPI.readSitemanFolderFiles('loadNumberCsv');
        if (files && files.length > 0) {
          for (const file of files) {
            let shouldDelete = file.name.includes(loadNumToDelete);
            if (!shouldDelete && file.content) {
              if (file.content.includes(loadNumToDelete)) {
                shouldDelete = true;
              } else {
                const parsed = parseCSVToGoodsItems(file.content);
                shouldDelete = parsed.some((item) => item.loadNum === loadNumToDelete);
              }
            }
            if (shouldDelete) {
              if (window.electronAPI?.deleteLocalSitemanCsv) {
                await window.electronAPI.deleteLocalSitemanCsv(file.name);
                console.log(`[deleteLoadBatch] Physically deleted file: ${file.name}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('[deleteLoadBatch] Error deleting physical CSV file:', err);
      }
    }

    // 2. Remove items from memory & local/sessionStorage
    const remainingItems = items.filter((i) => i.loadNum !== loadNumToDelete);
    setItems(remainingItems);

    safeSetLocalStorage('siteman_custom_dataset', JSON.stringify(remainingItems));
    safeSetSessionStorage('all_checking_items', JSON.stringify(remainingItems));
    window.dispatchEvent(new Event('dataset_updated'));

    toast.success(`Load #${loadNumToDelete} Berhasil Dihapus`);
  };

  return {
    // Phase
    phase,
    activeLoadNum,
    handleStartReview,
    handlePendingAndReturn,
    handleSelesaiCek,
    deleteLoadBatch,

    // Items & stats
    items,
    bclBatches,
    stats,
    totalContainers,
    metadata,

    // Table
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    checkedItems,
    paginatedItems,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
    sortField,
    sortDirection,
    toggleSorting,

    // Scan form
    scanInput,
    setScanInput,
    scanError,
    setScanError,
    scanInputRef,
    handleScanSubmit,
    handleScanInputChange,

    // Container modal
    modalOpen,
    modalContainerId,
    modalItems,
    modalItemsChecked,
    modalEditedQty,
    modalScannedIds,
    lastScannedItemId,
    modalItemScanInput,
    modalItemScanRef,
    revealedItems,
    allModalChecked,
    handleItemScanInputChange,
    handleModalItemScan,
    handleModalItemToggle,
    handleEditQty,
    handleModalCheckAll,
    handleModalDone,
    handleModalClose,

    // Edit modal
    editingItem,
    setEditingItem,
    editPck,
    setEditPck,
    editPcs,
    setEditPcs,
    handleStartEdit,
    handleSaveEdit,
    handleDeleteCheckedItem,
  };
}

export const useItemBcl = useCekBarang;
