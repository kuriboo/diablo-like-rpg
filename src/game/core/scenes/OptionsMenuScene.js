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

// Mathユーティリティを取得する関数
async function getPhaserMath() {
  const phaser = await getPhaserModule();
  return phaser.Math || phaser.default.Math;
}

import { SCENES } from '../constants';
import { GameSettings } from '../../data/GameSettings';
import SimplePlaceholderAssets  from '../../../debug/SimplePlaceholderAssets';

export default class OptionsMenuScene {
  // 静的なシーンインスタンスを保持
  static instance = null;
  static PhaserMath = null;
  
  /**
   * Phaserシーンのインスタンス化前に非同期で初期化する
   */
  static async initialize() {
    if (OptionsMenuScene.instance) return OptionsMenuScene.instance;
    
    const Scene = await getSceneClass();
    OptionsMenuScene.PhaserMath = await getPhaserMath();
    
    // Sceneを継承した実装クラス
    class OptionsMenuSceneImpl extends Scene {
      constructor() {
        super({ key: SCENES.OPTIONS_MENU });
        this.settings = null;
      }
    
      preload() {
        // デバッグモードかどうかを判定
        const isDebugMode = window.location.search.includes('debug=true');
        
        // プレースホルダーの初期化
        if (isDebugMode) {
          SimplePlaceholderAssets.setDebugMode(true);
          SimplePlaceholderAssets.initialize(this);
        }
        
        // オプション画面用のアセット
        if (isDebugMode) {
          // デバッグモード：プレースホルダーを使用
          SimplePlaceholderAssets.safeLoadImage(this, 'options-background', 'assets/images/ui/options_background.png');
          SimplePlaceholderAssets.safeLoadImage(this, 'slider-track', 'assets/images/ui/slider_track.png');
          SimplePlaceholderAssets.safeLoadImage(this, 'slider-thumb', 'assets/images/ui/slider_thumb.png');
          SimplePlaceholderAssets.safeLoadImage(this, 'checkbox-on', 'assets/images/ui/checkbox_on.png');
          SimplePlaceholderAssets.safeLoadImage(this, 'checkbox-off', 'assets/images/ui/checkbox_off.png');
        } else {
          // 通常モード：普通にロード
          this.load.image('options-background', 'assets/images/ui/options_background.png');
          this.load.image('slider-track', 'assets/images/ui/slider_track.png');
          this.load.image('slider-thumb', 'assets/images/ui/slider_thumb.png');
          this.load.image('checkbox-on', 'assets/images/ui/checkbox_on.png');
          this.load.image('checkbox-off', 'assets/images/ui/checkbox_off.png');
        }
      }
    
      create() {
        // 設定データの取得
        this.settings = GameSettings.getInstance();
        
        // 背景画像
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'options-background')
          .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // オプションタイトル
        this.add.text(this.cameras.main.width / 2, 80, 'オプション設定', {
          fontSize: '36px',
          fontFamily: 'Arial Black',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 4
        }).setOrigin(0.5);
        
        // 音量設定セクション
        this.add.text(this.cameras.main.width / 2, 160, '音量設定', {
          fontSize: '28px',
          fontFamily: 'Arial',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        // BGM音量スライダー
        this.createVolumeSlider(220, 'BGM音量', this.settings.bgmVolume, (value) => {
          this.settings.bgmVolume = value;
          // BGM音量の適用
          this.sound.volume = value;
        });
        
        // SE音量スライダー
        this.createVolumeSlider(280, 'SE音量', this.settings.sfxVolume, (value) => {
          this.settings.sfxVolume = value;
          // SEの音量設定を適用
        });
        
        // グラフィック設定セクション
        this.add.text(this.cameras.main.width / 2, 360, 'グラフィック設定', {
          fontSize: '28px',
          fontFamily: 'Arial',
          color: '#fff',
          stroke: '#000',
          strokeThickness: 3
        }).setOrigin(0.5);
        
        // フルスクリーン設定
        this.createToggle(420, 'フルスクリーン', this.settings.fullscreen, (value) => {
          this.settings.fullscreen = value;
          if (value) {
            this.scale.startFullscreen();
          } else {
            this.scale.stopFullscreen();
          }
        });
        
        // エフェクト品質設定
        this.createDropdown(480, 'エフェクト品質', ['低', '中', '高'], this.settings.effectQuality, (value) => {
          this.settings.effectQuality = value;
          // エフェクト品質の適用
        });
        
        // 戻るボタン
        const backButton = this.add.text(this.cameras.main.width / 2, 580, '保存して戻る', {
          fontSize: '26px',
          fontFamily: 'Arial',
          color: '#fff',
          backgroundColor: '#222',
          padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive();
        
        backButton.on('pointerover', () => {
          backButton.setStyle({ color: '#ff0' });
        });
        
        backButton.on('pointerout', () => {
          backButton.setStyle({ color: '#fff' });
        });
        
        backButton.on('pointerdown', () => {
          // 設定の保存
          this.settings.saveSettings();
          // メインメニューに戻る
          this.scene.start(SCENES.MAIN_MENU);
        });
      }
      
      createVolumeSlider(y, label, initialValue, callback) {
        // ラベルテキスト
        this.add.text(this.cameras.main.width / 2 - 200, y, label, {
          fontSize: '22px',
          fontFamily: 'Arial',
          color: '#fff'
        }).setOrigin(0, 0.5);
        
        // スライダートラック
        const track = this.add.image(this.cameras.main.width / 2 + 50, y, 'slider-track')
          .setOrigin(0.5)
          .setDisplaySize(200, 10);
        
        // スライダーのつまみ
        const thumb = this.add.image(
          track.x - track.displayWidth / 2 + track.displayWidth * initialValue,
          y,
          'slider-thumb'
        ).setInteractive({ draggable: true });
        
        // 現在の値表示テキスト
        const valueText = this.add.text(track.x + 120, y, `${Math.floor(initialValue * 100)}%`, {
          fontSize: '20px',
          fontFamily: 'Arial',
          color: '#fff'
        }).setOrigin(0, 0.5);
        
        // ドラッグ機能の実装
        thumb.on('drag', (pointer, dragX) => {
          // スライダーの範囲内でつまみを移動
          const minX = track.x - track.displayWidth / 2;
          const maxX = track.x + track.displayWidth / 2;
          
          // Math.Clampの代わりにJavaScriptの標準的な方法で値を制限
          const newX = Math.min(Math.max(dragX, minX), maxX);
          
          thumb.x = newX;
          
          // 値の計算 (0.0〜1.0)
          const value = (newX - minX) / (maxX - minX);
          valueText.setText(`${Math.floor(value * 100)}%`);
          
          // 値を設定に適用
          callback(value);
        });
        
        return { track, thumb, valueText };
      }
      
      createToggle(y, label, initialValue, callback) {
        // ラベルテキスト
        this.add.text(this.cameras.main.width / 2 - 200, y, label, {
          fontSize: '22px',
          fontFamily: 'Arial',
          color: '#fff'
        }).setOrigin(0, 0.5);
        
        // チェックボックス
        const checkbox = this.add.image(
          this.cameras.main.width / 2 + 50,
          y,
          initialValue ? 'checkbox-on' : 'checkbox-off'
        ).setInteractive();
        
        // クリックイベント
        checkbox.on('pointerdown', () => {
          const newValue = !initialValue;
          initialValue = newValue;
          checkbox.setTexture(newValue ? 'checkbox-on' : 'checkbox-off');
          callback(newValue);
        });
        
        return checkbox;
      }
      
      createDropdown(y, label, options, initialIndex, callback) {
        // ラベルテキスト
        this.add.text(this.cameras.main.width / 2 - 200, y, label, {
          fontSize: '22px',
          fontFamily: 'Arial',
          color: '#fff'
        }).setOrigin(0, 0.5);
        
        // 選択中の値を表示するテキスト
        const selectedText = this.add.text(
          this.cameras.main.width / 2 + 50,
          y,
          options[initialIndex],
          {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#fff',
            backgroundColor: '#444',
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
          }
        ).setInteractive();
        
        // ドロップダウンメニュー（初期状態では非表示）
        const dropdownItems = [];
        let dropdownVisible = false;
        
        // ドロップダウンの表示/非表示を切り替え
        selectedText.on('pointerdown', () => {
          if (dropdownVisible) {
            // 非表示にする
            dropdownItems.forEach(item => item.setVisible(false));
            dropdownVisible = false;
          } else {
            // 表示する
            options.forEach((option, index) => {
              if (!dropdownItems[index]) {
                // 初回のみ作成
                dropdownItems[index] = this.add.text(
                  selectedText.x,
                  selectedText.y + 30 + index * 30,
                  option,
                  {
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#fff',
                    backgroundColor: '#555',
                    padding: { left: 10, right: 10, top: 5, bottom: 5 }
                  }
                ).setInteractive();
                
                // 項目選択イベント
                dropdownItems[index].on('pointerdown', () => {
                  selectedText.setText(option);
                  callback(index);
                  // 選択後は閉じる
                  dropdownItems.forEach(item => item.setVisible(false));
                  dropdownVisible = false;
                });
              } else {
                dropdownItems[index].setVisible(true);
              }
            });
            
            dropdownVisible = true;
          }
        });
        
        return { selectedText, dropdownItems };
      }
      
      update() {
        // 必要に応じた更新処理
      }
    }
    
    // 実装クラスを保存
    OptionsMenuScene.instance = OptionsMenuSceneImpl;
    return OptionsMenuSceneImpl;
  }
  
  /**
   * シーンのインスタンス化
   * initialize()が事前に呼ばれている必要がある
   */
  constructor() {
    if (!OptionsMenuScene.instance) {
      throw new Error('OptionsMenuScene must be initialized before instantiation. Call OptionsMenuScene.initialize() first.');
    }
    return new OptionsMenuScene.instance();
  }
}