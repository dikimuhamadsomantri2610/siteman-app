// ─── bcl.ts ──────────────────────────────────────────────────────────────────
// Rule penentuan Item BCL vs NON-BCL berdasarkan DC (warehouse) dan Aisle.

export interface BclAisleRule {
  dc: string;
  bclAisles: string[];
}

export const BCL_AISLE_RULES: BclAisleRule[] = [
  {
    dc: 'GBG',
    bclAisles: ['01', '1', '08', '8', '21', '30', '31'],
  },
  {
    dc: 'D53',
    bclAisles: ['01', '1', '02', '2', '03', '3', '04', '4', '05', '5', '06', '6', '07', '7'],
  },
  {
    dc: 'DYS',
    bclAisles: ['10', '11', '12', '13'],
  },
];

/**
 * Determines whether an item is BCL or NON-BCL based on DC (warehouse) and Aisle.
 * - DC GBG  : Aisle 01, 08, 21, 30, 31 -> BCL (selain itu NON-BCL)
 * - DC D53  : Aisle 01, 02, 03, 04, 05, 06, 07 -> BCL (selain itu NON-BCL)
 * - DC DYS  : Aisle 10, 11, 12, 13 -> BCL (selain itu NON-BCL)
 */
export function determineItemBclType(dc: string, aisle: string, explicitType?: string): 'bcl' | 'non-bcl' {
  if (explicitType && explicitType.trim()) {
    const cleanType = explicitType.trim().toLowerCase();
    if (cleanType.includes('non')) return 'non-bcl';
    if (cleanType.includes('bcl')) return 'bcl';
  }

  const cleanDc = (dc || 'GBG').trim().toUpperCase();
  const rawAisle = (aisle || '').trim();
  const cleanAisle = rawAisle.replace(/^0+/, ''); // e.g. "01" -> "1", "08" -> "8"

  const rule = BCL_AISLE_RULES.find((r) => r.dc.toUpperCase() === cleanDc);

  if (rule) {
    const isBcl = rule.bclAisles.some(
      (a) => a === rawAisle || a.replace(/^0+/, '') === cleanAisle || a.padStart(2, '0') === rawAisle.padStart(2, '0')
    );
    return isBcl ? 'bcl' : 'non-bcl';
  }

  // Fallback for unlisted DCs: default to bcl
  return 'bcl';
}
