// ─── Domain Types for BCL Item Checking ──────────────────────────────────────

export interface GoodsItem {
  id: string;
  dnDate: string;
  loadNum: string;
  warehouse?: string;
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
  originalPck?: number;
  originalPcs?: number;
  originalTotalPiece?: number;
}

export type Phase = 'pending' | 'reviewing';

export type SortField = keyof GoodsItem | null;
export type SortDirection = 'asc' | 'desc';

export interface BclReportItem {
  id: string;
  dnDate: string;
  loadNum: string;
  warehouse?: string;
  store: string;
  storeName: string;
  erpOrder: string;
  aisle: string;
  containerId: string;
  item: string;
  itemDesc: string;
  coef: number;
  originalPck: number;
  originalPcs: number;
  originalTotalPiece: number;
  checkedPck: number;
  checkedPcs: number;
  checkedTotalPiece: number;
  diffPck: number;
  diffPcs: number;
  diffTotalPiece: number;
  type?: string;
  submittedAt: string;
}

export interface BclActiveBatch {
  loadNum: string;
  dnDate: string;
  warehouse?: string;
  store: string;
  storeName: string;
  items: GoodsItem[];
  totalContainers: number;
  stats: {
    total: number;
    checked: number;
    pending: number;
    completionRate: number;
  };
}

