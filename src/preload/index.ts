import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,

  // IPC methods
  invoke: (channel: string, ...args: unknown[]) => {
    const validChannels = ['save-recording', 'delete-recording', 'get-save-path']
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    throw new Error(`Invalid channel: ${channel}`)
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = ['recording-saved', 'error']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args))
    }
  }
})
