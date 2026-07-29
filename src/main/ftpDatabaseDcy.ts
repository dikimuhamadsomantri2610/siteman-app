import fs from 'fs'
import { join } from 'path'
import { getSitemanDirs } from './dirs'

export const CSV_FTP_CONFIG = {
  get host() { return process.env.CSV_FTP_HOST || 'databasedcy.yogya.com' },
  get user() { return process.env.CSV_FTP_USER || 'bstbadmin' },
  get password() { return process.env.CSV_FTP_PASSWORD || '123456' }
}

const RECENT_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export async function checkFtpConnection(): Promise<boolean> {
  const net = require('net')
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(3000)
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(21, CSV_FTP_CONFIG.host)
  })
}

export async function listLoadCsvFromFtp(dcPengirim: string): Promise<{ success: boolean; files?: Array<{ name: string; size: number; mtime?: string }>; error?: string }> {
  const dcFolder = (dcPengirim || 'GBG').trim().toUpperCase()
  const remoteFolder = `/${dcFolder}`

  const ftp = require('basic-ftp')
  const client = new ftp.Client()
  client.ftp.verbose = false

  try {
    await client.access({
      host: CSV_FTP_CONFIG.host,
      user: CSV_FTP_CONFIG.user,
      password: CSV_FTP_CONFIG.password,
      secure: false
    })

    await client.cd(remoteFolder)
    const list = await client.list()
    client.close()

    const now = Date.now()

    const files = list
      .filter((f: any) => {
        if (!f.isFile) return false
        if (!f.name.toLowerCase().endsWith('.csv') && f.name.includes('.')) return false
        if (f.modifiedAt) {
          const modTime = new Date(f.modifiedAt).getTime()
          if (!isNaN(modTime) && (now - modTime) > RECENT_DAYS_MS) {
            return false
          }
        }
        return true
      })
      .map((f: any) => ({
        name: f.name,
        size: f.size,
        mtime: f.modifiedAt ? new Date(f.modifiedAt).toISOString() : undefined
      }))

    return { success: true, files }
  } catch (err: any) {
    try { client.close() } catch {}
    return { success: false, error: err?.message || `Gagal membaca daftar file dari FTP ${CSV_FTP_CONFIG.host}` }
  }
}

export async function downloadSingleCsvFromFtp(dcPengirim: string, fileName: string): Promise<{ success: boolean; filePath?: string; content?: string; error?: string }> {
  const dirs = getSitemanDirs()
  const targetDir = dirs.loadNumberCsv
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const dcFolder = (dcPengirim || 'GBG').trim().toUpperCase()
  const remotePath = `/${dcFolder}/${fileName}`
  const localFilePath = join(targetDir, fileName)

  const ftp = require('basic-ftp')
  const client = new ftp.Client()
  client.ftp.verbose = false

  try {
    await client.access({
      host: CSV_FTP_CONFIG.host,
      user: CSV_FTP_CONFIG.user,
      password: CSV_FTP_CONFIG.password,
      secure: false
    })

    console.log(`[FTP Single CSV] Downloading ${remotePath} to ${localFilePath}...`)
    await client.downloadTo(localFilePath, remotePath)
    client.close()

    const content = await fs.promises.readFile(localFilePath, 'utf-8')
    return { success: true, filePath: localFilePath, content }
  } catch (err: any) {
    try { client.close() } catch {}
    return { success: false, error: err?.message || `Gagal mengunduh ${fileName} dari FTP server` }
  }
}

export async function downloadLoadCsvFromFtp(dcPengirim: string): Promise<{ success: boolean; downloadedCount?: number; error?: string }> {
  const dirs = getSitemanDirs()
  const targetDir = dirs.loadNumberCsv
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const dcFolder = (dcPengirim || 'GBG').trim().toUpperCase()
  const remoteFolder = `/${dcFolder}`
  console.log(`[FTP Load CSV] Connecting to ${CSV_FTP_CONFIG.host} for folder ${remoteFolder}...`)

  const ftp = require('basic-ftp')
  const client = new ftp.Client()
  client.ftp.verbose = false

  try {
    await client.access({
      host: CSV_FTP_CONFIG.host,
      user: CSV_FTP_CONFIG.user,
      password: CSV_FTP_CONFIG.password,
      secure: false
    })

    console.log(`[FTP Load CSV] Connected. Navigating to ${remoteFolder}...`)
    await client.cd(remoteFolder)

    const fileList = await client.list()
    const now = Date.now()

    // Filter: only .csv files modified within the last RECENT_DAYS_MS
    const recentFiles = fileList.filter((file: any) => {
      if (!file.isFile) return false
      if (!file.name.toLowerCase().endsWith('.csv') && file.name.includes('.')) return false
      if (file.modifiedAt) {
        const modTime = new Date(file.modifiedAt).getTime()
        if (!isNaN(modTime) && (now - modTime) > RECENT_DAYS_MS) {
          return false
        }
      }
      return true
    })

    console.log(`[FTP Load CSV] Found ${fileList.length} total files, ${recentFiles.length} within last 7 days in ${remoteFolder}`)

    let downloadedCount = 0
    for (const file of recentFiles) {
      const localPath = join(targetDir, file.name)
      await client.downloadTo(localPath, file.name)
      downloadedCount++
      console.log(`[FTP Load CSV] Downloaded: ${file.name}`)
    }

    client.close()
    return { success: true, downloadedCount }
  } catch (err: any) {
    console.error('[FTP Load CSV] Primary basic-ftp error, attempting SFTP / curl fallback:', err)
    try {
      client.close()
    } catch {
      // ignore
    }

    // Fallback via ssh2-sftp-client
    try {
      const Client = require('ssh2-sftp-client')
      const sftp = new Client()
      await sftp.connect({
        host: CSV_FTP_CONFIG.host,
        port: 22,
        username: CSV_FTP_CONFIG.user,
        password: CSV_FTP_CONFIG.password,
        readyTimeout: 15000
      })
      const list = await sftp.list(remoteFolder)
      const now = Date.now()
      let downloadedCount = 0
      for (const item of list) {
        if (item.type !== '-') continue
        if (!item.name.toLowerCase().endsWith('.csv') && item.name.includes('.')) continue
        // Filter: only files modified within last RECENT_DAYS_MS
        if (item.modifyTime) {
          const modTime = typeof item.modifyTime === 'number'
            ? item.modifyTime * 1000  // ssh2-sftp-client returns Unix epoch seconds
            : new Date(item.modifyTime).getTime()
          if (!isNaN(modTime) && (now - modTime) > RECENT_DAYS_MS) continue
        }
        const localPath = join(targetDir, item.name)
        await sftp.fastGet(`${remoteFolder}/${item.name}`, localPath)
        downloadedCount++
        console.log(`[FTP Load CSV][SFTP] Downloaded: ${item.name}`)
      }
      await sftp.end()
      return { success: true, downloadedCount }
    } catch (fallbackErr: any) {
      console.error('[FTP Load CSV] SFTP fallback error:', fallbackErr)
    }

    return {
      success: false,
      error: err?.message || `Gagal mengunduh file CSV dari FTP server ${CSV_FTP_CONFIG.host}`
    }
  }
}
