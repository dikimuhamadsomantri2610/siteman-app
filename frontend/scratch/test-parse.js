const fs = require('fs');

const parseCsv = (text) => {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push("");
    } else if ((c === "\r" || c === "\n") && !inQuotes) {
      if (c === "\r" && next === "\n") {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
};

const text = fs.readFileSync('c:\\Users\\dikim\\OneDrive\\Desktop\\siteman-app\\backend\\db\\dummy\\Report - GBG DN by Load Manual.csv', 'utf-8');
const rows = parseCsv(text);
console.log("Total rows:", rows.length);

const headers = rows[0].map((h) => h.trim().toLowerCase());
console.log("Parsed headers:", headers);

const getIdx = (names) => {
  for (const name of names) {
    const idx = headers.indexOf(name.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
};

const shipDateIdx = getIdx(["actual_ship_date_time", "ship_date", "tanggal"]);
const loadNumIdx = getIdx(["shipping_load_num", "load_num", "load"]);
const storeIdx = getIdx(["customer", "store_code", "kode_toko"]);
const storeNameIdx = getIdx(["store", "store_name", "nama_toko"]);
const erpOrderIdx = getIdx(["erp_order", "erp"]);
const aisleIdx = getIdx(["aisle", "lorong"]);
const containerIdx = getIdx(["parent_container_id", "container_id", "container"]);
const itemIdx = getIdx(["item", "item_code", "kode_barang"]);
const itemDescIdx = getIdx(["item_desc", "item_description", "nama_barang"]);
const coefIdx = getIdx(["coef", "coefficient"]);
const pckIdx = getIdx(["pck", "pack"]);
const pcsIdx = getIdx(["pcs", "pieces"]);
const totalPieceIdx = getIdx(["total_piece", "total_pieces", "total_pc"]);
const totalKgIdx = getIdx(["total_kg", "weight"]);
const lotIdx = getIdx(["lot", "exp_date", "expiry"]);

console.log("Indices mapping:");
console.log({
  shipDateIdx,
  loadNumIdx,
  storeIdx,
  storeNameIdx,
  erpOrderIdx,
  aisleIdx,
  containerIdx,
  itemIdx,
  itemDescIdx,
  coefIdx,
  pckIdx,
  pcsIdx,
  totalPieceIdx,
  totalKgIdx,
  lotIdx
});

if (rows.length > 1) {
  console.log("First row after headers:", rows[1]);
}
