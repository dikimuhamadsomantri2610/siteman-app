// ─── CekBarangPage ───────────────────────────────────────────────────────────
// Halaman CEK BARANG — satu halaman untuk scan semua barang (BCL + Non-BCL).
// Tidak ada pemisahan BCL / Non-BCL di halaman ini.
// Klasifikasi BCL / Non-BCL hanya dilakukan di halaman LSPB.

import { CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useCekBarang } from '@/pages/cek-barang/useCekBarang';

// ─── Komponen modular ─────────────────────────────────────────────────────────
import PendingCard    from '@/components/scan/PendingCard';
import StatsCards     from '@/components/scan/StatsCards';
import ScanBox        from '@/components/scan/ScanBox';
import ResultsTable   from '@/components/scan/ResultsTable';
import ContainerModal from '@/components/scan/ContainerModal';
import EditItemModal  from '@/components/scan/EditItemModal';
import { CsvFileList } from '@/components/CsvFileList';

export default function CekBarangPage() {
  const cek = useCekBarang();

  // ── PENDING PHASE ─────────────────────────────────────────────────────────
  if (cek.phase === 'pending') {
    if (cek.bclBatches.length === 0) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CsvFileList />
          {/* Skeleton Load Placeholder while dataset is being downloaded/scanned */}
          <div className="bg-white border-[2.5px] border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 animate-pulse">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="space-y-2 w-1/2">
                <div className="h-6 bg-slate-300 rounded-md w-3/4" />
                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
              </div>
              <div className="h-10 bg-slate-300 rounded-lg w-36" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="h-16 bg-slate-100 rounded-lg border border-slate-200" />
              <div className="h-16 bg-slate-100 rounded-lg border border-slate-200" />
              <div className="h-16 bg-slate-100 rounded-lg border border-slate-200" />
              <div className="h-16 bg-slate-100 rounded-lg border border-slate-200" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Page Header Card */}
        <div className="bg-white border-[2.5px] border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0052cc] border-[2px] border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
                SCAN & CEK BARANG
              </h2>
              <p className="text-sm font-medium text-slate-600">
                Terdapat <span className="font-extrabold text-[#0052cc]">{cek.bclBatches.length} Load Number</span> yang menunggu untuk dicek.
              </p>
            </div>
          </div>
        </div>

        {/* CSV File List Card */}
        <CsvFileList />

        {/* List of batches */}
        <div className="space-y-6">
          {cek.bclBatches.map((batch) => (
            <PendingCard
              key={batch.loadNum}
              metadata={{
                dnDate: batch.dnDate,
                loadNum: batch.loadNum,
                warehouse: batch.warehouse,
                store: batch.store,
                storeName: batch.storeName,
              }}
              stats={batch.stats}
              totalContainers={batch.totalContainers}
              items={batch.items}
              onStartReview={() => cek.handleStartReview(batch.loadNum)}
              onDeleteLoad={(loadNum) => cek.deleteLoadBatch(loadNum)}
              showTitle={false}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── REVIEWING PHASE ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header Card - Sticky at top so SELESAI CEK button is always accessible */}
      <div className="sticky top-[72px] z-30 bg-white/95 backdrop-blur-md border-[2.5px] border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0052cc] border-[2px] border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
              SCAN & CEK BARANG
            </h2>
            <p className="text-sm font-medium text-slate-600">
              <span className="font-extrabold text-[#0052cc]">{cek.metadata.loadNum}</span>
              {' · '}{cek.metadata.storeName}
              {' · '}<span className="text-slate-500 font-bold">{cek.metadata.dnDate}</span>
            </p>
          </div>
        </div>

        {/* Selesai Cek button */}
        <button
          onClick={cek.handleSelesaiCek}
          className="flex items-center gap-2 px-5 py-2.5 border-[2.5px] border-black bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-extrabold transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
        >
          <CheckCircle2 className="h-4 w-4" />
          SELESAI CEK
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={cek.stats} totalContainers={cek.totalContainers} />

      {/* Scan Box */}
      <ScanBox
        scanInput={cek.scanInput}
        onScanInputChange={cek.handleScanInputChange}
        scanError={cek.scanError}
        onClearError={() => cek.setScanError(null)}
        scanInputRef={cek.scanInputRef}
        onSubmit={cek.handleScanSubmit}
      />

      {/* Results Table */}
      <ResultsTable
        paginatedItems={cek.paginatedItems}
        checkedItems={cek.checkedItems}
        currentPage={cek.currentPage}
        totalPages={cek.totalPages}
        itemsPerPage={cek.itemsPerPage}
        searchQuery={cek.searchQuery}
        sortField={cek.sortField}
        onSearchChange={(q) => { cek.setSearchQuery(q); cek.setCurrentPage(1); }}
        onPageChange={cek.setCurrentPage}
        onSort={cek.toggleSorting}
        onEdit={cek.handleStartEdit}
        onDelete={cek.handleDeleteCheckedItem}
      />

      {/* Container Modal */}
      <ContainerModal
        isOpen={cek.modalOpen}
        containerId={cek.modalContainerId}
        modalItems={cek.modalItems}
        revealedItems={cek.revealedItems}
        allModalChecked={cek.allModalChecked}
        modalScannedIds={cek.modalScannedIds}
        modalItemsChecked={cek.modalItemsChecked}
        lastScannedItemId={cek.lastScannedItemId}
        modalEditedQty={cek.modalEditedQty}
        modalItemScanInput={cek.modalItemScanInput}
        modalItemScanRef={cek.modalItemScanRef}
        onClose={cek.handleModalClose}
        onDone={cek.handleModalDone}
        onItemScanChange={cek.handleItemScanInputChange}
        onItemScanSubmit={cek.handleModalItemScan}
        onItemToggle={cek.handleModalItemToggle}
        onEditQty={cek.handleEditQty}
        onCheckAll={cek.handleModalCheckAll}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={cek.editingItem}
        editPck={cek.editPck}
        editPcs={cek.editPcs}
        onPckChange={cek.setEditPck}
        onPcsChange={cek.setEditPcs}
        onSave={cek.handleSaveEdit}
        onClose={() => cek.setEditingItem(null)}
      />
    </div>
  );
}
