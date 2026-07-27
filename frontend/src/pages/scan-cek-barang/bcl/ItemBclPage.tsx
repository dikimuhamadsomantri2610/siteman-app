// ─── ItemBclPage ──────────────────────────────────────────────────────────────
// Halaman "Cek Item BCL" — hanya bertanggung jawab sebagai orkestrasi:
//   · Mengambil state & handler dari custom hook useItemBcl
//   · Merender komponen-komponen modular sesuai phase

import { ArrowLeft, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useItemBcl } from './useItemBcl';

// ─── Komponen modular ─────────────────────────────────────────────────────────
import PendingCard      from './components/PendingCard';
import StatsCards       from './components/StatsCards';
import ScanBox          from './components/ScanBox';
import ResultsTable     from './components/ResultsTable';
import ContainerModal   from './components/ContainerModal';
import EditItemModal    from './components/EditItemModal';

export default function ItemBclPage() {
  const bcl = useItemBcl();

  // ── PENDING PHASE ─────────────────────────────────────────────────────────
  if (bcl.phase === 'pending') {
    if (bcl.bclBatches.length === 0) {
      return (
        <PendingCard
          metadata={{ dnDate: '-', loadNum: '-', store: '-', storeName: '-' }}
          stats={{ total: 0, checked: 0, pending: 0, completionRate: 0 }}
          totalContainers={0}
          items={[]}
          onStartReview={() => {}}
        />
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#5294FF] text-white shadow-sm">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              CEK ITEM - BARANG CEK LANGSUNG
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Terdapat {bcl.bclBatches.length} load master yang menunggu untuk dicek.
            </p>
          </div>
        </div>

        {/* List of batches */}
        <div className="space-y-6">
          {bcl.bclBatches.map((batch) => (
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
              onStartReview={() => bcl.handleStartReview(batch.loadNum)}
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={bcl.handlePendingAndReturn}
            title="Pending & Kembali"
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#5294FF] text-white shadow-sm shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              BARANG CEK LANGSUNG
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-[#5294FF] dark:text-blue-400">{bcl.metadata.loadNum}</span>
              {' · '}{bcl.metadata.storeName}
              {' · '}<span className="text-zinc-400">{bcl.metadata.dnDate}</span>
            </p>
          </div>
        </div>

        {/* Selesai Cek button */}
        <button
          onClick={bcl.handleSelesaiCek}
          className="flex items-center gap-2 px-4 py-2 border-2 border-zinc-950 dark:border-zinc-700 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-bold transition-all shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
        >
          <CheckCircle2 className="h-4 w-4" />
          SELESAI CEK
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={bcl.stats} totalContainers={bcl.totalContainers} />

      {/* Scan Box */}
      <ScanBox
        scanInput={bcl.scanInput}
        onScanInputChange={bcl.handleScanInputChange}
        scanError={bcl.scanError}
        onClearError={() => bcl.setScanError(null)}
        scanInputRef={bcl.scanInputRef}
        onSubmit={bcl.handleScanSubmit}
      />

      {/* Results Table */}
      <ResultsTable
        paginatedItems={bcl.paginatedItems}
        checkedItems={bcl.checkedItems}
        currentPage={bcl.currentPage}
        totalPages={bcl.totalPages}
        itemsPerPage={bcl.itemsPerPage}
        searchQuery={bcl.searchQuery}
        sortField={bcl.sortField}
        onSearchChange={(q) => { bcl.setSearchQuery(q); bcl.setCurrentPage(1); }}
        onPageChange={bcl.setCurrentPage}
        onSort={bcl.toggleSorting}
        onEdit={bcl.handleStartEdit}
        onDelete={bcl.handleDeleteCheckedItem}
      />

      {/* Container Modal */}
      <ContainerModal
        isOpen={bcl.modalOpen}
        containerId={bcl.modalContainerId}
        modalItems={bcl.modalItems}
        revealedItems={bcl.revealedItems}
        allModalChecked={bcl.allModalChecked}
        modalScannedIds={bcl.modalScannedIds}
        modalItemsChecked={bcl.modalItemsChecked}
        modalEditedQty={bcl.modalEditedQty}
        modalItemScanInput={bcl.modalItemScanInput}
        modalItemScanRef={bcl.modalItemScanRef}
        onClose={bcl.handleModalClose}
        onDone={bcl.handleModalDone}
        onItemScanChange={bcl.handleItemScanInputChange}
        onItemScanSubmit={bcl.handleModalItemScan}
        onItemToggle={bcl.handleModalItemToggle}
        onEditQty={bcl.handleEditQty}
        onCheckAll={bcl.handleModalCheckAll}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={bcl.editingItem}
        editPck={bcl.editPck}
        editPcs={bcl.editPcs}
        onPckChange={bcl.setEditPck}
        onPcsChange={bcl.setEditPcs}
        onSave={bcl.handleSaveEdit}
        onClose={() => bcl.setEditingItem(null)}
      />
    </div>
  );
}
