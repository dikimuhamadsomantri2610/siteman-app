import React from 'react'
import { useDbStatus } from '@/hooks/useDbStatus'

export function StatusBarFooter(): React.ReactNode {
  const { isConnected } = useDbStatus(10000)

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="border-[2.5px] border-black rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 bg-white/60 backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

          <div className="flex flex-col min-w-[200px]">
            <span className="text-[10px] font-black text-gray-500 mb-1 tracking-widest uppercase">Status FTP</span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </>
                ) : (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </>
                )}
              </span>
              <span className={`text-sm font-bold ${isConnected ? 'text-gray-900' : 'text-red-600'}`}>
                {isConnected === null ? 'Memeriksa...' : isConnected ? 'Tersambung' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex flex-col min-w-[200px]">
            <span className="text-[10px] font-black text-gray-500 mb-1 tracking-widest uppercase">Versi Sistem</span>
            <span className="text-sm font-bold text-gray-900">v1.0.0-development</span>
          </div>

        </div>
      </div>
    </footer>
  )
}
