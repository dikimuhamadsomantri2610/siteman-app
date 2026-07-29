import fs from 'fs'
import { join } from 'path'

export interface SitemanDirs {
  rootDrive: string
  base: string
  loadNumberCsv: string
  reportCsv: string
  lspbBcl: string
  lspbNonBcl: string
  barcodeMasterItem: string
}

export function getSitemanDirs(): SitemanDirs {
  let rootDrive = 'D:\\'
  try {
    if (!fs.existsSync('D:\\')) {
      rootDrive = 'C:\\'
    }
  } catch {
    rootDrive = 'C:\\'
  }

  const baseDir = join(rootDrive, 'siteman')
  const dirs: SitemanDirs = {
    rootDrive,
    base: baseDir,
    loadNumberCsv: join(baseDir, 'load-number-csv'),
    reportCsv: join(baseDir, 'report-csv'),
    lspbBcl: join(baseDir, 'lspb-bcl'),
    lspbNonBcl: join(baseDir, 'lspb-non-bcl'),
    barcodeMasterItem: join(baseDir, 'barcode-master-item')
  }

  // Auto-create directories if they do not exist
  Object.values(dirs).forEach((dirPath) => {
    if (typeof dirPath === 'string' && dirPath.length > 3 && !fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log('[Siteman Dirs] Created directory:', dirPath)
      } catch (err) {
        console.error('[Siteman Dirs] Error creating directory:', dirPath, err)
      }
    }
  })

  return dirs
}
