import Phaser from 'phaser';
import IsometricPlugin from 'phaser3-plugin-isometric';
import MainScene from './scenes/MainScene';
import UIScene from './scenes/UIScene';
import LoadingScene from './scenes/LoadingScene';
import MenuScene from './scenes/MenuScene';
import GameOverScene from './scenes/GameOverScene';

class Game {
  constructor() {
    this.config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      backgroundColor: '#000000',
      parent: 'game-container',
      scene: [LoadingScene, MenuScene, MainScene, UIScene, GameOverScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      plugins: {
        global: [
          { key: 'IsometricPlugin', plugin: IsometricPlugin, start: true }
        ]
      },
      // アイソメトリックの射影設定
      isometricProjection: {
        projectionAngle: 30, // 投影角度（度）
        depth: 1            // 深さスケール
      },
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };
    
    this.game = null;
    this.events = null;
    
    // ゲームの状態管理
    this.gameState = {
      currentLevel: 1,
      playerLevel: 1,
      playerClass: 'warrior',
      difficulty: 'normal', // 'normal', 'nightmare', 'hell'
      hasCompanion: false,
      companionType: 'rogue',
      unlockedSkills: [],
      inventory: [],
      gold: 0,
      maxLevels: {
        normal: 30,
        nightmare: 60,
        hell: 100
      },
      saveSlot: 0,
      // 進行状況
      progress: {
        normal: { currentLevel: 1, completed: false },
        nightmare: { currentLevel: 1, completed: false },
        hell: { currentLevel: 1, completed: false }
      }
    };
  }

  /**
   * ゲームの初期化
   */
  init() {
    // Phaserインスタンスの作成
    this.game = new Phaser.Game(this.config);
    
    // グローバルイベントエミッターの設定
    this.events = new Phaser.Events.EventEmitter();
    
    // ブラウザのリサイズ対応
    window.addEventListener('resize', this.onResize.bind(this));
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    return this;
  }

  /**
   * リサイズイベントハンドラ
   */
  onResize() {
    if (this.game) {
      this.game.scale.resize(window.innerWidth, window.innerHeight);
    }
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // ゲーム開始イベント
    this.events.on('game-started', (data) => {
      console.log('Game started:', data);
    });
    
    // ゲームオーバーイベント
    this.events.on('game-over', () => {
      console.log('Game over');
    });
    
    // 難易度変更イベント
    this.events.on('difficulty-changed', (difficulty) => {
      console.log('Difficulty changed:', difficulty);
      this.gameState.difficulty = difficulty;
    });
    
    // プレイヤーレベルアップイベント
    this.events.on('player-level-up', (level) => {
      console.log('Player level up:', level);
      this.gameState.playerLevel = level;
    });
    
    // フロア変更イベント
    this.events.on('floor-changed', (floor) => {
      console.log('Floor changed:', floor);
      this.gameState.currentLevel = floor;
      
      // 現在の難易度の進行状況を更新
      const difficultyProgress = this.gameState.progress[this.gameState.difficulty];
      if (difficultyProgress) {
        difficultyProgress.currentLevel = Math.max(difficultyProgress.currentLevel, floor);
      }
      
      // 最大レベルに達したら難易度クリアフラグをセット
      const maxLevel = this.gameState.maxLevels[this.gameState.difficulty];
      if (floor >= maxLevel) {
        this.gameState.progress[this.gameState.difficulty].completed = true;
      }
    });
  }

  /**
   * 指定のシーンを取得
   * @param {string} key - シーンキー
   * @returns {Phaser.Scene} シーンオブジェクト
   */
  getScene(key) {
    return this.game ? this.game.scene.getScene(key) : null;
  }

  /**
   * ゲームの難易度を設定
   * @param {string} difficulty - 難易度 ('normal', 'nightmare', 'hell')
   */
  setDifficulty(difficulty) {
    if (['normal', 'nightmare', 'hell'].includes(difficulty)) {
      this.gameState.difficulty = difficulty;
      this.events.emit('difficulty-changed', difficulty);
    }
  }

  /**
   * 現在の難易度での最大レベルを取得
   * @returns {number} 最大レベル
   */
  getCurrentMaxLevel() {
    return this.gameState.maxLevels[this.gameState.difficulty];
  }

