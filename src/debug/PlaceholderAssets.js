/**
 * PlaceholderAssets.js - ゲーム開発用のプレースホルダー画像生成
 * 
 * 実際のアセットが用意されていない段階でも開発を進めるために
 * その場でプレースホルダー画像を生成する機能を提供します。
 * トップダウンビュー用に最適化されたプレースホルダーを生成します。
 */

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
     * キャラクタープレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createCharacterPlaceholders(scene) {
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
        this.createColorRect(scene, key, 32, 32, playerColors[type] || 0x00FF00);
        this.placeholders[key] = { type: 'player', color: playerColors[type], width: 32, height: 32 };
      });
      
      // コンパニオンタイプごとのプレースホルダーを作成
      playerTypes.forEach(type => {
        const key = `companion_${type}`;
        const color = playerColors[type] ? brightenColor(playerColors[type], 30) : 0x00FFFF;
        this.createColorRect(scene, key, 32, 32, color);
        this.placeholders[key] = { type: 'companion', color: color, width: 32, height: 32 };
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
        this.createColorRect(scene, key, 32, 32, enemyColors[type] || 0xFF0000);
        this.placeholders[key] = { type: 'enemy', color: enemyColors[type], width: 32, height: 32 };
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
        this.createColorRect(scene, key, 32, 32, npcColors[type] || 0x0000FF);
        this.placeholders[key] = { type: 'npc', color: npcColors[type], width: 32, height: 32 };
      });
      
      // 共通プレースホルダー（デバッグ用）は残しておく
      this.createColorRect(scene, 'character_placeholder', 32, 32, 0x00FF00);
    }
    
    
    /**
     * 方向付きキャラクタープレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     * @param {string} direction - 方向 ('up', 'down', 'left', 'right')
     */
    createDirectionalCharacter(scene, key, color, direction) {
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
      this.placeholders[key] = { type: 'character', direction, color, width, height };
    }
    
    /**
     * タイルプレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createTilePlaceholders(scene) {
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
        this.createTileWithPattern(scene, key, color);
      });
      
      // 障害物プレースホルダー作成
      Object.entries(obstacleColors).forEach(([type, color]) => {
        // 障害物は少し立体的に
        const key = `obstacle_${type}`;
        this.createObstacle(scene, key, color);
      });
      
      // 壁プレースホルダー（特殊処理）
      this.createWallTile(scene, 'tile_wall', 0x808080);
    }
    
    /**
     * パターン付きタイルプレースホルダー作成 - TopDownMap用に調整
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createTileWithPattern(scene, key, color) {
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
        this.placeholders[key] = { type: 'tile', color, width: tileSize, height: tileSize };
        
        // 登録確認ログ
        //console.log(`Created tile placeholder: ${key}`);
      } catch (e) {
        console.error(`タイルプレースホルダー ${key} の作成中にエラーが発生しました:`, e);
        
        // エラーが発生した場合、より単純な方法でプレースホルダーを作成
        try {
          this.createColorRect(scene, key, 32, 32, color);
          console.log(`Fallback colorRect created for ${key}`);
        } catch (innerError) {
          console.error(`代替プレースホルダーの作成にも失敗しました:`, innerError);
        }
      }
    }

    /**
     * 壁タイルのパターン作成（レンガ調）
     * 別メソッドに分離してコードを整理
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
     */
    createWallTile(scene, key, color, wallType = 'stone') {
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
            this.createBrickWallPattern(graphics, color, tileSize);
            break;
          case 'wood':
            // 木製壁パターン
            this.createWoodenWallPattern(graphics, color, tileSize);
            break;
          case 'ice':
            // 氷の壁パターン
            this.createIceWallPattern(graphics, color, tileSize);
            break;
          case 'metal':
            // 金属壁パターン
            this.createMetalWallPattern(graphics, color, tileSize);
            break;
          case 'stone':
          default:
            // 石壁パターン（デフォルト）
            this.createStoneWallPattern(graphics, color, tileSize);
            break;
        }
        
        // 枠線
        graphics.lineStyle(1, darkenColor(color, 30), 0.8);
        graphics.strokeRect(0, 0, tileSize, tileSize);
        
        // テクスチャとして生成して登録
        graphics.generateTexture(key, tileSize, tileSize);
        graphics.destroy();
        
        // プレースホルダー一覧に追加
        this.placeholders[key] = { type: 'wall', wallType, color, width: tileSize, height: tileSize };
        
        // 登録確認ログ
        console.log(`Created wall placeholder: ${key} (${wallType})`);
      } catch (e) {
        console.error(`壁プレースホルダー ${key} の作成中にエラーが発生しました:`, e);
        
        // エラーが発生した場合、より単純な方法でプレースホルダーを作成
        try {
          this.createColorRect(scene, key, 32, 32, color);
          console.log(`Fallback colorRect created for ${key}`);
        } catch (innerError) {
          console.error(`代替プレースホルダーの作成にも失敗しました:`, innerError);
        }
      }
    }

    /**
     * レンガ壁パターンの作成
     * @param {Phaser.Graphics} graphics - グラフィックスオブジェクト
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
     * @param {Phaser.Graphics} graphics - グラフィックスオブジェクト
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
     * 氷の壁パターンの作成（続き）
     * @param {Phaser.Graphics} graphics - グラフィックスオブジェクト
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
     * @param {Phaser.Graphics} graphics - グラフィックスオブジェクト
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
     * @param {Phaser.Graphics} graphics - グラフィックスオブジェクト
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

    /**
     * 宝箱アイテムのプレースホルダー作成 - TopDownMap用に調整
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー（item_chest形式）
     * @param {number} color - 色（16進数）
     * @param {boolean} isOpen - 開いているかどうか
     */
    createChestItem(scene, key, color, isOpen) {
      if (!scene || !scene.add) {
        console.warn(`シーンが無効なため ${key} を作成できません`);
        return;
      }
      
      try {
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
        
        // テクスチャとして生成して登録 - TopDownMapの命名規則に合わせる
        const finalKey = key.startsWith('item_') ? key : `item_${key.replace('chest_', '')}`;
        graphics.generateTexture(finalKey, width, height);
        graphics.destroy();
        
        // プレースホルダー一覧に追加
        this.placeholders[finalKey] = { type: 'item_chest', isOpen, color, width, height };
        
        console.log(`Created chest placeholder: ${finalKey}`);
      } catch (e) {
        console.error(`宝箱プレースホルダー ${key} の作成中にエラーが発生しました:`, e);
        
        // エラーが発生した場合、シンプルな矩形で代用
        try {
          const finalKey = key.startsWith('item_') ? key : `item_${key.replace('chest_', '')}`;
          this.createColorRect(scene, finalKey, 32, 32, color);
        } catch (innerError) {
          console.error(`代替宝箱プレースホルダーの作成にも失敗しました:`, innerError);
        }
      }
    }
        
    /**
     * 障害物プレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createObstacle(scene, key, color) {
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
      this.placeholders[key] = { type: 'obstacle', color, width, height };
    }
    
    /**
     * アイテムプレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createItemPlaceholders(scene) {
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
          this.createPotionItem(scene, `item_${type}`, color);
        } else if (type.includes('chest')) {
          // 宝箱の特殊形状
          this.createChestItem(scene, type, color, type.includes('open'));
        } else if (type.includes('weapon')) {
          // 武器の特殊形状
          this.createWeaponItem(scene, `item_${type}`, color, type.split('_')[1]);
        } else if (type === 'armor') {
          // 防具の特殊形状
          this.createArmorItem(scene, `item_${type}`, color);
        } else if (type.includes('gold')) {
          // 金貨の特殊形状
          this.createGoldItem(scene, `item_${type}`, color);
        } else {
          // その他の一般アイテム
          this.createColorRect(scene, `item_${type}`, 16, 16, color);
        }
      });
      
      // 汎用アイテムプレースホルダー
      this.createColorRect(scene, 'item_placeholder', 16, 16, 0xFFFF00);
    }
    
    /**
     * ポーションアイテムのプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createPotionItem(scene, key, color) {
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
      this.placeholders[key] = { type: 'item_potion', color, width, height };
    }
    
    /**
     * 宝箱アイテムのプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     * @param {boolean} isOpen - 開いているかどうか
     */
    createChestItem(scene, key, color, isOpen) {
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
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'item_chest', isOpen, color, width, height };
    }
    
    /**
     * 武器アイテムのプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     * @param {string} weaponType - 武器タイプ
     */
    createWeaponItem(scene, key, color, weaponType) {
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
      this.placeholders[key] = { type: 'item_weapon', weaponType, color, width, height };
    }
    
    /**
     * 防具アイテムのプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createArmorItem(scene, key, color) {
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
      this.placeholders[key] = { type: 'item_armor', color, width, height };
    }
    
    /**
     * 金貨アイテムのプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createGoldItem(scene, key, color) {
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
      this.placeholders[key] = { type: 'item_gold', color, width, height };
    }
    
    /**
     * UIプレースホルダーを作成 - 拡張版
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createUIPlaceholders(scene) {
      // 既存のプレースホルダー
      this.createUIPanel(scene, 'ui_panel', 0x333333);
      this.createUIButton(scene, 'ui_button', 0x666666, false);
      this.createUIButton(scene, 'ui_button_hover', 0x888888, true);
      this.createSkillIcon(scene, 'ui_skill_icon', 0x0000FF);
      this.createStatusBar(scene, 'ui_health_bar', 0xFF0000);
      this.createStatusBar(scene, 'ui_mana_bar', 0x0000FF);
      this.createInventorySlot(scene, 'ui_inventory_slot', 0x222222);
      this.createCursor(scene, 'ui_cursor', 0xFFFFFF);
      
      // MainMenuScene用のプレースホルダー
      this.createBackground(scene, 'menu-background', 0x1a3366); // 濃い青色の背景
      this.createGameLogo(scene, 'game-logo', 0xcc0000); // 赤色のロゴ
      this.createMenuButton(scene, 'button-normal', 0x444444, false);
      this.createMenuButton(scene, 'button-hover', 0x666666, true);
      
      // OptionsMenuScene用のプレースホルダー
      this.createBackground(scene, 'options-background', 0x333333); // 暗い灰色の背景
      this.createSliderTrack(scene, 'slider-track', 0x555555);
      this.createSliderThumb(scene, 'slider-thumb', 0x888888);
      this.createCheckbox(scene, 'checkbox-on', 0x00AA00, true);
      this.createCheckbox(scene, 'checkbox-off', 0x555555, false);
    }

    /**
     * ゲーム背景プレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createBackground(scene, key, color) {
      const graphics = scene.add.graphics();
      const width = 800;  // 標準的なゲーム画面サイズ
      const height = 600;
      
      // 基本背景
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, width, height);
      
      // グラデーション効果（上から下）
      const gradientHeight = height / 2;
      for (let i = 0; i < gradientHeight; i++) {
        const alpha = 0.1 * (i / gradientHeight);
        graphics.fillStyle(0xffffff, alpha);
        graphics.fillRect(0, i, width, 1);
      }
      
      // 装飾的なパターン
      graphics.fillStyle(brightenColor(color, 20), 0.1);
      for (let x = 0; x < width; x += 40) {
        for (let y = 0; y < height; y += 40) {
          graphics.fillRect(x, y, 20, 20);
        }
      }
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'background', color, width, height };
    }

    /**
     * ゲームロゴプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {string} color - 色（16進数）
     */
    createGameLogo(scene, key, color) {
      const graphics = scene.add.graphics();
      const width = 400;
      const height = 200;
      
      // ロゴ背景
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(50, 50, width - 100, height - 100, 20);
      
      // ロゴ枠線
      graphics.lineStyle(4, darkenColor(color, 20), 1);
      graphics.strokeRoundedRect(50, 50, width - 100, height - 100, 20);
      
      // 装飾（斜めの線）
      graphics.lineStyle(3, brightenColor(color, 30), 0.7);
      for (let i = 0; i < 5; i++) {
        graphics.lineBetween(50 + i * 20, 50, 50, 50 + i * 20);
        graphics.lineBetween(width - 50 - i * 20, height - 50, width - 50, height - 50 - i * 20);
      }
      
      // 仮のテキスト表現
      graphics.fillStyle(0xFFFFFF, 1);
      
      // 横線でテキスト表現
      const textY = height / 2;
      graphics.fillRect(width / 4, textY - 15, width / 2, 5);
      graphics.fillRect(width / 4, textY, width / 2, 5);
      graphics.fillRect(width / 4, textY + 15, width / 2, 5);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'logo', color, width, height };
    }

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
      
      // ベースとなる角丸長方形
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, width, height, 10);
      
      // 枠線
      const borderColor = isHover ? brightenColor(color, 60) : brightenColor(color, 30);
      graphics.lineStyle(2, borderColor, 1);
      graphics.strokeRoundedRect(0, 0, width, height, 10);
      
      // ボタン内部の塗りつぶし（グラデーションの代わりに単色を使用）
      // ホバー状態かどうかで色を変える
      const innerColor = isHover ? brightenColor(color, 20) : color;
      graphics.fillStyle(innerColor, 1);
      graphics.fillRoundedRect(2, 2, width - 4, height - 4, 9);
      
      // ホバー状態の時は追加のハイライト効果
      if (isHover) {
        // 上部に明るいハイライトを追加
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillRoundedRect(4, 4, width - 8, (height - 8) / 2, {tl: 8, tr: 8, bl: 0, br: 0});
      }
      
      // テキストプレースホルダー（中央に白い線）
      graphics.fillStyle(0xFFFFFF, 0.8);
      graphics.fillRect(width / 4, height / 2 - 2, width / 2, 4);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'button', isHover, color, width, height };
    }

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
      
      // スライダーの溝
      graphics.fillStyle(darkenColor(color, 30), 1);
      graphics.fillRoundedRect(0, 0, width, height, height / 2);
      
      // スライダーの溝の内側（グラデーション）
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(1, 1, width - 2, height - 2, (height - 2) / 2);
      
      // 内部の模様（目盛り）
      graphics.fillStyle(darkenColor(color, 20), 0.5);
      for (let i = 0; i < width; i += 20) {
        graphics.fillRect(i, height / 2 - 1, 1, 2);
      }
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'slider_track', color, width, height };
    }

    /**
     * スライダーつまみプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createSliderThumb(scene, key, color) {
      const graphics = scene.add.graphics();
      const size = 20;
      
      // つまみの円形ベース（外側の円）
      graphics.fillStyle(brightenColor(color, 10), 1);
      graphics.fillCircle(size / 2, size / 2, size / 2);
      
      // 枠線
      graphics.lineStyle(1, darkenColor(color, 20), 1);
      graphics.strokeCircle(size / 2, size / 2, size / 2);
      
      // つまみの内側（グラデーションの代わりに単色で）
      const innerColor = brightenColor(color, 30);
      graphics.fillStyle(innerColor, 1);
      graphics.fillCircle(size / 2, size / 2, size / 2 - 2);
      
      // ハイライト効果（上部に明るい半円）
      graphics.fillStyle(0xFFFFFF, 0.3);
      // 半円を描画（上部のみ）
      graphics.beginPath();
      graphics.arc(size / 2, size / 2, size / 3, Math.PI, 0, false);
      graphics.fillPath();
      
      // つまみの中央の模様
      graphics.fillStyle(darkenColor(color, 10), 0.5);
      graphics.fillCircle(size / 2, size / 2, 2);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, size, size);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'slider_thumb', color, width: size, height: size };
    }

    /**
     * チェックボックスプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     * @param {boolean} isChecked - チェック状態かどうか
     */
    createCheckbox(scene, key, color, isChecked) {
      const graphics = scene.add.graphics();
      const size = 24;
      
      // チェックボックスの外枠
      graphics.fillStyle(0x333333, 1);
      graphics.fillRoundedRect(0, 0, size, size, 4);
      
      // チェックボックスの内側
      graphics.fillStyle(isChecked ? color : 0x666666, 1);
      graphics.fillRoundedRect(2, 2, size - 4, size - 4, 3);
      
      // チェックマーク
      if (isChecked) {
        graphics.fillStyle(0xFFFFFF, 1);
        // チェックマーク（√）の描画
        graphics.beginPath();
        graphics.moveTo(5, size / 2);
        graphics.lineTo(size / 3, size - 7);
        graphics.lineTo(size - 5, 5);
        graphics.lineStyle(3, 0xFFFFFF, 1);
        graphics.strokePath();
      }
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, size, size);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'checkbox', isChecked, color, width: size, height: size };
    }
    
    /**
     * UIパネルプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createUIPanel(scene, key, color) {
      const graphics = scene.add.graphics();
      const width = 200;
      const height = 150;
      
      // パネル背景
      graphics.fillStyle(color, 0.8);
      graphics.fillRoundedRect(0, 0, width, height, 8);
      
      // パネル枠線
      graphics.lineStyle(2, brightenColor(color, 30), 1);
      graphics.strokeRoundedRect(0, 0, width, height, 8);
      
      // 上部のタイトルバー風
      graphics.fillStyle(darkenColor(color, 20), 1);
      graphics.fillRect(0, 0, width, 20);
      
      // ウィンドウコントロール風のボタン
      graphics.fillStyle(0xFF0000, 1);
      graphics.fillCircle(width - 10, 10, 5);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'ui_panel', color, width, height };
    }
    
    /**
     * UIボタンプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     * @param {boolean} isHover - ホバー状態かどうか
     */
    createUIButton(scene, key, color, isHover) {
      const graphics = scene.add.graphics();
      const width = 100;
      const height = 30;
      
      // 基本色
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, width, height, 5);
      
      // 枠線
      const borderColor = isHover ? brightenColor(color, 50) : brightenColor(color, 20);
      graphics.lineStyle(1, borderColor, 1);
      graphics.strokeRoundedRect(0, 0, width, height, 5);
      
      // ホバー時のハイライト
      if (isHover) {
        graphics.fillStyle(0xFFFFFF, 0.2);
        graphics.fillRoundedRect(2, 2, width - 4, height - 4, 4);
      }
      
      // テクスチャ生成
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'ui_button', isHover, color, width, height };
    }
    
    /**
     * スキルアイコンプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createSkillIcon(scene, key, color) {
      const graphics = scene.add.graphics();
      const size = 40;
      
      // アイコン背景
      graphics.fillStyle(darkenColor(color, 40), 1);
      graphics.fillRoundedRect(0, 0, size, size, 5);
      
      // アイコン枠線
      graphics.lineStyle(2, brightenColor(color, 20), 1);
      graphics.strokeRoundedRect(0, 0, size, size, 5);
      
      // スキル効果の表現
      graphics.fillStyle(color, 0.8);
      
      if (key.includes('skill')) {
        // スパイラル模様
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 3;
        
        for (let angle = 0; angle < Math.PI * 6; angle += 0.2) {
          const scale = 1 - angle / (Math.PI * 8);
          if (scale <= 0) continue;
          
          const x = centerX + Math.cos(angle) * radius * scale;
          const y = centerY + Math.sin(angle) * radius * scale;
          const dotSize = 1 + scale * 2;
          
          graphics.fillCircle(x, y, dotSize);
        }
      }
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, size, size);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'ui_skill_icon', color, width: size, height: size };
    }
    
    /**
     * ステータスバープレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createStatusBar(scene, key, color) {
      const graphics = scene.add.graphics();
      const width = 200;
      const height = 20;
      
      // バー背景
      graphics.fillStyle(0x222222, 0.8);
      graphics.fillRoundedRect(0, 0, width, height, 3);
      
      // バー本体（80%充填の表示）
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(2, 2, (width - 4) * 0.8, height - 4, 2);
      
      // バーの光沢
      graphics.fillStyle(0xFFFFFF, 0.2);
      graphics.fillRect(2, 2, width - 4, height / 3);
      
      // 枠線
      graphics.lineStyle(1, 0x000000, 0.5);
      graphics.strokeRoundedRect(0, 0, width, height, 3);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'ui_status_bar', color, width, height };
    }
    
    /**
     * インベントリスロットプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createInventorySlot(scene, key, color) {
      const graphics = scene.add.graphics();
      const size = 40;
      
      // スロット背景
      graphics.fillStyle(color, 0.8);
      graphics.fillRoundedRect(0, 0, size, size, 3);
      
      // スロット枠線
      graphics.lineStyle(1, brightenColor(color, 40), 1);
      graphics.strokeRoundedRect(0, 0, size, size, 3);
      
      // スロットの影
      graphics.fillStyle(0x000000, 0.2);
      graphics.fillRoundedRect(2, 2, size - 4, size - 4, 2);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, size, size);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'ui_inventory_slot', color, width: size, height: size };
    }
    
    /**
     * カーソルプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createCursor(scene, key, color) {
      const graphics = scene.add.graphics();
      const size = 20;
      
      // カーソル
      graphics.fillStyle(color, 1);
      graphics.fillTriangle(0, 0, 0, size, size * 0.7, size * 0.7);
      
      // カーソルの輪郭
      graphics.lineStyle(1, 0x000000, 1);
      graphics.strokeTriangle(0, 0, 0, size, size * 0.7, size * 0.7);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, size, size);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'ui_cursor', color, width: size, height: size };
    }
    
    /**
     * エフェクトプレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createEffectPlaceholders(scene) {
      // 攻撃エフェクト
      this.createAttackEffect(scene, 'effect_attack', 0xFF0000);
      
      // 回復エフェクト
      this.createHealEffect(scene, 'effect_heal', 0x00FF00);
      
      // 魔法エフェクト
      this.createMagicEffect(scene, 'effect_magic', 0x0000FF);
      
      // パーティクル
      this.createParticle(scene, 'particle', 0xFFFFFF);
    }
    
    /**
     * 攻撃エフェクトプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createAttackEffect(scene, key, color) {
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
      this.placeholders[key] = { type: 'effect_attack', color, width: size, height: size };
    }
    
    /**
     * 回復エフェクトプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createHealEffect(scene, key, color) {
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
      this.placeholders[key] = { type: 'effect_heal', color, width: size, height: size };
    }
    
    /**
     * 魔法エフェクトプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createMagicEffect(scene, key, color) {
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
      this.placeholders[key] = { type: 'effect_magic', color, width: size, height: size };
    }
    
    /**
     * パーティクルプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createParticle(scene, key, color) {
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
        this.placeholders[`${key}_${i}`] = { type: 'particle', color, width: size, height: size };
      }
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'particle', color, width: size, height: size };
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

    // ヘルパー関数：壁タイプから色を取得 - 新規追加
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

/**
* 色を明るくする
* @param {number} color - 元の色
* @param {number} percent - 明るくする割合（0-100）
* @returns {number} 明るくした色
*/
function brightenColor(color, percent) {
  if (color === undefined || color === null) {
    console.warn('brightenColor: 無効な色が指定されました');
    return 0xFFFFFF; // デフォルト白
  }

  try {
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
  } catch (e) {
    console.warn('brightenColor: エラーが発生しました', e);
    return color || 0xFFFFFF;
  }
}

/**
* 色を暗くする
* @param {number} color - 元の色
* @param {number} percent - 暗くする割合（0-100）
* @returns {number} 暗くした色
*/
function darkenColor(color, percent) {
  if (color === undefined || color === null) {
    console.warn('darkenColor: 無効な色が指定されました');
    return 0x000000; // デフォルト黒
  }

  try {
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
  } catch (e) {
    console.warn('darkenColor: エラーが発生しました', e);
    return color || 0x000000;
  }
}

// デフォルトエクスポートとしてシングルトンインスタンスをエクスポート
export default PlaceholderAssets.getInstance();
  
// 個別の関数としてもエクスポート
export const initialize = PlaceholderAssets.getInstance().initialize.bind(PlaceholderAssets.getInstance());
export const createColorRect = PlaceholderAssets.getInstance().createColorRect.bind(PlaceholderAssets.getInstance());
export const getTexture = PlaceholderAssets.getInstance().getTexture.bind(PlaceholderAssets.getInstance());
export const getFallbackTexture = PlaceholderAssets.getInstance().getFallbackTexture.bind(PlaceholderAssets.getInstance());
export { brightenColor, darkenColor };