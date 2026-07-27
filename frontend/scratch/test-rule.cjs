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

const checkFile = (filepath) => {
  if (!fs.existsSync(filepath)) return;
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

  const warehouseIdx = getIdx(["warehouse", "wh", "gudang"]);
  const aisleIdx = getIdx(["aisle", "lorong"]);
  const itemIdx = getIdx(["item", "item_code", "kode_barang"]);

  let bcl = 0;
  let nonBcl = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= 1 || !row[itemIdx]) continue;

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

    if (isBcl) bcl++;
    else nonBcl++;
  }

  console.log(`File: ${filepath}`);
  console.log(`  Total: ${bcl + nonBcl}, BCL: ${bcl}, Non-BCL: ${nonBcl}`);
};

checkFile('c:\\Users\\dikim\\OneDrive\\Desktop\\siteman-app\\backend\\db\\dummy\\1483595.csv');
checkFile('c:\\Users\\dikim\\OneDrive\\Desktop\\siteman-app\\backend\\db\\dummy\\Report - GBG DN by Load Manual.csv');
