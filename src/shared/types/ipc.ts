export interface SitemanFolderFile {
  name: string
  content: string
  path?: string
}

export interface FtpFileInfo {
  name: string
  size: number
  mtime?: string
}

export interface ElectronAPI {
  getSitemanDirs: () => Promise<Record<string, string>>
  saveSitemanFile: (
    folderKey: string,
    fileName: string,
    content: string
  ) => Promise<{ success: boolean; path?: string }>
  readSitemanFolderFiles: (folderKey: string) => Promise<SitemanFolderFile[]>
  openSitemanFolder: (folderKey: string) => Promise<{ success: boolean }>
  downloadSitemanMasterSftp: () => Promise<{ success: boolean; message?: string; count?: number }>
  downloadSitemanCsvFtp: (dcPengirim: string) => Promise<{ success: boolean; downloadedCount?: number; message?: string }>
  listSitemanCsvFtp: (dcPengirim: string) => Promise<{ success: boolean; files?: FtpFileInfo[]; message?: string; error?: string }>
  downloadSingleSitemanCsvFtp: (dcPengirim: string, fileName: string) => Promise<{ success: boolean; message?: string }>
  deleteLocalSitemanCsv: (fileName: string) => Promise<{ success: boolean; message?: string }>
  cleanupSitemanCsvFolder: () => Promise<{ success: boolean; deletedCount?: number }>
  cleanupSitemanCsvForSite: (siteToko: string) => Promise<{ success: boolean; deletedCount?: number }>
  purgeSitemanCsvFolder: () => Promise<{ success: boolean; deletedCount?: number }>
  checkDbConnection: () => Promise<{ success: boolean; message?: string }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
