import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

// View imports (flat page directory structure)
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CekBarangPage from '@/pages/cek-barang/CekBarangPage';
import ReportCsvPage from '@/pages/report-csv/ReportCsvPage';
import LspbBclPage from '@/pages/lspb-bcl/LspbBclPage';
import LspbNonBclPage from '@/pages/lspb-non-bcl/LspbNonBclPage';
import PreviewMasterItemPage from '@/pages/preview-master-item/PreviewMasterItemPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* Main routes */}
          <Route path="cek-barang" element={<CekBarangPage />} />
          <Route path="report-csv" element={<ReportCsvPage />} />
          <Route path="lspb-bcl" element={<LspbBclPage />} />
          <Route path="lspb-non-bcl" element={<LspbNonBclPage />} />
          <Route path="preview-master-item" element={<PreviewMasterItemPage />} />

          {/* Backwards-compatible aliases */}
          <Route path="cek-bcl" element={<CekBarangPage />} />
          <Route path="cek-non-bcl" element={<CekBarangPage />} />
          <Route path="scan-cek-barang/bcl" element={<CekBarangPage />} />
          <Route path="scan-cek-barang/non-bcl" element={<CekBarangPage />} />
          <Route path="report/csv" element={<ReportCsvPage />} />
          <Route path="report/lspb/bcl" element={<LspbBclPage />} />
          <Route path="report/lspb/non-bcl" element={<LspbNonBclPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
