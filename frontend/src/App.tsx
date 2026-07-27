import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';

// View imports
import LoginPage from '@/pages/login/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ScanCekBarangPage from '@/pages/scan-cek-barang/ScanCekBarangPage';
import ItemBclPage from '@/pages/scan-cek-barang/bcl/ItemBclPage';
import ItemNonBclPage from '@/pages/scan-cek-barang/non-bcl/ItemNonBclPage';
import LspbPage from '@/pages/report/lspb/LspbPage';
import LspbBclPage from '@/pages/report/lspb/bcl/LspbBclPage';
import LspbNonBclPage from '@/pages/report/lspb/non-bcl/LspbNonBclPage';
import ReportPage from '@/pages/report/ReportPage';
import ReportCsvPage from '@/pages/report/csv/ReportCsvPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard layout routes protected by authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="scan-cek-barang" element={<ScanCekBarangPage />} />
          <Route path="scan-cek-barang/bcl" element={<ItemBclPage />} />
          <Route path="scan-cek-barang/non-bcl" element={<ItemNonBclPage />} />
          <Route path="report/lspb" element={<LspbPage />} />
          <Route path="report/lspb/bcl" element={<LspbBclPage />} />
          <Route path="report/lspb/non-bcl" element={<LspbNonBclPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="report/csv" element={<ReportCsvPage />} />
          <Route path="report/bcl" element={<ReportCsvPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
