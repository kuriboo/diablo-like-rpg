/**
 * placeholders/EffectPlaceholders.js - エフェクト生成機能
 * 
 * PlaceholderAssetsのエフェクト生成機能を提供します。
 * 様々なタイプのエフェクトを生成し、ゲーム開発のプレースホルダーとして使用します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';
import PlaceholderAssets from '../PlaceholderAssets';


class EffectPlaceholders extends PlaceholderAssets {

  /**
   * エフェクトプレースホルダーを作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createEffectPlaceholders(scene, placeholders) {
    // 攻撃エフェクト
    createAttackEffect(scene, 'effect_attack', 0xFF0000, placeholders);
    
    // 回復エフェクト
    createHealEffect(scene, 'effect_heal', 0x00FF00, placeholders);
    
    // 魔法エフェクト
    createMagicEffect(scene, 'effect_magic', 0x0000FF, placeholders);
    
    // パーティクル
    createParticle(scene, 'particle', 0xFFFFFF, placeholders);
  }

  /**
   * 攻撃エフェクトプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createAttackEffect(scene, key, color, placeholders) {
    const graphics = scene.add.graphics();
    const size = 64;
    
    // 攻撃エフェクト（十字型）
    graphics.fillStyle(color, 0.8);
    
    // 中央から放射状の線
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      graphics.fillTriangle(
        size / 2, size / 2,
        size / 2 + Math.cos(angle) * size / 3, size / 2 + Math.sin(angle) * size / 3,
        size / 2 + Math.cos(angle + 0.3) * size / 3, size / 2 + Math.sin(angle + 0.3) * size / 3
      );
    }
    
    // 中央の円
    graphics.fillStyle(brightenColor(color, 50), 1);
    graphics.fillCircle(size / 2, size / 2, size / 8);
    
    // テクスチャとして生成して登録
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    
    // プレースホルダー一覧に追加
    if (placeholders) {
      placeholders[key] = { type: 'effect_attack', color, width: size, height: size };
    }
  }

  /**
   * 回復エフェクトプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createHealEffect(scene, key, color, placeholders) {
    const graphics = scene.add.graphics();
    const size = 64;
    
    // 回復エフェクト（上昇する＋マーク）
    graphics.fillStyle(color, 0.8);
    
    // 十字マーク
    graphics.fillRect(size / 2 - 4, size / 4, 8, size / 2);
    graphics.fillRect(size / 4, size / 2 - 4, size / 2, 8);
    
    // 上昇するパーティクル
    for (let i = 0; i < 10; i++) {
      const x = size / 4 + Math.random() * size / 2;
      const y = size / 4 + Math.random() * size / 2;
      const particleSize = 2 + Math.random() * 3;
      
      graphics.fillStyle(brightenColor(color, Math.random() * 80), 0.6);
      graphics.fillCircle(x, y, particleSize);
    }
    
    // テクスチャとして生成して登録
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    
    // プレースホルダー一覧に追加
    if (placeholders) {
      placeholders[key] = { type: 'effect_heal', color, width: size, height: size };
    }
  }

  /**
   * 魔法エフェクトプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createMagicEffect(scene, key, color, placeholders) {
    const graphics = scene.add.graphics();
    const size = 64;
    
    // 魔法エフェクト（六芒星とパーティクル）
    graphics.lineStyle(2, color, 0.8);
    
    // 六芒星
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 3;
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const nextAngle = (Math.PI * 2 / 6) * ((i + 2) % 6);
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(nextAngle) * radius;
      const y2 = centerY + Math.sin(nextAngle) * radius;
      
      graphics.lineBetween(x1, y1, x2, y2);
    }
    
    // 中央の円
    graphics.fillStyle(color, 0.5);
    graphics.fillCircle(centerX, centerY, radius / 3);
    
    // パーティクル
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const particleSize = 1 + Math.random() * 2;
      
      graphics.fillStyle(brightenColor(color, Math.random() * 80), 0.6);
      graphics.fillCircle(x, y, particleSize);
    }
    
    // テクスチャとして生成して登録
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    
    // プレースホルダー一覧に追加
    if (placeholders) {
      placeholders[key] = { type: 'effect_magic', color, width: size, height: size };
    }
  }

  /**
   * パーティクルプレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createParticle(scene, key, color, placeholders) {
    const graphics = scene.add.graphics();
    const size = 8;
    
    // シンプルな円形パーティクル
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size / 3);
    
    // グラデーション効果
    graphics.fillStyle(brightenColor(color, 50), 0.6);
    graphics.fillCircle(size / 2, size / 2, size / 4);
    
    // テクスチャとして生成して登録
    graphics.generateTexture(key, size, size);
    graphics.destroy();
    
    // 各フレーム（8x8の小さな画像を複数用意）
    for (let i = 1; i <= 4; i++) {
      const fadeGraphics = scene.add.graphics();
      
      // フェードアウト効果
      fadeGraphics.fillStyle(color, 1 - (i * 0.2));
      fadeGraphics.fillCircle(size / 2, size / 2, size / 3 * (1 - i * 0.1));
      
      // テクスチャとして生成して登録
      fadeGraphics.generateTexture(`${key}_${i}`, size, size);
      fadeGraphics.destroy();
      
      // プレースホルダー一覧に追加
      if (placeholders) {
        placeholders[`${key}_${i}`] = { type: 'particle', color, width: size, height: size };
      }
    }
    
    // プレースホルダー一覧に追加
    if (placeholders) {
      placeholders[key] = { type: 'particle', color, width: size, height: size };
    }
  }

}

Object.assign(PlaceholderAssets.prototype, {
  createEffectPlaceholders: EffectPlaceholders.prototype.createEffectPlaceholders,
  createAttackEffect: EffectPlaceholders.prototype.createAttackEffect,
  createHealEffect: EffectPlaceholders.prototype.createHealEffect,
  createMagicEffect: EffectPlaceholders.prototype.createMagicEffect,
  createParticle: EffectPlaceholders.prototype.createParticle,
});

export default PlaceholderAssets;
//export default EffectPlaceholders;