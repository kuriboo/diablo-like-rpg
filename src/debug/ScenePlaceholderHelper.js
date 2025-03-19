/**
 * ScenePlaceholderHelper.js
 * シーンファイルでのプレースホルダー利用を支援するユーティリティクラス
 */

import placeholderAssets from './PlaceholderAssets';

/**
 * シーンプレースホルダーヘルパークラス
 */
export class ScenePlaceholderHelper {
  /**
   * シングルトンインスタンス
   */
  static instance = null;
  
  /**
   * デバッグモードかどうか
   */
  isDebugMode = false;
  
  /**
   * 初期化済みかどうか
   */
  initialized = false;
  
  /**
   * 初期化された場合のコールバック関数
   */
  onInitializedCallbacks = [];
  
  /**
   * コンストラクタ
   * @param {boolean} debugMode - デバッグモードで起動するかどうか
   */
  constructor(debugMode = false) {
    this.isDebugMode = debugMode;
    
    // ブラウザの開発者ツールが開いている場合は自動的にデバッグモードに
    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      this.isDebugMode = true;
      console.log('🔍 デバッグモードが有効です');
    }
  }
  
  /**
   * シングルトンインスタンスを取得
   * @param {boolean} debugMode - デバッグモードで起動するかどうか
   * @returns {ScenePlaceholderHelper} シングルトンインスタンス
   */
  static getInstance(debugMode = false) {
    if (!ScenePlaceholderHelper.instance) {
      ScenePlaceholderHelper.instance = new ScenePlaceholderHelper(debugMode);
    }
    return ScenePlaceholderHelper.instance;
  }
  
  /**
   * 初期化処理
   * @param {Phaser.Scene} scene - Phaserシーン
   * @returns {Promise<boolean>} 初期化が成功したかどうか
   */
  async initialize(scene) {
    if (this.initialized) return true;
    
    try {
      if (this.isDebugMode) {
        console.log('🎭 プレースホルダーアセットを初期化中...');
        // PlaceholderAssetsの初期化
        await placeholderAssets.initialize(scene);
      }
      
      this.initialized = true;
      
      // 初期化完了時のコールバックを実行
      this.onInitializedCallbacks.forEach(callback => callback());
      this.onInitializedCallbacks = [];
      
      return true;
    } catch (error) {
      console.error('プレースホルダー初期化中にエラーが発生しました:', error);
      return false;
    }
  }
  
  /**
   * 初期化完了時のコールバックを追加
   * @param {function} callback - コールバック関数
   */
  onInitialized(callback) {
    if (this.initialized) {
      callback();
    } else {
      this.onInitializedCallbacks.push(callback);
    }
  }
  
  /**
   * 安全な画像ロード（通常のロードと、失敗時のプレースホルダーフォールバック）
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {string} path - 画像パス
   * @param {Object} options - オプション（width, height, color）
   */
  safeLoadImage(scene, key, path, options = {}) {
    // パスからファイル名を抽出
    const fileName = path.split('/').pop();
    const baseName = fileName.split('.')[0];
    
    // すでにテクスチャが存在していれば何もしない
    if (scene.textures.exists(key)) return;
    
    if (!this.isDebugMode) {
      // 通常モード：単純に画像をロード
      scene.load.image(key, path);
    } else {
      // デバッグモード：プレースホルダーを使用
      console.log(`🔄 プレースホルダーを使用: ${key} (${path})`);
      
      // 画像タイプを推測して適切なプレースホルダーを選択
      let placeholderType = 'ui_panel'; // デフォルト
      let placeholderColor = 0x999999; // デフォルト色
      
      // ファイル名から種類を推測
      if (baseName.includes('background')) {
        placeholderType = 'background';
        placeholderColor = baseName.includes('menu') ? 0x1a3366 : 0x333333;
      } else if (baseName.includes('logo')) {
        placeholderType = 'logo';
        placeholderColor = 0xcc0000;
      } else if (baseName.includes('button')) {
        placeholderType = 'button';
        placeholderColor = baseName.includes('hover') ? 0x666666 : 0x444444;
      } else if (baseName.includes('slider')) {
        if (baseName.includes('track')) {
          placeholderType = 'slider_track';
          placeholderColor = 0x555555;
        } else if (baseName.includes('thumb')) {
          placeholderType = 'slider_thumb';
          placeholderColor = 0x888888;
        }
      } else if (baseName.includes('checkbox')) {
        placeholderType = 'checkbox';
        placeholderColor = baseName.includes('on') ? 0x00AA00 : 0x555555;
      }
      
      // オプションから上書き
      const width = options.width || this.getDefaultWidth(placeholderType);
      const height = options.height || this.getDefaultHeight(placeholderType);
      const color = options.color || placeholderColor;
      
      // プレースホルダーを生成
      try {
        this.createPlaceholder(scene, key, placeholderType, {
          width, height, color, 
          isHover: baseName.includes('hover'),
          isChecked: baseName.includes('on')
        });
      } catch (error) {
        console.error(`プレースホルダー生成エラー (${key}):`, error);
        // エラー時はフォールバックの単色矩形を作成
        placeholderAssets.createColorRect(scene, key, width, height, color);
      }
    }
  }
  
  /**
   * プレースホルダーを作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {string} type - プレースホルダータイプ
   * @param {Object} options - オプション
   */
  createPlaceholder(scene, key, type, options = {}) {
    const { width, height, color, isHover, isChecked } = options;
    
    switch (type) {
      case 'background':
        placeholderAssets.createBackground(scene, key, color);
        break;
      case 'logo':
        placeholderAssets.createGameLogo(scene, key, color);
        break;
      case 'button':
        placeholderAssets.createMenuButton(scene, key, color, isHover);
        break;
      case 'slider_track':
        placeholderAssets.createSliderTrack(scene, key, color);
        break;
      case 'slider_thumb':
        placeholderAssets.createSliderThumb(scene, key, color);
        break;
      case 'checkbox':
        placeholderAssets.createCheckbox(scene, key, color, isChecked);
        break;
      default:
        // その他の種類のプレースホルダー
        placeholderAssets.createColorRect(scene, key, width, height, color);
    }
  }
  
  /**
   * プレースホルダータイプに応じたデフォルト幅を取得
   * @param {string} type - プレースホルダータイプ
   * @returns {number} デフォルト幅
   */
  getDefaultWidth(type) {
    switch (type) {
      case 'background': return 800;
      case 'logo': return 400;
      case 'button': return 250;
      case 'slider_track': return 200;
      case 'slider_thumb': return 20;
      case 'checkbox': return 24;
      default: return 100;
    }
  }
  
  /**
   * プレースホルダータイプに応じたデフォルト高さを取得
   * @param {string} type - プレースホルダータイプ
   * @returns {number} デフォルト高さ
   */
  getDefaultHeight(type) {
    switch (type) {
      case 'background': return 600;
      case 'logo': return 200;
      case 'button': return 60;
      case 'slider_track': return 10;
      case 'slider_thumb': return 20;
      case 'checkbox': return 24;
      default: return 100;
    }
  }
}

// デフォルトエクスポート
export default ScenePlaceholderHelper.getInstance();