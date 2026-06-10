const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
  listProtocols: () => ipcRenderer.invoke('list-protocols'),
  loadProtocol: (id) => ipcRenderer.invoke('load-protocol', id),
  saveProtocol: (protocol) => ipcRenderer.invoke('save-protocol', protocol),
  deleteProtocol: (id) => ipcRenderer.invoke('delete-protocol', id),
  exportProtocol: (id) => ipcRenderer.invoke('export-protocol', id),
  importStage: () => ipcRenderer.invoke('import-stage'),
  importCommit: (item, action) => ipcRenderer.invoke('import-commit', item, action),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  verifyHash: (version) => ipcRenderer.invoke('verify-hash', version),
  updateHistory: (id, history) => ipcRenderer.invoke('update-history', id, history),
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
