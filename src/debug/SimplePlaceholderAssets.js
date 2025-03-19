/**
 * SimplePlaceholderAssets.js - ゲーム開発用の簡易プレースホルダー画像生成
 * 
 * 既存のコードベースに影響を与えずに、必要なUIアセットのプレースホルダーを生成します。
 * この実装は最小限の変更でエラーを解消することに焦点を当てています。
 */

import { darkenColor, brightenColor } from './PlaceholderAssets';

// 既存のPlaceholderAssetsに依存しないようにユーティリティ関数を再実装
const fallbackBrightenColor = (color, percent) => {
  // 16進数の色から各成分を抽出
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;
  
  // 各成分を明るくする
  const newR = Math.min(255, r + Math.floor(r * percent / 100));
  const newG = Math.min(255, g + Math.floor(g * percent / 100));
  const newB = Math.min(255, b + Math.floor(b * percent / 100));
  
  // 新しい色を16進数に変換して返す
  return (newR << 16) | (newG << 8) | newB;
};

const fallbackDarkenColor = (color, percent) => {
  // 16進数の色から各成分を抽出
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;
  
  // 各成分を暗くする
  const newR = Math.max(0, r - Math.floor(r * percent / 100));
  const newG = Math.max(0, g - Math.floor(g * percent / 100));
  const newB = Math.max(0, b - Math.floor(b * percent / 100));
  
  // 新しい色を16進数に変換して返す
  return (newR << 16) | (newG << 8) | newB;
};

/**
 * UIプレースホルダー生成ユーティリティ
 */
