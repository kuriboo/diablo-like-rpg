/**
 * PlaceholderAssets.js - ゲーム開発用のプレースホルダー画像生成
 * 
 * 実際のアセットが用意されていない段階でも開発を進めるために
 * その場でプレースホルダー画像を生成する機能を提供します。
 * トップダウンビュー用に最適化されたプレースホルダーを生成します。
 */

import { brightenColor, darkenColor } from '../utils/ColorUtils';
/*import AnimationPlaceholders from './placeholders/AnimationPlaceholders';
import CharacterDetailPlaceholders from './placeholders/CharacterDetailPlaceholders';
import CharacterMonsterPlaceholders from './placeholders/CharacterMonsterPlaceholders';
import CharacterPlaceholders from './placeholders/CharacterPlaceholders';
import CharacterSlimePlaceholders from './placeholders/CharacterSlimePlaceholders';
import EffectPlaceholders from './placeholders/EffectPlaceholders';
import ItemPlaceholders from './placeholders/ItemPlaceholders';
import TilePlaceholders from './placeholders/TilePlaceholders';
import UIPlaceholders from './placeholders/UIPlaceholders';*/



/**
 * プレースホルダーアセット生成クラス
 */
class PlaceholderAssets {

    constructor() {
      this.initialized = false;
      this.placeholders = {};
    }
    
    /**
     * プレースホルダーアセットを初期化
     * @param {Phaser.Scene} scene - Phaserシーン
     * @returns {boolean} 初期化が成功したかどうか
     */
    initialize(scene) {
      if (!scene || !scene.textures) {
        console.error('有効なPhaserシーンが必要です');
        return false;
      }
      
      try {
        console.log('🎨 プレースホルダーアセット生成を開始...');
        
        // マップ生成に必要な最低限のプレースホルダーを必ず作成する
        this.ensureRequiredPlaceholders(scene);
        
        // 他のプレースホルダーも作成
        this.createCharacterPlaceholders(scene);
        this.createTilePlaceholders(scene);
        this.createItemPlaceholders(scene);
        this.createUIPlaceholders(scene);
        this.createEffectPlaceholders(scene);
        
        this.initialized = true;
        console.log('✅ プレースホルダーアセット生成完了');
        return true;
      } catch (error) {
        console.error('プレースホルダーアセット生成中にエラーが発生しました:', error);
        // エラーが発生しても最低限のプレースホルダーは用意する
        this.createFallbackPlaceholders(scene);
        return false;
      }
    }

