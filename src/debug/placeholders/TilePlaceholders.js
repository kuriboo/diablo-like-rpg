/**
 * placeholders/TilePlaceholders.js - タイル生成機能
 * 
 * PlaceholderAssetsのタイル生成機能を提供します。
 * 様々なタイプのタイルを生成し、ゲーム開発のプレースホルダーとして使用します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';
import PlaceholderAssets from '../PlaceholderAssets';


class TilePlaceholders extends PlaceholderAssets {

  /**
   * タイルプレースホルダーを作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createTilePlaceholders(scene, placeholders) {
    // タイルタイプと色のマッピング - TopDownMapの使用するタイプに合わせる
    const tileColors = {
      water: 0x1E90FF,  // ドジャーブルー
      grass: 0x3CB371,  // ミディアムシーグリーン
      dirt: 0x8B4513,   // サドルブラウン
      sand: 0xF4A460,   // サンディブラウン
      stone: 0x708090,  // スレートグレー
      snow: 0xFFFAFA,   // スノー
      lava: 0xFF4500    // オレンジレッド
    };
    
    // 障害物タイプと色のマッピング
    const obstacleColors = {
      tree: 0x228B22,    // フォレストグリーン
      rock: 0x696969,    // ディムグレー
      bush: 0x32CD32,    // ライムグリーン
      crate: 0xCD853F    // ペルー
    };
    
    // タイルプレースホルダー作成
    Object.entries(tileColors).forEach(([type, color]) => {
      // TopDownMapが使用する命名規則に合わせる
      const key = `tile_${type}`;
      createTileWithPattern(scene, key, color, placeholders);
    });
    
    // 障害物プレースホルダー作成
    Object.entries(obstacleColors).forEach(([type, color]) => {
      // 障害物は少し立体的に
      const key = `obstacle_${type}`;
      createObstacle(scene, key, color, placeholders);
    });
    
    // 壁プレースホルダー（特殊処理）
    createWallTile(scene, 'tile_wall', 0x808080, 'stone', placeholders);
  }

  /**
   * パターン付きタイルプレースホルダー作成 - TopDownMap用に調整
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createTileWithPattern(scene, key, color, placeholders) {
    if (!scene || !scene.add) {
      console.warn(`シーンが無効なため ${key} を作成できません`);
      return;
    }
    
    try {
      const graphics = scene.add.graphics();
      const tileSize = 32; // TopDownMapのデフォルトタイルサイズ
      
      // 背景色を塗る
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, tileSize, tileSize);
      
      // パターン追加（タイプごとに異なるパターン）
      if (key.includes('grass')) {
        // 草のパターン - 水と同様の手法で実装
        graphics.lineStyle(1, brightenColor(color, 20), 0.5);
        for (let i = 0; i < 5; i++) {
          const y = 3 + i * 6;
          // 草の短い縦線
          for (let x = 0; x < tileSize; x += 8) {
            graphics.beginPath();
            graphics.moveTo(x, y);
            graphics.lineTo(x, y + 4);
            graphics.strokePath();
          }
        }
      } else if (key.includes('dirt')) {
        // 土のパターン - 水と同様の手法で実装
        graphics.lineStyle(1, darkenColor(color, 20), 0.4);
        // 格子状の線を描画
        for (let i = 0; i < 4; i++) {
          // 水平線
          graphics.beginPath();
          graphics.moveTo(0, 8 * i);
          graphics.lineTo(tileSize, 8 * i);
          graphics.strokePath();
          
          // 垂直線
          graphics.beginPath();
          graphics.moveTo(8 * i, 0);
          graphics.lineTo(8 * i, tileSize);
          graphics.strokePath();
        }
      } else if (key.includes('stone')) {
        // 石のパターン - 水と同様の手法で実装
        graphics.lineStyle(1, darkenColor(color, 30), 0.6);
        // 石の割れ目を表現
        // 斜め線
        graphics.beginPath();
        graphics.moveTo(0, 0);
        graphics.lineTo(tileSize, tileSize);
        graphics.strokePath();
        
        graphics.beginPath();
        graphics.moveTo(tileSize, 0);
        graphics.lineTo(0, tileSize);
        graphics.strokePath();
        
        // 十字線
        graphics.beginPath();
        graphics.moveTo(tileSize/2, 0);
        graphics.lineTo(tileSize/2, tileSize);
        graphics.strokePath();
        
        graphics.beginPath();
        graphics.moveTo(0, tileSize/2);
        graphics.lineTo(tileSize, tileSize/2);
        graphics.strokePath();
      } else if (key.includes('water')) {
        // 水のパターン（波線）- 元のコードでうまく機能しているのでそのまま保持
        graphics.lineStyle(1, brightenColor(color, 40), 0.5);
        for (let i = 0; i < 3; i++) {
          const y = 5 + i * 10;
          graphics.beginPath();
          graphics.moveTo(0, y);
          graphics.lineTo(8, y + 2);
          graphics.lineTo(16, y);
          graphics.lineTo(24, y + 2);
          graphics.lineTo(32, y);
          graphics.strokePath();
        }
      } else if (key.includes('snow')) {
        // 雪のパターン - 水と同様の手法で実装
        graphics.lineStyle(1, brightenColor(color, 10), 0.3);
        // 雪の結晶を簡易的に表現
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const x = 8 + i * 8;
            const y = 8 + j * 8;
            // 十字の線で雪の結晶を表現
            // 水平線
            graphics.beginPath();
            graphics.moveTo(x - 3, y);
            graphics.lineTo(x + 3, y);
            graphics.strokePath();
            
            // 垂直線
            graphics.beginPath();
            graphics.moveTo(x, y - 3);
            graphics.lineTo(x, y + 3);
            graphics.strokePath();
            
            // 斜め線1
            graphics.beginPath();
            graphics.moveTo(x - 2, y - 2);
            graphics.lineTo(x + 2, y + 2);
            graphics.strokePath();
            
            // 斜め線2
            graphics.beginPath();
            graphics.moveTo(x + 2, y - 2);
            graphics.lineTo(x - 2, y + 2);
            graphics.strokePath();
          }
        }
      } else if (key.includes('sand')) {
        // 砂のパターン - 水と同様の手法で実装
        graphics.lineStyle(1, darkenColor(color, 15), 0.3);
        // 砂の波紋
        for (let i = 0; i < 4; i++) {
          const y = 4 + i * 8;
          // 緩やかな波線
          graphics.beginPath();
          graphics.moveTo(0, y);
          graphics.lineTo(8, y - 1);
          graphics.lineTo(16, y);
          graphics.lineTo(24, y - 1);
          graphics.lineTo(32, y);
          graphics.strokePath();
        }
      } else if (key.includes('lava')) {
        // 溶岩のパターン - 水と同様の手法で実装
        // 泡の表現
        for (let i = 0; i < 3; i++) {
          const y = 6 + i * 10;
          // 赤いハイライト
          graphics.lineStyle(2, brightenColor(color, 50), 0.7);
          graphics.beginPath();
          graphics.moveTo(0, y);
          graphics.lineTo(10, y + 3);
          graphics.lineTo(20, y - 2);
          graphics.lineTo(32, y + 1);
          graphics.strokePath();
          
          // 複数の泡を描画
          graphics.fillStyle(brightenColor(color, 40), 0.6);
          graphics.fillCircle(8, y - 3, 2);
          graphics.fillCircle(22, y + 2, 3);
          graphics.fillCircle(16, y - 4, 2);
        }
      } else if (key.includes('wall')) {
        // 壁のパターン - 水と同様の手法で実装
        // レンガ模様
        graphics.lineStyle(1, darkenColor(color, 20), 0.7);
        
        // 水平線（レンガの段）
        for (let y = 0; y < tileSize; y += 8) {
          graphics.beginPath();
          graphics.moveTo(0, y);
          graphics.lineTo(tileSize, y);
          graphics.strokePath();
        }
        
        // 垂直線（レンガのジョイント）- 交互に配置
        for (let row = 0; row < 4; row++) {
          const y = row * 8;
          const offset = (row % 2) * 16; // 交互にオフセット
          
          for (let col = 0; col < 2; col++) {
            const x = offset + col * 16;
            graphics.beginPath();
            graphics.moveTo(x, y);
            graphics.lineTo(x, y + 8);
            graphics.strokePath();
          }
        }
        
        // ハイライトを追加
        graphics.fillStyle(brightenColor(color, 10), 0.2);
        for (let row = 0; row < 4; row++) {
          const y = row * 8 + 1;
          const offset = (row % 2) * 16;
          
          for (let col = 0; col < 2; col++) {
            const x = offset + col * 16 + 1;
            graphics.fillRect(x, y, 15, 6);
          }
        }
      }
      
      // 軽いグリッド線（タイルの境界が分かるように）
      graphics.lineStyle(1, darkenColor(color, 10), 0.3);
      graphics.strokeRect(0, 0, tileSize, tileSize);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, tileSize, tileSize);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      if (placeholders) {
        placeholders[key] = { type: 'tile', color, width: tileSize, height: tileSize };
      }
      
      // 登録確認ログ
      //console.log(`Created tile placeholder: ${key}`);
    } catch (e) {
      console.error(`タイルプレースホルダー ${key} の作成中にエラーが発生しました:`, e);
      
      // エラーが発生した場合、より単純な方法でプレースホルダーを作成
      try {
        createColorRect(scene, key, 32, 32, color, placeholders);
        console.log(`Fallback colorRect created for ${key}`);
      } catch (innerError) {
        console.error(`代替プレースホルダーの作成にも失敗しました:`, innerError);
      }
    }
  }

  /**
   * 障害物プレースホルダー作成
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createObstacle(scene, key, color, placeholders) {
    const graphics = scene.add.graphics();
    const width = 32;
    const height = 32;
    
    // 障害物のタイプによって形状を変える
    if (key.includes('tree')) {
      // 木のプレースホルダー
      // 幹
      graphics.fillStyle(0x8B4513, 1);
      graphics.fillRect(12, 16, 8, 16);
      
      // 葉（三角形）
      graphics.fillStyle(color, 1);
      graphics.fillTriangle(16, 2, 28, 16, 4, 16);
      graphics.fillTriangle(16, 6, 24, 18, 8, 18);
    } else if (key.includes('rock')) {
      // 岩のプレースホルダー
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(4, 8, 24, 20, 8);
      
      // ハイライトと影
      graphics.fillStyle(brightenColor(color, 30), 0.3);
      graphics.fillRoundedRect(8, 12, 8, 6, 3);
      graphics.fillStyle(darkenColor(color, 30), 0.3);
      graphics.fillRoundedRect(18, 16, 6, 8, 3);
    } else if (key.includes('bush')) {
      // 茂みのプレースホルダー
      graphics.fillStyle(color, 1);
      
      // 複数の円で茂みを表現
      graphics.fillCircle(12, 20, 10);
      graphics.fillCircle(20, 20, 10);
      graphics.fillCircle(16, 14, 8);
    } else if (key.includes('crate')) {
      // 木箱のプレースホルダー
      graphics.fillStyle(color, 1);
      graphics.fillRect(4, 8, 24, 20);
      
      // 木目とエッジ
      graphics.lineStyle(1, darkenColor(color, 20), 0.8);
      graphics.strokeRect(4, 8, 24, 20);
      graphics.lineBetween(4, 18, 28, 18);
      graphics.lineBetween(16, 8, 16, 28);
    } else {
      // その他の障害物（デフォルト）
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(8, 8, 16, 16, 4);
    }
    
    // テクスチャとして生成して登録
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    
    // プレースホルダー一覧に追加
    if (placeholders) {
      placeholders[key] = { type: 'obstacle', color, width, height };
    }
  }

  /**
   * 壁タイルのパターン作成（レンガ調）
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - 色
   * @param {number} tileSize - タイルサイズ
   */
  createWallPattern(graphics, color, tileSize) {
    // 背景色
    const brickLight = brightenColor(color, 20);
    const brickDark = darkenColor(color, 20);
    
    // 横のレンガライン
    for (let y = 0; y < tileSize; y += 8) {
      graphics.fillStyle(brickDark, 0.5);
      graphics.fillRect(0, y, tileSize, 1);
      
      // 縦のレンガライン（交互に配置）
      const offset = (y / 8) % 2 === 0 ? 0 : 16;
      for (let x = offset; x < tileSize; x += 16) {
        graphics.fillStyle(brickDark, 0.5);
        graphics.fillRect(x, y, 1, 8);
      }
      
      // レンガのハイライト
      graphics.fillStyle(brickLight, 0.3);
      for (let x = offset; x < tileSize; x += 16) {
        graphics.fillRect(x + 1, y + 1, 15, 6);
      }
    }
  }

  /**
   * 壁タイルのプレースホルダー作成 - 拡張版（様々な壁タイプに対応）
   * @param {Phaser.Scene} scene - Phaserシーン
   * @param {string} key - テクスチャーキー
   * @param {number} color - 色（16進数）
   * @param {string} wallType - 壁のタイプ ('stone', 'brick', 'wood', 'ice', 'metal')
   * @param {Object} placeholders - プレースホルダーオブジェクト
   */
  createWallTile(scene, key, color, wallType = 'stone', placeholders) {
    if (!scene || !scene.add) {
      console.warn(`シーンが無効なため ${key} を作成できません`);
      return;
    }
    
    try {
      const graphics = scene.add.graphics();
      const tileSize = 32; // TopDownMapのデフォルトタイルサイズ
      
      // 背景色を塗る
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, tileSize, tileSize);
      
      // 壁のタイプに応じてパターンを変更
      switch (wallType) {
        case 'brick':
          // レンガ壁パターン
          createBrickWallPattern(graphics, color, tileSize);
          break;
        case 'wood':
          // 木製壁パターン
          createWoodenWallPattern(graphics, color, tileSize);
          break;
        case 'ice':
          // 氷の壁パターン
          createIceWallPattern(graphics, color, tileSize);
          break;
        case 'metal':
          // 金属壁パターン
          createMetalWallPattern(graphics, color, tileSize);
          break;
        case 'stone':
        default:
          // 石壁パターン（デフォルト）
          createStoneWallPattern(graphics, color, tileSize);
          break;
      }
      
      // 枠線
      graphics.lineStyle(1, darkenColor(color, 30), 0.8);
      graphics.strokeRect(0, 0, tileSize, tileSize);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, tileSize, tileSize);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      if (placeholders) {
        placeholders[key] = { type: 'wall', wallType, color, width: tileSize, height: tileSize };
      }
      
      // 登録確認ログ
      console.log(`Created wall placeholder: ${key} (${wallType})`);
    } catch (e) {
      console.error(`壁プレースホルダー ${key} の作成中にエラーが発生しました:`, e);
      
      // エラーが発生した場合、より単純な方法でプレースホルダーを作成
      try {
        createColorRect(scene, key, 32, 32, color, placeholders);
        console.log(`Fallback colorRect created for ${key}`);
      } catch (innerError) {
        console.error(`代替プレースホルダーの作成にも失敗しました:`, innerError);
      }
    }
  }

  /**
   * レンガ壁パターンの作成
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - ベースカラー
   * @param {number} tileSize - タイルサイズ
   */
  createBrickWallPattern(graphics, color, tileSize) {
    const brickLight = brightenColor(color, 15);
    const brickDark = darkenColor(color, 25);
    
    // レンガの行を描画
    for (let y = 0; y < tileSize; y += 8) {
      // レンガの横の線（各レンガの区切り）
      graphics.lineStyle(1, brickDark, 0.7);
      graphics.lineBetween(0, y, tileSize, y);
      
      // レンガの縦の線（交互にずらす）
      const offset = (y / 8) % 2 === 0 ? 0 : 8;
      
      for (let x = offset; x < tileSize; x += 16) {
        graphics.lineBetween(x, y, x, y + 8);
      }
      
      // レンガの表面テクスチャ（薄い色のランダムな斑点）
      graphics.fillStyle(brickLight, 0.2);
      for (let brick = 0; brick < tileSize / 16; brick++) {
        const brickX = offset + brick * 16;
        for (let i = 0; i < 3; i++) {
          const spotX = brickX + 2 + Math.floor(Math.random() * 12);
          const spotY = y + 2 + Math.floor(Math.random() * 4);
          const spotSize = 1 + Math.random() * 1.5;
          graphics.fillCircle(spotX, spotY, spotSize);
        }
      }
    }
  }

  /**
   * 木製壁パターンの作成
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - ベースカラー
   * @param {number} tileSize - タイルサイズ
   */
  createWoodenWallPattern(graphics, color, tileSize) {
    const woodLight = brightenColor(color, 10);
    const woodDark = darkenColor(color, 20);
    
    // 縦板のパターン
    for (let x = 2; x < tileSize; x += 6) {
      // 板の描画
      graphics.fillStyle(woodDark, 0.2);
      graphics.fillRect(x, 0, 4, tileSize);
      
      // 木目の描画
      graphics.lineStyle(1, woodDark, 0.3);
      for (let y = 0; y < tileSize; y += 5) {
        const knotY = y + Math.floor(Math.random() * 5);
        // 木目の節を描画
        if (Math.random() < 0.3) {
          graphics.fillStyle(woodDark, 0.4);
          graphics.fillCircle(x + 2, knotY, 1.5);
          graphics.fillStyle(woodLight, 0.2);
          graphics.fillCircle(x + 2, knotY, 0.5);
        }
        
        // 木目の線
        graphics.lineStyle(1, woodDark, 0.2);
        const lineY = y + Math.floor(Math.random() * 5);
        graphics.lineBetween(x, lineY, x + 4, lineY);
      }
    }
    
    // 横方向の梁 - 上下に配置
    graphics.fillStyle(woodDark, 0.5);
    graphics.fillRect(0, 0, tileSize, 3);
    graphics.fillRect(0, tileSize - 3, tileSize, 3);
  }

  /**
   * 氷の壁パターンの作成
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - ベースカラー
   * @param {number} tileSize - タイルサイズ
   */
  createIceWallPattern(graphics, color, tileSize) {
    const iceLight = brightenColor(color, 30);
    const iceDark = darkenColor(color, 15);
    
    // 氷の大きなブロック - 不規則な氷の割れ目パターン
    // 主要な割れ目ライン
    graphics.lineStyle(1, iceDark, 0.4);
    
    // 中央を通る不規則な縦の割れ目
    const centerX = tileSize / 2 + (Math.random() * 4 - 2);
    graphics.beginPath();
    graphics.moveTo(centerX, 0);
    // うねうねした線を描画
    for (let y = 0; y < tileSize; y += tileSize / 4) {
      const controlX = centerX + (Math.random() * 8 - 4);
      graphics.lineTo(controlX, y);
    }
    graphics.lineTo(centerX + (Math.random() * 4 - 2), tileSize);
    graphics.strokePath();
    
    // 横方向の小さな割れ目をいくつか追加
    for (let i = 0; i < 3; i++) {
      const y = 4 + Math.random() * (tileSize - 8);
      const startX = Math.random() * (tileSize / 2);
      const length = 4 + Math.random() * (tileSize / 2);
      
      graphics.beginPath();
      graphics.moveTo(startX, y);
      graphics.lineTo(startX + length, y + (Math.random() * 4 - 2));
      graphics.strokePath();
    }
    
    // 反射/氷のきらめき効果
    graphics.fillStyle(iceLight, 0.5);
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * tileSize;
      const y = Math.random() * tileSize;
      const size = 1 + Math.random() * 2;
      graphics.fillCircle(x, y, size);
    }
    
    // より大きな反射エリア
    graphics.fillStyle(iceLight, 0.2);
    const reflectionX = Math.random() * (tileSize - 10) + 5;
    const reflectionY = Math.random() * (tileSize - 10) + 5;
    graphics.fillCircle(reflectionX, reflectionY, 4 + Math.random() * 3);
  }

  /**
   * 金属壁パターンの作成
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - ベースカラー
   * @param {number} tileSize - タイルサイズ
   */
  createMetalWallPattern(graphics, color, tileSize) {
    const metalLight = brightenColor(color, 25);
    const metalDark = darkenColor(color, 15);
    
    // 金属パネルのベース
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, tileSize, tileSize);
    
    // 金属の質感 - 横方向のパネル
    for (let y = 0; y < tileSize; y += 8) {
      // パネルのエッジ
      graphics.lineStyle(1, metalDark, 0.6);
      graphics.lineBetween(0, y, tileSize, y);
      
      // パネルのハイライト（上部）
      graphics.lineStyle(1, metalLight, 0.3);
      graphics.lineBetween(0, y + 1, tileSize, y + 1);
    }
    
    // 金属の質感 - リベット（ボルト）を追加
    graphics.fillStyle(metalDark, 0.7);
    for (let x = 4; x < tileSize; x += 8) {
      for (let y = 4; y < tileSize; y += 8) {
        // リベットの位置をランダムに調整
        if (Math.random() < 0.7) { // 一部のリベットをスキップ
          const offsetX = x + (Math.random() * 2 - 1);
          const offsetY = y + (Math.random() * 2 - 1);
          graphics.fillCircle(offsetX, offsetY, 1.5);
          
          // リベットのハイライト
          graphics.fillStyle(metalLight, 0.4);
          graphics.fillCircle(offsetX - 0.5, offsetY - 0.5, 0.5);
          graphics.fillStyle(metalDark, 0.7);
        }
      }
    }
    
    // スクラッチ（擦り傷）効果を追加
    graphics.lineStyle(1, metalLight, 0.2);
    for (let i = 0; i < 4; i++) {
      const startX = Math.random() * tileSize;
      const startY = Math.random() * tileSize;
      const endX = startX + (Math.random() * 10 - 5);
      const endY = startY + (Math.random() * 10 - 5);
      graphics.lineBetween(startX, startY, endX, endY);
    }
  }

  /**
   * 石壁パターンの作成
   * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
   * @param {number} color - ベースカラー
   * @param {number} tileSize - タイルサイズ
   */
  createStoneWallPattern(graphics, color, tileSize) {
    const stoneLight = brightenColor(color, 15);
    const stoneDark = darkenColor(color, 25);
    
    // 石の不規則なブロックを描画
    const blockSizes = [6, 8, 10, 12];
    
    // 石ブロックのグリッドを作成
    for (let y = 0; y < tileSize; y += 8) {
      for (let x = 0; x < tileSize; x += 8) {
        // 石ブロックの大きさをランダムに選択
        const width = blockSizes[Math.floor(Math.random() * blockSizes.length)];
        const height = blockSizes[Math.floor(Math.random() * blockSizes.length)];
        
        // ブロックの位置を少しランダムに調整
        const offsetX = x + (Math.random() * 2 - 1);
        const offsetY = y + (Math.random() * 2 - 1);
        
        // ブロックが画面外にはみ出さないように調整
        const adjustedWidth = Math.min(width, tileSize - offsetX);
        const adjustedHeight = Math.min(height, tileSize - offsetY);
        
        // ブロックの描画
        if (adjustedWidth > 0 && adjustedHeight > 0) {
          // 石ブロックの本体
          graphics.fillStyle(stoneDark, 0.3);
          graphics.fillRect(offsetX, offsetY, adjustedWidth, adjustedHeight);
          
          // ブロックのエッジ
          graphics.lineStyle(1, stoneDark, 0.5);
          graphics.strokeRect(offsetX, offsetY, adjustedWidth, adjustedHeight);
          
          // 石の質感（ランダムな斑点）
          graphics.fillStyle(stoneLight, 0.2);
          for (let i = 0; i < 3; i++) {
            const spotX = offsetX + Math.random() * (adjustedWidth - 2) + 1;
            const spotY = offsetY + Math.random() * (adjustedHeight - 2) + 1;
            const spotSize = 0.5 + Math.random() * 1;
            graphics.fillCircle(spotX, spotY, spotSize);
          }
        }
      }
    }
    
    // 全体に薄い陰影を追加して立体感を出す
    graphics.fillStyle(stoneDark, 0.1);
    graphics.fillTriangle(0, 0, tileSize, 0, 0, tileSize);
    graphics.fillStyle(stoneLight, 0.1);
    graphics.fillTriangle(tileSize, tileSize, tileSize, 0, 0, tileSize);
  }
}

Object.assign(PlaceholderAssets.prototype, {
  createTilePlaceholders: TilePlaceholders.prototype.createTilePlaceholders,
  createTileWithPattern: TilePlaceholders.prototype.createTileWithPattern,
  createObstacle: TilePlaceholders.prototype.createObstacle,
  createWallPattern: TilePlaceholders.prototype.createWallPattern,
  createWallTile: TilePlaceholders.prototype.createWallTile,
  createBrickWallPattern: TilePlaceholders.prototype.createBrickWallPattern,
  createWoodenWallPattern: TilePlaceholders.prototype.createWoodenWallPattern,
  createIceWallPattern: TilePlaceholders.prototype.createIceWallPattern,
  createMetalWallPattern: TilePlaceholders.prototype.createMetalWallPattern,
  createStoneWallPattern: TilePlaceholders.prototype.createStoneWallPattern,
});

export default PlaceholderAssets;
//export default TilePlaceholders;