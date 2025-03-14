const { contextBridge, ipcRenderer } = require('electron');

// Electronの機能をブラウザ環境に公開
contextBridge.exposeInMainWorld('electronAPI', {
  // ゲームデータの保存
  saveGame: (gameData) => ipcRenderer.invoke('save-game', gameData),
  
  // ゲームデータの読み込み
  loadGame: (saveSlot) => ipcRenderer.invoke('load-game', saveSlot),
  
  // セーブデータの一覧を取得
  getSaveSlots: () => ipcRenderer.invoke('get-save-slots'),
  
  // セーブデータの削除
  deleteSave: (saveSlot) => ipcRenderer.invoke('delete-save', saveSlot),
  
  // Electronかどうかの判定用フラグ
  isElectron: true
});