import { useState, useEffect } from 'react';
import { AppHeader } from "@/components/AppHeader";
import { StatusBarFooter } from "@/components/StatusBarFooter";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteModal, setStoredSite } from "@/components/SiteModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always pop up SiteModal on app startup/load
  const [siteModalOpen, setSiteModalOpen] = useState(true);

  useEffect(() => {
    const handleOpenModal = () => setSiteModalOpen(true);
    window.addEventListener('open_site_modal', handleOpenModal);
    return () => window.removeEventListener('open_site_modal', handleOpenModal);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 grid-bg text-[#1a1a1a] print:bg-white print:text-black">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <AppHeader />

      {/* ─── Main Content Container (pt-28 sm:pt-32 prevents header overlap) ─── */}
      <main className="flex-1 px-6 sm:px-8 pt-28 sm:pt-32 pb-52">
        <div className="max-w-7xl mx-auto print:max-w-none print:w-full print:m-0">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* ─── Footer Status Bar ─────────────────────────────────────────── */}
      <StatusBarFooter />

      {/* ─── Mandatory Site Modal on Startup ───────────────────────────── */}
      <SiteModal
        isOpen={siteModalOpen}
        isForced={true}
        onClose={() => setSiteModalOpen(false)}
        onSave={(site) => {
          setStoredSite(site);
          setSiteModalOpen(false);
        }}
      />
    </div>
  );
}