  /**
   * ゲームを新規開始
   * @param {object} options - ゲーム開始オプション
   */
  startNewGame(options = {}) {
    // デフォルトオプションとマージ
    const gameOptions = {
      playerClass: options.playerClass || 'warrior',
      difficulty: options.difficulty || 'normal',
      hasCompanion: options.hasCompanion || false,
      companionType: options.companionType || 'rogue',
      saveSlot: options.saveSlot || 0
    };
    
    // ゲーム状態をリセット
    this.gameState = {
      ...this.gameState,
      currentLevel: 1,
      playerLevel: 1,
      playerClass: gameOptions.playerClass,
      difficulty: gameOptions.difficulty,
      hasCompanion: gameOptions.hasCompanion,
      companionType: gameOptions.companionType,
      unlockedSkills: [],
      inventory: [],
      gold: 100, // 初期所持金
      saveSlot: gameOptions.saveSlot
    };
    
    // メインシーンを開始
    this.game.scene.start('MainScene', { gameData: this.gameState });
  }

  /**
   * 保存されたゲームを読み込む
   * @param {number} saveSlot - セーブスロット番号
   */
  loadGame(saveSlot = 0) {
    // ローカルストレージからゲームデータを読み込み
    const savedData = this.loadGameData(saveSlot);
    
    if (savedData) {
      // 読み込んだデータでゲーム状態を更新
      this.gameState = { ...this.gameState, ...savedData, saveSlot };
      
      // メインシーンを開始
      this.game.scene.start('MainScene', { gameData: this.gameState });
    } else {
      console.error('No saved game data found for slot:', saveSlot);
      
      // セーブデータがない場合はメニューに戻る
      this.goToMenu();
    }
  }

  /**
   * 現在のゲームをセーブ
   */
  saveGame() {
    // 現在のシーンからゲームデータを取得
    const mainScene = this.getScene('MainScene');
    if (mainScene) {
      // シーンからプレイヤーデータを取得
      if (mainScene.player) {
        this.gameState.playerLevel = mainScene.player.level;
        
        // その他の必要なデータを取得
        // ...
      }
      
      // ゲームデータをローカルストレージに保存
      this.saveGameData(this.gameState.saveSlot, this.gameState);
      
      return true;
    }
    
    return false;
  }

  /**
   * ゲームデータをローカルストレージに保存
   * @param {number} slot - セーブスロット
   * @param {object} data - 保存するデータ
   */
  saveGameData(slot, data) {
    try {
      localStorage.setItem(`diablo_rpg_save_${slot}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving game data:', error);
      return false;
    }
  }

  /**
   * ローカルストレージからゲームデータを読み込み
   * @param {number} slot - セーブスロット
   * @returns {object|null} 読み込んだデータ、またはnull
   */
  loadGameData(slot) {
    try {
      const savedData = localStorage.getItem(`diablo_rpg_save_${slot}`);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error('Error loading game data:', error);
      return null;
    }
  }

  /**
   * メニュー画面へ遷移
   */
  goToMenu() {
    this.game.scene.start('MenuScene');
  }

  /**
   * ゲームオーバー画面へ遷移
   */
  goToGameOver() {
    this.game.scene.start('GameOverScene', { gameData: this.gameState });
  }

  /**
   * 次の難易度に進む（現在の難易度完了後）
   */
  progressToDifficulty() {
    const currentDifficulty = this.gameState.difficulty;
    let nextDifficulty = currentDifficulty;
    
    // 次の難易度を決定
    if (currentDifficulty === 'normal') {
      nextDifficulty = 'nightmare';
    } else if (currentDifficulty === 'nightmare') {
      nextDifficulty = 'hell';
    }
    
    // 現在の難易度と同じ場合は何もしない
    if (nextDifficulty === currentDifficulty) {
      return false;
    }
    
    // 難易度を更新
    this.gameState.difficulty = nextDifficulty;
    this.gameState.currentLevel = 1;
    
    // プレイヤーのレベルと能力値は保持される
    
    // メインシーンをリスタート
    this.game.scene.start('MainScene', { gameData: this.gameState });
    
    return true;
  }

  /**
   * ゲームリソースの解放
   */
  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    
    if (this.events) {
      this.events.removeAllListeners();
      this.events = null;
    }
    
    window.removeEventListener('resize', this.onResize);
  }
}

// シングルトンとしてエクスポート
const gameInstance = new Game();
export default gameInstance;