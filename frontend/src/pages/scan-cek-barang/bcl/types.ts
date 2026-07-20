// ─── Domain Types for BCL Item Checking ──────────────────────────────────────

export interface GoodsItem {
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

export type Phase = 'pending' | 'reviewing';

export type SortField = keyof GoodsItem | null;
export type SortDirection = 'asc' | 'desc';
