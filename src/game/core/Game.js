// src/game/core/Game.js
import { SceneRegistrationHelper } from './SceneRegistrationHelper';
import LoadingScene from './scenes/LoadingScene';
import MainMenuScene from './scenes/MainMenuScene';
import OptionsMenuScene from './scenes/OptionsMenuScene';
import MainScene from './scenes/MainScene';
import GameOverScene from './scenes/GameOverScene';
import PauseScene from './scenes/PauseScene';
import UIScene from './scenes/UIScene';
import { GAME_CONFIG, SCENES } from './constants';
import { GameSettings } from '../data/GameSettings';
import SimplePlaceholderAssets from '../../debug/SimplePlaceholderAssets';

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
  
  /**
   * ゲームを非同期で初期化する静的メソッド
   * @param {Object} customConfig - カスタム設定（オプション）
   * @returns {Promise<Game>} 初期化されたGameインスタンス
   */
  static async initialize(customConfig = {}) {
    // ゲームインスタンスを取得
    const game = Game.getInstance();
    
    // シーン登録ヘルパーを初期化
    if (!game.sceneHelper) {
      game.sceneHelper = new SceneRegistrationHelper();
    }

    await Promise.all([
      LoadingScene.initialize(),
      MainMenuScene.initialize(),
      OptionsMenuScene.initialize(),
      MainScene.initialize(),
      GameOverScene.initialize(),
      PauseScene.initialize(),
      UIScene.initialize()
    ]);

    console.log("登録前:", MainMenuScene, OptionsMenuScene);
    
    // 各シーンを登録
    game.sceneHelper.registerScenes({
      [SCENES.LOADING]: LoadingScene,
      [SCENES.MAIN_MENU]: MainMenuScene,
      [SCENES.OPTIONS_MENU]: OptionsMenuScene, 
      [SCENES.GAME]: MainScene,
      [SCENES.GAME_OVER]: GameOverScene,
      [SCENES.PAUSE]: PauseScene,
      [SCENES.UI]: UIScene
    });

    console.log("登録後:", game.sceneHelper.registeredSceneClasses);
    
    // シーンを初期化
    await game.sceneHelper.initializeAllScenes();
    
    // Phaserを動的にロード
    const Phaser = await game.loadPhaser();
    if (!Phaser) {
      throw new Error('Phaserのロードに失敗しました');
    }
    
    // デフォルトの設定とカスタム設定をマージ
    const baseConfig = {
      width: GAME_CONFIG.WIDTH,
      height: GAME_CONFIG.HEIGHT,
      parent: 'game-container',
      backgroundColor: '#000000',
      type: Phaser.AUTO,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: GAME_CONFIG.GRAVITY },
          debug: game.debugMode
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: game.sceneHelper.getSceneConfig(),
      audio: {
        disableWebAudio: false
      },
      render: {
        pixelArt: false,
        antialias: true
      }
    };
    
    // カスタム設定があれば上書き
    game.config = { ...baseConfig, ...customConfig };
    
    // ゲームインスタンスをまだ作成していなければ作成
    if (!game.instance) {
      game.instance = new Phaser.Game(game.config);
      
      // ゲーム設定の適用
      game.settings.applySettings(game.instance);
      
      // リサイズイベントのハンドラを設定
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', game.onResize.bind(game));
      }
      
      console.log('ゲームが初期化されました');
    }
    
    return game;
  }

  constructor() {
    // 既にインスタンスが存在する場合は既存のインスタンスを返す
    if (Game.instance) {
      return Game.instance;
    }
    
    // ゲーム設定の初期化
    this.settings = GameSettings.getInstance();
    
    // シーン登録ヘルパー
    this.sceneHelper = null;
    
    // ゲーム設定
    this.config = null;
    
    // Phaserインスタンス
    this.Phaser = null;
    
    // ゲームインスタンス
    this.instance = null;
    
    // シーン間でのデータ共有用
    this.registry = {
      playerData: null,
      currentLevel: null,
      gameTime: 0
    };
    
    // シングルトンインスタンスを設定
    Game.instance = this;

    // デバッグモード設定
    this.debugMode = process.env.NODE_ENV !== 'production';
    
    // デバッグモード時はコンソールにゲームインスタンスを露出
    if (this.debugMode && typeof window !== 'undefined') {
      window.game = this;
      console.log('🎮 デバッグモードが有効です');
    }
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
   * Phaserをロードする
   * @returns {Promise<any>} Phaserモジュール
   */
  async loadPhaser() {
    if (this.Phaser) return this.Phaser;
    
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') return null;
    
    try {
      // Phaserを動的にインポート
      const module = await import('phaser');
      this.Phaser = module.default || module;
      return this.Phaser;
    } catch (error) {
      console.error('Failed to load Phaser:', error);
      return null;
    }
  }
  
  /**
   * ゲームを初期化して起動する
   * @param {Object} customConfig - カスタム設定（オプション）
   * @returns {Promise<Game>} 初期化されたGameインスタンス
   */
  async init(customConfig = {}) {
    return Game.initialize(customConfig);
  }
  
  /**
   * ゲームを開始する
   */
  async start() {
    // インスタンスがない場合は初期化
    if (!this.instance) {
      await this.init();
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
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.onResize);
      }
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

// アプリケーションのエントリーポイント（オプション）
if (typeof window !== 'undefined' && !window.gameInitialized) {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // ローディング表示（オプション）
      const loadingElement = document.createElement('div');
      loadingElement.textContent = 'ゲームを読み込んでいます...';
      loadingElement.style.position = 'absolute';
      loadingElement.style.top = '50%';
      loadingElement.style.left = '50%';
      loadingElement.style.transform = 'translate(-50%, -50%)';
      loadingElement.style.fontSize = '24px';
      loadingElement.style.color = 'white';
      
      const container = document.getElementById('game-container') || document.body;
      container.appendChild(loadingElement);

      // デバッグモード判定
      const isDebugMode = window.location.search.includes('debug=true');

      // ゲーム初期化時にプレースホルダー設定
      if (isDebugMode) {
        console.log('🎮 デバッグモードが有効です');
        SimplePlaceholderAssets.setDebugMode(true);
        
        // 最初のシーン作成後に初期化するために、イベントを利用
        document.addEventListener('DOMContentLoaded', () => {
          // ゲーム初期化後にプレースホルダーを準備
          const gameStartInterval = setInterval(() => {
            const scene = window.game?.scene?.scenes?.[0];
            if (scene) {
              SimplePlaceholderAssets.initialize(scene);
              clearInterval(gameStartInterval);
            }
          }, 100);
        });
      }
      
      // ゲーム初期化
      await Game.initialize();
      
      // ローディング表示を削除
      container.removeChild(loadingElement);
      
      // 初期化フラグの設定
      window.gameInitialized = true;
    } catch (error) {
      console.error('ゲーム初期化エラー:', error);
      
      // エラーメッセージを表示
      const errorElement = document.createElement('div');
      errorElement.innerHTML = `
        <h3>ゲームの読み込みに失敗しました</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">再試行</button>
      `;
      errorElement.style.position = 'absolute';
      errorElement.style.top = '50%';
      errorElement.style.left = '50%';
      errorElement.style.transform = 'translate(-50%, -50%)';
      errorElement.style.textAlign = 'center';
      errorElement.style.padding = '20px';
      errorElement.style.background = 'rgba(200, 0, 0, 0.8)';
      errorElement.style.color = 'white';
      errorElement.style.borderRadius = '8px';
      
      const container = document.getElementById('game-container') || document.body;
      container.appendChild(errorElement);
    }
  });
}