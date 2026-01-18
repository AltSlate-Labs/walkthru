import { app, BrowserWindow, ipcMain, dialog, desktopCapturer, session } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  // Set up display media request handler for getDisplayMedia support
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })

    // Use the first screen source
    const screenSource = sources.find(s => s.id.startsWith('screen:')) || sources[0]

    if (screenSource) {
      callback({ video: screenSource, audio: 'loopback' })
    } else {
      callback({})
    }
  })

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Generate filename with timestamp
function generateFilename(): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const time = now.toTimeString().slice(0, 5).replace(':', '')
  return `recording-${date}-${time}.webm`
}

// Get default recordings directory
function getDefaultRecordingsDir(): string {
  const homeDir = app.getPath('home')
  const moviesDir = path.join(homeDir, 'Movies', 'Walkthru')

  if (!fs.existsSync(moviesDir)) {
    fs.mkdirSync(moviesDir, { recursive: true })
  }

  return moviesDir
}

// IPC Handlers
ipcMain.handle('save-recording', async (_event, data: number[]) => {
  const defaultPath = path.join(getDefaultRecordingsDir(), generateFilename())

  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath,
    filters: [{ name: 'WebM Video', extensions: ['webm'] }]
  })

  if (canceled || !filePath) {
    return { success: false, reason: 'cancelled' }
  }

  try {
    const buffer = Buffer.from(data)
    fs.writeFileSync(filePath, buffer)
    return { success: true, filePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, reason: message }
  }
})

ipcMain.handle('get-save-path', async () => {
  return getDefaultRecordingsDir()
})

// App lifecycle
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
