/**
 * placeholders/ItemGenerator.js - アイテム生成機能
 * 
 * PlaceholderAssetsのアイテム生成機能を提供します。
 * 様々なタイプのアイテムを生成し、ゲーム開発のプレースホルダーとして使用します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';

/**
 * アイテムプレースホルダーを作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createItemPlaceholders(scene, placeholders) {
  // アイテムタイプと色のマッピング
  const itemColors = {
    potion_health: 0xFF0000,    // 赤（回復ポーション）
    potion_mana: 0x0000FF,      // 青（マナポーション）
    weapon_sword: 0xC0C0C0,     // 銀（剣）
    weapon_axe: 0x8B4513,       // 茶（斧）
    weapon_bow: 0xCD853F,       // ペルー（弓）
    armor: 0x4682B4,            // スティールブルー（防具）
    chest_closed: 0x8B4513,     // 茶（閉じた宝箱）
    chest_open: 0xFFD700,       // 金（開いた宝箱）
    gold_coin: 0xFFD700         // 金（金貨）
  };
  
  // 通常アイテムプレースホルダー作成
  Object.entries(itemColors).forEach(([type, color]) => {
    if (type.includes('potion')) {
      // ポーションの特殊形状
      createPotionItem(scene, `item_${type}`, color, placeholders);
    } else if (type.includes('chest')) {
      // 宝箱の特殊形状
      createChestItem(scene, type, color, type.includes('open'), placeholders);
    } else if (type.includes('weapon')) {
      // 武器の特殊形状
      createWeaponItem(scene, `item_${type}`, color, type.split('_')[1], placeholders);
    } else if (type === 'armor') {
      // 防具の特殊形状
      createArmorItem(scene, `item_${type}`, color, placeholders);
    } else if (type.includes('gold')) {
      // 金貨の特殊形状
      createGoldItem(scene, `item_${type}`, color, placeholders);
    } else {
      // その他の一般アイテム
      createColorRect(scene, `item_${type}`, 16, 16, color, placeholders);
    }
  });
  
  // 汎用アイテムプレースホルダー
  createColorRect(scene, 'item_placeholder', 16, 16, 0xFFFF00, placeholders);
}

/**
 * ポーションアイテムのプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createPotionItem(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 16;
  const height = 16;
  
  // ポーションの形（丸い底と細い首）
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(5, 6, 6, 8, { tl: 3, tr: 3, bl: 3, br: 3 });
  
  // ポーションの首
  graphics.fillStyle(darkenColor(color, 10), 1);
  graphics.fillRect(6, 3, 4, 3);
  
  // ポーションの栓
  graphics.fillStyle(0x8B4513, 1);
  graphics.fillRect(6, 2, 4, 1);
  
  // ポーションの光沢
  graphics.fillStyle(brightenColor(color, 60), 0.5);
  graphics.fillRoundedRect(6, 8, 2, 4, 1);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'item_potion', color, width, height };
  }
}

/**
 * 宝箱アイテムのプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {boolean} isOpen - 開いているかどうか
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createChestItem(scene, key, color, isOpen, placeholders) {
  const graphics = scene.add.graphics();
  const width = 32;
  const height = 32;
  
  // 宝箱の底
  graphics.fillStyle(color, 1);
  graphics.fillRect(8, 16, 16, 12);
  
  // 宝箱の枠線
  graphics.lineStyle(1, darkenColor(color, 30), 1);
  graphics.strokeRect(8, 16, 16, 12);
  
  if (isOpen) {
    // 開いた宝箱の蓋
    graphics.fillStyle(darkenColor(color, 20), 1);
    graphics.fillRect(8, 8, 16, 4);
    
    // 蓋の内側
    graphics.fillStyle(brightenColor(color, 30), 1);
    graphics.fillRect(9, 9, 14, 2);
    
    // キラキラエフェクト
    graphics.fillStyle(0xFFFFFF, 0.8);
    graphics.fillCircle(16, 20, 2);
    graphics.fillCircle(20, 22, 1);
    
    // 宝箱の金具
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillRect(14, 14, 4, 2);
  } else {
    // 閉じた宝箱の蓋
    graphics.fillStyle(darkenColor(color, 20), 1);
    graphics.fillRect(8, 12, 16, 4);
    
    // 宝箱の金具
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillRect(14, 14, 4, 2);
  }
  
  // テクスチャとして生成して登録
  // TopDownMapの命名規則に合わせる
  const finalKey = key.startsWith('item_') ? key : `item_${key.replace('chest_', '')}`;
  graphics.generateTexture(finalKey, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[finalKey] = { type: 'item_chest', isOpen, color, width, height };
  }
}

/**
 * 武器アイテムのプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {string} weaponType - 武器タイプ
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createWeaponItem(scene, key, color, weaponType, placeholders) {
  const graphics = scene.add.graphics();
  const width = 16;
  const height = 16;
  
  if (weaponType === 'sword') {
    // 剣
    // 剣の刃
    graphics.fillStyle(color, 1);
    graphics.fillRect(7, 2, 2, 10);
    
    // 剣の先端
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(7, 2, 9, 2, 8, 1);
    
    // 剣のつば
    graphics.fillStyle(0xFFD700, 1); // 金色
    graphics.fillRect(5, 12, 6, 1);
    
    // 剣の柄
    graphics.fillStyle(0x8B4513, 1); // 茶色
    graphics.fillRect(7, 13, 2, 3);
  } else if (weaponType === 'axe') {
    // 斧
    // 斧の柄
    graphics.fillStyle(0x8B4513, 1); // 茶色
    graphics.fillRect(7, 7, 2, 8);
    
    // 斧の刃
    graphics.fillStyle(color, 1);
    graphics.fillTriangle(8, 2, 12, 5, 8, 8);
    graphics.fillTriangle(8, 2, 4, 5, 8, 8);
  } else if (weaponType === 'bow') {
    // 弓
    // 弓の本体
    graphics.lineStyle(2, color, 1);
    graphics.beginPath();
    graphics.arc(8, 8, 6, 0.5, 5.78, false);
    graphics.strokePath();
    
    // 弓の弦
    graphics.lineStyle(1, 0xFFFFFF, 1);
    graphics.lineBetween(4, 3, 12, 3);
    
    // 矢
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(8, 4, 1, 8);
    graphics.fillStyle(0xc0c0c0, 1);
    graphics.fillTriangle(8, 4, 9, 4, 8.5, 2);
  } else {
    // その他のデフォルト武器
    graphics.fillStyle(color, 1);
    graphics.fillRect(6, 4, 4, 10);
  }
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'item_weapon', weaponType, color, width, height };
  }
}

/**
 * 防具アイテムのプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createArmorItem(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 16;
  const height = 16;
  
  // 鎧の胴体部分
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(4, 4, 8, 10, 2);
  
  // 鎧の肩部分
  graphics.fillStyle(darkenColor(color, 20), 1);
  graphics.fillRect(2, 4, 2, 3);
  graphics.fillRect(12, 4, 2, 3);
  
  // 鎧の模様
  graphics.lineStyle(1, darkenColor(color, 30), 1);
  graphics.lineBetween(8, 4, 8, 14);
  graphics.lineBetween(4, 9, 12, 9);
  
  // 鎧の光沢
  graphics.fillStyle(brightenColor(color, 50), 0.3);
  graphics.fillRect(5, 5, 2, 3);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'item_armor', color, width, height };
  }
}

/**
 * 金貨アイテムのプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createGoldItem(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 16;
  const height = 16;
  
  // 金貨の外枠
  graphics.fillStyle(color, 1);
  graphics.fillCircle(8, 8, 5);
  
  // 金貨の内側
  graphics.fillStyle(darkenColor(color, 10), 1);
  graphics.fillCircle(8, 8, 4);
  
  // 金貨の模様（$マーク）
  graphics.fillStyle(color, 1);
  graphics.fillRect(7, 5, 2, 6);
  graphics.fillRect(6, 5, 4, 1);
  graphics.fillRect(6, 8, 4, 1);
  graphics.fillRect(6, 10, 4, 1);
  
  // 金貨の光沢
  graphics.fillStyle(brightenColor(color, 50), 0.6);
  graphics.fillCircle(6, 6, 1);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'item_gold', color, width, height };
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
export function createColorRect(scene, key, width, height, color, placeholders, alpha = 1) {
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