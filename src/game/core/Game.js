// src/game/core/Game.js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';
import { LoadingScene } from './scenes/LoadingScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { OptionsMenuScene } from './scenes/OptionsMenuScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PauseScene } from './scenes/PauseScene';
import { GAME_CONFIG, SCENES } from './constants';
import { GameSettings } from '../data/GameSettings';

/**
 * ゲームのシングルトンインスタンスを管理するクラス
 */
export class Game {
  static instance = null;

  /**
   * シングルトンインスタンスを取得
   * @returns {Game} Gameのインスタンス
   */
  static getInstance() {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }

  constructor() {
    // 既にインスタンスが存在する場合は既存のインスタンスを返す
    if (Game.instance) {
      return Game.instance;
    }
    
    // ゲーム設定の初期化
    this.settings = GameSettings.getInstance();
    
    // Phaserの設定
    this.config = {
      type: Phaser.AUTO,
      width: GAME_CONFIG.WIDTH,
      height: GAME_CONFIG.HEIGHT,
      parent: 'game-container',
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: GAME_CONFIG.GRAVITY },
          debug: false
        }
      },
      scene: [
        BootScene,
        PreloadScene,
        LoadingScene,
        MainMenuScene,
        OptionsMenuScene,
        GameScene,
        GameOverScene,
        PauseScene
      ],
      audio: {
        disableWebAudio: false
      },
      render: {
        pixelArt: false,
        antialias: true
      }
    };
    
    // ゲームインスタンスは初期化時には作成しない
    this.instance = null;
    
    // シーン間でのデータ共有用
    this.registry = {
      playerData: null,
      currentLevel: null,
      gameTime: 0
    };
    
    // シングルトンインスタンスを設定
    Game.instance = this;
  }
  
  /**
   * ウィンドウリサイズ時の処理
   */
  onResize() {
    if (this.instance && this.instance.isBooted) {
      this.instance.scale.refresh();
    }
  }
  
  /**
   * ゲームを初期化して起動する
   */
  init() {
    if (!this.instance) {
      this.instance = new Phaser.Game(this.config);
      
      // ゲーム設定の適用
      this.settings.applySettings(this.instance);
      
      // リサイズイベントのハンドラを設定
      window.addEventListener('resize', this.onResize.bind(this));
    }
    return this;
  }
  
  /**
   * ゲームを開始する
   */
  start() {
    // インスタンスがない場合は初期化
    if (!this.instance) {
      this.init();
    }
    
    // ゲームが既に起動している場合は何もしない
    if (this.instance && !this.instance.isRunning) {
      this.instance.start();
    }
    
    return this;
  }
  
  /**
   * ゲームを停止して破棄する
   */
  destroy() {
    if (this.instance) {
      this.instance.destroy(true);
      this.instance = null;
      window.removeEventListener('resize', this.onResize);
    }
  }
  
  /**
   * 特定のシーンを開始する
   * @param {string} sceneKey - 開始するシーンのキー
   * @param {Object} data - シーンに渡すデータ
   */
  startScene(sceneKey, data = {}) {
    if (this.instance && this.instance.scene.getScene(sceneKey)) {
      this.instance.scene.start(sceneKey, data);
    } else {
      console.error(`Scene ${sceneKey} not found`);
    }
  }
  
  /**
   * メインメニューに戻る
   */
  returnToMainMenu() {
    this.startScene(SCENES.MAIN_MENU);
  }
  
  /**
   * ゲームオーバー画面を表示
   * @param {Object} data - ゲームオーバーの情報
   */
  gameOver(data = {}) {
    this.startScene(SCENES.GAME_OVER, data);
  }
  
  /**
   * 新しいゲームを開始
   */
  newGame() {
    this.startScene(SCENES.GAME);
  }
  
  /**
   * オプション画面を開く
   */
  openOptions() {
    this.startScene(SCENES.OPTIONS_MENU);
  }
  
  /**
   * ゲームをポーズする
   */
  pauseGame() {
    if (this.instance && this.instance.scene.isActive(SCENES.GAME)) {
      this.instance.scene.pause(SCENES.GAME);
      this.instance.scene.launch(SCENES.PAUSE);
    }
  }
  
  /**
   * ゲームを再開する
   */
  resumeGame() {
    if (this.instance && this.instance.scene.isPaused(SCENES.GAME)) {
      this.instance.scene.resume(SCENES.GAME);
      this.instance.scene.stop(SCENES.PAUSE);
    }
  }
  
  /**
   * ゲームデータを保存する
   * @param {string|number} slot - セーブスロット
   * @param {Object} data - 保存するゲームデータ
   * @returns {Promise<boolean>} 保存が成功したかどうかを返すPromise
   */
  async saveGameData(slot, data) {
    try {
      const saveKey = `diablo-rpg-save-${slot}`;
      const saveData = JSON.stringify({
        ...data,
        timestamp: Date.now()
      });
      
      localStorage.setItem(saveKey, saveData);
      console.log(`Game saved to slot ${slot}`);
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      return false;
    }
  }
  
  /**
   * ゲームデータをロードする
   * @param {string|number} slot - ロードするセーブスロット
   * @returns {Promise<Object|null>} ロードしたゲームデータを返すPromise、データがない場合はnull
   */
  async loadGameData(slot) {
    try {
      const saveKey = `diablo-rpg-save-${slot}`;
      const saveData = localStorage.getItem(saveKey);
      
      if (!saveData) {
        return null;
      }
      
      const parsedData = JSON.parse(saveData);
      console.log(`Game loaded from slot ${slot}`);
      return parsedData;
    } catch (error) {
      console.error('Error loading game:', error);
      return null;
    }
  }
}