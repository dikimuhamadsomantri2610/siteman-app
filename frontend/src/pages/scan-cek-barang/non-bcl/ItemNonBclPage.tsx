"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  QrCode, Search, AlertCircle, RefreshCw, Barcode,
  ChevronLeft, ChevronRight, FileText, MapPin, Calendar,
  X, CheckCircle2, Package, ScanLine, ClipboardList,
  ArrowRight, Eye, Boxes
} from "lucide-react";
import { toast } from 'sonner';
import rawDataset from '../bcl_nonbcl_dataset.json';

interface GoodsItem {
  id: string;
  dnDate: string;
  loadNum: string;
  store: string;
  storeName: string;
  erpOrder: string;
  aisle: string;
  containerId: string;
  item: string;
  itemDesc: string;
  coef: number;
  pck: number;
  pcs: number;
  totalPiece: number;
  totalKg: number;
  expDate: string;
  status: string;
  type: string;
}

type Phase = 'pending' | 'reviewing';

export default function ItemNonBclPage() {
  const allRawItems = useMemo(() => rawDataset as GoodsItem[], []);
  const initialNonBclItems = useMemo(() => allRawItems.filter(i => i.type === 'non-bcl'), [allRawItems]);

  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== 'undefined') {
      const savedPhase = sessionStorage.getItem('non_bcl_phase');
      if (savedPhase) return savedPhase as Phase;
    }
    return 'pending';
  });

  const [items, setItems] = useState<GoodsItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('all_checking_items');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as GoodsItem[];
          const hasOutdatedTypes = parsed.some(i => i.erpOrder.toUpperCase().startsWith('CR') && i.type === 'bcl');
          if (!hasOutdatedTypes) return parsed;
        } catch {
          // ignore parsing error, fallback to rawDataset
        }
      }
    }
    return rawDataset as GoodsItem[];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal state
  const [scanInput, setScanInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContainerId, setModalContainerId] = useState('');
  const [modalItemsChecked, setModalItemsChecked] = useState<Set<string>>(new Set());
  const [modalEditedQty, setModalEditedQty] = useState<Record<string, { pck: number; pcs: number }>>({});
  const [modalScannedIds, setModalScannedIds] = useState<Set<string>>(new Set());
  const [modalItemScanInput, setModalItemScanInput] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);
  const modalItemScanRef = useRef<HTMLInputElement>(null);

  // Sync state changes to sessionStorage safely
  useEffect(() => {
    sessionStorage.setItem('all_checking_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    sessionStorage.setItem('non_bcl_phase', phase);
  }, [phase]);

  const saveItems = (updated: GoodsItem[]) => {
    setItems(updated);
  };

  const handleStartReview = () => {
    setPhase('reviewing');
    setTimeout(() => scanInputRef.current?.focus(), 300);
  };

  // NON-BCL-only items derived from shared state
  const nonBclItems = useMemo(() => items.filter(i => i.type === 'non-bcl'), [items]);

  // Stats — NON-BCL only
  const stats = useMemo(() => {
    const total = nonBclItems.length;
    const checked = nonBclItems.filter(i => i.status === 'checked').length;
    const pending = total - checked;
    const completionRate = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, pending, completionRate };
  }, [nonBclItems]);

  // Unique container IDs — NON-BCL only
  const allContainerIds = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of nonBclItems) {
      const cid = item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId;
      if (!seen.has(cid)) { seen.add(cid); result.push(cid); }
    }
    return result;
  }, [nonBclItems]);

  const totalContainers = allContainerIds.length;

  // Metadata from first NON-BCL item
  const metadata = useMemo(() => {
    const s = nonBclItems[0];
    if (!s) return { dnDate: '-', loadNum: '-', store: '-', storeName: '-' };
    return { dnDate: s.dnDate, loadNum: s.loadNum, store: s.store, storeName: s.storeName };
  }, [nonBclItems]);

  // Modal items: search ALL items in container (cross-type)
  const modalItems = useMemo(() => {
    if (!modalContainerId) return [];
    return items.filter(item => {
      const cid = item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId;
      return cid === modalContainerId;
    });
  }, [modalContainerId, items]);

  // Handle scan → open modal
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = scanInput.trim().toUpperCase();
    if (!raw) return;
    // Normalize to last 8 digits (dataset stores containerId as 8 chars)
    const query = raw.length > 8 ? raw.slice(-8) : raw;

    const containerItems = items.filter(item => {
      const cid = item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId;
      return cid === query;
    });

    if (containerItems.length === 0) {
      toast.error(`Container ID "${raw}" tidak ditemukan dalam dataset!`);
      return;
    }

    const prevCheckedIds = new Set<string>(
      containerItems.filter(i => i.status === 'checked').map(i => i.id)
    );
    const initialQty: Record<string, { pck: number; pcs: number }> = {};
    containerItems.forEach(i => { initialQty[i.id] = { pck: i.pck, pcs: i.pcs }; });

    setModalContainerId(query);
    setModalItemsChecked(prevCheckedIds);
    setModalEditedQty(initialQty);
    setModalScannedIds(prevCheckedIds);
    setModalItemScanInput('');
    setModalOpen(true);
    setScanInput('');
    setTimeout(() => modalItemScanRef.current?.focus(), 200);
  };

  // Scan item inside modal → reveal
  const handleModalItemScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = modalItemScanInput.trim().toUpperCase();
    if (!query) return;

    const matched = modalItems.find(item =>
      item.item.toUpperCase() === query ||
      item.item.replace(/^0+/, '').toUpperCase() === query.replace(/^0+/, '') ||
      (item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId).toUpperCase() === query
    );

    if (!matched) {
      toast.error(`Item "${query}" tidak ditemukan dalam container ${modalContainerId}`);
      setModalItemScanInput('');
      return;
    }

    if (modalScannedIds.has(matched.id)) {
      toast.warning(`"${matched.itemDesc}" sudah di-scan sebelumnya.`);
      setModalItemScanInput('');
      return;
    }

    setModalScannedIds(prev => new Set([...prev, matched.id]));
    setModalItemsChecked(prev => new Set([...prev, matched.id]));
    toast.success(`✓ ${matched.itemDesc}`);
    setModalItemScanInput('');
    setTimeout(() => modalItemScanRef.current?.focus(), 50);
  };

  const handleModalItemToggle = (id: string) => {
    setModalItemsChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleEditQty = (id: string, field: 'pck' | 'pcs', value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setModalEditedQty(prev => ({ ...prev, [id]: { ...prev[id], [field]: num } }));
  };

  const handleModalDone = () => {
    const updated = items.map(item => {
      const cid = item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId;
      const isInThisContainer = cid === modalContainerId || item.containerId.toUpperCase() === modalContainerId;
      if (isInThisContainer) {
        const eq = modalEditedQty[item.id] || { pck: item.pck, pcs: item.pcs };
        const newTotalPiece = eq.pck * item.coef + eq.pcs;
        return { ...item, pck: eq.pck, pcs: eq.pcs, totalPiece: newTotalPiece, status: modalItemsChecked.has(item.id) ? 'checked' : 'pending' };
      }
      return item;
    });
    saveItems(updated);
    toast.success(`Container ${modalContainerId}: ${modalScannedIds.size}/${modalItems.length} item selesai dicek.`);
    setModalOpen(false); setModalContainerId(''); setModalItemsChecked(new Set());
    setModalEditedQty({}); setModalScannedIds(new Set()); setModalItemScanInput('');
    setTimeout(() => scanInputRef.current?.focus(), 150);
  };

  const handleModalClose = () => {
    setModalOpen(false); setModalContainerId(''); setModalItemsChecked(new Set());
    setModalEditedQty({}); setModalScannedIds(new Set()); setModalItemScanInput('');
    setTimeout(() => scanInputRef.current?.focus(), 150);
  };

  const revealedItems = modalItems.filter(i => modalScannedIds.has(i.id));
  const allModalChecked = revealedItems.length > 0 && revealedItems.every(i => modalItemsChecked.has(i.id));
  const handleModalCheckAll = () => {
    if (allModalChecked) {
      setModalItemsChecked(prev => { const next = new Set(prev); revealedItems.forEach(i => next.delete(i.id)); return next; });
    } else {
      setModalItemsChecked(prev => new Set([...prev, ...revealedItems.map(i => i.id)]));
    }
  };
  const modalCheckedCount = revealedItems.filter(i => modalItemsChecked.has(i.id)).length;
  const remainingCount = modalItems.length - modalScannedIds.size;

  // Table: checked items only
  const checkedItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      if (item.status !== 'checked') return false;
      if (!q) return true;
      return (
        item.itemDesc.toLowerCase().includes(q) ||
        item.item.toLowerCase().includes(q) ||
        item.containerId.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  const handleResetAll = () => {
    // Only reset NON-BCL items, preserve BCL progress
    const updated = items.map(i => {
      if (i.type !== 'non-bcl') return i; // keep bcl as-is
      const orig = initialNonBclItems.find(o => o.id === i.id);
      return { ...i, status: 'pending', pck: orig?.pck ?? i.pck, pcs: orig?.pcs ?? i.pcs };
    });
    saveItems(updated);
    setCurrentPage(1);
    setPhase('pending');
    toast.info('Semua data check Item NON BCL berhasil di-reset.');
  };



  const totalPages = Math.max(1, Math.ceil(checkedItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return checkedItems.slice(start, start + itemsPerPage);
  }, [checkedItems, currentPage]);

  // ─── PENDING PHASE ────────────────────────────────────────────────────────
  if (phase === 'pending') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Cek Item NON BCL</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {totalContainers} container · {items.length} item menunggu untuk dicek.
            </p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="rounded-2xl border-2 border-blue-100 dark:border-blue-900/60 bg-white dark:bg-zinc-900 shadow-md overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Menunggu Review
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 px-6 py-5">
            {/* Left: Load info */}
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Load Number</p>
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5 truncate">{metadata.loadNum}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm font-semibold">{metadata.dnDate}</span>
                </div>
                <span className="text-zinc-200 dark:text-zinc-700">·</span>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm font-semibold truncate">{metadata.storeName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{metadata.store}</span>
                </div>
              </div>
            </div>

            {/* Middle: Stats */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{totalContainers}</p>
                <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">Total Container</p>
              </div>
              <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-700" />
              <div className="text-center">
                <p className="text-4xl font-extrabold text-zinc-900 dark:text-white">{items.length}</p>
                <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">Total Item</p>
              </div>
            </div>

            {/* Right: Review button */}
            <button
              onClick={handleStartReview}
              className="shrink-0 flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25"
            >
              <Eye className="h-4 w-4" />
              Review
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {stats.checked > 0 && (
            <div className="px-6 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Progress sebelumnya: {stats.checked} dari {stats.total} item
                </span>
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{stats.completionRate}%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-700" style={{ width: `${stats.completionRate}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── REVIEWING PHASE ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Cek Item NON BCL</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-blue-600 dark:text-blue-400">{metadata.loadNum}</span>
              {' · '}{metadata.storeName}
              {' · '}<span className="text-zinc-400">{metadata.dnDate}</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Reset & Kembali
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Boxes className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Total Item</span>
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{stats.total}</p>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 block">{totalContainers} container</span>
        </div>
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-400 text-xs font-semibold uppercase tracking-wider">Sudah Cek</span>
          </div>
          <p className="text-3xl font-extrabold text-green-700 dark:text-green-400">{stats.checked}</p>
          <span className="text-xs text-green-600/70 dark:text-green-500/50 mt-1 block">Telah dikonfirmasi</span>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">Belum Cek</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">{stats.pending}</p>
          <span className="text-xs text-amber-600/70 dark:text-amber-500/50 mt-1 block">Menunggu scan</span>
        </div>
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-3">Completion</span>
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-white">{stats.completionRate}%</p>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scan Box */}
      <form onSubmit={handleScanSubmit} className="rounded-2xl border-2 border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <ScanLine className="h-7 w-7" />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest block mb-1">
              Scan Container ID
            </label>
            <input
              ref={scanInputRef}
              type="text"
              autoFocus
              placeholder="Arahkan scanner ke barcode atau ketik Container ID (8 digit) lalu Enter..."
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              className="w-full h-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-base font-semibold px-4 text-zinc-900 dark:text-white placeholder-zinc-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
          >
            <Barcode className="h-5 w-5" />
            Cek Item
          </button>
        </div>
      </form>

      {/* Rekap Table — checked items only */}
      <div className="rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">Rekap Item NON BCL</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-900">
              {checkedItems.length} item terscan
            </span>
          </div>
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari item..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-0 text-sm pl-9 pr-3 rounded-lg text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead>
              <tr className="bg-zinc-100/50 dark:bg-zinc-800/30 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 text-[11px] tracking-wider uppercase">
                <th className="py-3 px-4 font-bold">NO</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">CONTAINER ID</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">AISLE</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">ITEM</th>
                <th className="py-3 px-4 font-bold">ITEM DESC</th>
                <th className="py-3 px-4 font-bold text-center">COEF</th>
                <th className="py-3 px-4 font-bold text-center">PCK</th>
                <th className="py-3 px-4 font-bold text-center">PCS</th>
                <th className="py-3 px-4 font-bold text-center">TOTAL PC</th>
                <th className="py-3 px-4 font-bold text-right">TOTAL KG</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">EXP DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardList className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
                      <p className="font-semibold text-sm text-zinc-400 dark:text-zinc-500">Belum ada item yang discan.</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Scan Container ID di atas untuk mulai mengecek barang.</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.map((item, index) => (
                <tr key={item.id} className="bg-green-50/30 dark:bg-green-950/5 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-zinc-400 text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="py-3 px-4 font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap font-mono text-xs">
                    {item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{item.aisle}</td>
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap text-xs">{item.item}</td>
                  <td className="py-3 px-4 text-zinc-900 dark:text-white font-medium whitespace-normal wrap-break-word min-w-[220px]">{item.itemDesc}</td>
                  <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">{item.coef}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-zinc-900 dark:text-white">{item.pck}</td>
                  <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">{item.pcs}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-zinc-900 dark:text-white">{item.totalPiece}</td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-white">{item.totalKg.toFixed(2)}</td>
                  <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{item.expDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">{paginatedItems.length} dari {checkedItems.length} item terscan</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Hal. {currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleModalClose} />

          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-blue-600 rounded-t-3xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Container ID</p>
                  <p className="text-xl font-extrabold text-white font-mono tracking-widest">{modalContainerId}</p>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/25 text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress bar + scan counter */}
            <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20 flex items-center justify-between gap-4 shrink-0">
              <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${modalItems.length > 0 ? Math.round((modalScannedIds.size / modalItems.length) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                  {modalScannedIds.size}/{modalItems.length} discan
                </span>
              </div>
              {revealedItems.length > 0 && (
                <button
                  onClick={handleModalCheckAll}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all shrink-0"
                >
                  {allModalChecked ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>

            {/* ── Item Scan Input inside modal ── */}
            <form onSubmit={handleModalItemScan} className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Barcode className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-1">Scan Item</p>
                  <input
                    ref={modalItemScanRef}
                    type="text"
                    placeholder="Scan barcode item atau ketik Item Code lalu Enter..."
                    value={modalItemScanInput}
                    onChange={e => setModalItemScanInput(e.target.value)}
                    className="w-full h-9 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm font-semibold px-3 text-zinc-900 dark:text-white placeholder-zinc-400 transition-all"
                  />
                </div>
                <button type="submit" className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shrink-0">
                  Scan
                </button>
              </div>
              {remainingCount > 0 && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 ml-[52px]">
                  {remainingCount} item belum discan dalam container ini
                </p>
              )}
            </form>

            {/* Column Headers */}
            {revealedItems.length > 0 && (
              <div className="px-6 py-2.5 bg-zinc-100/60 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  <div className="col-span-1" />
                  <div className="col-span-5">Item / Deskripsi</div>
                  <div className="col-span-2 text-center">PCK</div>
                  <div className="col-span-2 text-center">PCS</div>
                  <div className="col-span-2 text-center">Total PC</div>
                </div>
              </div>
            )}

            {/* Items List — only revealed (scanned) items */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {revealedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
                    <Barcode className="h-8 w-8 text-blue-400 dark:text-blue-500" />
                  </div>
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Scan item untuk memunculkan data</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
                    Arahkan scanner ke barcode pada item atau ketik Item Code di kotak scan di atas.
                  </p>
                </div>
              ) : (
                revealedItems.map((item) => {
                  const isItemChecked = modalItemsChecked.has(item.id);
                  const eq = modalEditedQty[item.id] || { pck: item.pck, pcs: item.pcs };
                  const computedTotal = eq.pck * item.coef + eq.pcs;
                  return (
                    <div
                      key={item.id}
                      className={`px-6 py-4 grid grid-cols-12 gap-2 items-center transition-colors animate-in fade-in slide-in-from-top-2 duration-300 ${isItemChecked ? 'bg-green-50/60 dark:bg-green-950/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20'}`}
                    >
                      <button
                        onClick={() => handleModalItemToggle(item.id)}
                        className={`col-span-1 flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all ${
                          isItemChecked
                            ? 'bg-green-500 border-green-500'
                            : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-blue-400'
                        }`}
                      >
                        {isItemChecked && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </button>

                      <div className="col-span-5 min-w-0">
                        <p className="font-bold text-sm leading-tight whitespace-normal wrap-break-word text-zinc-900 dark:text-white">
                          {item.itemDesc}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">{item.item}</span>
                          <span className="text-zinc-200 dark:text-zinc-700">·</span>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Aisle {item.aisle}</span>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <input type="number" min={0} value={eq.pck}
                          onChange={e => handleEditQty(item.id, 'pck', e.target.value)}
                          className="w-16 h-9 text-center text-sm font-extrabold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg text-zinc-900 dark:text-white transition-all" />
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <input type="number" min={0} value={eq.pcs}
                          onChange={e => handleEditQty(item.id, 'pcs', e.target.value)}
                          className="w-16 h-9 text-center text-sm font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg text-zinc-900 dark:text-white transition-all" />
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="text-base font-extrabold text-zinc-900 dark:text-white">{computedTotal}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={handleModalClose}
                className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
              >
                Batal
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
                  {modalCheckedCount}/{modalItems.length} item dicek
                </span>
                <button
                  onClick={handleModalDone}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white text-sm font-bold transition-all shadow-md shadow-green-600/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Selesai Container Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
