/**
 * placeholders/AnimationGenerator.js - キャラクターアニメーション生成機能
 * 
 * PlaceholderAssetsのアニメーション生成機能を提供します。
 * キャラクターのスプライトシートとアニメーションを生成します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';
import PlaceholderAssets from '../PlaceholderAssets';


class AnimationPlaceholders extends PlaceholderAssets {

  /**
   * キャラクターのスプライトシートを生成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - スプライトシートのキー
   * @param {number} color - キャラクターの色
   * @param {string} action - 動作タイプ
   * @param {string} direction - 方向
   * @param {number} frameCount - フレーム数
   * @param {number} frameWidth - フレーム幅
   * @param {number} frameHeight - フレーム高さ
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createCharacterSpritesheet(scene, key, color, action, direction, frameCount, frameWidth, frameHeight, placeholders) {
    if (!scene || !scene.textures) {
      console.warn(`シーンが無効なため ${key} を作成できません`);
      return;
    }
    
    // 既にテクスチャが存在する場合はスキップ
    if (scene.textures.exists(key)) {
      console.log(`スプライトシート ${key} は既に存在します`);
      return;
    }
    
    try {
      console.log(`スプライトシート生成開始: ${key}`);
      
      // 統合されたキャンバスを作成（すべてのフレームを一つのテクスチャに）
      const totalWidth = frameWidth * frameCount;
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d');
      
      // 基本的な影の色（暗い色）
      const shadowColor = darkenColor(color, 50);
      
      // 各フレームを描画
      for (let frame = 0; frame < frameCount; frame++) {
        const frameX = frame * frameWidth;
        
        // 動作と方向に基づいてキャラクターを描画
        drawCharacterFrame(
          ctx, 
          color, 
          action, 
          direction, 
          frame, 
          frameX, 
          0, 
          frameWidth, 
          frameHeight,
          shadowColor
        );
      }
      
      // キャンバスをテクスチャとして登録
      const texture = scene.textures.addCanvas(key, canvas);
      
      // スプライトシートの設定
      scene.textures.get(key).add('0', 0, 0, 0, totalWidth, frameHeight, frameCount, frameWidth, frameHeight);
      
      console.log(`✅ スプライトシート生成完了: ${key} (${frameCount}フレーム)`);
      
      // プレースホルダー一覧に追加
      if (placeholders) {
        placeholders[key] = { 
          type: 'character_sheet', 
          action, 
          direction, 
          frameCount, 
          color, 
          width: totalWidth, 
          height: frameHeight 
        };
      }
      
    } catch (e) {
      console.error(`スプライトシート ${key} の生成中にエラーが発生しました:`, e);
      
      // エラーが発生した場合、単一フレームの単色プレースホルダーを生成
      if (scene.add && scene.add.graphics) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, frameWidth, frameHeight);
        graphics.generateTexture(key, frameWidth, frameHeight);
        graphics.destroy();
        
        // 最低限のスプライトシート構造を設定
        scene.textures.get(key).add('0', 0, 0, 0, frameWidth, frameHeight, frameCount, frameWidth, frameHeight);
      }
    }
  }

  /**
   * 方向付きキャラクターアニメーションフレームを描画
   * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
   * @param {number} color - キャラクターの色
   * @param {string} action - 動作タイプ
   * @param {string} direction - 方向
   * @param {number} frameIndex - フレームインデックス
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {number} shadowColor - 影の色
   */
  drawCharacterFrame(ctx, color, action, direction, frameIndex, x, y, width, height, shadowColor) {
    // キャンバスの座標系は左上が原点
    
    // このフレームの領域をクリア
    ctx.clearRect(x, y, width, height);
    
    // キャラクター描画のベース設定
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const bodyWidth = width * 0.4;
    const bodyHeight = height * 0.5;
    const headRadius = width * 0.15;
    
    // 足の設定
    const legLength = height * 0.2;
    const legWidth = width * 0.08;
    
    // 腕の設定
    const armLength = height * 0.25;
    const armWidth = width * 0.08;
    
    // アニメーションフレームインデックスに基づく動きのオフセット
    const frameOffset = frameIndex / 10;  // フレーム間の変化を滑らかにする
    const walkCycle = Math.sin(frameIndex * Math.PI / 2); // 歩行サイクル (-1 〜 1)
    
    // 方向による体の向きを調整
    let flipX = 1;  // 左右反転フラグ（1:通常、-1:反転）
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    
    if (direction === 'left') {
      flipX = -1;  // 左向きなら反転
    }
    
    // 動作による体の調整
    let bodyModifier = 1.0;  // 体の形状修飾子
    let headOffsetY = 0;  // 頭の位置オフセット
    let limbsActionModifier = 0;  // 手足の動きの修飾子
    
    // 動作に応じた体の構成を設定
    if (action === 'idle') {
      // アイドル状態は小さな上下運動
      bodyOffsetY = Math.sin(frameIndex * 0.7) * 1.5;
      limbsActionModifier = 0.3;
    } else if (action === 'walk') {
      // 歩行時は足と腕を大きく動かす
      bodyOffsetY = Math.abs(walkCycle) * 2;
      limbsActionModifier = 1.0;
    } else if (action === 'attack') {
      // 攻撃時は体を前に傾ける
      bodyOffsetX = flipX * (frameIndex % 3) * 2;
      bodyModifier = 0.9 + (frameIndex % 3) * 0.1;
      limbsActionModifier = 1.5;
    } else if (action === 'hurt') {
      // ダメージ時は体を後ろに傾ける
      bodyOffsetX = -flipX * 3;
      bodyOffsetY = 2;
      bodyModifier = 0.8;
      limbsActionModifier = 0.8;
    } else if (action === 'death') {
      // 死亡時は徐々に倒れる
      const deathProgress = frameIndex / 4;  // 0〜1の進行度
      bodyOffsetY = 8 * deathProgress;
      bodyModifier = 1.0 - 0.3 * deathProgress;
      headOffsetY = 2 * deathProgress;
      limbsActionModifier = -0.5 * deathProgress;
    } else if (action === 'cast') {
      // 魔法詠唱時は腕を上げる
      bodyOffsetY = -Math.sin(frameIndex * 0.5) * 2;
      limbsActionModifier = 0.7 + Math.sin(frameIndex * Math.PI / 2) * 0.3;
    }
    
    // 足を描画（左右の足）
    ctx.fillStyle = shadowColor; // 足は少し暗く
    
    // 左足と右足のオフセットを計算（歩行サイクルに基づく）
    let leftLegOffset = 0;
    let rightLegOffset = 0;
    
    if (action === 'walk') {
      leftLegOffset = walkCycle * 5 * limbsActionModifier;
      rightLegOffset = -walkCycle * 5 * limbsActionModifier;
    } else if (action === 'attack') {
      // 攻撃時は足を踏ん張る
      leftLegOffset = -2 * limbsActionModifier;
      rightLegOffset = 2 * limbsActionModifier;
    } else if (action === 'idle') {
      // アイドル時はわずかに動かす
      leftLegOffset = Math.sin(frameIndex * 0.5) * limbsActionModifier;
      rightLegOffset = -Math.sin(frameIndex * 0.5) * limbsActionModifier;
    }
    
    // 左足
    ctx.fillRect(
      centerX - (legWidth * 1.5) + bodyOffsetX,
      centerY + bodyHeight / 2 + leftLegOffset,
      legWidth,
      legLength
    );
    
    // 右足
    ctx.fillRect(
      centerX + (legWidth * 0.5) + bodyOffsetX,
      centerY + bodyHeight / 2 + rightLegOffset,
      legWidth,
      legLength
    );
    
    // 体を描画
    ctx.fillStyle = color;
    
    if (direction === 'up' || direction === 'down') {
      // 上向きか下向きなら楕円形の体
      drawEllipse(
        ctx,
        centerX + bodyOffsetX,
        centerY + bodyOffsetY,
        bodyWidth * bodyModifier,
        bodyHeight
      );
    } else {
      // 左右向きなら少し細長い楕円
      drawEllipse(
        ctx,
        centerX + bodyOffsetX,
        centerY + bodyOffsetY,
        bodyWidth * bodyModifier * 0.9,
        bodyHeight
      );
    }
    
    // 腕を描画（左右の腕）
    ctx.fillStyle = color;
    
    // 腕の角度と長さを設定
    let leftArmAngle = 0;
    let rightArmAngle = 0;
    let leftArmScale = 1;
    let rightArmScale = 1;
    
    if (action === 'walk') {
      // 歩行時は腕を振る
      leftArmAngle = walkCycle * 0.5 * limbsActionModifier;
      rightArmAngle = -walkCycle * 0.5 * limbsActionModifier;
    } else if (action === 'attack') {
      // 攻撃時は片腕を大きく振る
      const attackProgress = (frameIndex % 3) / 2;  // 0〜1の攻撃進行度
      
      if (direction === 'left' || direction === 'right') {
        // 左右方向の攻撃
        leftArmAngle = flipX * (1 - attackProgress) * Math.PI * 0.3;
        rightArmAngle = flipX * attackProgress * Math.PI * 0.5;
        leftArmScale = 1 + attackProgress * 0.3;
      } else {
        // 上下方向の攻撃
        leftArmAngle = (1 - attackProgress) * Math.PI * 0.3;
        rightArmAngle = -attackProgress * Math.PI * 0.5;
        rightArmScale = 1 + attackProgress * 0.3;
      }
    } else if (action === 'cast') {
      // 魔法詠唱時は両腕を上げる
      const castProgress = Math.sin(frameIndex * Math.PI / 2);  // 詠唱の進行
      leftArmAngle = -0.3 - castProgress * 0.3;
      rightArmAngle = 0.3 + castProgress * 0.3;
    } else if (action === 'idle') {
      // アイドル時はわずかに動かす
      leftArmAngle = Math.sin(frameIndex * 0.5) * 0.1 * limbsActionModifier;
      rightArmAngle = -Math.sin(frameIndex * 0.5) * 0.1 * limbsActionModifier;
    } else if (action === 'hurt' || action === 'death') {
      // ダメージや死亡時は腕を下げる
      leftArmAngle = 0.2;
      rightArmAngle = -0.2;
    }
    
    // 腕の描画（方向と動作に応じて調整）
    if (direction === 'up') {
      // 上向き - 腕は体の横から後ろ向きに
      drawArm(ctx, centerX - bodyWidth * 0.4 + bodyOffsetX, centerY - bodyHeight * 0.2 + bodyOffsetY, 
            leftArmAngle - Math.PI * 0.3, armLength * leftArmScale, armWidth);
      drawArm(ctx, centerX + bodyWidth * 0.4 + bodyOffsetX, centerY - bodyHeight * 0.2 + bodyOffsetY, 
            rightArmAngle + Math.PI * 0.3, armLength * rightArmScale, armWidth);
    } else if (direction === 'down') {
      // 下向き - 腕は体の横から前向きに
      drawArm(ctx, centerX - bodyWidth * 0.4 + bodyOffsetX, centerY - bodyHeight * 0.2 + bodyOffsetY, 
            leftArmAngle + Math.PI * 0.3, armLength * leftArmScale, armWidth);
      drawArm(ctx, centerX + bodyWidth * 0.4 + bodyOffsetX, centerY - bodyHeight * 0.2 + bodyOffsetY, 
            rightArmAngle - Math.PI * 0.3, armLength * rightArmScale, armWidth);
    } else {
      // 左右向き - 片側の腕のみ見える
      const armBaseX = centerX + bodyOffsetX;
      const armBaseY = centerY - bodyHeight * 0.2 + bodyOffsetY;
      
      if (direction === 'left') {
        // 左向き - 右腕が見える
        drawArm(ctx, armBaseX, armBaseY, rightArmAngle + Math.PI * 0.2, armLength * rightArmScale, armWidth);
      } else {
        // 右向き - 左腕が見える
        drawArm(ctx, armBaseX, armBaseY, leftArmAngle - Math.PI * 0.2, armLength * leftArmScale, armWidth);
      }
    }
    
    // 頭を描画
    ctx.fillStyle = color;
    let headX = centerX + bodyOffsetX;
    let headY = centerY - bodyHeight * 0.5 + headOffsetY + bodyOffsetY;
    
    // 方向に応じた頭の形状
    if (direction === 'up') {
      // 上向きの頭（頭の上部が小さい）
      drawEllipse(ctx, headX, headY, headRadius * 1.8, headRadius * 1.5);
      
      // 髪の毛のような装飾
      ctx.fillStyle = darkenColor(color, 20);
      drawEllipse(ctx, headX, headY - headRadius * 0.5, headRadius * 1.5, headRadius * 0.7);
    } else if (direction === 'down') {
      // 下向きの頭（普通の丸）
      drawEllipse(ctx, headX, headY, headRadius * 1.8, headRadius * 1.7);
      
      // 顔のディテール
      ctx.fillStyle = shadowColor;
      
      // 目
      const eyeSize = headRadius * 0.2;
      ctx.fillRect(headX - headRadius * 0.6, headY - headRadius * 0.2, eyeSize, eyeSize);
      ctx.fillRect(headX + headRadius * 0.4, headY - headRadius * 0.2, eyeSize, eyeSize);
      
      // 口
      ctx.fillRect(headX - headRadius * 0.3, headY + headRadius * 0.4, headRadius * 0.6, headRadius * 0.1);
    } else {
      // 左右向きの頭（横向きのシルエット）
      drawEllipse(ctx, headX, headY, headRadius * 1.5, headRadius * 1.7);
      
      // 顔のディテール（方向に応じて左右反転）
      ctx.fillStyle = shadowColor;
      
      // 目と口（方向に応じて位置調整）
      if (direction === 'left') {
        // 左向き
        ctx.fillRect(headX - headRadius * 0.7, headY - headRadius * 0.2, headRadius * 0.3, headRadius * 0.3);
        ctx.fillRect(headX - headRadius * 0.4, headY + headRadius * 0.4, headRadius * 0.3, headRadius * 0.1);
      } else {
        // 右向き
        ctx.fillRect(headX + headRadius * 0.4, headY - headRadius * 0.2, headRadius * 0.3, headRadius * 0.3);
        ctx.fillRect(headX + headRadius * 0.1, headY + headRadius * 0.4, headRadius * 0.3, headRadius * 0.1);
      }
    }
    
    // アクション固有のエフェクト
    if (action === 'attack') {
      // 攻撃エフェクト
      const attackProgress = frameIndex / 2;
      
      if (attackProgress > 0.5) {
        // 攻撃の軌跡
        ctx.strokeStyle = brightenColor(color, 70);
        ctx.lineWidth = 2;
        
        // 攻撃方向に応じた軌跡
        ctx.beginPath();
        if (direction === 'left') {
          ctx.arc(centerX - width * 0.3, centerY, width * 0.3, -Math.PI * 0.8, -Math.PI * 0.2);
        } else if (direction === 'right') {
          ctx.arc(centerX + width * 0.3, centerY, width * 0.3, -Math.PI * 0.8, -Math.PI * 0.2);
        } else if (direction === 'up') {
          ctx.arc(centerX, centerY - height * 0.3, width * 0.3, Math.PI * 0.8, Math.PI * 0.2, true);
        } else {
          ctx.arc(centerX, centerY + height * 0.3, width * 0.3, -Math.PI * 0.2, -Math.PI * 0.8, true);
        }
        ctx.stroke();
      }
    } else if (action === 'cast') {
      // 魔法詠唱エフェクト
      const castProgress = frameIndex / 3;
      
      if (castProgress > 0.3) {
        // 魔法のオーラ
        const glowColor = brightenColor(color, 100);
        ctx.fillStyle = `rgba(${(glowColor >> 16) & 0xFF}, ${(glowColor >> 8) & 0xFF}, ${glowColor & 0xFF}, 0.3)`;
        
        // 体の周りに魔法の円
        const glowRadius = width * 0.4 * castProgress;
        drawEllipse(ctx, centerX + bodyOffsetX, centerY + bodyOffsetY - height * 0.1, glowRadius, glowRadius * 0.8);
        
        // 魔法の粒子
        ctx.fillStyle = brightenColor(color, 70);
        for (let i = 0; i < 8; i++) {
          const angle = Math.PI * 2 * i / 8 + frameIndex * 0.2;
          const particleX = centerX + bodyOffsetX + Math.cos(angle) * glowRadius * 0.8;
          const particleY = centerY + bodyOffsetY - height * 0.1 + Math.sin(angle) * glowRadius * 0.6;
          const particleSize = width * 0.05 * (0.7 + Math.sin(frameIndex + i) * 0.3);
          
          drawEllipse(ctx, particleX, particleY, particleSize, particleSize);
        }
      }
    } else if (action === 'hurt') {
      // ダメージエフェクト
      const hurtIntensity = 0.7 - frameIndex * 0.3;  // フレームが進むにつれて弱まる
      
      if (hurtIntensity > 0) {
        // ダメージ時の赤い点滅
        ctx.fillStyle = `rgba(255, 0, 0, ${hurtIntensity * 0.3})`;
        ctx.fillRect(x, y, width, height);
        
        // 小さなダメージ表現（！マークのような）
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.fillRect(centerX - width * 0.03, centerY - height * 0.3, width * 0.06, height * 0.15);
        ctx.fillRect(centerX - width * 0.03, centerY - height * 0.1, width * 0.06, height * 0.05);
      }
    } else if (action === 'death') {
      // 死亡エフェクト
      const deathProgress = frameIndex / 4;  // 0〜1の進行度
      
      // 透明度を徐々に下げる
      ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * deathProgress})`;
      ctx.fillRect(x, y, width, height);
      
      // 魂が抜けるような表現
      if (deathProgress > 0.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(deathProgress - 0.5) * 0.8})`;
        
        for (let i = 0; i < 3; i++) {
          const soulX = centerX + (Math.random() * 2 - 1) * width * 0.1;
          const soulY = centerY - height * 0.3 * deathProgress - i * height * 0.15;
          const soulSize = width * 0.1 * (1 - deathProgress * 0.5);
          
          drawEllipse(ctx, soulX, soulY, soulSize, soulSize * 1.5);
        }
      }
    }
  }

  /**
   * 楕円を描画するヘルパー関数
   * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
   * @param {number} x - 中心X座標
   * @param {number} y - 中心Y座標
   * @param {number} radiusX - X軸半径
   * @param {number} radiusY - Y軸半径
   */
  drawEllipse(ctx, x, y, radiusX, radiusY) {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 腕を描画するヘルパー関数
   * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
   * @param {number} x - 接続点X座標
   * @param {number} y - 接続点Y座標
   * @param {number} angle - 角度（ラジアン）
   * @param {number} length - 腕の長さ
   * @param {number} width - 腕の幅
   */
  drawArm(ctx, x, y, angle, length, width) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // 腕の描画（少し湾曲した形）
    ctx.beginPath();
    ctx.moveTo(-width / 2, 0);
    ctx.lineTo(-width / 2, length);
    ctx.quadraticCurveTo(-width / 2 + width / 4, length + width / 2, width / 2, length);
    ctx.lineTo(width / 2, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * 複数方向のキャラクターアニメーションを生成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} baseKey - ベースとなるテクスチャーキー
   * @param {number} color - キャラクターの色
   * @param {string[]} actions - 生成する動作の配列
   * @param {string[]} directions - 生成する方向の配列
   * @param {Object} options - その他のオプション
   * @param {Object} placeholders - プレースホルダーオブジェクト
   * @returns {Object} 生成されたテクスチャのマップ
   */
  createCharacterAnimationSet(scene, baseKey, color, actions = ['idle', 'walk'], directions = ['down', 'left', 'right', 'up'], options = {}, placeholders) {
    if (!scene || !scene.textures) {
      console.warn(`シーンが無効なため ${baseKey} アニメーションセットを作成できません`);
      return {};
    }
    
    const defaultOptions = {
      frameWidth: 32,
      frameHeight: 32,
      frameRate: 8
    };
    
    const settings = { ...defaultOptions, ...options };
    const { frameWidth, frameHeight } = settings;
    
    // アクションフレーム数のマッピング
    const actionFrames = {
      idle: 4,
      walk: 4,
      attack: 3,
      hurt: 2,
      death: 5,
      cast: 4
    };
    
    console.log(`キャラクターアニメーションセット生成開始: ${baseKey}`);
    
    const generatedTextures = {};
    
    // 各動作と方向の組み合わせでスプライトシートを生成
    for (const action of actions) {
      generatedTextures[action] = {};
      
      for (const direction of directions) {
        // 各アクションのフレーム数を取得
        const frameCount = actionFrames[action] || 4;
        
        // テクスチャキーを生成
        const textureKey = `${baseKey}_${action}_${direction}_sheet`;
        
        // スプライトシートを生成
        createCharacterSpritesheet(
          scene,
          textureKey,
          color,
          action,
          direction,
          frameCount,
          frameWidth,
          frameHeight,
          placeholders
        );
        
        generatedTextures[action][direction] = textureKey;
      }
    }
    
    console.log(`✅ キャラクターアニメーションセット生成完了: ${baseKey}`);
    return generatedTextures;
  }

}

Object.assign(PlaceholderAssets.prototype, {
  createCharacterSpritesheet: AnimationPlaceholders.prototype.createCharacterSpritesheet,
  generateRooms: AnimationPlaceholders.prototype.generateRooms,
  roomsOverlap: DungeonMapGenerator.prototype.roomsOverlap,
  connectRooms: DungeonMapGenerator.prototype.connectRooms,
  createHorizontalCorridor: DungeonMapGenerator.prototype.createHorizontalCorridor,
  createVerticalCorridor: DungeonMapGenerator.prototype.createVerticalCorridor,
  finalizeWallsAndFloors: DungeonMapGenerator.prototype.finalizeWallsAndFloors,
  generateHeightMapFromRooms: DungeonMapGenerator.prototype.generateHeightMapFromRooms
});

export default PlaceholderAssets;