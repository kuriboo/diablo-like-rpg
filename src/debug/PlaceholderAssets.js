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
        
        // キャラクタープレースホルダー
        this.createCharacterPlaceholders(scene);
        
        // タイルプレースホルダー
        this.createTilePlaceholders(scene);
        
        // アイテムプレースホルダー
        this.createItemPlaceholders(scene);
        
        // UIプレースホルダー
        this.createUIPlaceholders(scene);
        
        // エフェクトプレースホルダー
        this.createEffectPlaceholders(scene);
        
        this.initialized = true;
        console.log('✅ プレースホルダーアセット生成完了');
        return true;
      } catch (error) {
        console.error('プレースホルダーアセット生成中にエラーが発生しました:', error);
        return false;
      }
    }
    
    /**
     * キャラクタープレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createCharacterPlaceholders(scene) {
      // プレイヤーキャラクタータイプと色のマッピング
      const playerColors = {
        warrior: 0x8B0000, // 暗い赤
        rogue: 0x006400,   // 暗い緑
        sorcerer: 0x00008B  // 暗い青
      };
      
      // 敵キャラクタータイプと色のマッピング
      const enemyColors = {
        skeleton: 0xBDBDBD,  // 薄い灰色
        zombie: 0x556B2F,    // オリーブ
        ghost: 0xE6E6FA,     // 薄い紫
        spider: 0x800080,    // 紫
        slime: 0x00FF7F,     // 春の緑
        wolf: 0x8B4513,      // サドルブラウン
        boss: 0xFF0000       // 赤
      };
      
      // NPCタイプと色のマッピング
      const npcColors = {
        villager: 0xFFD700,   // 金色
        guard: 0x4682B4,      // スティールブルー
        blacksmith: 0xB22222, // 煉瓦色
        merchant: 0x9370DB,   // ミディアムパープル
        alchemist: 0x32CD32   // ライムグリーン
      };
      
      // プレイヤーキャラクタープレースホルダー作成
      Object.entries(playerColors).forEach(([type, color]) => {
        // 4方向すべてのプレースホルダーを作成
        ['up', 'down', 'left', 'right'].forEach(direction => {
          this.createDirectionalCharacter(scene, `player_${type}_${direction}`, color, direction);
        });
      });
      
      // 敵キャラクタープレースホルダー作成
      Object.entries(enemyColors).forEach(([type, color]) => {
        ['up', 'down', 'left', 'right'].forEach(direction => {
          this.createDirectionalCharacter(scene, `enemy_${type}_${direction}`, color, direction);
        });
      });
      
      // NPCキャラクタープレースホルダー作成
      Object.entries(npcColors).forEach(([type, color]) => {
        ['up', 'down', 'left', 'right'].forEach(direction => {
          this.createDirectionalCharacter(scene, `npc_${type}_${direction}`, color, direction);
        });
      });
      
      // 共通プレースホルダー（デバッグ用）
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
      // タイルタイプと色のマッピング
      const tileColors = {
        grass: 0x3CB371,  // ミディアムシーグリーン
        dirt: 0x8B4513,   // サドルブラウン
        stone: 0x708090,  // スレートグレー
        water: 0x1E90FF,  // ドジャーブルー
        snow: 0xFFFAFA,   // スノー
        sand: 0xF4A460,   // サンディブラウン
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
        this.createTileWithPattern(scene, `tile_${type}`, color);
      });
      
      // 障害物プレースホルダー作成
      Object.entries(obstacleColors).forEach(([type, color]) => {
        // 障害物は少し立体的に
        this.createObstacle(scene, `obstacle_${type}`, color);
      });
      
      // 壁プレースホルダー（特殊処理）
      this.createWallTile(scene, 'tile_wall', 0x808080);
    }
    
    /**
     * パターン付きタイルプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createTileWithPattern(scene, key, color) {
      const graphics = scene.add.graphics();
      const tileSize = 32;
      
      // 背景色を塗る
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, tileSize, tileSize);
      
      // パターン追加（タイプごとに異なるパターン）
      if (key.includes('grass')) {
        // 草のパターン（点々）
        graphics.fillStyle(brightenColor(color, 20), 0.5);
        for (let i = 0; i < 6; i++) {
          const x = Math.random() * tileSize;
          const y = Math.random() * tileSize;
          graphics.fillCircle(x, y, 2);
        }
      } else if (key.includes('dirt')) {
        // 土のパターン（線）
        graphics.lineStyle(1, darkenColor(color, 20), 0.3);
        for (let i = 0; i < 3; i++) {
          const x1 = Math.random() * tileSize;
          const y1 = Math.random() * tileSize;
          const x2 = x1 + (Math.random() * 10 - 5);
          const y2 = y1 + (Math.random() * 10 - 5);
          graphics.lineBetween(x1, y1, x2, y2);
        }
      } else if (key.includes('stone')) {
        // 石のパターン（クラック）
        graphics.lineStyle(1, darkenColor(color, 40), 0.5);
        for (let i = 0; i < 2; i++) {
          const x1 = Math.random() * tileSize;
          const y1 = Math.random() * tileSize;
          const x2 = Math.random() * tileSize;
          const y2 = Math.random() * tileSize;
          graphics.lineBetween(x1, y1, x2, y2);
        }
      } else if (key.includes('water')) {
        // 水のパターン（波線）
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
        // 雪のパターン（小さな点）
        graphics.fillStyle(darkenColor(color, 10), 0.5);
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * tileSize;
          const y = Math.random() * tileSize;
          graphics.fillCircle(x, y, 1);
        }
      } else if (key.includes('sand')) {
        // 砂のパターン（小さな粒）
        graphics.fillStyle(darkenColor(color, 20), 0.4);
        for (let i = 0; i < 12; i++) {
          const x = Math.random() * tileSize;
          const y = Math.random() * tileSize;
          graphics.fillRect(x, y, 1, 1);
        }
      } else if (key.includes('lava')) {
        // 溶岩のパターン（泡）
        graphics.fillStyle(brightenColor(color, 40), 0.7);
        for (let i = 0; i < 4; i++) {
          const x = 5 + Math.random() * (tileSize - 10);
          const y = 5 + Math.random() * (tileSize - 10);
          const r = 2 + Math.random() * 3;
          graphics.fillCircle(x, y, r);
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
    }
    
    /**
     * 壁タイルのプレースホルダー作成
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} color - 色（16進数）
     */
    createWallTile(scene, key, color) {
      const graphics = scene.add.graphics();
      const tileSize = 32;
      
      // 背景色
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, tileSize, tileSize);
      
      // レンガ模様
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
      
      // 枠線
      graphics.lineStyle(1, darkenColor(color, 30), 0.8);
      graphics.strokeRect(0, 0, tileSize, tileSize);
      
      // テクスチャとして生成して登録
      graphics.generateTexture(key, tileSize, tileSize);
      graphics.destroy();
      
      // プレースホルダー一覧に追加
      this.placeholders[key] = { type: 'wall', color, width: tileSize, height: tileSize };
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
     * UIプレースホルダーを作成
     * @param {Phaser.Scene} scene - Phaserシーン
     */
    createUIPlaceholders(scene) {
      // UIパネル
      this.createUIPanel(scene, 'ui_panel', 0x333333);
      
      // UIボタン
      this.createUIButton(scene, 'ui_button', 0x666666, false);
      this.createUIButton(scene, 'ui_button_hover', 0x888888, true);
      
      // スキルアイコン
      this.createSkillIcon(scene, 'ui_skill_icon', 0x0000FF);
      
      // ステータスバー
      this.createStatusBar(scene, 'ui_health_bar', 0xFF0000);
      this.createStatusBar(scene, 'ui_mana_bar', 0x0000FF);
      
      // インベントリスロット
      this.createInventorySlot(scene, 'ui_inventory_slot', 0x222222);
      
      // カーソル
      this.createCursor(scene, 'ui_cursor', 0xFFFFFF);
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
      
      // ボタン背景
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, width, height, 5);
      
      // ボタン枠線
      graphics.lineStyle(1, isHover ? brightenColor(color, 50) : brightenColor(color, 20), 1);
      graphics.strokeRoundedRect(0, 0, width, height, 5);
      
      // ボタン内部のグラデーション
      const gradient = graphics.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, brightenColor(color, 20));
      gradient.addColorStop(1, darkenColor(color, 20));
      graphics.fillStyle(gradient, 1);
      graphics.fillRoundedRect(2, 2, width - 4, height - 4, 4);
      
      // テクスチャとして生成して登録
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
      return scene && scene.textures && scene.textures.exists(key);
    }
    
    /**
     * プレースホルダーテクスチャの取得（存在しない場合は生成）
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - テクスチャーキー
     * @param {number} width - フォールバック用の幅
     * @param {number} height - フォールバック用の高さ
     * @param {number} color - フォールバック用の色
     * @returns {string} 実際に使用できるテクスチャキー
     */
    getTexture(scene, key, width = 32, height = 32, color = 0xffff00) {
      // 既存のテクスチャがあれば、そのまま返す
      if (this.hasTexture(scene, key)) {
        return key;
      }
      
      // プレースホルダーキーを作成
      const placeholderKey = `placeholder_${key}`;
      
      // プレースホルダーも存在しなければ生成
      if (!this.hasTexture(scene, placeholderKey)) {
        this.createColorRect(scene, placeholderKey, width, height, color);
        console.log(`⚠️ テクスチャ '${key}' が見つからないため、プレースホルダーを生成しました`);
      }
      
      return placeholderKey;
    }
    
    /**
     * フォールバックテクスチャの取得（クラス分類ごとにデフォルト提供）
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} type - テクスチャタイプ ('character', 'tile', 'item', 'ui', 'effect')
     * @returns {string} フォールバック用テクスチャキー
     */
    getFallbackTexture(scene, type) {
      const fallbacks = {
        character: 'character_placeholder',
        player: 'player_warrior_down', 
        enemy: 'enemy_skeleton_down',
        npc: 'npc_villager_down',
        tile: 'tile_grass',
        item: 'item_placeholder',
        potion: 'item_potion_health',
        weapon: 'item_weapon_sword',
        chest: 'chest_closed',
        ui: 'ui_panel',
        effect: 'effect_attack',
        particle: 'particle'
      };
      
      const key = fallbacks[type] || 'character_placeholder';
      
      // フォールバックテクスチャがなければ作成
      if (!this.hasTexture(scene, key)) {
        if (type === 'character' || type === 'player') {
          this.createColorRect(scene, key, 32, 32, 0x00ff00);
        } else if (type === 'enemy') {
          this.createColorRect(scene, key, 32, 32, 0xff0000);
        } else if (type === 'npc') {
          this.createColorRect(scene, key, 32, 32, 0x0000ff);
        } else if (type === 'tile') {
          this.createColorRect(scene, key, 32, 32, 0x888888);
        } else if (type === 'item' || type === 'potion' || type === 'weapon') {
          this.createColorRect(scene, key, 16, 16, 0xffff00);
        } else if (type === 'chest') {
          this.createColorRect(scene, key, 32, 32, 0x8b4513);
        } else if (type === 'ui') {
          this.createColorRect(scene, key, 100, 100, 0x333333);
        } else if (type === 'effect' || type === 'particle') {
          this.createColorRect(scene, key, 64, 64, 0xffffff, 0.7);
        } else {
          this.createColorRect(scene, key, 32, 32, 0xffff00);
        }
      }
      
      return key;
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
  function darkenColor(color, percent) {
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
  
  // デフォルトエクスポートとしてシングルトンインスタンスをエクスポート
  export default PlaceholderAssets.getInstance();
  
  // 個別の関数としてもエクスポート
  export const initialize = PlaceholderAssets.getInstance().initialize.bind(PlaceholderAssets.getInstance());
  export const createColorRect = PlaceholderAssets.getInstance().createColorRect.bind(PlaceholderAssets.getInstance());
  export const getTexture = PlaceholderAssets.getInstance().getTexture.bind(PlaceholderAssets.getInstance());
  export const getFallbackTexture = PlaceholderAssets.getInstance().getFallbackTexture.bind(PlaceholderAssets.getInstance());
  export { brightenColor, darkenColor };