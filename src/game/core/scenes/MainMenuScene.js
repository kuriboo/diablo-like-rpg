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
import SimplePlaceholderAssets  from '../../../debug/SimplePlaceholderAssets';
import AudioPlaceholders from '../../../debug/AudioPlaceholders';

export default class MainMenuScene {
  // 静的なシーンインスタンスを保持
  static instance = null;
  
  /**
   * Phaserシーンのインスタンス化前に非同期で初期化する
   */
  static async initialize() {
    if (MainMenuScene.instance) return MainMenuScene.instance;
    
    const Scene = await getSceneClass();
    
    // Sceneを継承した実装クラス
    class MainMenuSceneImpl extends Scene {
      constructor() {
        super({ key: SCENES.MAIN_MENU });
      }
    
      preload() {
        // デバッグモードかどうかを判定（URL パラメータなどで切り替え可能）
        const isDebugMode = window.location.search.includes('debug=true');
        
        // プレースホルダーの初期化
        if (isDebugMode) {
          SimplePlaceholderAssets.setDebugMode(true);
          SimplePlaceholderAssets.initialize(this);
        }
        
        // メニュー画面用のアセットをロード（安全なロード方法を使用）
        if (isDebugMode) {
          // デバッグモード：プレースホルダーを使用
          SimplePlaceholderAssets.safeLoadImage(this, 'menu-background', 'assets/images/ui/menu_background.png');
          SimplePlaceholderAssets.safeLoadImage(this, 'game-logo', 'assets/images/ui/game_logo.png');
          SimplePlaceholderAssets.safeLoadImage(this, 'button-normal', 'assets/images/ui/button_normal.png');
          SimplePlaceholderAssets.safeLoadImage(this, 'button-hover', 'assets/images/ui/button_hover.png');
        } else {
          // 通常モード：普通にロード
          this.load.image('menu-background', 'assets/images/ui/menu_background.png');
          this.load.image('game-logo', 'assets/images/ui/game_logo.png');
          this.load.image('button-normal', 'assets/images/ui/button_normal.png');
          this.load.image('button-hover', 'assets/images/ui/button_hover.png');
        }

        // 音声プレースホルダーの初期化
        if (isDebugMode) {
          AudioPlaceholders.setDebugMode(true);
          AudioPlaceholders.initialize(this);
        }
        
        // 音声アセットの安全なロード
        AudioPlaceholders.safeLoadAudio(this, 'menu-bgm', 'assets/audio/menu_bgm.mp3');
        AudioPlaceholders.safeLoadAudio(this, 'click-sfx', 'assets/audio/click.mp3');
        AudioPlaceholders.safeLoadAudio(this, 'hover-sfx', 'assets/audio/hover.mp3');
      }
    
      create() {
        // 背景画像の追加
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu-background')
          .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // ゲームロゴの追加
        const logo = this.add.image(this.cameras.main.width / 2, 120, 'game-logo')
          .setScale(0.8);
        
        // タイトルテキストの追加
        this.add.text(this.cameras.main.width / 2, 250, 'Diablo-like RPG', {
          fontSize: '42px',
          fontFamily: 'Arial Black',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 6,
          shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, stroke: true, fill: true }
        }).setOrigin(0.5);
        
        // メニューボタンの作成
        const buttonStartGame = this.createButton(this.cameras.main.width / 2, 350, 'ゲームスタート', () => {
          this.scene.start(SCENES.GAME);
        });
        
        const buttonOptions = this.createButton(this.cameras.main.width / 2, 420, 'オプション', () => {
          this.scene.start(SCENES.OPTIONS_MENU);
        });
        
        const buttonCredits = this.createButton(this.cameras.main.width / 2, 490, 'クレジット', () => {
          // クレジット表示ロジック
          console.log('クレジット表示');
        });
        
        const buttonExit = this.createButton(this.cameras.main.width / 2, 560, 'ゲーム終了', () => {
          // ゲーム終了ロジック（ブラウザゲームでは実装制限あり）
          if (window.confirm('ゲームを終了しますか？')) {
            window.close(); // ブラウザ環境では制限がある場合があります
          }
        });
        
        // デバッグモードかどうかを判定
        const isDebugMode = window.location.search.includes('debug=true');
        
        // 背景音楽の再生（BGM）- デバッグモード時はスキップ
        if (!isDebugMode && this.sound && this.sound.add) {
          try {
            if (!this.sound.get('menu-bgm')) {
              this.sound.add('menu-bgm', { loop: true, volume: 0.5 }).play();
            }
          } catch (error) {
            console.warn('BGM再生に失敗しました: ', error);
          }
        } else {
          console.log('デバッグモード: BGMの再生をスキップしました');
        }
      }
      
      createButton(x, y, text, callback) {
        const button = this.add.image(x, y, 'button-normal')
          .setInteractive()
          .setScale(0.4);
        
        const buttonText = this.add.text(x, y, text, {
          fontSize: '24px',
          fontFamily: 'Arial',
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5);
        
        // デバッグモード判定
        const isDebugMode = window.location.search.includes('debug=true');
        
        button.on('pointerover', () => {
          button.setTexture('button-hover');
          
          // ホバー音（デバッグモード時はスキップ）
          if (!isDebugMode && this.sound && this.sound.play) {
            try {
              this.sound.play('hover-sfx', { volume: 0.3 });
            } catch (error) {
              console.warn('ホバー音の再生に失敗しました');
            }
          }
        });
        
        button.on('pointerout', () => {
          button.setTexture('button-normal');
        });
        
        button.on('pointerdown', () => {
          // クリック音（デバッグモード時はスキップ）
          if (!isDebugMode && this.sound && this.sound.play) {
            try {
              this.sound.play('click-sfx', { volume: 0.5 });
            } catch (error) {
              console.warn('クリック音の再生に失敗しました');
            }
          }
          
          callback();
        });
        
        return { button, text: buttonText };
      }
      
      update() {
        // アニメーションやエフェクトの更新（必要に応じて）
      }
    }
    
    // 実装クラスを保存
    MainMenuScene.instance = MainMenuSceneImpl;
    return MainMenuSceneImpl;
  }
  
  /**
   * シーンのインスタンス化
   * initialize()が事前に呼ばれている必要がある
   */
  constructor() {
    if (!MainMenuScene.instance) {
      throw new Error('MainMenuScene must be initialized before instantiation. Call MainMenuScene.initialize() first.');
    }
    return new MainMenuScene.instance();
  }
}