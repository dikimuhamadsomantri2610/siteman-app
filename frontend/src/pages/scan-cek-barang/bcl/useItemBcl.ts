// ─── Custom Hook: useItemBcl ──────────────────────────────────────────────────
// Centralises ALL state, derived values, and event handlers for ItemBclPage.

import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { GoodsItem, Phase, SortField, SortDirection } from './types';
import rawDataset from '../bcl_nonbcl_dataset.json';

const ITEMS_PER_PAGE = 20;

/** Normalise a container-id string to the last 8 characters. */
export const normaliseCid = (cid: string) =>
  cid.length >= 8 ? cid.slice(-8) : cid;

export function useItemBcl() {
  // ── Phase ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('pending');

  // ── Items ──────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<GoodsItem[]>(() => {
    if (typeof window === 'undefined') return rawDataset as GoodsItem[];
    const saved = sessionStorage.getItem('all_checking_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GoodsItem[];
        const hasOutdatedTypes = parsed.some((i) => i.type === 'non-bcl');
        if (!hasOutdatedTypes) return parsed;
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
    sessionStorage.setItem('bcl_phase', phase);
  }, [items, phase]);

  // ── Derived: BCL-only items ────────────────────────────────────────────────
  const bclItems = useMemo(() => items.filter((i) => i.type === 'bcl'), [items]);

  // ── Derived: stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = bclItems.length;
    const checked = bclItems.filter((i) => i.status === 'checked').length;
    return {
      total,
      checked,
      pending: total - checked,
      completionRate: total > 0 ? Math.round((checked / total) * 100) : 0,
    };
  }, [bclItems]);

  // ── Derived: unique container IDs ──────────────────────────────────────────
  const allContainerIds = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of bclItems) {
      const cid = normaliseCid(item.containerId);
      if (!seen.has(cid)) { seen.add(cid); result.push(cid); }
    }
    return result;
  }, [bclItems]);

  const totalContainers = allContainerIds.length;

  // ── Derived: metadata from first BCL item ──────────────────────────────────
  const metadata = useMemo(() => {
    const s = bclItems[0];
    if (!s) return { dnDate: '-', loadNum: '-', store: '-', storeName: '-' };
    return { dnDate: s.dnDate, loadNum: s.loadNum, store: s.store, storeName: s.storeName };
  }, [bclItems]);

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
    const filtered = bclItems.filter((item) => {
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
  }, [bclItems, searchQuery, sortField, sortDirection]);

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
  const handleStartReview = () => {
    setPhase('reviewing');
    setTimeout(() => scanInputRef.current?.focus(), 300);
  };

  const handlePendingAndReturn = () => {
    setPhase('pending');
    toast.success('Pengecekan ditunda. Progress Anda berhasil disimpan.');
  };

  const handleSelesaiCek = () => {
    setPhase('pending');
    toast.success('Pengecekan selesai! Data telah tersimpan.');
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
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = scanInput.trim().toUpperCase();
    if (!raw) {
      setScanError('Tolong masukan no container id yang sesuai');
      return;
    }
    const query = normaliseCid(raw);
    const containerItems = items.filter((item) => normaliseCid(item.containerId) === query);

    if (containerItems.length === 0) {
      setScanError('Tolong masukan no container id yang sesuai');
      toast.error(`Container ID "${raw}" tidak ditemukan dalam dataset!`);
      return;
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
    handleStartReview,
    handlePendingAndReturn,
    handleSelesaiCek,

    // Items & stats
    items,
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
