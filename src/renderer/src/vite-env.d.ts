/// <reference types="vite/client" />
import type { ElectronAPI } from '@shared/types/ipc'

declare module '*.svg' {
  import React from 'react'
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
