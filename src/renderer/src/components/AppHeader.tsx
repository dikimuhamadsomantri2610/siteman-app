import { ArrowLeft, Bell, AlertCircle, CheckCircle2 } from 'lucide-react'
import React, { useState, useEffect, useMemo } from 'react'
import logoYomartSvg from '@/assets/logo_yomart.svg'
import { useNavigate, useLocation } from 'react-router-dom'
import { OfflineCsv } from './OfflineCsv'
import { getStoredSite, matchesActiveSite, SiteInfo } from '@/components/SiteModal'
import { determineItemBclType } from '@shared/types/bcl'
import { BclReportItem } from '@shared/types/types'

interface AppHeaderProps {
  title?: string
  onBack?: () => void
  icon?: React.ReactNode
  titleColor?: string
  backColor?: string
  backHoverColor?: string
}

export function AppHeader({ title, onBack, icon, titleColor, backColor, backHoverColor }: AppHeaderProps): React.ReactNode {
  const navigate = useNavigate()
  const location = useLocation()
  const [notifOpen, setNotifOpen] = useState(false)

  const isHome = location.pathname === '/'
  const handleBack = onBack || (!isHome ? () => navigate(-1) : undefined)

  const [reports, setReports] = useState<BclReportItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bcl_reports");
      if (saved) {
        try {
          return JSON.parse(saved) as BclReportItem[];
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [siteState, setSiteState] = useState<SiteInfo>(() => getStoredSite());

  useEffect(() => {
    const handleUpdate = () => {
      setSiteState(getStoredSite());
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("bcl_reports");
        if (saved) {
          try {
            setReports(JSON.parse(saved));
          } catch {
            setReports([]);
          }
        } else {
          setReports([]);
        }
      }
    };

    window.addEventListener("site_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("dataset_updated", handleUpdate);

    return () => {
      window.removeEventListener("site_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("dataset_updated", handleUpdate);
    };
  }, []);

  // Filter report items with selisih (LSPB) for active site
  const lspbNotifications = useMemo(() => {
    const siteReports = reports.filter((r) => matchesActiveSite(r, siteState) && r.diffTotalPiece !== 0);
    const map = new Map<string, { loadNum: string; submittedAt: string; type: 'bcl' | 'non-bcl'; count: number }>();

    siteReports.forEach((item) => {
      const itemType = determineItemBclType(
        item.warehouse || siteState.dcPengirim || "GBG",
        item.aisle || "",
        item.type
      );
      const key = `${item.loadNum}_${item.submittedAt}_${itemType}`;
      if (!map.has(key)) {
        map.set(key, {
          loadNum: item.loadNum,
          submittedAt: item.submittedAt,
          type: itemType,
          count: 0,
        });
      }
      map.get(key)!.count += 1;
    });

    const list = Array.from(map.values()).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return list;
  }, [reports, siteState]);

  const unreadCount = lspbNotifications.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md border-b-[2.5px] border-black px-6 sm:px-8 py-3.5 flex items-center justify-between gap-4 min-h-[72px]">
      <div className="flex items-center gap-4">
        {handleBack && (
          <button
            onClick={handleBack}
            className={`border-[2.5px] border-black rounded-lg p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-75 flex items-center justify-center ${backColor || 'bg-[#0052cc] text-white'} ${backHoverColor || ''}`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          {icon || <img src={logoYomartSvg} className="h-9 w-9 object-contain" alt="Logo" />}
          <h1 className={`text-xl font-bold tracking-tight uppercase translate-y-[1px] ${titleColor || 'text-[#0052cc]'}`}>
            {title || 'SITEMAN - DC'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Offline CSV Indicator Badge */}
        <OfflineCsv />

        {/* Notification Bell for LSPB (Laporan Selisih Penerimaan Barang) */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            className="border-[2.5px] border-black rounded-xl p-2 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-75 flex items-center justify-center relative"
            title="Laporan Selisih (LSPB)"
          >
            <Bell className="h-5 w-5 text-gray-800" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white border border-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border-[2.5px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b-[2px] border-black flex items-center justify-between bg-amber-300">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-black shrink-0" />
                    <p className="font-black text-xs text-black uppercase tracking-wider">LSPB (Laporan Selisih)</p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded border border-black bg-red-500 text-white">
                      {unreadCount} LOAD SELISIH
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {lspbNotifications.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                      <p className="font-bold text-xs text-slate-800 uppercase">Tidak Ada Selisih (LSPB)</p>
                      <p className="text-[11px] text-slate-500">
                        Semua hasil pengecekan barang sesuai dengan data master CSV.
                      </p>
                    </div>
                  ) : (
                    lspbNotifications.map((n, idx) => {
                      const isNonBcl = n.type === 'non-bcl';
                      const route = isNonBcl ? '/lspb-non-bcl' : '/lspb-bcl';
                      const dateStr = new Date(n.submittedAt).toLocaleDateString("id-ID", {
                        dateStyle: "medium",
                      });
                      const timeStr = new Date(n.submittedAt).toLocaleTimeString("id-ID", {
                        timeStyle: "short",
                      });

                      return (
                        <div
                          key={`${n.loadNum}-${n.submittedAt}-${n.type}-${idx}`}
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(route);
                          }}
                          className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors bg-red-50/40"
                        >
                          <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border border-black bg-red-500 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-extrabold text-slate-900 leading-tight truncate">
                                Load #{n.loadNum}
                              </p>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black uppercase ${isNonBcl ? 'bg-purple-200 text-purple-900' : 'bg-emerald-200 text-emerald-900'}`}>
                                {isNonBcl ? 'NON BCL' : 'BCL'}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-red-600 mt-0.5">
                              {n.count} Item Selisih Terdeteksi
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Disubmit: {dateStr} · {timeStr}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