const SimplePlaceholderAssets = {
  // デバッグモード設定
  debugMode: false,
  
  // 初期化済みかどうか
  initialized: false,
  
  // プレースホルダーのリスト
  placeholders: {},
  
  /**
   * デバッグモードを設定する
   * @param {boolean} isDebug - デバッグモードかどうか
   */
  setDebugMode(isDebug) {
    this.debugMode = isDebug;
  },
  
  /**
   * プレースホルダーを初期化する
   * @param {Phaser.Scene} scene - Phaserシーンオブジェクト
   * @returns {boolean} 初期化が成功したかどうか
   */
  initialize(scene) {
    if (this.initialized) return true;
    if (!scene || !scene.textures) {
      console.error('有効なPhaserシーンが必要です');
      return false;
    }
    
    try {
      console.log('🎨 UIプレースホルダー生成を開始...');
      
      // メニュー関連のプレースホルダーを生成
      this.createMenuPlaceholders(scene);
      
      // オプション画面関連のプレースホルダーを生成
      this.createOptionsPlaceholders(scene);
      
      this.initialized = true;
      console.log('✅ UIプレースホルダー生成完了');
      return true;
    } catch (error) {
      console.error('UIプレースホルダー生成中にエラーが発生しました:', error);
      return false;
    }
  },
  
  /**
   * メニュー関連のプレースホルダーを生成
   * @param {Phaser.Scene} scene - Phaserシーン
   */
  createMenuPlaceholders(scene) {
    if (!this.debugMode) return;
    
    // メインメニュー背景
    this.createBackground(scene, 'menu-background', 0x1a3366);
    
    // ゲームロゴ
    this.createGameLogo(scene, 'game-logo', 0xcc0000);
    
    // ボタン
    this.createMenuButton(scene, 'button-normal', 0x444444, false);
    this.createMenuButton(scene, 'button-hover', 0x666666, true);
  },
  
  /**
   * オプション画面関連のプレースホルダーを生成
   * @param {Phaser.Scene} scene - Phaserシーン
   */
  createOptionsPlaceholders(scene) {
    if (!this.debugMode) return;
    
    // オプション画面背景
    this.createBackground(scene, 'options-background', 0x333333);
    
    // スライダー関連
    this.createSliderTrack(scene, 'slider-track', 0x555555);
    this.createSliderThumb(scene, 'slider-thumb', 0x888888);
    
    // チェックボックス
    this.createCheckbox(scene, 'checkbox-on', 0x00AA00, true);
    this.createCheckbox(scene, 'checkbox-off', 0x555555, false);
  },
  
  /**
   * 背景プレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   */
  createBackground(scene, key, color) {
    const graphics = scene.add.graphics();
    const width = 800;
    const height = 600;
    
    // 背景色を塗る
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    
    // グラデーション効果
    const brighterColor = brightenColor ? brightenColor(color, 20) : fallbackBrightenColor(color, 20);
    graphics.fillStyle(brighterColor, 0.1);
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        graphics.fillRect(x, y, 20, 20);
      }
    }
    
    // テクスチャ生成
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    this.placeholders[key] = { type: 'background', width, height };
    console.log(`📦 プレースホルダー生成: ${key}`);
  },
  
  /**
   * ゲームロゴプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   */
  createGameLogo(scene, key, color) {
    const graphics = scene.add.graphics();
    const width = 400;
    const height = 200;
    
    // ロゴ背景
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(50, 50, width - 100, height - 100, 20);
    
    // ロゴ枠線
    const darkerColor = darkenColor ? darkenColor(color, 20) : fallbackDarkenColor(color, 20);
    graphics.lineStyle(4, darkerColor, 1);
    graphics.strokeRoundedRect(50, 50, width - 100, height - 100, 20);
    
    // 「GAME」を表現する線
    graphics.fillStyle(0xFFFFFF, 1);
    const textY = height / 2;
    graphics.fillRect(width / 4, textY - 15, width / 2, 5);
    graphics.fillRect(width / 4, textY, width / 2, 5);
    graphics.fillRect(width / 4, textY + 15, width / 2, 5);
    
    // テクスチャ生成
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    this.placeholders[key] = { type: 'logo', width, height };
    console.log(`📦 プレースホルダー生成: ${key}`);
  },
  
  /**
   * メニューボタンプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {boolean} isHover - ホバー状態かどうか
   */
  createMenuButton(scene, key, color, isHover) {
    const graphics = scene.add.graphics();
    const width = 250;
    const height = 60;
    
    // ボタン背景
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(0, 0, width, height, 10);
    
    // ボタン枠線
    const borderColor = isHover ? 
      (brightenColor ? brightenColor(color, 60) : fallbackBrightenColor(color, 60)) : 
      (brightenColor ? brightenColor(color, 30) : fallbackBrightenColor(color, 30));
    graphics.lineStyle(2, borderColor, 1);
    graphics.strokeRoundedRect(0, 0, width, height, 10);
    
    // ホバー効果
    if (isHover) {
      graphics.fillStyle(0xFFFFFF, 0.2);
      graphics.fillRoundedRect(4, 4, width - 8, height - 8, 8);
    }
    
    // テキスト部分
    graphics.fillStyle(0xFFFFFF, 0.8);
    graphics.fillRect(width / 4, height / 2 - 2, width / 2, 4);
    
    // テクスチャ生成
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    this.placeholders[key] = { type: 'button', isHover, width, height };
    console.log(`📦 プレースホルダー生成: ${key}`);
  },
  
  /**
   * スライダートラックプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   */
  createSliderTrack(scene, key, color) {
    const graphics = scene.add.graphics();
    const width = 200;
    const height = 10;
    
    // トラック背景
    const darkerColor = darkenColor ? darkenColor(color, 30) : fallbackDarkenColor(color, 30);
    graphics.fillStyle(darkerColor, 1);
    graphics.fillRoundedRect(0, 0, width, height, height / 2);
    
    // トラック内側
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(1, 1, width - 2, height - 2, (height - 2) / 2);
    
    // 目盛り
    graphics.fillStyle(darkerColor, 0.5);
    for (let i = 0; i < width; i += 20) {
      graphics.fillRect(i, height / 2 - 1, 1, 2);
    }
    
    // テクスチャ生成
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    this.placeholders[key] = { type: 'slider_track', width, height };
    console.log(`📦 プレースホルダー生成: ${key}`);
  },
  
  /**
   * スライダーつまみプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   */
  createSliderThumb(scene, key, color) {
    const graphics = scene.add.graphics();
    const size = 20;
    
    // つまみ背景
    const brighterColor = brightenColor ? brightenColor(color, 10) : fallbackBrightenColor(color, 10);
    graphics.fillStyle(brighterColor, 1);
    graphics.fillCircle(size / 2, size / 2, size / 2);
    
    // つまみ枠線
    const darkerColor = darkenColor ? darkenColor(color, 20) : fallbackDarkenColor(color, 20);
    graphics.lineStyle(1, darkerColor, 1);
    graphics.strokeCircle(size / 2, size / 2, size / 2);
    
    // つまみ中央の模様
    graphics.fillStyle(darkerColor, 0.5);
    graphics.fillCircle(size / 2, size / 2, 2);
    
    // テクスチャ生成
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    
    this.placeholders[key] = { type: 'slider_thumb', width: size, height: size };
    console.log(`📦 プレースホルダー生成: ${key}`);
  },
  
  /**
   * チェックボックスプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {boolean} isChecked - チェックされているかどうか
   */
  createCheckbox(scene, key, color, isChecked) {
    const graphics = scene.add.graphics();
    const size = 24;
    
    // チェックボックス外枠
    graphics.fillStyle(0x333333, 1);
    graphics.fillRoundedRect(0, 0, size, size, 4);
    
    // チェックボックス内側
    graphics.fillStyle(isChecked ? color : 0x666666, 1);
    graphics.fillRoundedRect(2, 2, size - 4, size - 4, 3);
    
    // チェックマーク
    if (isChecked) {
      graphics.fillStyle(0xFFFFFF, 1);
      graphics.beginPath();
      graphics.moveTo(5, size / 2);
      graphics.lineTo(size / 3, size - 7);
      graphics.lineTo(size - 5, 5);
      graphics.lineStyle(3, 0xFFFFFF, 1);
      graphics.strokePath();
    }
    
    // テクスチャ生成
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    
    this.placeholders[key] = { type: 'checkbox', isChecked, width: size, height: size };
    console.log(`📦 プレースホルダー生成: ${key}`);
  },
  
  /**
   * テクスチャが存在するかチェック
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @returns {boolean} テクスチャが存在するかどうか
   */
  hasTexture(scene, key) {
    return scene && scene.textures && scene.textures.exists(key);
  },
  
  /**
   * 安全な画像ロード（実際のアセットが読み込めない場合はプレースホルダーを使用）
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {string} path - 画像パス
   */
  safeLoadImage(scene, key, path) {
    // 既にテクスチャが存在する場合はスキップ
    if (this.hasTexture(scene, key)) return;
    
    // プレースホルダーが有効でなければ通常通りロード
    if (!this.debugMode) {
      scene.load.image(key, path);
      return;
    }
    
    // プレースホルダーが既に生成されている場合は何もしない
    if (this.placeholders[key]) return;
    
    // プレースホルダーを生成
    console.log(`🔄 プレースホルダーを使用: ${key} (${path})`);
    
    // ファイル名から種類を推測して適切なプレースホルダーを選択
    const fileName = path.split('/').pop();
    const baseName = fileName.split('.')[0];
    
    if (baseName.includes('background')) {
      const color = baseName.includes('menu') ? 0x1a3366 : 0x333333;
      this.createBackground(scene, key, color);
    } else if (baseName.includes('logo')) {
      this.createGameLogo(scene, key, 0xcc0000);
    } else if (baseName.includes('button')) {
      const isHover = baseName.includes('hover');
      const color = isHover ? 0x666666 : 0x444444;
      this.createMenuButton(scene, key, color, isHover);
    } else if (baseName.includes('slider')) {
      if (baseName.includes('track')) {
        this.createSliderTrack(scene, key, 0x555555);
      } else if (baseName.includes('thumb')) {
        this.createSliderThumb(scene, key, 0x888888);
      }
    } else if (baseName.includes('checkbox')) {
      const isChecked = baseName.includes('on');
      const color = isChecked ? 0x00AA00 : 0x555555;
      this.createCheckbox(scene, key, color, isChecked);
    } else {
      // デフォルトのプレースホルダー（単色の矩形）
      this.createColorRect(scene, key, 100, 100, 0xAAAAAA);
    }
  },
  
  /**
   * 単色矩形プレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {number} color - 色（16進数）
   */
  createColorRect(scene, key, width, height, color) {
    const graphics = scene.add.graphics();
    
    // 単色矩形
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    
    // 枠線
    const darkerColor = darkenColor ? darkenColor(color, 30) : fallbackDarkenColor(color, 30);
    graphics.lineStyle(1, darkerColor, 1);
    graphics.strokeRect(0, 0, width, height);
    
    // テクスチャ生成
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    this.placeholders[key] = { type: 'rect', width, height };
    console.log(`📦 プレースホルダー生成: ${key}`);
  }
};

export default SimplePlaceholderAssets;