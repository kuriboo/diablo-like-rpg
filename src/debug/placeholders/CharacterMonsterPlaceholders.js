/**
 * CharacterMonsterPlaceholders.js - モンスターキャラクター描画機能
 * 
 * このモジュールは幽霊、スライム、その他のモンスターキャラクターを
 * 描画するための関数を提供します。PlaceholderAssets.jsから
 * モンスター関連の機能を分離したものです。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';
import PlaceholderAssets from '../PlaceholderAssets';


class CharacterMonsterPlaceholders extends PlaceholderAssets {

  /**
   * 幽霊キャラクターを描画
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - キャラクターの色
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {string} variant - バリアント ('normal', 'wisp', 'phantom', 'shadow')
   * @param {boolean} details - 詳細な描画を有効にするか
   * @param {string} direction - 向き ('down', 'up', 'left', 'right')
   * @param {boolean} animation - アニメーション風にするか
   * @param {Object} customFeatures - カスタマイズオプション
   */
  drawGhostCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures = {}) {
    // デフォルトのカスタマイズオプション
    const defaults = {
      transparency: 0.7,
      eyeColor: 0x000000,
      glowColor: brightenColor(color, 30),
      hasTrail: true,
      hasArms: variant !== 'wisp',
      faceType: variant === 'shadow' ? 'scary' : 'normal', // 'normal', 'scary', 'cute'
      trailCount: variant === 'phantom' ? 3 : 1
    };
    
    const features = { ...defaults, ...customFeatures };
    
    // 基本的なサイズ計算
    const centerX = width / 2;
    const centerY = height / 2;
    const bodyWidth = width * 0.4;
    const bodyHeight = height * 0.4;
    
    // アニメーション効果（静止画でもわずかな動きを表現）
    let animOffsetY = 0;
    
    if (animation) {
      animOffsetY = Math.sin(Date.now() * 0.005) * 2;
    }
    
    // バリアントごとの描画の違い
    if (variant === 'wisp') {
      // ウィスプは単純な光の球体
      drawWispGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details);
    } else if (variant === 'phantom') {
      // ファントムは透明度が高く、残像あり
      drawPhantomGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details, direction);
    } else if (variant === 'shadow') {
      // シャドウは暗く、より怖い
      drawShadowGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details, direction);
    } else {
      // 通常の幽霊
      drawNormalGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details, direction);
    }
  }

  /**
   * ウィスプタイプの幽霊を描画
   */
  drawWispGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details) {
    // 本体（光の球体）
    graphics.fillStyle(color, features.transparency);
    graphics.fillCircle(centerX, centerY + animOffsetY, bodyWidth * 0.6);
    
    // 内側の光る部分
    graphics.fillStyle(features.glowColor, features.transparency * 0.8);
    graphics.fillCircle(centerX, centerY + animOffsetY, bodyWidth * 0.4);
    
    // 外側のグロー効果
    graphics.fillStyle(features.glowColor, features.transparency * 0.3);
    graphics.fillCircle(centerX, centerY + animOffsetY, bodyWidth * 0.8);
    
    // 小さな光の粒子
    if (details) {
      graphics.fillStyle(0xFFFFFF, features.transparency * 0.9);
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * bodyWidth * 0.4;
        const particleSize = 1 + Math.random() * 2;
        
        graphics.fillCircle(
          centerX + Math.cos(angle) * distance,
          centerY + animOffsetY + Math.sin(angle) * distance,
          particleSize
        );
      }
    }
    
    // 光の軌跡（あれば）
    if (features.hasTrail) {
      graphics.fillStyle(color, features.transparency * 0.5);
      for (let i = 1; i <= features.trailCount; i++) {
        const trailSize = bodyWidth * 0.6 * (1 - i * 0.2);
        graphics.fillCircle(centerX, centerY + animOffsetY + i * 5, trailSize);
      }
    }
  }

  /**
   * ファントムタイプの幽霊を描画
   */
  drawPhantomGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details, direction) {
    // 残像を先に描画
    if (features.hasTrail) {
      for (let i = 1; i <= features.trailCount; i++) {
        const trailAlpha = features.transparency * (1 - i * 0.2);
        const trailOffsetY = i * 5;
        
        // 残像の体
        graphics.fillStyle(color, trailAlpha * 0.7);
        drawGhostBody(graphics, centerX, centerY + trailOffsetY + animOffsetY, bodyWidth, bodyHeight, direction);
        
        // 残像の目と口（省略されたシンプルなバージョン）
        if (details && direction !== 'up') {
          graphics.fillStyle(0xFFFFFF, trailAlpha * 0.5);
          const eyeSpacing = bodyWidth * 0.3;
          const eyeSize = bodyWidth * 0.1;
          
          // 目
          graphics.fillCircle(centerX - eyeSpacing / 2, centerY - bodyHeight * 0.2 + trailOffsetY + animOffsetY, eyeSize);
          graphics.fillCircle(centerX + eyeSpacing / 2, centerY - bodyHeight * 0.2 + trailOffsetY + animOffsetY, eyeSize);
        }
      }
    }
    
    // メインのファントム
    graphics.fillStyle(color, features.transparency);
    drawGhostBody(graphics, centerX, centerY + animOffsetY, bodyWidth, bodyHeight, direction);
    
    // 顔の描画（上を向いている場合は顔は見えない）
    if (direction !== 'up') {
      drawGhostFace(graphics, centerX, centerY + animOffsetY, bodyWidth, bodyHeight, features, details, direction);
    }
    
    // 腕（あれば）
    if (features.hasArms && direction !== 'up') {
      drawGhostArms(graphics, centerX, centerY + animOffsetY, bodyWidth, bodyHeight, color, features.transparency, direction);
    }
    
    // グロー効果
    graphics.fillStyle(features.glowColor, features.transparency * 0.2);
    drawEllipse(
      graphics,
      centerX,
      centerY + animOffsetY,
      bodyWidth * 1.3,
      bodyHeight * 1.3
    );
  }

  /**
   * シャドウタイプの幽霊を描画
   */
  drawShadowGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details, direction) {
    // シャドウは暗い色
    const shadowColor = darkenColor(color, 50);
    
    // 底部の影
    graphics.fillStyle(0x000000, 0.3);
    drawEllipse(
      graphics,
      centerX,
      centerY + bodyHeight * 0.8,
      bodyWidth * 1.2,
      bodyHeight * 0.2
    );
    
    // 体（暗い色でより形がはっきりしない）
    graphics.fillStyle(shadowColor, features.transparency * 0.8);
    drawGhostBody(graphics, centerX, centerY + animOffsetY, bodyWidth, bodyHeight, direction);
    
    // 腕（まるで霧のように伸びる）
    if (features.hasArms && direction !== 'up') {
      graphics.fillStyle(shadowColor, features.transparency * 0.6);
      const armLength = bodyHeight * 0.6;
      const armWidth = bodyWidth * 0.15;
      
      if (direction === 'down') {
        // 両腕が見える
        // 左腕
        graphics.fillTriangle(
          centerX - bodyWidth * 0.3,
          centerY - bodyHeight * 0.1 + animOffsetY,
          centerX - bodyWidth * 0.3 - armLength,
          centerY + animOffsetY,
          centerX - bodyWidth * 0.3,
          centerY + armWidth + animOffsetY
        );
        
        // 右腕
        graphics.fillTriangle(
          centerX + bodyWidth * 0.3,
          centerY - bodyHeight * 0.1 + animOffsetY,
          centerX + bodyWidth * 0.3 + armLength,
          centerY + animOffsetY,
          centerX + bodyWidth * 0.3,
          centerY + armWidth + animOffsetY
        );
      } else if (direction === 'left' || direction === 'right') {
        // 片腕だけ見える
        const dirMod = direction === 'left' ? -1 : 1;
        
        graphics.fillTriangle(
          centerX,
          centerY - bodyHeight * 0.1 + animOffsetY,
          centerX + dirMod * armLength,
          centerY + animOffsetY,
          centerX,
          centerY + armWidth + animOffsetY
        );
      }
    }
    
    // 顔（恐ろしい表情）- 上を向いている場合は省略
    if (direction !== 'up') {
      // 目
      graphics.fillStyle(0xFF0000, features.transparency);
      const eyeSpacing = bodyWidth * 0.3;
      const eyeSize = bodyWidth * 0.1;
      
      graphics.fillCircle(centerX - eyeSpacing / 2, centerY - bodyHeight * 0.2 + animOffsetY, eyeSize);
      graphics.fillCircle(centerX + eyeSpacing / 2, centerY - bodyHeight * 0.2 + animOffsetY, eyeSize);
      
      // 口（鋭い歯を持つ）
      if (details) {
        graphics.fillStyle(0xFFFFFF, features.transparency * 0.8);
        
        // 口の輪郭
        drawEllipse(
          graphics,
          centerX,
          centerY + animOffsetY,
          bodyWidth * 0.4,
          bodyHeight * 0.1
        );
        
        // 歯
        for (let i = 0; i < 4; i++) {
          const toothWidth = bodyWidth * 0.05;
          const toothSpacing = bodyWidth * 0.09;
          
          graphics.fillTriangle(
            centerX - bodyWidth * 0.18 + i * toothSpacing,
            centerY - bodyHeight * 0.05 + animOffsetY,
            centerX - bodyWidth * 0.18 + i * toothSpacing + toothWidth,
            centerY - bodyHeight * 0.05 + animOffsetY,
            centerX - bodyWidth * 0.18 + i * toothSpacing + toothWidth / 2,
            centerY + bodyHeight * 0.05 + animOffsetY
          );
        }
      }
    }
    
    // ダークオーラ
    graphics.fillStyle(0x000000, features.transparency * 0.2);
    drawEllipse(
      graphics,
      centerX,
      centerY + animOffsetY,
      bodyWidth * 1.4,
      bodyHeight * 1.4
    );
  }

  /**
   * 通常の幽霊を描画
   */
  drawNormalGhost(graphics, color, width, height, centerX, centerY, bodyWidth, bodyHeight, features, animOffsetY, details, direction) {
    // 底部の影
    graphics.fillStyle(0x000000, 0.2);
    drawEllipse(
      graphics,
      centerX,
      centerY + bodyHeight * 0.8,
      bodyWidth,
      bodyHeight * 0.1
    );
    
    // 体
    graphics.fillStyle(color, features.transparency);
    drawGhostBody(graphics, centerX, centerY + animOffsetY, bodyWidth, bodyHeight, direction);
    
    // 腕（あれば）
    if (features.hasArms && direction !== 'up') {
      drawGhostArms(graphics, centerX, centerY + animOffsetY, bodyWidth, bodyHeight, color, features.transparency, direction);
    }
    
    // 顔の描画（上を向いている場合は顔は見えない）
    if (direction !== 'up') {
      drawGhostFace(graphics, centerX, centerY + animOffsetY, bodyWidth, bodyHeight, features, details, direction);
    }
  }

  /**
   * 幽霊の体を描画
   */
  drawGhostBody(graphics, centerX, centerY, bodyWidth, bodyHeight, direction) {
    // 上半身（丸い頭部）
    graphics.fillCircle(centerX, centerY - bodyHeight * 0.3, bodyWidth * 0.6);
    
    // 下半身（波形の裾）
    graphics.beginPath();
    
    // 体の左端
    graphics.moveTo(centerX - bodyWidth * 0.6, centerY - bodyHeight * 0.3);
    
    // 左側面
    graphics.lineTo(centerX - bodyWidth * 0.6, centerY + bodyHeight * 0.3);
    
    // 波形の裾を描く
    const waveCount = 5;
    const waveWidth = bodyWidth * 1.2 / waveCount;
    const waveHeight = bodyHeight * 0.2;
    
    for (let i = 0; i < waveCount; i++) {
      const waveX = centerX - bodyWidth * 0.6 + waveWidth * i;
      const waveY = centerY + bodyHeight * 0.3;
      
      if (i === 0) {
        graphics.lineTo(waveX + waveWidth / 2, waveY + waveHeight);
      } else {
        graphics.lineTo(waveX, waveY);
        graphics.lineTo(waveX + waveWidth / 2, waveY + waveHeight);
      }
    }
    
    // 体の右側面
    graphics.lineTo(centerX + bodyWidth * 0.6, centerY - bodyHeight * 0.3);
    
    // 頭部の上部で閉じる
    graphics.arc(centerX, centerY - bodyHeight * 0.3, bodyWidth * 0.6, 0, Math.PI, true);
    
    graphics.closePath();
    graphics.fill();
  }

  /**
   * 幽霊の顔を描画
   */
  drawGhostFace(graphics, centerX, centerY, bodyWidth, bodyHeight, features, details, direction) {
    const faceType = features.faceType;
    
    if (faceType === 'scary') {
      // 恐ろしい顔
      // 目
      graphics.fillStyle(0xFF0000, 0.8);
      const eyeSpacing = bodyWidth * 0.3;
      const eyeSize = bodyWidth * 0.1;
      
      graphics.fillCircle(centerX - eyeSpacing / 2, centerY - bodyHeight * 0.2, eyeSize);
      graphics.fillCircle(centerX + eyeSpacing / 2, centerY - bodyHeight * 0.2, eyeSize);
      
      // 口
      if (details) {
        graphics.fillStyle(0x000000, 0.8);
        drawEllipse(
          graphics,
          centerX,
          centerY,
          bodyWidth * 0.3,
          bodyHeight * 0.1
        );
      }
    } else if (faceType === 'cute') {
      // かわいい顔
      // 目
      graphics.fillStyle(0x000000, 1);
      const eyeSpacing = bodyWidth * 0.25;
      const eyeSize = bodyWidth * 0.08;
      
      graphics.fillCircle(centerX - eyeSpacing / 2, centerY - bodyHeight * 0.3, eyeSize);
      graphics.fillCircle(centerX + eyeSpacing / 2, centerY - bodyHeight * 0.3, eyeSize);
      
      // 白目のハイライト
      graphics.fillStyle(0xFFFFFF, 0.8);
      graphics.fillCircle(centerX - eyeSpacing / 2 + eyeSize * 0.3, centerY - bodyHeight * 0.3 - eyeSize * 0.3, eyeSize * 0.3);
      graphics.fillCircle(centerX + eyeSpacing / 2 + eyeSize * 0.3, centerY - bodyHeight * 0.3 - eyeSize * 0.3, eyeSize * 0.3);
      
      // 口（笑顔）
      if (details) {
        graphics.lineStyle(2, 0x000000, 0.8);
        graphics.beginPath();
        graphics.arc(centerX, centerY - bodyHeight * 0.15, bodyWidth * 0.2, 0.1 * Math.PI, 0.9 * Math.PI, false);
        graphics.strokePath();
      }
    } else {
      // 通常の顔
      // 目
      graphics.fillStyle(0x000000, 0.8);
      const eyeSpacing = bodyWidth * 0.3;
      const eyeSize = bodyWidth * 0.1;
      
      if (direction === 'left') {
        // 左向きは目が一つだけ見える
        graphics.fillCircle(centerX - eyeSpacing / 2, centerY - bodyHeight * 0.3, eyeSize);
      } else if (direction === 'right') {
        // 右向きは目が一つだけ見える
        graphics.fillCircle(centerX + eyeSpacing / 2, centerY - bodyHeight * 0.3, eyeSize);
      } else {
        // 正面向きは両目見える
        graphics.fillCircle(centerX - eyeSpacing / 2, centerY - bodyHeight * 0.3, eyeSize);
        graphics.fillCircle(centerX + eyeSpacing / 2, centerY - bodyHeight * 0.3, eyeSize);
      }
      
      // 口
      if (details) {
        graphics.fillStyle(0x000000, 0.8);
        drawEllipse(
          graphics,
          centerX,
          centerY - bodyHeight * 0.1,
          bodyWidth * 0.2,
          bodyHeight * 0.05
        );
      }
    }
  }

  /**
   * 幽霊の腕を描画
   */
  drawGhostArms(graphics, centerX, centerY, bodyWidth, bodyHeight, color, transparency, direction) {
    graphics.fillStyle(color, transparency * 0.8);
    
    if (direction === 'down') {
      // 両腕が見える
      // 左腕
      graphics.fillCircle(centerX - bodyWidth * 0.7, centerY - bodyHeight * 0.1, bodyWidth * 0.15);
      graphics.fillCircle(centerX - bodyWidth * 0.5, centerY - bodyHeight * 0.2, bodyWidth * 0.15);
      
      // 右腕
      graphics.fillCircle(centerX + bodyWidth * 0.7, centerY - bodyHeight * 0.1, bodyWidth * 0.15);
      graphics.fillCircle(centerX + bodyWidth * 0.5, centerY - bodyHeight * 0.2, bodyWidth * 0.15);
    } else if (direction === 'left') {
      // 左向きは右腕だけ見える
      graphics.fillCircle(centerX + bodyWidth * 0.5, centerY - bodyHeight * 0.2, bodyWidth * 0.15);
      graphics.fillCircle(centerX + bodyWidth * 0.7, centerY - bodyHeight * 0.1, bodyWidth * 0.15);
    } else if (direction === 'right') {
      // 右向きは左腕だけ見える
      graphics.fillCircle(centerX - bodyWidth * 0.5, centerY - bodyHeight * 0.2, bodyWidth * 0.15);
      graphics.fillCircle(centerX - bodyWidth * 0.7, centerY - bodyHeight * 0.1, bodyWidth * 0.15);
    }
  }

}

Object.assign(PlaceholderAssets.prototype, {
  drawGhostCharacter: CharacterMonsterPlaceholders.prototype.drawGhostCharacter,
  drawWispGhost: CharacterMonsterPlaceholders.prototype.drawWispGhost,
  drawPhantomGhost: CharacterMonsterPlaceholders.prototype.drawPhantomGhost,
  drawShadowGhost: CharacterMonsterPlaceholders.prototype.drawShadowGhost,
  drawNormalGhost: CharacterMonsterPlaceholders.prototype.drawNormalGhost,
  drawGhostBody: CharacterMonsterPlaceholders.prototype.drawGhostBody,
  drawGhostFace: CharacterMonsterPlaceholders.prototype.drawGhostFace,
  drawGhostArms: CharacterMonsterPlaceholders.prototype.drawGhostArms,  
});

export default PlaceholderAssets;
//export default CharacterMonsterPlaceholders;