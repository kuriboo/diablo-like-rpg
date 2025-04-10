/**
 * placeholders/CharacterSlimePlaceholders.js - スライムキャラクター描画機能
 * 
 * PlaceholderAssetsのスライム系キャラクター描画機能を提供します。
 * スライムタイプのモンスターキャラクターを描画します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';
import PlaceholderAssets from '../PlaceholderAssets';


class CharacterSlimePlaceholders extends PlaceholderAssets {

  /**
   * スライムキャラクターを描画
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - キャラクターの色
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {string} variant - バリアント ('normal', 'king', 'elemental', 'metal')
   * @param {boolean} details - 詳細な描画を有効にするか
   * @param {string} direction - 向き ('down', 'up', 'left', 'right')
   * @param {boolean} animation - アニメーション風にするか
   * @param {Object} customFeatures - カスタマイズオプション
   */
  drawSlimeCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures = {}) {
    // デフォルトのカスタマイズオプション
    const defaults = {
      transparency: variant === 'normal' ? 0.8 : 0.9,
      eyeColor: 0x000000,
      innerColor: brightenColor(color, 20),
      bubbleCount: variant === 'elemental' ? 8 : 4,
      hasCrown: variant === 'king',
      metallic: variant === 'metal',
      facialExpression: 'happy' // 'happy', 'angry', 'neutral'
    };
    
    const features = { ...defaults, ...customFeatures };
    
    // 基本的なサイズ計算
    const centerX = width / 2;
    const centerY = height / 2;
    
    // スライムのサイズ調整
    let sizeModifier = 1.0;
    if (variant === 'king') {
      sizeModifier = 1.2;
    } else if (variant === 'metal') {
      sizeModifier = 0.9;
    }
    
    // スライムの体のサイズ
    const bodyWidth = width * 0.5 * sizeModifier;
    const bodyHeight = height * 0.4 * sizeModifier;
    
    // アニメーション効果（静止画でもわずかな動きを表現）
    let squishY = 0;
    let squishX = 0;
    
    if (animation) {
      squishY = Math.sin(Date.now() * 0.005) * bodyHeight * 0.1;
      squishX = -squishY * 0.5; // 体積保存の法則で横に広がる
    }
    
    // 底部の影
    graphics.fillStyle(0x000000, 0.2);
    drawEllipse(
      graphics,
      centerX,
      centerY + bodyHeight * 0.6,
      bodyWidth,
      bodyHeight * 0.1
    );
    
    // スライムの体を描画（バリアントによって異なる）
    if (variant === 'metal') {
      // 金属スライムは反射光沢と硬い表面
      drawMetalSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction);
    } else if (variant === 'elemental') {
      // 属性スライムは内部にエネルギーの渦や粒子がある
      drawElementalSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction);
    } else if (variant === 'king') {
      // 王様スライムは王冠と大きさがある
      drawKingSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction);
    } else {
      // 通常のスライム
      drawNormalSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction);
    }
  }

  /**
   * 通常のスライムを描画
   */
  drawNormalSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction) {
    // 底部の影
    graphics.fillStyle(0x000000, 0.2);
    drawEllipse(
      graphics,
      centerX,
      centerY + bodyHeight * 0.6,
      bodyWidth,
      bodyHeight * 0.1
    );
    
    // スライムの体
    graphics.fillStyle(color, features.transparency);
    drawEllipse(
      graphics,
      centerX,
      centerY,
      bodyWidth + squishX,
      bodyHeight - squishY
    );
    
    // 内部の光る部分やバブル
    if (details) {
      // 半透明の内側のエリア
      graphics.fillStyle(features.innerColor, features.transparency * 0.7);
      drawEllipse(
        graphics,
        centerX,
        centerY - bodyHeight * 0.2,
        bodyWidth * 0.7 + squishX * 0.7,
        bodyHeight * 0.6 - squishY * 0.7
      );
      
      // 小さな気泡
      graphics.fillStyle(features.innerColor, features.transparency * 0.5);
      for (let i = 0; i < features.bubbleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * bodyWidth * 0.6;
        const bubbleSize = bodyWidth * (0.05 + Math.random() * 0.05);
        
        graphics.fillCircle(
          centerX + Math.cos(angle) * distance,
          centerY + Math.sin(angle) * distance - bodyHeight * 0.1,
          bubbleSize
        );
      }
    }
    
    // 目と表情
    if (direction !== 'up') { // 背面からは見えない
      drawSlimeFace(graphics, centerX, centerY, bodyWidth, bodyHeight, features, details, direction);
    }
  }

  /**
   * 金属スライムを描画
   */
  drawMetalSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction) {
    // 金属スライムの体
    graphics.fillStyle(color, features.metallic ? 1.0 : features.transparency);
    drawEllipse(
      graphics,
      centerX,
      centerY,
      bodyWidth + squishX,
      bodyHeight - squishY
    );
    
    // 金属の光沢
    if (details) {
      // 反射ハイライト
      graphics.fillStyle(0xFFFFFF, 0.5);
      drawEllipse(
        graphics,
        centerX - bodyWidth * 0.3,
        centerY - bodyHeight * 0.3,
        bodyWidth * 0.3,
        bodyHeight * 0.2
      );
      
      // 別の反射
      graphics.fillStyle(0xFFFFFF, 0.3);
      drawEllipse(
        graphics,
        centerX + bodyWidth * 0.2,
        centerY + bodyHeight * 0.1,
        bodyWidth * 0.1,
        bodyHeight * 0.1
      );
      
      // 輪郭線（硬い表面を表現）
      graphics.lineStyle(1, darkenColor(color, 30), 0.8);
      drawEllipse(
        graphics,
        centerX,
        centerY,
        bodyWidth + squishX,
        bodyHeight - squishY,
        true,
        false
      );
    }
    
    // 目と表情
    if (direction !== 'up') { // 背面からは見えない
      drawSlimeFace(graphics, centerX, centerY - bodyHeight * 0.1, bodyWidth, bodyHeight, features, details, direction);
    }
  }

  /**
   * 属性スライムを描画
   */
  drawElementalSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction) {
    // 外側の薄いオーラ
    graphics.fillStyle(features.innerColor, features.transparency * 0.3);
    drawEllipse(
      graphics,
      centerX,
      centerY,
      bodyWidth * 1.2 + squishX * 1.2,
      bodyHeight * 1.2 - squishY * 1.2
    );
    
    // 本体
    graphics.fillStyle(color, features.transparency * 0.7);
    drawEllipse(
      graphics,
      centerX,
      centerY,
      bodyWidth + squishX,
      bodyHeight - squishY
    );
    
    // 内部のエネルギー
    if (details) {
      // エネルギーの渦
      const vortexColor = brightenColor(color, 50);
      graphics.fillStyle(vortexColor, features.transparency * 0.6);
      
      // 渦巻き効果
      const vortexRadius = bodyWidth * 0.7;
      const spiralArms = 3;
      
      for (let arm = 0; arm < spiralArms; arm++) {
        const startAngle = (Math.PI * 2 / spiralArms) * arm;
        
        for (let i = 0; i < Math.PI * 2; i += 0.3) {
          const spiralRadius = vortexRadius * (1 - i / (Math.PI * 4));
          if (spiralRadius <= 0) continue;
          
          const x = centerX + Math.cos(i + startAngle) * spiralRadius;
          const y = centerY + Math.sin(i + startAngle) * spiralRadius;
          const dotSize = bodyWidth * 0.04 * (1 - i / (Math.PI * 4));
          
          graphics.fillCircle(x, y, dotSize);
        }
      }
      
      // 中心のエネルギー球
      graphics.fillStyle(0xFFFFFF, features.transparency * 0.8);
      graphics.fillCircle(centerX, centerY, bodyWidth * 0.15);
    }
    
    // 目と表情
    if (direction !== 'up') { // 背面からは見えない
      // 属性スライムは目が少し大きい
      features.eyeScale = 1.2;
      drawSlimeFace(graphics, centerX, centerY - bodyHeight * 0.2, bodyWidth, bodyHeight, features, details, direction);
    }
  }

  /**
   * 王様スライムを描画
   */
  drawKingSlime(graphics, color, centerX, centerY, bodyWidth, bodyHeight, squishX, squishY, features, details, direction) {
    // 王様スライムの体
    graphics.fillStyle(color, features.transparency);
    drawEllipse(
      graphics,
      centerX,
      centerY,
      bodyWidth + squishX,
      bodyHeight - squishY
    );
    
    // 内部の光る部分
    if (details) {
      // 半透明の内側のエリア
      graphics.fillStyle(features.innerColor, features.transparency * 0.7);
      drawEllipse(
        graphics,
        centerX,
        centerY - bodyHeight * 0.2,
        bodyWidth * 0.7 + squishX * 0.7,
        bodyHeight * 0.6 - squishY * 0.7
      );
      
      // 小さな気泡
      graphics.fillStyle(features.innerColor, features.transparency * 0.5);
      for (let i = 0; i < features.bubbleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * bodyWidth * 0.6;
        const bubbleSize = bodyWidth * (0.05 + Math.random() * 0.05);
        
        graphics.fillCircle(
          centerX + Math.cos(angle) * distance,
          centerY + Math.sin(angle) * distance - bodyHeight * 0.1,
          bubbleSize
        );
      }
    }
    
    // 目と表情 - 王様スライムは目が大きい
    if (direction !== 'up') { // 背面からは見えない
      features.eyeScale = 1.3;
      drawSlimeFace(graphics, centerX, centerY - bodyHeight * 0.15, bodyWidth, bodyHeight, features, details, direction);
    }
    
    // 王冠
    if (features.hasCrown) {
      const crownColor = 0xFFD700; // 金色
      graphics.fillStyle(crownColor, 1.0);
      
      // 王冠の基部
      graphics.fillRect(
        centerX - bodyWidth * 0.3,
        centerY - bodyHeight * 0.6,
        bodyWidth * 0.6,
        bodyHeight * 0.15
      );
      
      // 王冠のとげ
      for (let i = 0; i < 3; i++) {
        const spikeX = centerX - bodyWidth * 0.2 + bodyWidth * 0.2 * i;
        graphics.fillTriangle(
          spikeX - bodyWidth * 0.05,
          centerY - bodyHeight * 0.6,
          spikeX + bodyWidth * 0.05,
          centerY - bodyHeight * 0.6,
          spikeX,
          centerY - bodyHeight * 0.8
        );
      }
      
      // 王冠の宝石
      if (details) {
        graphics.fillStyle(0xFF0000, 1.0); // 赤い宝石
        graphics.fillCircle(
          centerX,
          centerY - bodyHeight * 0.65,
          bodyWidth * 0.06
        );
      }
    }
  }

  /**
   * スライムの顔を描画
   */
  drawSlimeFace(graphics, centerX, centerY, bodyWidth, bodyHeight, features, details, direction) {
    // 目のサイズと間隔
    const eyeScale = features.eyeScale || 1.0;
    const eyeSize = bodyWidth * 0.08 * eyeScale;
    const eyeSpacing = bodyWidth * 0.2;
    
    // 顔の向きに応じて目の位置を調整
    let leftEyeX, rightEyeX;
    
    if (direction === 'left') {
      // 左向き - 左目だけ見える
      leftEyeX = centerX - eyeSpacing * 0.5;
      rightEyeX = null; // 見えない
    } else if (direction === 'right') {
      // 右向き - 右目だけ見える
      leftEyeX = null; // 見えない
      rightEyeX = centerX + eyeSpacing * 0.5;
    } else {
      // 正面向き - 両目見える
      leftEyeX = centerX - eyeSpacing * 0.5;
      rightEyeX = centerX + eyeSpacing * 0.5;
    }
    
    // 目の白目
    graphics.fillStyle(0xFFFFFF, 1);
    
    if (leftEyeX !== null) {
      graphics.fillCircle(leftEyeX, centerY - bodyHeight * 0.1, eyeSize);
    }
    
    if (rightEyeX !== null) {
      graphics.fillCircle(rightEyeX, centerY - bodyHeight * 0.1, eyeSize);
    }
    
    // 瞳
    graphics.fillStyle(features.eyeColor, 1);
    
    if (leftEyeX !== null) {
      graphics.fillCircle(leftEyeX, centerY - bodyHeight * 0.1, eyeSize * 0.6);
    }
    
    if (rightEyeX !== null) {
      graphics.fillCircle(rightEyeX, centerY - bodyHeight * 0.1, eyeSize * 0.6);
    }
    
    // 表情
    if (details && direction === 'down') {
      if (features.facialExpression === 'happy') {
        // 笑顔
        graphics.lineStyle(bodyWidth * 0.03, 0x000000, 1);
        graphics.beginPath();
        graphics.arc(centerX, centerY + bodyHeight * 0.2, bodyWidth * 0.2, 0, Math.PI, false);
        graphics.strokePath();
      } else if (features.facialExpression === 'angry') {
        // 怒った表情
        graphics.lineStyle(bodyWidth * 0.03, 0x000000, 1);
        graphics.beginPath();
        graphics.arc(centerX, centerY + bodyHeight * 0.3, bodyWidth * 0.2, Math.PI, 0, false);
        graphics.strokePath();
        
        // 眉を追加
        graphics.lineStyle(bodyWidth * 0.03, 0x000000, 1);
        
        if (leftEyeX !== null) {
          graphics.lineBetween(
            leftEyeX - eyeSize,
            centerY - bodyHeight * 0.2 - eyeSize,
            leftEyeX + eyeSize,
            centerY - bodyHeight * 0.2
          );
        }
        
        if (rightEyeX !== null) {
          graphics.lineBetween(
            rightEyeX - eyeSize,
            centerY - bodyHeight * 0.2,
            rightEyeX + eyeSize,
            centerY - bodyHeight * 0.2 - eyeSize
          );
        }
      } else {
        // ニュートラルな表情
        graphics.lineStyle(bodyWidth * 0.03, 0x000000, 1);
        graphics.lineBetween(
          centerX - bodyWidth * 0.15,
          centerY + bodyHeight * 0.2,
          centerX + bodyWidth * 0.15,
          centerY + bodyHeight * 0.2
        );
      }
    }
  }

  /**
   * 楕円を描画するヘルパー関数の拡張
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} x - 中心X座標
   * @param {number} y - 中心Y座標
   * @param {number} radiusX - X軸半径
   * @param {number} radiusY - Y軸半径
   * @param {boolean} outline - 輪郭線のみかどうか
   * @param {boolean} fill - 塗りつぶすかどうか
   */
  drawEllipseExtended(graphics, x, y, radiusX, radiusY, outline = false, fill = true) {
    if (outline) {
      // すでにlineStyle()が設定されていることを前提に輪郭線のみ描画
      graphics.strokeEllipse(x, y, radiusX, radiusY);
    } else if (fill) {
      // 通常の塗りつぶし
      graphics.fillEllipse(x, y, radiusX, radiusY);
    } else {
      // 両方
      graphics.fillEllipse(x, y, radiusX, radiusY);
      graphics.strokeEllipse(x, y, radiusX, radiusY);
    }
  }

}

Object.assign(PlaceholderAssets.prototype, {
  drawSlimeCharacter: CharacterSlimePlaceholders.prototype.drawSlimeCharacter,
  drawNormalSlime: CharacterSlimePlaceholders.prototype.drawNormalSlime,
  drawMetalSlime: CharacterSlimePlaceholders.prototype.drawMetalSlime,
  drawElementalSlime: CharacterSlimePlaceholders.prototype.drawElementalSlime,
  drawKingSlime: CharacterSlimePlaceholders.prototype.drawKingSlime,
  drawSlimeFace: CharacterSlimePlaceholders.prototype.drawSlimeFace,
  drawEllipseExtended: CharacterSlimePlaceholders.prototype.drawEllipseExtended,
});

export default PlaceholderAssets;
//export default CharacterSlimePlaceholders;