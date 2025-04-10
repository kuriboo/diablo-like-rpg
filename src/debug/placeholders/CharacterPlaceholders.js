/**
 * placeholders/CharacterPlaceholders.js - キャラクター生成機能
 * 
 * PlaceholderAssetsのキャラクター生成機能を提供します。
 * 様々なタイプのキャラクターを生成し、ゲーム開発のプレースホルダーとして使用します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';
import PlaceholderAssets from '../PlaceholderAssets';


class CharacterPlaceholders extends PlaceholderAssets {

  /**
   * キャラクタープレースホルダーを作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createCharacterPlaceholders(scene, placeholders) {
    // プレイヤータイプごとのプレースホルダー作成
    const playerTypes = ['warrior', 'rogue', 'sorcerer'];
    const playerColors = {
      warrior: 0x8B0000, // 暗い赤
      rogue: 0x006400,   // 暗い緑
      sorcerer: 0x00008B  // 暗い青
    };
    
    // プレイヤータイプごとのプレースホルダーを作成
    playerTypes.forEach(type => {
      const key = `player_${type}`;
      createColorRect(scene, key, 32, 32, playerColors[type] || 0x00FF00, placeholders);
      if (placeholders) {
        placeholders[key] = { type: 'player', color: playerColors[type], width: 32, height: 32 };
      }
    });
    
    // コンパニオンタイプごとのプレースホルダーを作成
    playerTypes.forEach(type => {
      const key = `companion_${type}`;
      const color = playerColors[type] ? brightenColor(playerColors[type], 30) : 0x00FFFF;
      createColorRect(scene, key, 32, 32, color, placeholders);
      if (placeholders) {
        placeholders[key] = { type: 'companion', color: color, width: 32, height: 32 };
      }
    });
    
    // 敵キャラクタータイプと色のマッピング
    const enemyTypes = ['skeleton', 'zombie', 'ghost', 'spider', 'slime', 'wolf', 'boss'];
    const enemyColors = {
      skeleton: 0xBDBDBD,  // 薄い灰色
      zombie: 0x556B2F,    // オリーブ
      ghost: 0xE6E6FA,     // 薄い紫
      spider: 0x800080,    // 紫
      slime: 0x00FF7F,     // 春の緑
      wolf: 0x8B4513,      // サドルブラウン
      boss: 0xFF0000       // 赤
    };
    
    // 敵タイプごとのプレースホルダーを作成
    enemyTypes.forEach(type => {
      const key = `enemy_${type}`;
      createColorRect(scene, key, 32, 32, enemyColors[type] || 0xFF0000, placeholders);
      if (placeholders) {
        placeholders[key] = { type: 'enemy', color: enemyColors[type], width: 32, height: 32 };
      }
    });
    
    // NPCタイプと色のマッピング
    const npcTypes = ['villager', 'guard', 'blacksmith', 'merchant', 'alchemist'];
    const npcColors = {
      villager: 0xFFD700,   // 金色
      guard: 0x4682B4,      // スティールブルー
      blacksmith: 0xB22222, // 煉瓦色
      merchant: 0x9370DB,   // ミディアムパープル
      alchemist: 0x32CD32   // ライムグリーン
    };
    
    // NPCタイプごとのプレースホルダーを作成
    npcTypes.forEach(type => {
      const key = `npc_${type}`;
      createColorRect(scene, key, 32, 32, npcColors[type] || 0x0000FF, placeholders);
      if (placeholders) {
        placeholders[key] = { type: 'npc', color: npcColors[type], width: 32, height: 32 };
      }
    });
    
    // 共通プレースホルダー（デバッグ用）は残しておく
    createColorRect(scene, 'character_placeholder', 32, 32, 0x00FF00, placeholders);
  }

  /**
   * 方向付きキャラクタープレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {string} direction - 方向 ('up', 'down', 'left', 'right')
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createDirectionalCharacter(scene, key, color, direction, placeholders) {
    const graphics = scene.add.graphics();
    
    // キャラクターのサイズ
    const width = 32;
    const height = 32;
    
    // 基本の矩形を描画
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    
    // 輪郭を追加
    graphics.lineStyle(1, 0x000000, 1);
    graphics.strokeRect(0, 0, width, height);
    
    // 方向インジケータ（白い三角形）
    graphics.fillStyle(0xffffff, 1);
    
    switch (direction) {
      case 'up':
        // 上向き三角形
        graphics.fillTriangle(
          width / 2, 5,  // 頂点
          width - 10, 15, // 右下
          10, 15         // 左下
        );
        break;
      case 'down':
        // 下向き三角形
        graphics.fillTriangle(
          width / 2, height - 5,  // 頂点
          width - 10, height - 15, // 右上
          10, height - 15         // 左上
        );
        break;
      case 'left':
        // 左向き三角形
        graphics.fillTriangle(
          5, height / 2,  // 頂点
          15, 10,         // 右上
          15, height - 10 // 右下
        );
        break;
      case 'right':
        // 右向き三角形
        graphics.fillTriangle(
          width - 5, height / 2,  // 頂点
          width - 15, 10,         // 左上
          width - 15, height - 10 // 左下
        );
        break;
    }
    
    // 目の表現を追加（方向に応じて位置調整）
    graphics.fillStyle(0x000000, 1);
    
    if (direction === 'left') {
      // 左向きなら左側に目
      graphics.fillCircle(10, 15, 2);
    } else if (direction === 'right') {
      // 右向きなら右側に目
      graphics.fillCircle(width - 10, 15, 2);
    } else if (direction === 'up' || direction === 'down') {
      // 上下向きなら両目
      graphics.fillCircle(12, 15, 2);
      graphics.fillCircle(width - 12, 15, 2);
    }
    
    // テクスチャとして生成して登録
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    // プレースホルダー一覧に追加
    if (placeholders) {
      placeholders[key] = { type: 'character', direction, color, width, height };
    }
  }

  /**
   * キャラクター向けの改良されたプレースホルダー生成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - キャラクターの色
   * @param {string} characterType - キャラクタータイプ ('humanoid', 'monster', 'ghost', 'slime', 'beast', 'mech')
   * @param {Object} options - 追加オプション
   * @param {Object} placeholders - プレースホルダーオブジェクト
   * @returns {string} 生成されたテクスチャのキー
   */
  createEnhancedCharacter(scene, key, color, characterType = 'humanoid', options = {}, placeholders) {
    if (!scene || !scene.add) {
      console.warn(`シーンが無効なため ${key} を作成できません`);
      return null;
    }
    
    const defaultOptions = {
      width: 32,
      height: 32,
      variant: 'normal', // 'normal', 'armored', 'robed', 'hooded'
      details: true,     // 詳細な描画を有効にするか
      quality: 'high',   // 'low', 'medium', 'high'
      alpha: 1.0,        // 透明度
      direction: 'down', // 'down', 'up', 'left', 'right'
      animation: false,  // アニメーション風にするか（静止画像の場合）
      customFeatures: {} // キャラクタータイプ固有のカスタマイズ
    };
    
    const settings = { ...defaultOptions, ...options };
    const { width, height, variant, details, quality, alpha, direction, animation, customFeatures } = settings;
    
    try {
      const graphics = scene.add.graphics();
      
      // キャラクタータイプごとに別々の描画関数を呼び出す
      switch(characterType.toLowerCase()) {
        case 'humanoid':
          drawHumanoidCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures);
          break;
        case 'monster':
          drawMonsterCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures);
          break;
        case 'ghost':
          drawGhostCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures);
          break;
        case 'slime':
          drawSlimeCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures);
          break;
        case 'beast':
          drawBeastCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures);
          break;
        case 'mech':
          drawMechCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures);
          break;
        default:
          // デフォルトはhumanoid
          drawHumanoidCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures);
      }
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      if (placeholders) {
        placeholders[key] = { 
          type: 'character', 
          characterType, 
          variant,
          color, 
          width, 
          height, 
          direction
        };
      }
      
      console.log(`✅ 強化キャラクター生成完了: ${key} (${characterType}, ${variant})`);
      return key;
    } catch (e) {
      console.error(`強化キャラクター ${key} の生成中にエラーが発生しました:`, e);
      
      // エラーが発生した場合、単純な色付き矩形で代用
      createColorRect(scene, key, width, height, color, placeholders, alpha);
      return key;
    }
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

  /**
   * 敵キャラクタープレースホルダーを作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {string} enemyType - 敵タイプ（'skeleton', 'zombie', 'ghost', 'spider', 'slime', 'wolf', 'boss'）
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createEnemyCharacter(scene, key, enemyType, placeholders) {
    // 敵タイプに応じた色を取得
    const enemyColors = {
      skeleton: 0xBDBDBD,  // 薄い灰色
      zombie: 0x556B2F,    // オリーブ
      ghost: 0xE6E6FA,     // 薄い紫
      spider: 0x800080,    // 紫
      slime: 0x00FF7F,     // 春の緑
      wolf: 0x8B4513,      // サドルブラウン
      boss: 0xFF0000       // 赤
    };
    
    // 敵タイプに応じたキャラクタータイプを取得
    const characterTypes = {
      skeleton: 'humanoid',
      zombie: 'humanoid',
      ghost: 'ghost',
      spider: 'monster',
      slime: 'slime',
      wolf: 'monster',
      boss: 'humanoid'
    };
    
    // 色とキャラクタータイプを取得
    const color = enemyColors[enemyType] || 0xFF0000;
    const characterType = characterTypes[enemyType] || 'humanoid';
    
    // 敵キャラクターを作成
    createEnhancedCharacter(scene, key, color, characterType, {}, placeholders);
  }

}

Object.assign(PlaceholderAssets.prototype, {
  createCharacterPlaceholders: CharacterPlaceholders.prototype.createCharacterPlaceholders,
  createDirectionalCharacter: CharacterPlaceholders.prototype.createDirectionalCharacter,
  createEnhancedCharacter: CharacterPlaceholders.prototype.createEnhancedCharacter,
  createColorRect: CharacterPlaceholders.prototype.createColorRect,
  createEnemyCharacter: CharacterPlaceholders.prototype.createEnemyCharacter,
});

export default PlaceholderAssets;
//export default CharacterPlaceholders;