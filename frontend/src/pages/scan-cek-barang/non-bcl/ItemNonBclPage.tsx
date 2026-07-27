// ─── ItemNonBclPage ─────────────────────────────────────────────────────────────
// Halaman "Cek Item NON BCL" — menggunakan custom hook useItemBcl('non-bcl')

import { ArrowLeft, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useItemBcl } from '../bcl/useItemBcl';

// ─── Komponen modular ─────────────────────────────────────────────────────────
import PendingCard      from '../bcl/components/PendingCard';
import StatsCards       from '../bcl/components/StatsCards';
import ScanBox          from '../bcl/components/ScanBox';
import ResultsTable     from '../bcl/components/ResultsTable';
import ContainerModal   from '../bcl/components/ContainerModal';
import EditItemModal    from '../bcl/components/EditItemModal';

export default function ItemNonBclPage() {
  const nonBcl = useItemBcl('non-bcl');

  // ── PENDING PHASE ─────────────────────────────────────────────────────────
  if (nonBcl.phase === 'pending') {
    if (nonBcl.bclBatches.length === 0) {
      return (
        <PendingCard
          metadata={{ dnDate: '-', loadNum: '-', store: '-', storeName: '-' }}
          stats={{ total: 0, checked: 0, pending: 0, completionRate: 0 }}
          totalContainers={0}
          items={[]}
          onStartReview={() => {}}
          cardTitle="BARANG CEK NON-BCL"
        />
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white shadow-sm">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              CEK ITEM - BARANG CEK NON-BCL
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Terdapat {nonBcl.bclBatches.length} load master yang menunggu untuk dicek.
            </p>
          </div>
        </div>

        {/* List of batches */}
        <div className="space-y-6">
          {nonBcl.bclBatches.map((batch) => (
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
              onStartReview={() => nonBcl.handleStartReview(batch.loadNum)}
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
            onClick={nonBcl.handlePendingAndReturn}
            title="Pending & Kembali"
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-zinc-950 dark:border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              BARANG CEK NON-BCL
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-indigo-500 dark:text-indigo-400">{nonBcl.metadata.loadNum}</span>
              {' · '}{nonBcl.metadata.storeName}
              {' · '}<span className="text-zinc-400">{nonBcl.metadata.dnDate}</span>
            </p>
          </div>
        </div>

        {/* Selesai Cek button */}
        <button
          onClick={nonBcl.handleSelesaiCek}
          className="flex items-center gap-2 px-4 py-2 border-2 border-zinc-950 dark:border-zinc-700 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-bold transition-all shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
        >
          <CheckCircle2 className="h-4 w-4" />
          SELESAI CEK
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={nonBcl.stats} totalContainers={nonBcl.totalContainers} />

      {/* Scan Box */}
      <ScanBox
        scanInput={nonBcl.scanInput}
        onScanInputChange={nonBcl.handleScanInputChange}
        scanError={nonBcl.scanError}
        onClearError={() => nonBcl.setScanError(null)}
        scanInputRef={nonBcl.scanInputRef}
        onSubmit={nonBcl.handleScanSubmit}
      />

      {/* Results Table */}
      <ResultsTable
        paginatedItems={nonBcl.paginatedItems}
        checkedItems={nonBcl.checkedItems}
        currentPage={nonBcl.currentPage}
        totalPages={nonBcl.totalPages}
        itemsPerPage={nonBcl.itemsPerPage}
        searchQuery={nonBcl.searchQuery}
        sortField={nonBcl.sortField}
        onSearchChange={(q) => { nonBcl.setSearchQuery(q); nonBcl.setCurrentPage(1); }}
        onPageChange={nonBcl.setCurrentPage}
        onSort={nonBcl.toggleSorting}
        onEdit={nonBcl.handleStartEdit}
        onDelete={nonBcl.handleDeleteCheckedItem}
      />

      {/* Container Modal */}
      <ContainerModal
        isOpen={nonBcl.modalOpen}
        containerId={nonBcl.modalContainerId}
        modalItems={nonBcl.modalItems}
        revealedItems={nonBcl.revealedItems}
        allModalChecked={nonBcl.allModalChecked}
        modalScannedIds={nonBcl.modalScannedIds}
        modalItemsChecked={nonBcl.modalItemsChecked}
        modalEditedQty={nonBcl.modalEditedQty}
        modalItemScanInput={nonBcl.modalItemScanInput}
        modalItemScanRef={nonBcl.modalItemScanRef}
        onClose={nonBcl.handleModalClose}
        onDone={nonBcl.handleModalDone}
        onItemScanChange={nonBcl.handleItemScanInputChange}
        onItemScanSubmit={nonBcl.handleModalItemScan}
        onItemToggle={nonBcl.handleModalItemToggle}
        onEditQty={nonBcl.handleEditQty}
        onCheckAll={nonBcl.handleModalCheckAll}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={nonBcl.editingItem}
        editPck={nonBcl.editPck}
        editPcs={nonBcl.editPcs}
        onPckChange={nonBcl.setEditPck}
        onPcsChange={nonBcl.setEditPcs}
        onSave={nonBcl.handleSaveEdit}
        onClose={() => nonBcl.setEditingItem(null)}
      />
    </div>
  );
}
