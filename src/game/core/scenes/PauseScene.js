// src/game/core/scenes/PauseScene.js

// Phaserを動的にロードするためのユーティリティ
let PhaserModule = null;

// 非同期でPhaserをロードする関数
async function getPhaserModule() {
  if (PhaserModule) return PhaserModule;
  
  try {
    PhaserModule = await import('phaser');
    return PhaserModule;
  } catch (error) {
    console.error('Failed to load Phaser:', error);
    throw error;
  }
}

// SceneクラスをPhaserから取得するユーティリティ関数
async function getSceneClass() {
  const phaser = await getPhaserModule();
  return phaser.Scene || phaser.default.Scene;
}

import { SCENES } from '../constants';

export default class PauseScene {
  // 静的なシーンインスタンスを保持
  static instance = null;
  
  /**
   * Phaserシーンのインスタンス化前に非同期で初期化する
   */
  static async initialize() {
    if (PauseScene.instance) return PauseScene.instance;
    
    const Scene = await getSceneClass();
    
    // Sceneを継承した実装クラス
    class PauseSceneImpl extends Scene {
      constructor() {
        super({ key: SCENES.PAUSE });
      }
    
      preload() {
        // ポーズ画面用のアセット
        this.load.image('pause-overlay', 'assets/images/ui/pause_overlay.png');
      }
    
      create() {
        // 背景をやや暗く
        const overlay = this.add.rectangle(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2,
          this.cameras.main.width,
          this.cameras.main.height,
          0x000000, 
          0.7
        );
        
        // ポーズメニューのコンテナ
        const menuContainer = this.add.container(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2 - 50
        );
        
        // ポーズタイトル
        const pauseTitle = this.add.text(0, -120, 'ゲーム一時停止', {
          fontSize: '36px',
          fontFamily: 'Arial Black',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6,
          shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, stroke: true, fill: true }
        }).setOrigin(0.5);
        
        menuContainer.add(pauseTitle);
        
        // メニューボタン
        const resumeButton = this.createMenuButton(0, -40, 'ゲームに戻る', () => {
          this.resumeGame();
        });
        
        const optionsButton = this.createMenuButton(0, 20, 'オプション', () => {
          this.scene.launch(SCENES.OPTIONS_MENU);
          this.scene.pause();
        });
        
        const mainMenuButton = this.createMenuButton(0, 80, 'メインメニューへ', () => {
          if (window.confirm('メインメニューに戻りますか？\n進行状況は失われます。')) {
            this.scene.stop(SCENES.GAME);
            this.scene.start(SCENES.MAIN_MENU);
          }
        });
        
        menuContainer.add([resumeButton.container, optionsButton.container, mainMenuButton.container]);
        
        // ESCキーで再開
        this.input.keyboard.on('keydown-ESC', () => {
          this.resumeGame();
        });
        
        // ポーズメニュー出現アニメーション
        this.tweens.add({
          targets: menuContainer,
          y: this.cameras.main.height / 2,
          alpha: { from: 0, to: 1 },
          duration: 300,
          ease: 'Power2'
        });
      }
      
      /**
       * メニューボタンを作成
       * @param {number} x - X座標
       * @param {number} y - Y座標
       * @param {string} text - ボタンテキスト
       * @param {Function} callback - クリック時のコールバック
       * @returns {Object} ボタンコンテナとコンポーネント
       */
      createMenuButton(x, y, text, callback) {
        const container = this.add.container(x, y);
        
        const button = this.add.rectangle(0, 0, 240, 50, 0x333333, 0.8)
          .setStrokeStyle(2, 0xffffff, 1)
          .setInteractive({ useHandCursor: true });
        
        const buttonText = this.add.text(0, 0, text, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([button, buttonText]);
        
        // ボタンのホバーエフェクト
        button.on('pointerover', () => {
          button.setFillStyle(0x555555, 0.8);
          buttonText.setColor('#ffff00');
        });
        
        button.on('pointerout', () => {
          button.setFillStyle(0x333333, 0.8);
          buttonText.setColor('#ffffff');
        });
        
        button.on('pointerdown', () => {
          // クリック効果音
          if (this.sound.get('click-sfx')) {
            this.sound.play('click-sfx', { volume: 0.5 });
          }
          callback();
        });
        
        return { container, button, text: buttonText };
      }
      
      /**
       * ゲームを再開する
       */
      resumeGame() {
        this.scene.resume(SCENES.GAME);
        this.scene.stop();
      }
    }
    
    // 実装クラスを保存
    PauseScene.instance = PauseSceneImpl;
    return PauseSceneImpl;
  }
  
  /**
   * シーンのインスタンス化
   * initialize()が事前に呼ばれている必要がある
   */
  constructor() {
    if (!PauseScene.instance) {
      throw new Error('PauseScene must be initialized before instantiation. Call PauseScene.initialize() first.');
    }
    return new PauseScene.instance();
  }
}