    /**
     * マップ生成に必須のプレースホルダーを確実に作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    ensureRequiredPlaceholders(scene) {
      console.log('必須プレースホルダーを確保中...');
      
      // TopDownMapが必ず必要とするタイルタイプ
      const requiredTiles = [
        { key: 'tile_water', color: 0x1E90FF },
        { key: 'tile_grass', color: 0x3CB371 },
        { key: 'tile_dirt', color: 0x8B4513 },
        { key: 'tile_sand', color: 0xF4A460 },
        { key: 'tile_stone', color: 0x708090 },
        { key: 'tile_snow', color: 0xFFFAFA },
        { key: 'tile_lava', color: 0xFF4500 },
        { key: 'tile_wall', color: 0x808080 },
        { key: 'item_chest', color: 0x8B4513 }
      ];
      
      // 壁タイルタイプ - 新規追加
      const wallTiles = [
        { key: 'wall_stone', color: 0x808080, type: 'stone' },
        { key: 'wall_brick', color: 0xB22222, type: 'brick' },
        { key: 'wall_wood', color: 0x8B4513, type: 'wood' },
        { key: 'wall_ice', color: 0xADD8E6, type: 'ice' },
        { key: 'wall_metal', color: 0x696969, type: 'metal' }
      ];
      
      // 各タイルのプレースホルダーを作成
      requiredTiles.forEach(tile => {
        try {
          if (tile.key === 'item_chest') {
            this.createChestItem(scene, tile.key, tile.color, false);
          } else if (tile.key === 'tile_wall') {
            this.createWallTile(scene, tile.key, tile.color);
          } else {
            this.createTileWithPattern(scene, tile.key, tile.color);
          }
          console.log(`必須プレースホルダー作成: ${tile.key}`);
        } catch (e) {
          console.warn(`必須プレースホルダー ${tile.key} の作成中にエラーが発生しました:`, e);
          // エラーが発生した場合、シンプルな色付き矩形で代用
          this.createColorRect(scene, tile.key, 32, 32, tile.color);
          console.log(`代替プレースホルダー作成: ${tile.key}`);
        }
      });
      
      // 壁タイルのプレースホルダーを作成
      wallTiles.forEach(wall => {
        try {
          this.createWallTile(scene, wall.key, wall.color, wall.type);
          console.log(`壁タイルプレースホルダー作成: ${wall.key} (${wall.type})`);
        } catch (e) {
          console.warn(`壁タイルプレースホルダー ${wall.key} の作成中にエラーが発生しました:`, e);
          // エラーが発生した場合、シンプルな色付き矩形で代用
          this.createColorRect(scene, wall.key, 32, 32, wall.color);
          console.log(`代替壁タイルプレースホルダー作成: ${wall.key}`);
        }
      });
    }

    /**
     * エラー発生時に使用する最低限のフォールバックプレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createFallbackPlaceholders(scene) {
      console.log('緊急フォールバックプレースホルダーを作成中...');
      
      // 絶対に必要な基本プレースホルダー
      const fallbackColors = {
        'tile_grass': 0x3CB371,
        'tile_stone': 0x708090,
        'item_chest': 0x8B4513,
        'character_placeholder': 0x00FF00,
        'wall_stone': 0x808080  // 壁のフォールバックも追加
      };
      
      // シンプルな色付き矩形を作成
      Object.entries(fallbackColors).forEach(([key, color]) => {
        try {
          this.createColorRect(scene, key, 32, 32, color);
          console.log(`フォールバックプレースホルダー作成: ${key}`);
        } catch (e) {
          console.error(`フォールバックプレースホルダー ${key} の作成に失敗しました:`, e);
        }
      });
    }

    /**
     * 単色矩形プレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {number} color - 色（16進数）
     * @param {number} alpha - 透明度
     */
    createColorRect(scene, key, width, height, color, alpha = 1) {
      const graphics = scene.add.graphics();
      
      // 単色矩形
      graphics.fillStyle(color, alpha);
      graphics.fillRect(0, 0, width, height);
      
      // 枠線
      graphics.lineStyle(1, darkenColor(color, 30), alpha);
      graphics.strokeRect(0, 0, width, height);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'rect', color, width, height, alpha };
    }

    /**
     * テクスチャの有無を確認
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @returns {boolean} テクスチャが存在するかどうか
     */
    hasTexture(scene, key) {
      return scene && scene.textures && key && scene.textures.exists(key);
    }
    
    /**
     * プレースホルダーテクスチャの取得 - TopDownMap用に強化
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} width - フォールバック用の幅
     * @param {number} height - フォールバック用の高さ
     * @param {number} color - フォールバック用の色
     * @returns {string} 実際に使用できるテクスチャキー
     */
    getTexture(scene, key, width = 32, height = 32, color = 0xffff00) {
      // キーが無効な場合は安全なフォールバックを返す
      if (!key) {
        console.warn('無効なテクスチャキーが指定されました');
        return this.getFallbackTexture(scene, 'tile');
      }
      
      // 既存のテクスチャがあれば、そのまま返す
      if (this.hasTexture(scene, key)) {
        return key;
      }
      
      // キーパターンの分析
      let type, subtype;
      
      if (key.includes('_')) {
        const parts = key.split('_');
        type = parts[0];
        subtype = parts[1];
      } else {
        // 単一単語のキーの場合はデフォルト処理
        type = 'generic';
        subtype = key;
      }
      
      console.log(`プレースホルダーが必要: ${key} (${type}/${subtype})`);
      
      // タイプに基づいてプレースホルダーを生成
      try {
        if (type === 'tile') {
          if (!this.hasTexture(scene, key)) {
            // タイル用プレースホルダー生成
            const tileColor = this.getTileColor(subtype);
            this.createTileWithPattern(scene, key, tileColor);
            return key;
          }
        } else if (type === 'item' && subtype === 'chest') {
          if (!this.hasTexture(scene, key)) {
            // 宝箱プレースホルダー生成
            this.createChestItem(scene, key, 0x8B4513, false);
            return key;
          }
        } else if (type === 'wall') {
          if (!this.hasTexture(scene, key)) {
            // 壁タイルのプレースホルダー生成
            const wallColor = this.getWallColor(subtype);
            this.createWallTile(scene, key, wallColor, subtype);
            return key;
          }
        } else {
          // その他の一般プレースホルダー
          const placeholderKey = `placeholder_${key}`;
          if (!this.hasTexture(scene, placeholderKey)) {
            this.createColorRect(scene, placeholderKey, width, height, color);
            console.log(`⚠️ テクスチャ '${key}' が見つからないため、汎用プレースホルダーを生成しました`);
          }
          return placeholderKey;
        }
      } catch (e) {
        console.error(`プレースホルダー生成エラー (${key}):`, e);
        // 緊急フォールバック - 単色矩形
        const emergencyKey = `emergency_${type}_${Date.now()}`;
        this.createColorRect(scene, emergencyKey, width, height, 0xFF00FF);
        return emergencyKey;
      }
      
      return key;
    }
    
    /**
     * フォールバックテクスチャの取得 - TopDownMap用に強化
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} type - テクスチャタイプ ('character', 'tile', 'item', 'ui', 'effect')
     * @returns {string} フォールバック用テクスチャキー
     */
    getFallbackTexture(scene, type) {
      // 無効なシーンの場合はnullを返す
      if (!scene) {
        console.warn('getFallbackTexture: シーンが無効です');
        return null;
      }
      
      // TopDownMapに合わせたフォールバックキー
      const fallbacks = {
        character: 'character_placeholder',
        player: 'player_warrior', 
        enemy: 'enemy_skeleton',
        npc: 'npc_villager',
        tile: 'tile_grass',
        item: 'item_chest',
        ui: 'ui_panel',
        effect: 'effect_attack',
        wall: 'wall_stone'  // 壁のフォールバックを追加
      };
      
      const key = fallbacks[type] || 'tile_grass';
      
      // フォールバックテクスチャがなければ作成
      if (!this.hasTexture(scene, key)) {
        console.log(`フォールバックテクスチャが必要: ${key} (${type})`);
        
        try {
          if (type === 'tile') {
            this.createTileWithPattern(scene, key, 0x3CB371); // 草色
          } else if (type === 'item' && key.includes('chest')) {
            this.createChestItem(scene, key, 0x8B4513, false);
          } else if (type === 'wall') {
            // 壁タイルのフォールバック
            this.createWallTile(scene, key, 0x808080, 'stone');
          } else {
            // 汎用的な色のプレースホルダー
            const color = type === 'player' ? 0x00ff00 : 
                        type === 'enemy' ? 0xff0000 : 
                        type === 'npc' ? 0x0000ff : 
                        type === 'wall' ? 0x808080 : 
                        0xffff00;
                        
            const size = type === 'item' ? 16 : 32;
            this.createColorRect(scene, key, size, size, color);
          }
          console.log(`🔄 フォールバックテクスチャ作成: ${key} (${type})`);
        } catch (e) {
          console.error(`フォールバックテクスチャ生成エラー (${key}):`, e);
          
          // 最終手段 - 緊急フォールバック
          const emergencyKey = `emergency_${type}_${Date.now()}`;
          this.createColorRect(scene, emergencyKey, 32, 32, 0xFF00FF);
          return emergencyKey;
        }
      }
      
      return key;
    }

    /**
     * 単色矩形プレースホルダー作成 (ヘルパー関数)
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {number} color - 色（16進数）
     * @param {Object} placeholders - プレースホルダーオブジェクト
     * @param {number} alpha - 透明度
     */
    createColorRect(scene, key, width, height, color, placeholders, alpha = 1) {
      const graphics = scene.add.graphics();
      
      // 単色矩形
      graphics.fillStyle(color, alpha);
      graphics.fillRect(0, 0, width, height);
      
      // 枠線
      graphics.lineStyle(1, darkenColor(color, 30), alpha);
      graphics.strokeRect(0, 0, width, height);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      if (placeholders) {
        placeholders[key] = { type: 'rect', color, width, height, alpha };
      }
    }

    // ヘルパー関数：タイルタイプから色を取得
    getTileColor(tileType) {
      const tileColors = {
        water: 0x1E90FF,  // ドジャーブルー
        grass: 0x3CB371,  // ミディアムシーグリーン
        dirt: 0x8B4513,   // サドルブラウン
        sand: 0xF4A460,   // サンディブラウン
        stone: 0x708090,  // スレートグレー
        snow: 0xFFFAFA,   // スノー
        lava: 0xFF4500,   // オレンジレッド
        wall: 0x808080    // グレー
      };
      
      return tileColors[tileType] || 0x888888;
    }

    // ヘルパー関数：障害物タイプから色を取得
    getObstacleColor(obstacleType) {
      const obstacleColors = {
        tree: 0x228B22,    // フォレストグリーン
        rock: 0x696969,    // ディムグレー
        bush: 0x32CD32,    // ライムグリーン
        crate: 0xCD853F    // ペルー
      };
      
      return obstacleColors[obstacleType] || 0x8B4513;
    }

    // ヘルパー関数：壁タイプから色を取得
    getWallColor(wallType) {
      const wallColors = {
        stone: 0x808080,   // 灰色
        brick: 0xB22222,   // 煉瓦色
        wood: 0x8B4513,    // 茶色
        ice: 0xADD8E6,     // 薄い青
        metal: 0x696969    // 暗い灰色
      };
      
      return wallColors[wallType] || 0x808080;
    }
    
    // シングルトンインスタンスを取得
    static getInstance() {
      if (!this.instance) {
        this.instance = new PlaceholderAssets();
      }
      return this.instance;
    }
}

//export default PlaceholderAssets;

// デフォルトエクスポートとしてシングルトンインスタンスをエクスポート
export default PlaceholderAssets.getInstance();
  
// 個別の関数としてもエクスポート
export const initialize = PlaceholderAssets.getInstance().initialize.bind(PlaceholderAssets.getInstance());
export const createColorRect = PlaceholderAssets.getInstance().createColorRect.bind(PlaceholderAssets.getInstance());
export const getTexture = PlaceholderAssets.getInstance().getTexture.bind(PlaceholderAssets.getInstance());
export const getFallbackTexture = PlaceholderAssets.getInstance().getFallbackTexture.bind(PlaceholderAssets.getInstance());