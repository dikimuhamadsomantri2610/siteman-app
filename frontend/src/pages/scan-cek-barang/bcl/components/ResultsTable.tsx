// ─── ResultsTable ─────────────────────────────────────────────────────────────
// Tabel rekap item yang sudah di-cek, dengan sorting, pencarian, dan paginasi.

import { ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle2, ClipboardList, Edit, Search, Trash2 } from 'lucide-react';
import { GoodsItem, SortField } from '../types';

interface ResultsTableProps {
  paginatedItems: GoodsItem[];
  checkedItems: GoodsItem[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  searchQuery: string;
  sortField: SortField;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onSort: (field: keyof GoodsItem) => void;
  onEdit: (item: GoodsItem) => void;
  onDelete: (id: string) => void;
}

interface SortableThProps {
  label: string;
  field: keyof GoodsItem;
  currentSort: SortField;
  align?: 'left' | 'center';
  nowrap?: boolean;
  onSort: (field: keyof GoodsItem) => void;
}

function SortableTh({ label, field, currentSort, align = 'left', nowrap, onSort }: SortableThProps) {
  const isActive = currentSort === field;
  return (
    <th
      className={`py-3 px-4 font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${nowrap ? 'whitespace-nowrap' : ''}`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-[#5294FF]' : 'text-zinc-400'}`} />
      </div>
    </th>
  );
}

export default function ResultsTable({
  paginatedItems,
  checkedItems,
  currentPage,
  totalPages,
  itemsPerPage,
  searchQuery,
  sortField,
  onSearchChange,
  onPageChange,
  onSort,
  onEdit,
  onDelete,
}: ResultsTableProps) {
  const COLS: { label: string; field: keyof GoodsItem; align?: 'left' | 'center'; nowrap?: boolean }[] = [
    { label: 'CONTAINER ID', field: 'containerId', nowrap: true },
    { label: 'AISLE',        field: 'aisle',       nowrap: true },
    { label: 'ITEM',         field: 'item',        nowrap: true },
    { label: 'ITEM DESC',    field: 'itemDesc' },
    { label: 'COEF',         field: 'coef',        align: 'center' },
    { label: 'PCK',          field: 'pck',         align: 'center' },
    { label: 'PCS',          field: 'pcs',         align: 'center' },
    { label: 'TOTAL PC',     field: 'totalPiece',  align: 'center' },
    { label: 'TOTAL KG',     field: 'totalKg',     align: 'center' },
    { label: 'EXP DATE',     field: 'expDate',     nowrap: true },
  ];

  return (
    <div className="rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Table Header / Search */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[#5294FF] dark:text-blue-400" />
          <h3 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight">
            TABLE HASIL CEK
          </h3>
        </div>
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari item..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#5294FF] focus:ring-0 text-sm pl-9 pr-3 rounded-md text-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 text-[11px] tracking-wider uppercase select-none">
              <th className="py-3 px-4 font-bold">NO</th>
              {COLS.map((col) => (
                <SortableTh
                  key={col.field}
                  label={col.label}
                  field={col.field}
                  currentSort={sortField}
                  align={col.align}
                  nowrap={col.nowrap}
                  onSort={onSort}
                />
              ))}
              <th className="py-3 px-4 font-bold text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ClipboardList className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
                    <p className="font-semibold text-sm text-zinc-400 dark:text-zinc-500">
                      Belum ada item yang discan.
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Scan Container ID di atas untuk mulai mengecek barang.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="bg-green-50/30 dark:bg-green-950/5 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-zinc-400 text-xs">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-[#5294FF] dark:text-blue-400 whitespace-nowrap text-xs">
                    {item.containerId.length >= 8 ? item.containerId.slice(-8) : item.containerId}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{item.aisle}</td>
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap text-xs">{item.item}</td>
                  <td className="py-3 px-4 text-zinc-900 dark:text-white font-medium whitespace-normal wrap-break-word min-w-55">{item.itemDesc}</td>
                  <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">{item.coef}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-zinc-900 dark:text-white">{item.pck}</td>
                  <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">{item.pcs}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-zinc-900 dark:text-white">{item.totalPiece}</td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-white">{item.totalKg.toFixed(2)}</td>
                  <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{item.expDate}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        title="Edit Qty"
                        className="flex items-center justify-center p-1.5 rounded border border-zinc-950 dark:border-zinc-700 bg-[#5294FF] hover:bg-[#3578e5] text-white transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        title="Hapus"
                        className="flex items-center justify-center p-1.5 rounded border border-zinc-950 dark:border-zinc-700 bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {paginatedItems.length} dari {checkedItems.length} item terscan
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Hal. {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
