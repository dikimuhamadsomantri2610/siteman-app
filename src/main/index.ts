import { app, shell, BrowserWindow } from 'electron'
import { join, dirname } from 'path'
import { config as loadDotenv } from 'dotenv'
import fs from 'fs'
import { getSitemanDirs } from './dirs'
import { registerIpcHandlers } from './ipc'

// ─── Fix GPU cache errors (common when app runs from OneDrive folder) ─────────
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

// ─── Load .env ────────────────────────────────────────────────────────────────
const envPaths = [
  join(process.cwd(), '.env'),
  join(dirname(app.getPath('exe')), '.env')
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    loadDotenv({ path: envPath })
    console.log('[App] Loaded .env from:', envPath)
    break
  }
}

const isDev = process.env.NODE_ENV === 'development'

// ─── Register IPC Handlers ───────────────────────────────────────────────────
registerIpcHandlers()

// ─── Create Window ────────────────────────────────────────────────────────────
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../build/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.siteman.app')
  }

  // Initialize directory structure on launch
  getSitemanDirs()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
