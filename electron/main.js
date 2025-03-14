const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const url = require('url');
const fs = require('fs');

// ゲームデータの保存先ディレクトリ
const saveDirectory = path.join(app.getPath('userData'), 'saves');

// 保存ディレクトリが存在しない場合は作成
if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true });
}

let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Diablo-Like RPG',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 開発環境の場合はlocalhostのURL、本番環境の場合はローカルファイルを読み込む
  const startUrl = isDev 
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '../out/index.html'),
        protocol: 'file:',
        slashes: true
      });

  // URLを読み込む
  mainWindow.loadURL(startUrl);

  // 開発環境ではDevToolsを開く
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// アプリの準備ができたらウィンドウを作成
app.whenReady().then(createWindow);

// 全てのウィンドウが閉じられたときにアプリを終了（macOS以外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アクティブ化されたときにウィンドウがなければ作成（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ゲームデータ保存のIPC通信ハンドラ
ipcMain.handle('save-game', async (event, gameData) => {
  try {
    const saveSlot = gameData.saveSlot || 0;
    const savePath = path.join(saveDirectory, `save_${saveSlot}.json`);
    
    // ゲームデータをJSON形式で保存
    fs.writeFileSync(savePath, JSON.stringify(gameData, null, 2));
    
    return { 
      success: true, 
      message: `Game saved successfully to slot ${saveSlot}` 
    };
  } catch (error) {
    console.error('Error saving game:', error);
    return { 
      success: false, 
      message: `Failed to save game: ${error.message}` 
    };
  }
});

// ゲームデータ読み込みのIPC通信ハンドラ
ipcMain.handle('load-game', async (event, saveSlot = 0) => {
  try {
    const savePath = path.join(saveDirectory, `save_${saveSlot}.json`);
    
    // ファイルが存在するかチェック
    if (!fs.existsSync(savePath)) {
      return { 
        success: false, 
        message: `No save data found for slot ${saveSlot}` 
      };
    }
    
    // ゲームデータを読み込む
    const saveDataStr = fs.readFileSync(savePath, 'utf8');
    const gameData = JSON.parse(saveDataStr);
    
    return { 
      success: true, 
      gameData,
      message: `Game loaded successfully from slot ${saveSlot}` 
    };
  } catch (error) {
    console.error('Error loading game:', error);
    return { 
      success: false, 
      message: `Failed to load game: ${error.message}` 
    };
  }
});

// セーブデータの一覧を取得するIPC通信ハンドラ
ipcMain.handle('get-save-slots', async () => {
  try {
    const files = fs.readdirSync(saveDirectory);
    const saveSlots = [];
    
    // 保存ファイルをループして各スロットの基本情報を取得
    for (const file of files) {
      if (file.startsWith('save_') && file.endsWith('.json')) {
        const filePath = path.join(saveDirectory, file);
        const saveDataStr = fs.readFileSync(filePath, 'utf8');
        const saveData = JSON.parse(saveDataStr);
        
        // スロット番号を取得 (save_0.json -> 0)
        const slotMatch = file.match(/save_(\d+)\.json/);
        const slot = slotMatch ? parseInt(slotMatch[1]) : 0;
        
        // 必要な情報だけ抽出
        saveSlots.push({
          slot,
          playerClass: saveData.playerClass,
          playerLevel: saveData.playerLevel,
          difficulty: saveData.difficulty,
          currentLevel: saveData.currentLevel,
          lastSaved: fs.statSync(filePath).mtime
        });
      }
    }
    
    return { 
      success: true, 
      saveSlots: saveSlots.sort((a, b) => a.slot - b.slot) 
    };
  } catch (error) {
    console.error('Error getting save slots:', error);
    return { 
      success: false, 
      message: `Failed to get save slots: ${error.message}`, 
      saveSlots: [] 
    };
  }
});

// セーブデータを削除するIPC通信ハンドラ
ipcMain.handle('delete-save', async (event, saveSlot = 0) => {
  try {
    const savePath = path.join(saveDirectory, `save_${saveSlot}.json`);
    
    // ファイルが存在するかチェック
    if (!fs.existsSync(savePath)) {
      return { 
        success: false, 
        message: `No save data found for slot ${saveSlot}` 
      };
    }
    
    // セーブデータを削除
    fs.unlinkSync(savePath);
    
    return { 
      success: true, 
      message: `Save data deleted for slot ${saveSlot}` 
    };
  } catch (error) {
    console.error('Error deleting save:', error);
    return { 
      success: false, 
      message: `Failed to delete save: ${error.message}` 
    };
  }
});