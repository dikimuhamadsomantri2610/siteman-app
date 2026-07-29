import { ipcMain, shell } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { getSitemanDirs } from './dirs'
import { downloadMasterFromSftp } from './ftpCentral'
import { downloadLoadCsvFromFtp, listLoadCsvFromFtp, downloadSingleCsvFromFtp, checkFtpConnection } from './ftpDatabaseDcy'

export function registerIpcHandlers(): void {
  ipcMain.handle('siteman:check-db-connection', async () => {
    const ok = await checkFtpConnection()
    return { success: ok }
  })

  ipcMain.handle('siteman:get-dirs', () => {
    return getSitemanDirs()
  })

  ipcMain.handle(
    'siteman:save-file',
    async (_, { folderKey, fileName, content }: { folderKey: string; fileName: string; content: string }) => {
      const dirs = getSitemanDirs()
      const targetDir = (dirs as any)[folderKey] || dirs.base
      const filePath = join(targetDir, fileName)
      await fs.promises.writeFile(filePath, content, 'utf-8')
      console.log('[Siteman File] Saved file to:', filePath)
      return { success: true, filePath }
    }
  )

  ipcMain.handle('siteman:read-folder-files', async (_, folderKey: string) => {
    const dirs = getSitemanDirs()
    const targetDir = (dirs as any)[folderKey] || dirs.base
    if (!fs.existsSync(targetDir)) return []

    try {
      const filenames = await fs.promises.readdir(targetDir)
      const fileDetails = await Promise.all(
        filenames.map(async (name) => {
          const fullPath = join(targetDir, name)
          const stat = await fs.promises.stat(fullPath)
          if (!stat.isFile()) return null

          let content = ''
          if (stat.size < 100 * 1024 * 1024) {
            // Read files up to 100MB
            try {
              content = await fs.promises.readFile(fullPath, 'utf-8')
            } catch {
              try {
                content = await fs.promises.readFile(fullPath, 'latin1')
              } catch (err) {
                console.error('[Read File] Failed reading file:', fullPath, err)
              }
            }
          }
          return {
            name,
            path: fullPath,
            size: stat.size,
            mtime: stat.mtime,
            content
          }
        })
      )
      return fileDetails.filter(Boolean)
    } catch (err) {
      console.error('[Read Folder] Error reading files in folder:', folderKey, err)
      return []
    }
  })

  ipcMain.handle('siteman:open-folder', async (_, folderKey: string) => {
    const dirs = getSitemanDirs()
    const targetDir = (dirs as any)[folderKey] || dirs.base
    await shell.openPath(targetDir)
    return { success: true }
  })

  ipcMain.handle('siteman:download-master-sftp', async () => {
    return await downloadMasterFromSftp()
  })

  ipcMain.handle('siteman:download-csv-ftp', async (_, dcPengirim: string) => {
    return await downloadLoadCsvFromFtp(dcPengirim)
  })

  ipcMain.handle('siteman:list-csv-ftp', async (_, dcPengirim: string) => {
    return await listLoadCsvFromFtp(dcPengirim)
  })

  ipcMain.handle('siteman:download-single-csv-ftp', async (_, { dcPengirim, fileName }: { dcPengirim: string; fileName: string }) => {
    return await downloadSingleCsvFromFtp(dcPengirim, fileName)
  })

  /**
   * Scan all CSV files in loadNumberCsv and delete any that do NOT contain
   * the given siteToko string in their content (fast grep, no full CSV parse).
   */
  ipcMain.handle('siteman:cleanup-csv-for-site', async (_, siteToko: string) => {
    if (!siteToko || !siteToko.trim()) {
      return { success: false, error: 'No siteToko provided' }
    }
    const siteKey = siteToko.trim().replace(/^0+/, '') // strip leading zeros for flexible match
    const dirs = getSitemanDirs()
    const targetDir = dirs.loadNumberCsv
    if (!fs.existsSync(targetDir)) return { success: true, deleted: 0, kept: 0 }

    let deleted = 0
    let kept = 0
    try {
      const entries = await fs.promises.readdir(targetDir, { withFileTypes: true })
      for (const entry of entries) {
        const entryPath = join(targetDir, entry.name)
        if (entry.isDirectory()) {
          // Remove stray subdirectories left by FTP client
          fs.rmSync(entryPath, { recursive: true, force: true })
          console.log('[Delete CSV] Removed stray dir:', entryPath)
          deleted++
          continue
        }
        if (!entry.isFile()) continue

        // Read file content and check if siteToko appears anywhere in it
        try {
          const content = await fs.promises.readFile(entryPath, 'utf-8').catch(() =>
            fs.promises.readFile(entryPath, 'latin1')
          )
          const hassite = content.includes(siteToko.trim()) || content.includes(siteKey)
          if (hassite) {
            kept++
          } else {
            await fs.promises.unlink(entryPath)
            console.log('[Delete CSV] Deleted file:', entryPath)
            deleted++
          }
        } catch {
          // If we can't read it, delete it
          try { await fs.promises.unlink(entryPath) } catch {}
          deleted++
        }
      }
      console.log(`[Delete CSV] Done: kept=${kept}, deleted=${deleted} (site=${siteToko})`)
      return { success: true, deleted, kept }
    } catch (err: any) {
      console.error('[Delete CSV] Error during cleanup:', err)
      return { success: false, error: err?.message }
    }
  })

  ipcMain.handle('siteman:delete-local-csv', async (_, fileName: string) => {
    if (!fileName || !fileName.trim()) {
      return { success: false, error: 'No filename provided' }
    }
    const dirs = getSitemanDirs()
    const filePath = join(dirs.loadNumberCsv, fileName.trim())
    // Security: ensure the resolved path stays within the target directory
    if (!filePath.startsWith(dirs.loadNumberCsv)) {
      return { success: false, error: 'Invalid path' }
    }
    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true })
          console.log('[Delete CSV] Deleted dir:', filePath)
        } else {
          await fs.promises.unlink(filePath)
          console.log('[Delete CSV] Deleted file:', filePath)
        }
        return { success: true }
      }
      return { success: false, error: 'File not found' }
    } catch (err: any) {
      console.error('[Delete CSV] Error deleting:', filePath, err)
      return { success: false, error: err?.message }
    }
  })

  /** Remove any leftover subdirectories inside loadNumberCsv (created by FTP client) */
  ipcMain.handle('siteman:cleanup-csv-folder', async () => {
    const dirs = getSitemanDirs()
    const targetDir = dirs.loadNumberCsv
    if (!fs.existsSync(targetDir)) return { success: true, cleaned: 0 }
    let cleaned = 0
    try {
      const entries = await fs.promises.readdir(targetDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = join(targetDir, entry.name)
          fs.rmSync(dirPath, { recursive: true, force: true })
          console.log('[Cleanup CSV Folder] Removed subfolder:', dirPath)
          cleaned++
        }
      }
      return { success: true, cleaned }
    } catch (err: any) {
      return { success: false, error: err?.message }
    }
  })

  /** Delete ALL files and subfolders inside loadNumberCsv (nuclear purge) */
  ipcMain.handle('siteman:purge-csv-folder', async () => {
    const dirs = getSitemanDirs()
    const targetDir = dirs.loadNumberCsv
    if (!fs.existsSync(targetDir)) return { success: true, deleted: 0 }
    let deleted = 0
    try {
      const entries = await fs.promises.readdir(targetDir, { withFileTypes: true })
      for (const entry of entries) {
        const entryPath = join(targetDir, entry.name)
        if (entry.isDirectory()) {
          fs.rmSync(entryPath, { recursive: true, force: true })
        } else {
          await fs.promises.unlink(entryPath)
        }
        deleted++
        console.log('[Purge CSV Folder] Deleted:', entryPath)
      }
      return { success: true, deleted }
    } catch (err: any) {
      console.error('[Purge CSV Folder] Error:', err)
      return { success: false, error: err?.message }
    }
  })
}