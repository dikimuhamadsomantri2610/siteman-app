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

const processFile = (filepath) => {
  const text = fs.readFileSync(filepath, 'utf-8');
  const rows = parseCsv(text);
  const headers = rows[0].map(h => h.trim().toLowerCase());
  
  const getIdx = (names) => {
    for (const name of names) {
      const idx = headers.indexOf(name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const shipDateIdx = getIdx(["actual_ship_date_time", "ship_date", "tanggal"]);
  const warehouseIdx = getIdx(["warehouse", "wh", "gudang"]);
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

  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= 1 || !row[itemIdx]) continue;

    const rawContainer = row[containerIdx] || "";
    const containerId = rawContainer.length >= 8 ? rawContainer.slice(-8) : rawContainer;
    const loadNum = row[loadNumIdx] || "-";
    const rawWarehouse = (warehouseIdx !== -1 ? row[warehouseIdx] : "") || "GBG";
    const rawAisle = (row[aisleIdx] || "").trim();
    const normalizedAisle = rawAisle.padStart(2, "0");
    const whUpper = rawWarehouse.trim().toUpperCase();

    let isBcl = false;
    if (whUpper === "GBG") {
      isBcl = ["01", "08", "21", "30", "31"].includes(normalizedAisle);
    } else if (whUpper === "D53") {
      isBcl = ["01", "02", "03", "04", "05"].includes(normalizedAisle);
    } else {
      isBcl = ["01", "08", "21", "30", "31", "02", "03", "04", "05"].includes(normalizedAisle);
    }

    const coef = Math.max(1, parseInt(row[coefIdx]) || 1);
    const pck = Math.max(0, parseInt(row[pckIdx]) || 0);
    const pcs = Math.max(0, parseInt(row[pcsIdx]) || 0);
    const totalPiece = Math.max(0, parseInt(row[totalPieceIdx]) || pck * coef + pcs);

    items.push({
      id: `${loadNum}_${i}`,
      dnDate: row[shipDateIdx] || "-",
      loadNum,
      warehouse: rawWarehouse,
      store: row[storeIdx] || "-",
      storeName: row[storeNameIdx] || "-",
      erpOrder: row[erpOrderIdx] || "-",
      aisle: rawAisle || "-",
      containerId,
      item: row[itemIdx],
      itemDesc: row[itemDescIdx],
      coef,
      pck,
      pcs,
      totalPiece,
      totalKg: parseFloat(row[totalKgIdx]) || 0,
      expDate: row[lotIdx] || "-",
      status: "pending",
      type: isBcl ? "bcl" : "non-bcl"
    });
  }
  return items;
};

const items1 = processFile('c:\\Users\\dikim\\OneDrive\\Desktop\\siteman-app\\backend\\db\\dummy\\1483595.csv');
const items2 = processFile('c:\\Users\\dikim\\OneDrive\\Desktop\\siteman-app\\backend\\db\\dummy\\1483596.csv');

console.log(`1483595: Total=${items1.length}, BCL=${items1.filter(i=>i.type==='bcl').length}, NonBCL=${items1.filter(i=>i.type==='non-bcl').length}`);
console.log(`1483596: Total=${items2.length}, BCL=${items2.filter(i=>i.type==='bcl').length}, NonBCL=${items2.filter(i=>i.type==='non-bcl').length}`);

const combined = [...items1, ...items2];
fs.writeFileSync('c:\\Users\\dikim\\OneDrive\\Desktop\\siteman-app\\frontend\\src\\pages\\scan-cek-barang\\bcl_nonbcl_dataset.json', JSON.stringify(combined, null, 2));
console.log(`Saved combined ${combined.length} items to bcl_nonbcl_dataset.json`);
