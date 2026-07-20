"use client";
import { FileBarChart2 } from "lucide-react";

export default function ReportBclPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 shadow-2xl text-center max-w-lg w-full border border-white/10"
           style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)' }}>
        
        {/* Decorative blobs */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-violet-400/25 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-6 animate-pulse">
            <FileBarChart2 className="h-8 w-8 text-indigo-200" />
          </div>
          
          <span className="text-indigo-200 text-xs font-bold tracking-widest uppercase mb-2">
            Siteman Panel
          </span>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Report BCL
          </h1>
          
          <p className="text-indigo-200/85 text-sm sm:text-base max-w-sm leading-relaxed">
            Halaman laporan BCL sedang dalam tahap pengembangan. Silakan hubungi administrator untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    </div>
  );
}
