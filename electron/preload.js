const { contextBridge, ipcRenderer } = require('electron');

// Electronの機能をブラウザ環境に公開
contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (gameData) => ipcRenderer.invoke('save-game', gameData),
  loadGame: () => ipcRenderer.invoke('load-game'),
  // 他にElectronの機能を追加可能
});