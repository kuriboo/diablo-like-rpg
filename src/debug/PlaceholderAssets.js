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

    /**
     * PlaceholderAssets拡張 - CharacterAnimation.js
     * 
     * PlaceholderAssetsクラスに追加するキャラクターアニメーション生成機能を提供します。
     * このコードをPlaceholderAssetsクラスに統合して使用します。
     */

    /**
     * 以下はPlaceholderAssetsクラスに追加するメソッドです
     */

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
     */
    createCharacterSpritesheet(scene, key, color, action, direction, frameCount, frameWidth, frameHeight) {
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
        this.placeholders[key] = { 
          type: 'character_sheet', 
          action, 
          direction, 
          frameCount, 
          color, 
          width: totalWidth, 
          height: frameHeight 
        };
        
      } catch (e) {
        console.error(`スプライトシート ${key} の生成中にエラーが発生しました:`, e);
        
        // エラーが発生した場合、単一フレームの単色プレースホルダーを生成
        this.createColorRect(scene, key, frameWidth, frameHeight, color);
        
        // 最低限のスプライトシート構造を設定
        scene.textures.get(key).add('0', 0, 0, 0, frameWidth, frameHeight, frameCount, frameWidth, frameHeight);
      }
    }

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
      
      // 幽霊の体のサイズ
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
     * @returns {Object} 生成されたテクスチャのマップ
     */
    createCharacterAnimationSet(scene, baseKey, color, actions = ['idle', 'walk'], directions = ['down', 'left', 'right', 'up'], options = {}) {
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
          this.createCharacterSpritesheet(
            scene,
            textureKey,
            color,
            action,
            direction,
            frameCount,
            frameWidth,
            frameHeight
          );
          
          generatedTextures[action][direction] = textureKey;
        }
      }
      
      console.log(`✅ キャラクターアニメーションセット生成完了: ${baseKey}`);
      return generatedTextures;
    }

    /**
     * キャラクター向けの改良されたプレースホルダー生成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - キャラクターの色
     * @param {string} characterType - キャラクタータイプ ('humanoid', 'monster', 'ghost', 'slime', 'beast', 'mech')
     * @param {Object} options - 追加オプション
     * @returns {string} 生成されたテクスチャのキー
     */
    createEnhancedCharacter(scene, key, color, characterType = 'humanoid', options = {}) {
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
        this.placeholders[key] = { 
          type: 'character', 
          characterType, 
          variant,
          color, 
          width, 
          height, 
          direction
        };
        
        console.log(`✅ 強化キャラクター生成完了: ${key} (${characterType}, ${variant})`);
        return key;
      } catch (e) {
        console.error(`強化キャラクター ${key} の生成中にエラーが発生しました:`, e);
        
        // エラーが発生した場合、単純な色付き矩形で代用
        this.createColorRect(scene, key, width, height, color, alpha);
        return key;
      }
    }

    /**
     * 人型キャラクターを描画（続き）
     * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
     * @param {number} color - キャラクターの色
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {string} variant - バリアント ('normal', 'armored', 'robed', 'hooded')
     * @param {boolean} details - 詳細な描画を有効にするか
     * @param {string} direction - 向き ('down', 'up', 'left', 'right')
     * @param {boolean} animation - アニメーション風にするか
     * @param {Object} customFeatures - カスタマイズオプション
     */
    drawHumanoidCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures = {}) {
      // 前のコードの続き...
      
      // デフォルトのカスタマイズオプション
      const defaults = {
        hairColor: darkenColor(color, 20),
        skinColor: brightenColor(color, 30),
        clothColor: color,
        armorColor: darkenColor(color, 10),
        eyeColor: 0x000000,
        accessoryColor: 0xFFD700,
        hasWeapon: false,
        weaponType: 'sword', // 'sword', 'axe', 'staff', 'bow'
        hasShield: false,
        hairStyle: 'short', // 'short', 'long', 'ponytail', 'bald'
        hasBeard: false,
        hasHelmet: false,
        hasHat: false
      };
      
      const features = { ...defaults, ...customFeatures };
      
      // 基本的なサイズ計算
      const centerX = width / 2;
      const centerY = height / 2;
      const headRadius = width * 0.15;
      const bodyWidth = width * 0.4;
      const bodyHeight = height * 0.3;
      
      // 腕と足のサイズ
      const limbWidth = width * 0.08;
      const armLength = height * 0.25;
      const legLength = height * 0.2;
      
      // アニメーション効果（静止画でもわずかな動きを表現）
      let animOffsetY = 0;
      let leftLegOffset = 0;
      let rightLegOffset = 0;
      let leftArmAngle = 0;
      let rightArmAngle = 0;
      
      if (animation) {
        animOffsetY = 1;
        leftLegOffset = 2;
        rightLegOffset = -1;
        leftArmAngle = 0.1;
        rightArmAngle = -0.05;
      }
      
      // 頭と体の位置計算
      const headY = centerY - bodyHeight * 0.5 - headRadius;
      let bodyY = centerY;
      
      if (variant === 'normal' || variant === 'hooded') {
        bodyY = centerY;
      } else if (variant === 'armored') {
        bodyY = centerY + 1; // 重い鎧で少し下がる
      } else if (variant === 'robed') {
        bodyY = centerY - 2; // ローブで少し上がる
      }
      
      // 方向による描画順序とサイズの調整
      let drawOrder;
      let headScaleX = 1;
      let bodyScaleX = 1;
      
      if (direction === 'down') {
        drawOrder = ['legs', 'body', 'arms', 'head', 'face', 'hair', 'accessories'];
      } else if (direction === 'up') {
        drawOrder = ['legs', 'arms', 'body', 'head', 'hair', 'accessories', 'face'];
      } else if (direction === 'left') {
        drawOrder = ['legs', 'body', 'right_arm', 'head', 'face', 'hair', 'left_arm', 'accessories'];
        headScaleX = 0.8;
        bodyScaleX = 0.9;
      } else { // right
        drawOrder = ['legs', 'body', 'left_arm', 'head', 'face', 'hair', 'right_arm', 'accessories'];
        headScaleX = 0.8;
        bodyScaleX = 0.9;
      }
      
      // 各パーツを描画順序に従って描画
      for (const part of drawOrder) {
        switch (part) {
          case 'legs':
            // 足を描画
            graphics.fillStyle(features.clothColor, 1);
            
            // 左足
            graphics.fillRect(
              centerX - limbWidth * 1.5,
              bodyY + bodyHeight / 2 + leftLegOffset,
              limbWidth,
              legLength
            );
            
            // 右足
            graphics.fillRect(
              centerX + limbWidth * 0.5,
              bodyY + bodyHeight / 2 + rightLegOffset,
              limbWidth,
              legLength
            );
            
            // バリアントによる調整
            if (variant === 'armored') {
              // 鎧の足
              graphics.fillStyle(features.armorColor, 1);
              graphics.fillRect(
                centerX - limbWidth * 1.5 - 1,
                bodyY + bodyHeight / 2 + leftLegOffset + legLength * 0.6,
                limbWidth + 2,
                legLength * 0.4
              );
              graphics.fillRect(
                centerX + limbWidth * 0.5 - 1,
                bodyY + bodyHeight / 2 + rightLegOffset + legLength * 0.6,
                limbWidth + 2,
                legLength * 0.4
              );
            } else if (variant === 'robed') {
              // ローブの下部
              graphics.fillStyle(features.clothColor, 1);
              graphics.fillTriangle(
                centerX - limbWidth * 2,
                bodyY + bodyHeight / 2,
                centerX + limbWidth * 2,
                bodyY + bodyHeight / 2,
                centerX,
                bodyY + bodyHeight / 2 + legLength * 1.2
              );
            }
            break;
            
          case 'body':
            // 体を描画
            let bodyFillColor = features.clothColor;
            
            if (variant === 'armored') {
              bodyFillColor = features.armorColor;
            }
            
            // 体の本体
            graphics.fillStyle(bodyFillColor, 1);
            
            if (direction === 'left' || direction === 'right') {
              // 横向きの体（少し薄く）
              drawEllipse(
                graphics,
                centerX,
                bodyY,
                bodyWidth * bodyScaleX,
                bodyHeight
              );
            } else {
              // 前後向きの体
              drawEllipse(
                graphics,
                centerX,
                bodyY,
                bodyWidth,
                bodyHeight
              );
            }
            
            // バリアントごとの詳細
            if (details) {
              if (variant === 'armored') {
                // 鎧のデザイン
                graphics.fillStyle(darkenColor(features.armorColor, 20), 1);
                
                // 胸部プレート
                if (direction === 'down' || direction === 'up') {
                  graphics.fillRect(
                    centerX - bodyWidth * 0.3,
                    bodyY - bodyHeight * 0.2,
                    bodyWidth * 0.6,
                    bodyHeight * 0.4
                  );
                }
                
                // 肩部プレート
                graphics.fillStyle(brightenColor(features.armorColor, 10), 1);
                if (direction !== 'left') {
                  drawEllipse(
                    graphics,
                    centerX - bodyWidth * 0.4,
                    bodyY - bodyHeight * 0.3,
                    bodyWidth * 0.2,
                    bodyHeight * 0.2
                  );
                }
                
                if (direction !== 'right') {
                  drawEllipse(
                    graphics,
                    centerX + bodyWidth * 0.4,
                    bodyY - bodyHeight * 0.3,
                    bodyWidth * 0.2,
                    bodyHeight * 0.2
                  );
                }
              } else if (variant === 'robed') {
                // ローブのデザイン
                graphics.fillStyle(darkenColor(features.clothColor, 15), 1);
                
                // ローブの襟
                drawEllipse(
                  graphics,
                  centerX,
                  bodyY - bodyHeight * 0.3,
                  bodyWidth * 0.8,
                  bodyHeight * 0.2
                );
                
                // ローブのベルト
                graphics.fillStyle(darkenColor(features.clothColor, 30), 1);
                graphics.fillRect(
                  centerX - bodyWidth * 0.5,
                  bodyY,
                  bodyWidth,
                  bodyHeight * 0.1
                );
              } else {
                // 通常の服のデザイン
                graphics.fillStyle(darkenColor(features.clothColor, 20), 1);
                
                if (direction === 'down') {
                  // 前面のボタンやデザイン
                  graphics.fillRect(
                    centerX - bodyWidth * 0.1,
                    bodyY - bodyHeight * 0.3,
                    bodyWidth * 0.2,
                    bodyHeight * 0.6
                  );
                }
              }
            }
            break;
            
          case 'arms':
          case 'left_arm':
          case 'right_arm':
            // 腕を描画
            graphics.fillStyle(variant === 'armored' ? features.armorColor : features.skinColor, 1);
            
            // 左右の腕のオフセットとサイズ
            const armOffsetX = bodyWidth * 0.5;
            const armOffsetY = bodyHeight * 0.1;
            
            // 特定方向の場合のみ特定の腕を描画
            if (part === 'arms' || 
                (part === 'left_arm' && (direction === 'right' || direction === 'down' || direction === 'up')) ||
                (part === 'right_arm' && (direction === 'left' || direction === 'down' || direction === 'up'))) {
              
              if (part !== 'right_arm') {
                // 左腕
                if (features.hasShield && (direction === 'down' || direction === 'right')) {
                  // 盾を持つ姿勢
                  graphics.fillStyle(features.armorColor, 1);
                  graphics.fillRect(
                    centerX - armOffsetX - limbWidth,
                    bodyY - armOffsetY,
                    limbWidth,
                    armLength * 0.7
                  );
                  
                  // 盾
                  graphics.fillStyle(brightenColor(features.armorColor, 20), 1);
                  graphics.fillRect(
                    centerX - armOffsetX - limbWidth * 3,
                    bodyY - armOffsetY,
                    limbWidth * 2,
                    armLength * 0.8
                  );
                  
                  // 盾のデザイン
                  if (details) {
                    graphics.fillStyle(features.accessoryColor, 1);
                    graphics.fillCircle(
                      centerX - armOffsetX - limbWidth * 2,
                      bodyY - armOffsetY + armLength * 0.4,
                      limbWidth * 0.5
                    );
                  }
                } else {
                  // 通常の左腕
                  graphics.fillRect(
                    centerX - armOffsetX - limbWidth,
                    bodyY - armOffsetY,
                    limbWidth,
                    armLength
                  );
                  
                  // 左手
                  graphics.fillStyle(features.skinColor, 1);
                  drawEllipse(
                    graphics,
                    centerX - armOffsetX - limbWidth * 0.5,
                    bodyY - armOffsetY + armLength,
                    limbWidth * 0.8,
                    limbWidth * 0.8
                  );
                }
              }
              
              if (part !== 'left_arm') {
                // 右腕
                if (features.hasWeapon && (direction === 'down' || direction === 'left')) {
                  // 武器を持つ姿勢
                  graphics.fillStyle(variant === 'armored' ? features.armorColor : features.skinColor, 1);
                  graphics.fillRect(
                    centerX + armOffsetX,
                    bodyY - armOffsetY,
                    limbWidth,
                    armLength * 0.6
                  );
                  
                  // 武器のタイプに応じた描画
                  graphics.fillStyle(0x8B4513, 1); // 武器の柄（茶色）
                  
                  if (features.weaponType === 'sword') {
                    // 剣
                    graphics.fillRect(
                      centerX + armOffsetX + limbWidth,
                      bodyY - armOffsetY + armLength * 0.4,
                      limbWidth * 0.5,
                      armLength * 0.8
                    );
                    
                    // 剣の刃
                    graphics.fillStyle(0xC0C0C0, 1); // 銀色
                    graphics.fillRect(
                      centerX + armOffsetX + limbWidth * 0.75,
                      bodyY - armOffsetY,
                      limbWidth,
                      armLength * 0.4
                    );
                  } else if (features.weaponType === 'axe') {
                    // 斧
                    graphics.fillRect(
                      centerX + armOffsetX + limbWidth,
                      bodyY - armOffsetY + armLength * 0.3,
                      limbWidth * 0.5,
                      armLength
                    );
                    
                    // 斧の刃
                    graphics.fillStyle(0xC0C0C0, 1); // 銀色
                    graphics.fillTriangle(
                      centerX + armOffsetX + limbWidth * 1.5,
                      bodyY - armOffsetY + armLength * 0.3,
                      centerX + armOffsetX + limbWidth * 3,
                      bodyY - armOffsetY + armLength * 0.1,
                      centerX + armOffsetX + limbWidth * 3,
                      bodyY - armOffsetY + armLength * 0.5
                    );
                  } else if (features.weaponType === 'staff') {
                    // 杖
                    graphics.fillRect(
                      centerX + armOffsetX + limbWidth,
                      bodyY - armOffsetY - armLength * 0.3,
                      limbWidth * 0.5,
                      armLength * 1.5
                    );
                    
                    // 杖の飾り
                    graphics.fillStyle(features.accessoryColor, 1); // 金色
                    graphics.fillCircle(
                      centerX + armOffsetX + limbWidth * 1.25,
                      bodyY - armOffsetY - armLength * 0.3,
                      limbWidth
                    );
                  } else if (features.weaponType === 'bow') {
                    // 弓
                    graphics.lineStyle(limbWidth * 0.5, 0x8B4513, 1);
                    graphics.beginPath();
                    graphics.arc(
                      centerX + armOffsetX + limbWidth * 2,
                      bodyY - armOffsetY + armLength * 0.5,
                      armLength * 0.8,
                      -Math.PI * 0.6,
                      Math.PI * 0.6
                    );
                    graphics.strokePath();
                    
                    // 弓の弦
                    graphics.lineStyle(1, 0xFFFFFF, 1);
                    graphics.lineBetween(
                      centerX + armOffsetX + limbWidth * 2 + Math.cos(-Math.PI * 0.6) * armLength * 0.8,
                      bodyY - armOffsetY + armLength * 0.5 + Math.sin(-Math.PI * 0.6) * armLength * 0.8,
                      centerX + armOffsetX + limbWidth * 2 + Math.cos(Math.PI * 0.6) * armLength * 0.8,
                      bodyY - armOffsetY + armLength * 0.5 + Math.sin(Math.PI * 0.6) * armLength * 0.8
                    );
                  }
                } else {
                  // 通常の右腕
                  graphics.fillRect(
                    centerX + armOffsetX,
                    bodyY - armOffsetY,
                    limbWidth,
                    armLength
                  );
                  
                  // 右手
                  graphics.fillStyle(features.skinColor, 1);
                  drawEllipse(
                    graphics,
                    centerX + armOffsetX + limbWidth * 0.5,
                    bodyY - armOffsetY + armLength,
                    limbWidth * 0.8,
                    limbWidth * 0.8
                  );
                }
              }
            }
            break;
            
          case 'head':
            // 頭を描画
            graphics.fillStyle(features.skinColor, 1);
            
            // 方向に応じた頭の形
            if (direction === 'left' || direction === 'right') {
              // 横向きの頭（楕円形）
              drawEllipse(
                graphics,
                centerX,
                headY,
                headRadius * headScaleX * 1.2,
                headRadius * 1.3
              );
            } else {
              // 前後向きの頭（丸）
              drawEllipse(
                graphics,
                centerX,
                headY,
                headRadius * 1.2,
                headRadius * 1.3
              );
            }
            break;
            
          case 'face':
            // 顔の詳細を描画（目、口など）
            if (details) {
              if (direction === 'down') {
                // 目
                graphics.fillStyle(0xFFFFFF, 1);
                graphics.fillCircle(
                  centerX - headRadius * 0.4,
                  headY - headRadius * 0.1,
                  headRadius * 0.25
                );
                graphics.fillCircle(
                  centerX + headRadius * 0.4,
                  headY - headRadius * 0.1,
                  headRadius * 0.25
                );
                
                // 瞳
                graphics.fillStyle(features.eyeColor, 1);
                graphics.fillCircle(
                  centerX - headRadius * 0.4,
                  headY - headRadius * 0.1,
                  headRadius * 0.12
                );
                graphics.fillCircle(
                  centerX + headRadius * 0.4,
                  headY - headRadius * 0.1,
                  headRadius * 0.12
                );
                
                // 口
                graphics.fillStyle(0x000000, 1);
                graphics.fillRect(
                  centerX - headRadius * 0.3,
                  headY + headRadius * 0.4,
                  headRadius * 0.6,
                  headRadius * 0.1
                );
              } else if (direction === 'left') {
                // 左向きの目と口
                graphics.fillStyle(0xFFFFFF, 1);
                graphics.fillCircle(
                  centerX - headRadius * 0.2,
                  headY - headRadius * 0.1,
                  headRadius * 0.25
                );
                
                graphics.fillStyle(features.eyeColor, 1);
                graphics.fillCircle(
                  centerX - headRadius * 0.2,
                  headY - headRadius * 0.1,
                  headRadius * 0.12
                );
                
                // 口
                graphics.fillStyle(0x000000, 1);
                graphics.fillRect(
                  centerX - headRadius * 0.6,
                  headY + headRadius * 0.3,
                  headRadius * 0.3,
                  headRadius * 0.1
                );
              } else if (direction === 'right') {
                // 右向きの目と口
                graphics.fillStyle(0xFFFFFF, 1);
                graphics.fillCircle(
                  centerX + headRadius * 0.2,
                  headY - headRadius * 0.1,
                  headRadius * 0.25
                );
                
                graphics.fillStyle(features.eyeColor, 1);
                graphics.fillCircle(
                  centerX + headRadius * 0.2,
                  headY - headRadius * 0.1,
                  headRadius * 0.12
                );
                
                // 口
                graphics.fillStyle(0x000000, 1);
                graphics.fillRect(
                  centerX + headRadius * 0.3,
                  headY + headRadius * 0.3,
                  headRadius * 0.3,
                  headRadius * 0.1
                );
              } else if (direction === 'up') {
                // 後ろ向きは顔の詳細なし
              }
              
              // ひげがある場合
              if (features.hasBeard && direction !== 'up') {
                graphics.fillStyle(features.hairColor, 1);
                
                if (direction === 'down') {
                  // 正面向きのひげ
                  graphics.fillRect(
                    centerX - headRadius * 0.4,
                    headY + headRadius * 0.5,
                    headRadius * 0.8,
                    headRadius * 0.4
                  );
                } else if (direction === 'left') {
                  // 左向きのひげ
                  graphics.fillRect(
                    centerX - headRadius * 0.8,
                    headY + headRadius * 0.3,
                    headRadius * 0.5,
                    headRadius * 0.4
                  );
                } else if (direction === 'right') {
                  // 右向きのひげ
                  graphics.fillRect(
                    centerX + headRadius * 0.3,
                    headY + headRadius * 0.3,
                    headRadius * 0.5,
                    headRadius * 0.4
                  );
                }
              }
            }
            break;
            
          case 'hair':
            // 髪の毛を描画
            if (!features.hasHelmet && features.hairStyle !== 'bald') {
              graphics.fillStyle(features.hairColor, 1);
              
              if (features.hairStyle === 'short') {
                // 短い髪
                if (direction === 'down') {
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.4,
                    headRadius * 1.3,
                    headRadius * 0.7
                  );
                } else if (direction === 'up') {
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.4,
                    headRadius * 1.3,
                    headRadius * 0.7
                  );
                } else if (direction === 'left') {
                  drawEllipse(
                    graphics,
                    centerX - headRadius * 0.2,
                    headY - headRadius * 0.4,
                    headRadius * 0.8,
                    headRadius * 0.7
                  );
                } else if (direction === 'right') {
                  drawEllipse(
                    graphics,
                    centerX + headRadius * 0.2,
                    headY - headRadius * 0.4,
                    headRadius * 0.8,
                    headRadius * 0.7
                  );
                }
              } else if (features.hairStyle === 'long') {
                // 長い髪
                if (direction === 'down') {
                  // 頭頂部
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.4,
                    headRadius * 1.3,
                    headRadius * 0.7
                  );
                  
                  // 両サイドの長い髪
                  graphics.fillRect(
                    centerX - headRadius * 1.3,
                    headY - headRadius * 0.4,
                    headRadius * 0.5,
                    bodyHeight
                  );
                  graphics.fillRect(
                    centerX + headRadius * 0.8,
                    headY - headRadius * 0.4,
                    headRadius * 0.5,
                    bodyHeight
                  );
                } else if (direction === 'up') {
                  // 後ろの長い髪
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.2,
                    headRadius * 1.3,
                    headRadius * 0.9
                  );
                  
                  // 背中に垂れる髪
                  graphics.fillRect(
                    centerX - headRadius * 0.8,
                    headY,
                    headRadius * 1.6,
                    bodyHeight * 0.8
                  );
                } else if (direction === 'left') {
                  // 左向きの長い髪
                  drawEllipse(
                    graphics,
                    centerX - headRadius * 0.2,
                    headY - headRadius * 0.4,
                    headRadius * 0.8,
                    headRadius * 0.7
                  );
                  
                  // 後ろの長い髪
                  graphics.fillRect(
                    centerX + headRadius * 0.5,
                    headY - headRadius * 0.4,
                    headRadius * 0.5,
                    bodyHeight * 0.8
                  );
                } else if (direction === 'right') {
                  // 右向きの長い髪
                  drawEllipse(
                    graphics,
                    centerX + headRadius * 0.2,
                    headY - headRadius * 0.4,
                    headRadius * 0.8,
                    headRadius * 0.7
                  );
                  
                  // 前の長い髪
                  graphics.fillRect(
                    centerX - headRadius * 1,
                    headY - headRadius * 0.4,
                    headRadius * 0.5,
                    bodyHeight * 0.8
                  );
                }
              } else if (features.hairStyle === 'ponytail') {
                // ポニーテール
                if (direction === 'down') {
                  // 頭頂部
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.4,
                    headRadius * 1.3,
                    headRadius * 0.7
                  );
                  
                  // ポニーテール
                  drawEllipse(
                    graphics,
                    centerX,
                    headY + headRadius * 0.5,
                    headRadius * 0.5,
                    bodyHeight * 0.4
                  );
                } else if (direction === 'up') {
                  // 頭頂部
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.4,
                    headRadius * 1.3,
                    headRadius * 0.7
                  );
                  
                  // 見えないポニーテール
                } else if (direction === 'left') {
                  // 左向きの頭頂部
                  drawEllipse(
                    graphics,
                    centerX - headRadius * 0.2,
                    headY - headRadius * 0.4,
                    headRadius * 0.8,
                    headRadius * 0.7
                  );
                  
                  // 横から見えるポニーテール
                  drawEllipse(
                    graphics,
                    centerX + headRadius * 0.8,
                    headY,
                    headRadius * 0.5,
                    headRadius * 0.8
                  );
                } else if (direction === 'right') {
                  // 右向きの頭頂部
                  drawEllipse(
                    graphics,
                    centerX + headRadius * 0.2,
                    headY - headRadius * 0.4,
                    headRadius * 0.8,
                    headRadius * 0.7
                  );
                  
                  // 横から見えるポニーテール
                  drawEllipse(
                    graphics,
                    centerX - headRadius * 0.8,
                    headY,
                    headRadius * 0.5,
                    headRadius * 0.8
                  );
                }
              }
            }
            
            // フードがある場合（robed/hooded）
            if (variant === 'hooded' || (variant === 'robed' && customFeatures.hasHood)) {
              graphics.fillStyle(features.clothColor, 1);
              
              if (direction === 'down') {
                // 前から見たフード
                graphics.fillCircle(
                  centerX,
                  headY,
                  headRadius * 1.5
                );
                
                // フードの開口部
                graphics.fillStyle(darkenColor(features.clothColor, 40), 1);
                graphics.fillCircle(
                  centerX,
                  headY,
                  headRadius * 1.1
                );
              } else if (direction === 'up') {
                // 後ろから見たフード
                graphics.fillCircle(
                  centerX,
                  headY,
                  headRadius * 1.5
                );
              } else if (direction === 'left') {
                // 左から見たフード
                graphics.fillRect(
                  centerX - headRadius * 1.5,
                  headY - headRadius * 1.2,
                  headRadius * 3,
                  headRadius * 2.4
                );
                
                // フードの開口部
                graphics.fillStyle(darkenColor(features.clothColor, 40), 1);
                graphics.fillCircle(
                  centerX - headRadius * 0.2,
                  headY,
                  headRadius * 1.1
                );
              } else if (direction === 'right') {
                // 右から見たフード
                graphics.fillRect(
                  centerX - headRadius * 1.5,
                  headY - headRadius * 1.2,
                  headRadius * 3,
                  headRadius * 2.4
                );
                
                // フードの開口部
                graphics.fillStyle(darkenColor(features.clothColor, 40), 1);
                graphics.fillCircle(
                  centerX + headRadius * 0.2,
                  headY,
                  headRadius * 1.1
                );
              }
            }
            break;
            
          case 'accessories':
            // アクセサリー（帽子、ヘルメット、その他装飾品）
            if (features.hasHelmet) {
              // ヘルメット
              graphics.fillStyle(features.armorColor, 1);
              
              if (direction === 'down') {
                // 前からのヘルメット
                drawEllipse(
                  graphics,
                  centerX,
                  headY,
                  headRadius * 1.3,
                  headRadius * 1.2
                );
                
                // 詳細表現（ある場合）
                if (details) {
                  // ヘルメットの鼻パーツ
                  graphics.fillStyle(darkenColor(features.armorColor, 20), 1);
                  graphics.fillTriangle(
                    centerX - headRadius * 0.3,
                    headY,
                    centerX + headRadius * 0.3,
                    headY,
                    centerX,
                    headY + headRadius * 0.6
                  );
                  
                  // ヘルメットの装飾
                  graphics.fillStyle(features.accessoryColor, 1);
                  graphics.fillRect(
                    centerX - headRadius * 0.8,
                    headY - headRadius * 0.8,
                    headRadius * 1.6,
                    headRadius * 0.3
                  );
                }
              } else if (direction === 'up') {
                // 後ろからのヘルメット
                drawEllipse(
                  graphics,
                  centerX,
                  headY,
                  headRadius * 1.3,
                  headRadius * 1.2
                );
                
                // 詳細表現（ある場合）
                if (details) {
                  // ヘルメットの後ろの装飾
                  graphics.fillStyle(darkenColor(features.armorColor, 10), 1);
                  graphics.fillRect(
                    centerX - headRadius * 0.8,
                    headY - headRadius * 0.8,
                    headRadius * 1.6,
                    headRadius * 0.3
                  );
                }
              } else if (direction === 'left') {
                // 左からのヘルメット
                drawEllipse(
                  graphics,
                  centerX,
                  headY,
                  headRadius * 1.2,
                  headRadius * 1.2
                );
                
                // 詳細表現（ある場合）
                if (details) {
                  // ヘルメットの横の装飾
                  graphics.fillStyle(features.accessoryColor, 1);
                  graphics.fillCircle(
                    centerX + headRadius * 0.3,
                    headY - headRadius * 0.5,
                    headRadius * 0.3
                  );
                }
              } else if (direction === 'right') {
                // 右からのヘルメット
                drawEllipse(
                  graphics,
                  centerX,
                  headY,
                  headRadius * 1.2,
                  headRadius * 1.2
                );
                
                // 詳細表現（ある場合）
                if (details) {
                  // ヘルメットの横の装飾
                  graphics.fillStyle(features.accessoryColor, 1);
                  graphics.fillCircle(
                    centerX - headRadius * 0.3,
                    headY - headRadius * 0.5,
                    headRadius * 0.3
                  );
                }
              }
            } else if (features.hasHat) {
              // 帽子（ローブのときは魔法使いの帽子）
              const hatColor = variant === 'robed' ? features.clothColor : features.accessoryColor;
              graphics.fillStyle(hatColor, 1);
              
              if (variant === 'robed') {
                // 魔法使いの帽子
                if (direction === 'down') {
                  // 帽子の円錐部分
                  graphics.fillTriangle(
                    centerX - headRadius * 1.0,
                    headY - headRadius * 0.5,
                    centerX + headRadius * 1.0,
                    headY - headRadius * 0.5,
                    centerX,
                    headY - headRadius * 2.5
                  );
                  
                  // 帽子のつば
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.5,
                    headRadius * 1.3,
                    headRadius * 0.3
                  );
                  
                  // 帽子の装飾
                  if (details) {
                    graphics.fillStyle(features.accessoryColor, 1);
                    graphics.fillCircle(
                      centerX,
                      headY - headRadius * 1.5,
                      headRadius * 0.3
                    );
                  }
                } else if (direction === 'up') {
                  // 背面からは帽子の後ろ部分
                  graphics.fillTriangle(
                    centerX - headRadius * 1.0,
                    headY - headRadius * 0.5,
                    centerX + headRadius * 1.0,
                    headY - headRadius * 0.5,
                    centerX,
                    headY - headRadius * 2.5
                  );
                  
                  // 帽子のつば
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.5,
                    headRadius * 1.3,
                    headRadius * 0.3
                  );
                } else if (direction === 'left' || direction === 'right') {
                  // 横向きの魔法使いの帽子
                  const dirMod = direction === 'left' ? -1 : 1;
                  
                  // 帽子の円錐部分（横から見ると曲がっている）
                  graphics.beginPath();
                  graphics.moveTo(centerX, headY - headRadius * 0.5);
                  graphics.quadraticCurveTo(
                    centerX + dirMod * headRadius * 1.0,
                    headY - headRadius * 1.5,
                    centerX + dirMod * headRadius * 0.5,
                    headY - headRadius * 2.5
                  );
                  graphics.lineTo(centerX, headY - headRadius * 0.5);
                  graphics.fillPath();
                  
                  // 帽子のつば（楕円形）
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.5,
                    headRadius * 0.8,
                    headRadius * 0.3
                  );
                }
              } else {
                // 一般的な帽子
                if (direction === 'down') {
                  // 帽子の上部
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.8,
                    headRadius * 1.2,
                    headRadius * 0.5
                  );
                  
                  // 帽子のつば
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.5,
                    headRadius * 1.5,
                    headRadius * 0.2
                  );
                } else if (direction === 'up') {
                  // 背面から見た帽子
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.8,
                    headRadius * 1.2,
                    headRadius * 0.5
                  );
                  
                  // 帽子のつば
                  drawEllipse(
                    graphics,
                    centerX,
                    headY - headRadius * 0.5,
                    headRadius * 1.5,
                    headRadius * 0.2
                  );
                } else if (direction === 'left' || direction === 'right') {
                  // 横向きの帽子
                  const dirMod = direction === 'left' ? -1 : 1;
                  
                  // 帽子の上部
                  drawEllipse(
                    graphics,
                    centerX + dirMod * headRadius * 0.2,
                    headY - headRadius * 0.8,
                    headRadius * 0.8,
                    headRadius * 0.5
                  );
                  
                  // 帽子のつば（前または後ろに突き出た部分）
                  graphics.fillRect(
                    centerX - dirMod * headRadius * 0.8,
                    headY - headRadius * 0.6,
                    headRadius * 1.0,
                    headRadius * 0.2
                  );
                }
              }
            }
            
            // バリアントに基づいた追加アクセサリー
            if (variant === 'armored' && details) {
              // 鎧の装飾
              graphics.fillStyle(features.accessoryColor, 1);
              
              if (direction === 'down') {
                // 鎧の紋章
                graphics.fillCircle(
                  centerX,
                  bodyY - bodyHeight * 0.2,
                  bodyWidth * 0.15
                );
              }
            }
            break;
        }
      }
    }
    
    /**
     * 鎧の騎士キャラクターのオプションを取得
     * @param {number} color - ベースカラー
     * @returns {Object} カスタマイズオプション
     */
    getKnightOptions(color) {
      return {
        armorColor: color,
        hairColor: darkenColor(color, 40),
        hasHelmet: true,
        hasShield: true,
        hasWeapon: true,
        weaponType: 'sword'
      };
    }
    
    /**
     * 魔法使いキャラクターのオプションを取得
     * @param {number} color - ベースカラー
     * @returns {Object} カスタマイズオプション
     */
    getWizardOptions(color) {
      return {
        clothColor: color,
        hairColor: 0x888888, // 白髪に近いグレー
        hasHat: true,
        hasWeapon: true,
        weaponType: 'staff',
        hairStyle: 'long'
      };
    }
    
    /**
     * 盗賊キャラクターのオプションを取得
     * @param {number} color - ベースカラー
     * @returns {Object} カスタマイズオプション
     */
    getRogueOptions(color) {
      return {
        clothColor: color,
        hairColor: darkenColor(color, 50),
        hasHood: true,
        hasWeapon: true,
        weaponType: 'dagger'
      };
    }
    
    /**
     * 弓使いキャラクターのオプションを取得
     * @param {number} color - ベースカラー
     * @returns {Object} カスタマイズオプション
     */
    getArcherOptions(color) {
      return {
        clothColor: color,
        hairColor: brightenColor(color, 30),
        hairStyle: 'ponytail',
        hasWeapon: true,
        weaponType: 'bow'
      };
    }
    
    /**
     * 楕円を描画するヘルパー関数
     * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @param {number} radiusX - X軸半径
     * @param {number} radiusY - Y軸半径
     */
    drawEllipse(graphics, x, y, radiusX, radiusY) {
      graphics.beginPath();
      graphics.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
      graphics.fill();
    }
    
    /**
     * 色を明るくする
     * @param {number} color - 元の色
     * @param {number} percent - 明るくする割合（0-100）
     * @returns {number} 明るくした色
     */
    brightenColor(color, percent) {
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
    }
    
    /**
     * 色を暗くする
     * @param {number} color - 元の色
     * @param {number} percent - 暗くする割合（0-100）
     * @returns {number} 暗くした色
     */
    darkenColor(color, percent) {
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
    }

    /**
     * 敵キャラクタープレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {string} enemyType - 敵タイプ（'skeleton', 'zombie', 'ghost', 'spider', 'slime', 'wolf', 'boss'）
     */
    createEnemyCharacter(scene, key, enemyType) {
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
      createEnhancedCharacter(scene, key, color, characterType);
    }

    /**
     * キャラクターアニメーションのデバッグビューを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} baseKey - ベースとなるテクスチャーキー
     * @param {string[]} actions - 表示する動作の配列
     * @param {string[]} directions - 表示する方向の配列
     * @param {Object} options - その他のオプション
     */
    createCharacterDebugView(scene, baseKey, actions = ['idle', 'walk'], directions = ['down', 'left', 'right', 'up'], options = {}) {
      if (!scene) return;
      
      const defaultOptions = {
        x: 50,
        y: 50,
        spacing: 10,
        scale: 1,
        frameWidth: 32,
        frameHeight: 32,
        backgroundColor: 0x222222,
        textColor: 0xFFFFFF
      };
      
      const settings = { ...defaultOptions, ...options };
      
      // デバッグコンテナを作成
      const container = scene.add.container(settings.x, settings.y);
      
      // 背景を作成
      const totalWidth = (settings.frameWidth + settings.spacing) * directions.length + settings.spacing;
      const totalHeight = (settings.frameHeight + settings.spacing) * actions.length + settings.spacing + 20; // 20はテキスト用
      
      const background = scene.add.rectangle(0, 0, totalWidth, totalHeight, settings.backgroundColor, 0.7);
      background.setOrigin(0, 0);
      container.add(background);
      
      // 各アクションと方向の組み合わせでスプライトを表示
      let offsetY = settings.spacing + 20; // 上部にテキスト用のスペース
      
      for (const action of actions) {
        let offsetX = settings.spacing;
        
        // アクション名を表示
        const actionText = scene.add.text(
          settings.spacing, 
          offsetY - 15, 
          action, 
          { fontSize: '14px', fill: '#FFFFFF' }
        );
        container.add(actionText);
        
        for (const direction of directions) {
          // スプライトシートのキーを生成
          const textureKey = `${baseKey}_${action}_${direction}_sheet`;
          
          // 方向のテキストを表示
          if (action === actions[0]) {
            const directionText = scene.add.text(
              offsetX + settings.frameWidth / 2, 
              settings.spacing,
              direction, 
              { fontSize: '12px', fill: '#FFFFFF' }
            );
            directionText.setOrigin(0.5, 0);
            container.add(directionText);
          }
          
          // アニメーションが存在するか確認
          if (scene.textures.exists(textureKey)) {
            // アニメーションキーを生成
            const animKey = `${baseKey}_${action}_${direction}_debug`;
            
            // アニメーションが存在しなければ作成
            if (!scene.anims.exists(animKey)) {
              scene.anims.create({
                key: animKey,
                frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
              });
            }
            
            // スプライトを作成
            const sprite = scene.add.sprite(
              offsetX + settings.frameWidth / 2, 
              offsetY + settings.frameHeight / 2, 
              textureKey
            );
            sprite.play(animKey);
            sprite.setScale(settings.scale);
            container.add(sprite);
          } else {
            // テクスチャが存在しない場合は代替表示
            const placeholder = scene.add.rectangle(
              offsetX + settings.frameWidth / 2, 
              offsetY + settings.frameHeight / 2,
              settings.frameWidth, 
              settings.frameHeight, 
              0xFF0000, 
              0.5
            );
            container.add(placeholder);
            
            const noTexText = scene.add.text(
              offsetX + settings.frameWidth / 2, 
              offsetY + settings.frameHeight / 2, 
              'N/A', 
              { fontSize: '10px', fill: '#FFFFFF' }
            );
            noTexText.setOrigin(0.5, 0.5);
            container.add(noTexText);
          }
          
          offsetX += settings.frameWidth + settings.spacing;
        }
        
        offsetY += settings.frameHeight + settings.spacing;
      }
      
      // タイトルを追加
      const title = scene.add.text(
        totalWidth / 2, 
        settings.spacing / 2, 
        `Character: ${baseKey}`, 
        { fontSize: '16px', fill: '#FFFFFF', fontWeight: 'bold' }
      );
      title.setOrigin(0.5, 0);
      container.add(title);
      
      return container;
    }

    /**
     * シンプルなキャラクターコントローラーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {Phaser.GameObjects.Sprite} sprite - キャラクタースプライト
     * @param {Object} config - 設定オブジェクト
     * @returns {Object} コントローラーオブジェクト
     */
    createSimpleCharacterController(scene, sprite, config = {}) {
      if (!scene || !sprite) {
        console.error('有効なシーンとスプライトが必要です');
        return null;
      }
      
      const defaultConfig = {
        speed: 2,
        animations: {
          idle: {
            down: 'idle_down',
            up: 'idle_up',
            left: 'idle_left',
            right: 'idle_right'
          },
          walk: {
            down: 'walk_down',
            up: 'walk_up',
            left: 'walk_left',
            right: 'walk_right'
          },
          attack: {
            down: 'attack_down',
            up: 'attack_up',
            left: 'attack_left',
            right: 'attack_right'
          }
        },
        keys: {
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
          attack: Phaser.Input.Keyboard.KeyCodes.SPACE
        }
      };
      
      const settings = { ...defaultConfig, ...config };
      
      // キーの設定
      const keys = {
        up: scene.input.keyboard.addKey(settings.keys.up),
        down: scene.input.keyboard.addKey(settings.keys.down),
        left: scene.input.keyboard.addKey(settings.keys.left),
        right: scene.input.keyboard.addKey(settings.keys.right),
        attack: scene.input.keyboard.addKey(settings.keys.attack)
      };
      
      // 現在の状態
      const state = {
        direction: 'down',
        action: 'idle',
        isAttacking: false
      };
      
      // アニメーション再生関数
      const playAnimation = (action, direction) => {
        const animKey = settings.animations[action][direction];
        if (animKey && !sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
          sprite.play(animKey);
        }
      };
      
      // 攻撃開始関数
      const startAttack = () => {
        state.isAttacking = true;
        state.action = 'attack';
        playAnimation('attack', state.direction);
        
        // 攻撃アニメーション終了時のハンドラー
        sprite.once('animationcomplete', () => {
          state.isAttacking = false;
          state.action = 'idle';
          playAnimation('idle', state.direction);
        });
      };
      
      // 更新関数
      const update = () => {
        // 攻撃中は移動できない
        if (state.isAttacking) return;
        
        // 攻撃キーが押されたら攻撃開始
        if (Phaser.Input.Keyboard.JustDown(keys.attack)) {
          startAttack();
          return;
        }
        
        // 移動処理
        let isMoving = false;
        
        if (keys.up.isDown) {
          sprite.y -= settings.speed;
          state.direction = 'up';
          isMoving = true;
        } else if (keys.down.isDown) {
          sprite.y += settings.speed;
          state.direction = 'down';
          isMoving = true;
        }
        
        if (keys.left.isDown) {
          sprite.x -= settings.speed;
          state.direction = 'left';
          isMoving = true;
        } else if (keys.right.isDown) {
          sprite.x += settings.speed;
          state.direction = 'right';
          isMoving = true;
        }
        
        // 移動状態に応じてアニメーションを更新
        if (isMoving) {
          if (state.action !== 'walk') {
            state.action = 'walk';
            playAnimation('walk', state.direction);
          }
        } else {
          if (state.action !== 'idle') {
            state.action = 'idle';
            playAnimation('idle', state.direction);
          }
        }
      };
      
      // 初期アニメーション
      playAnimation('idle', state.direction);
      
      // 公開API
      return {
        update,
        keys,
        state,
        sprite
      };
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