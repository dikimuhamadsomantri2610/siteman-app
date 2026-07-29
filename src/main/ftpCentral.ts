import fs from 'fs'
import { join } from 'path'
import { getSitemanDirs } from './dirs'

export interface SftpDownloadResult {
  success: boolean
  filePath?: string
  fileName?: string
  size?: number
  content?: string
  error?: string
}

export const SFTP_CONFIG = {
  get host() { return process.env.SFTP_HOST || 'central.yogya.com' },
  get port() { return Number(process.env.SFTP_PORT) || 2254 },
  get username() { return process.env.SFTP_USER || 'yomart' },
  get password() { return process.env.SFTP_PASSWORD || 'yomart147258369' },
  get remotePath() { return process.env.SFTP_REMOTE_PATH || '/data/u01/data/rollout/sku_MASTER_ALL_NEW_YM' },
  fileName: 'sku_MASTER_ALL_NEW_YM'
}

export async function downloadMasterFromSftp(): Promise<SftpDownloadResult> {
  const dirs = getSitemanDirs()
  const targetDir = dirs.barcodeMasterItem
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  const localFilePath = join(targetDir, SFTP_CONFIG.fileName)

  console.log(`[SFTP Download] Connecting to ${SFTP_CONFIG.host}:${SFTP_CONFIG.port}...`)

  try {
    const Client = require('ssh2-sftp-client')
    const sftp = new Client()
    await sftp.connect({
      host: SFTP_CONFIG.host,
      port: SFTP_CONFIG.port,
      username: SFTP_CONFIG.username,
      password: SFTP_CONFIG.password,
      readyTimeout: 10000
    })

    console.log(`[SFTP Download] Connected. Downloading ${SFTP_CONFIG.remotePath}...`)
    await sftp.fastGet(SFTP_CONFIG.remotePath, localFilePath)
    await sftp.end()

    console.log('[SFTP Download] Success:', localFilePath)
    const stat = await fs.promises.stat(localFilePath)
    const content = await fs.promises.readFile(localFilePath, 'utf-8')

    return {
      success: true,
      filePath: localFilePath,
      fileName: SFTP_CONFIG.fileName,
      size: stat.size,
      content
    }
  } catch (err: any) {
    console.error('[SFTP Download] Connection failed:', err?.message || err)

    // Fallback: Check if local file exists in barcodeMasterItem directory
    try {
      if (fs.existsSync(localFilePath)) {
        const stat = await fs.promises.stat(localFilePath)
        const content = await fs.promises.readFile(localFilePath, 'utf-8')
        console.log('[SFTP Download] Loaded existing local master file as fallback.')
        return {
          success: true,
          filePath: localFilePath,
          fileName: SFTP_CONFIG.fileName,
          size: stat.size,
          content,
          error: `Mode Offline: Menggunakan master lokal (SFTP ${SFTP_CONFIG.host} tidak dijangkau)`
        }
      }
    } catch {
      // ignore
    }

    return {
      success: false,
      error: `Gagal terhubung ke SFTP Server (${SFTP_CONFIG.host}:${SFTP_CONFIG.port}). Pastikan komputer terhubung ke jaringan kantor / VPN Yogya.`
    }
  }
}
