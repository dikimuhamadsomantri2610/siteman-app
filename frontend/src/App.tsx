import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';

// View imports
import LoginPage from '@/pages/login/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ScanCekBarangPage from '@/pages/scan-cek-barang/ScanCekBarangPage';
import ItemBclPage from '@/pages/scan-cek-barang/bcl/ItemBclPage';
import UploadMasterPage from '@/pages/scan-cek-barang/upload-master/UploadMasterPage';
import LspbPage from '@/pages/report/lspb/LspbPage';
import LspbBclPage from '@/pages/report/lspb/bcl/LspbBclPage';
import ReportPage from '@/pages/report/ReportPage';
import ReportBclPage from '@/pages/report/bcl/ReportBclPage';

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
          <Route path="scan-cek-barang/upload-master" element={<UploadMasterPage />} />
          <Route path="report/lspb" element={<LspbPage />} />
          <Route path="report/lspb/bcl" element={<LspbBclPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="report/bcl" element={<ReportBclPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
