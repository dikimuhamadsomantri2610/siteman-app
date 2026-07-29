import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getSitemanDirs: () => ipcRenderer.invoke('siteman:get-dirs'),
  saveSitemanFile: (folderKey: string, fileName: string, content: string) =>
    ipcRenderer.invoke('siteman:save-file', { folderKey, fileName, content }),
  readSitemanFolderFiles: (folderKey: string) =>
    ipcRenderer.invoke('siteman:read-folder-files', folderKey),
  openSitemanFolder: (folderKey: string) =>
    ipcRenderer.invoke('siteman:open-folder', folderKey),
  downloadSitemanMasterSftp: () =>
    ipcRenderer.invoke('siteman:download-master-sftp'),
  downloadSitemanCsvFtp: (dcPengirim: string) =>
    ipcRenderer.invoke('siteman:download-csv-ftp', dcPengirim),
  listSitemanCsvFtp: (dcPengirim: string) =>
    ipcRenderer.invoke('siteman:list-csv-ftp', dcPengirim),
  downloadSingleSitemanCsvFtp: (dcPengirim: string, fileName: string) =>
    ipcRenderer.invoke('siteman:download-single-csv-ftp', { dcPengirim, fileName }),
  deleteLocalSitemanCsv: (fileName: string) =>
    ipcRenderer.invoke('siteman:delete-local-csv', fileName),
  cleanupSitemanCsvFolder: () =>
    ipcRenderer.invoke('siteman:cleanup-csv-folder'),
  cleanupSitemanCsvForSite: (siteToko: string) =>
    ipcRenderer.invoke('siteman:cleanup-csv-for-site', siteToko),
  purgeSitemanCsvFolder: () =>
    ipcRenderer.invoke('siteman:purge-csv-folder'),
  checkDbConnection: () =>
    ipcRenderer.invoke('siteman:check-db-connection')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
