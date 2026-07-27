// ─── Custom Hook: useItemBcl ──────────────────────────────────────────────────
// Centralises ALL state, derived values, and event handlers for ItemBclPage.

import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GoodsItem, Phase, SortField, SortDirection, BclReportItem, BclActiveBatch } from './types';
import rawDataset from '../bcl_nonbcl_dataset.json';

const ITEMS_PER_PAGE = 20;

/** Normalise a container-id string to the last 8 characters. */
export const normaliseCid = (cid: string) =>
  cid.length >= 8 ? cid.slice(-8) : cid;

export function useItemBcl(itemType: 'bcl' | 'non-bcl' = 'bcl') {
  // ── Phase ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('pending');
  const [activeLoadNum, setActiveLoadNum] = useState<string | null>(null);

  // ── Items ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<GoodsItem[]>(() => {
    if (typeof window === 'undefined') return rawDataset as GoodsItem[];
    const saved = sessionStorage.getItem('all_checking_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GoodsItem[];
        if (parsed.length > 0 && parsed.some((i) => i.type === 'non-bcl')) {
          return parsed;
        }
      } catch {
        // ignore – fallback to rawDataset
      }
    }
    return rawDataset as GoodsItem[];
  });

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
    sessionStorage.setItem('all_checking_items', JSON.stringify(items));
  }, [items]);

  // ── Derived: Target items (BCL / Non-BCL) ──────────────────────────────────
  const targetItems = useMemo(() => items.filter((i) => i.type === itemType), [items, itemType]);

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

  // ── Derived: revealed (scanned) items inside modal ─────────────────────────
  const revealedItems = useMemo(
    () => modalItems.filter((item) => modalScannedIds.has(item.id)),
    [modalItems, modalScannedIds]
  );

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

  const handleSelesaiCek = () => {
    if (reviewingItems.length === 0) {
      toast.error('Tidak ada item aktif yang menunggu diselesaikan.');
      return;
    }

    const submittedAt = new Date().toISOString();
    const newReports: BclReportItem[] = reviewingItems.map((item) => {
      const original = (rawDataset as GoodsItem[]).find((o) => o.id === item.id);
      const oPck = original?.pck ?? 0;
      const oPcs = original?.pcs ?? 0;
      const oTotal = oPck * item.coef + oPcs;

      const isChecked = item.status === 'checked';
      const cPck = isChecked ? item.pck : 0;
      const cPcs = isChecked ? item.pcs : 0;
      const cTotal = isChecked ? item.totalPiece : 0;

      return {
        id: item.id,
        dnDate: item.dnDate,
        loadNum: item.loadNum,
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
    localStorage.setItem('bcl_reports', JSON.stringify(updatedReports));

    // Remove only submitted items of this type & load from active list
    const remainingItems = items.filter(
      (item) => !(item.type === itemType && item.loadNum === activeLoadNum)
    );
    saveItems(remainingItems);
    
    setActiveLoadNum(null);
    setPhase('pending');
    toast.success(`Pengecekan Load ${activeLoadNum} selesai! Laporan berhasil dipindahkan ke Laporan.`);
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
    const original = (rawDataset as GoodsItem[]).find((o) => o.id === itemId);
    const updated = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            status: 'pending' as const,
            pck: original?.pck ?? 0,
            pcs: original?.pcs ?? 0,
            totalPiece: (original?.pck ?? 0) * item.coef + (original?.pcs ?? 0),
          }
        : item
    );
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

    const matched = modalItems.find(
      (item) =>
        item.item.toUpperCase() === cleanVal ||
        item.item.replace(/^0+/, '').toUpperCase() === cleanVal.replace(/^0+/, '')
    );
    if (matched && !modalScannedIds.has(matched.id)) {
      setModalScannedIds((prev) => new Set([...prev, matched.id]));
      setModalItemsChecked((prev) => new Set([...prev, matched.id]));
      toast.success(`✓ ${matched.itemDesc}`);
      setModalItemScanInput('');
      setTimeout(() => modalItemScanRef.current?.focus(), 50);
    }
  };

  const handleModalItemScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = modalItemScanInput.trim().toUpperCase();
    if (!query) return;

    const matched = modalItems.find(
      (item) =>
        item.item.toUpperCase() === query ||
        item.item.replace(/^0+/, '').toUpperCase() === query.replace(/^0+/, '') ||
        normaliseCid(item.containerId).toUpperCase() === query
    );

    if (!matched) {
      toast.error(`Item "${query}" tidak ditemukan dalam container ${modalContainerId}`);
      setModalItemScanInput('');
      return;
    }
    if (!modalScannedIds.has(matched.id)) {
      setModalScannedIds((prev) => new Set([...prev, matched.id]));
      setModalItemsChecked((prev) => new Set([...prev, matched.id]));
      toast.success(`✓ ${matched.itemDesc}`);
    }
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
  return {
    // Phase
    phase,
    activeLoadNum,
    handleStartReview,
    handlePendingAndReturn,
    handleSelesaiCek,

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
