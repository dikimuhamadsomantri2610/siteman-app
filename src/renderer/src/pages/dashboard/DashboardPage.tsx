import { useState, useEffect } from "react";
import { LayoutDashboard, ClipboardCheck, FileBarChart2, ArrowRight, MapPin, X, Barcode } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteModal, SiteInfo } from "@/components/SiteModal";
import { useSite } from "@/hooks/useSite";

const dashboardCards = [
  {
    title: "Scan & Cek Barang",
    route: "/cek-barang",
    description: "Proses verifikasi dan scan semua barang dari DC ke Toko Secara Otomatis.",
    actionText: "BUKA SCANNER",
    icon: <ClipboardCheck className="h-6 w-6 text-white" />,
    iconBg: "bg-blue-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    actionBg: "#2563eb",
  },
  {
    title: "Report Pengecekan CSV",
    route: "/report-csv",
    description: "Export dan unduh laporan data operasional dalam format CSV.",
    actionText: "LIHAT REPORT",
    icon: <FileBarChart2 className="h-6 w-6 text-white" />,
    iconBg: "bg-[#0052cc] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    actionBg: "#0052cc",
  },
  {
    title: "LSPB BCL",
    route: "/lspb-bcl",
    description: "Laporan Selisih Penerimaan Barang kategori BCL.",
    actionText: "LIHAT REPORT",
    icon: <FileBarChart2 className="h-6 w-6 text-white" />,
    iconBg: "bg-amber-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    actionBg: "#d97706",
  },
  {
    title: "LSPB Non-BCL",
    route: "/lspb-non-bcl",
    description: "Laporan Selisih Penerimaan Barang kategori Non-BCL.",
    actionText: "LIHAT REPORT",
    icon: <FileBarChart2 className="h-6 w-6 text-white" />,
    iconBg: "bg-emerald-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    actionBg: "#059669",
  },
  // {
  //   title: "Preview Master Item & Barcode (DEVELOPMENT)",
  //   route: "/preview-master-item",
  //   description: "Ngke bakal di Hapus hehe.",
  //   actionText: "LIHAT PREVIEW",
  //   icon: <Barcode className="h-6 w-6 text-white" />,
  //   iconBg: "bg-purple-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  //   actionBg: "#7c3aed",
  // },
];

export default function Dashboard() {
  const { site, openSiteModal, isSiteComplete } = useSite();
  const [siteModalOpen, setSiteModalOpen] = useState(false);

  useEffect(() => {
    if (!isSiteComplete) {
      setSiteModalOpen(true);
    }
  }, [isSiteComplete]);

  const handleResetSite = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSiteModal();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Banner Cerah (daily-work-print style) */}
      <div className="bg-white border-[2.5px] border-black rounded-xl p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-300 border-[2px] border-black rounded-lg font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <LayoutDashboard className="h-4 w-4 text-black" />
            <span>Siteman Management Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang di Siteman DC
          </h1>
          <p className="text-slate-600 text-sm max-w-xl leading-relaxed font-medium">
            Sistem manajemen operasional site DC untuk scanning, verifikasi barang, dan pembuatan laporan serah terima secara presisi.
          </p>
        </div>

        {/* Site Active Card (Static container with permanent X button to change site) */}
        <div className="bg-[#0052cc] text-white border-[2.5px] border-black rounded-xl p-4 pr-12 shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 shrink-0 relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300 border-[2px] border-black text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0 font-black">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest block">DC PENGIRIM & SITE TOKO</span>
            <span className="text-sm font-extrabold text-white uppercase tracking-wide">
              {site.siteToko ? `DC ${site.dcPengirim || 'BELUM DIPILIH'} · SITE ${site.siteToko}` : (site.dcPengirim ? `DC ${site.dcPengirim} · SITE BELUM DIISI` : 'BELUM DIPILIH & DIISI')}
            </span>
          </div>

          {/* Button X is ALWAYS visible to reset / edit site */}
          <button
            type="button"
            onClick={handleResetSite}
            title="Reset & Isi Ulang Site Toko"
            className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-md border-[1.5px] border-black bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Grid Menu Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card) => (
          <div
            key={card.route}
            className="flex flex-col bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${card.iconBg}`}>
                {card.icon}
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 mb-2 uppercase tracking-wide">
                {card.title}
              </h2>

              <p className="text-slate-600 text-sm flex-1 leading-relaxed font-medium">
                {card.description}
              </p>

              <div className="mt-6">
                <Link
                  to={card.route}
                  onClick={() => {
                    if (card.route === '/cek-barang') {
                      sessionStorage.setItem('siteman_ftp_trigger_download', 'true');
                    }
                  }}
                  className="neo-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all"
                  style={{ backgroundColor: card.actionBg }}
                >
                  {card.actionText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
