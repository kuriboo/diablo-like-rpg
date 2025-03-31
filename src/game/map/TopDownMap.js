// Phaserを動的にロードするためのユーティリティ
let PhaserModule = null;

// 非同期でPhaserをロードする関数
async function getPhaserModule() {
  if (PhaserModule) return PhaserModule;
  
  try {
    PhaserModule = await import('phaser');
    return PhaserModule;
  } catch (error) {
    console.error('Failed to load Phaser:', error);
    throw error;
  }
}

// SceneクラスをPhaserから取得するユーティリティ関数
async function getTilemapsClass() {
  const phaser = await getPhaserModule();
  return phaser.Tilemaps || phaser.default.Tilemaps;
}

import { isDebugMode } from '../../debug';
import AssetManager from '../core/AssetManager';
import MapLoader from '../../debug/MapLoader';

export default class TopDownMap {
  constructor(options = {}) {
    this.scene = options.scene;
    this.mapData = options.mapData || null;
    this.TileMaps = null; 
    
    // タイルサイズ（トップダウン向けに正方形に）
    this.tileSize = options.tileSize || 32;
    
    // マップサイズ
    this.width = this.mapData ? this.mapData.width : 50;
    this.height = this.mapData ? this.mapData.height : 50;
    
    // 統合タイルセット
    this.integratedTilesets = null;
    
    // タイルセットマッピング
    this.terrainTilesets = {
      0: 'water', // 水
      1: 'grass', // 草
      2: 'dirt',  // 土
      3: 'sand',  // 砂
      4: 'stone', // 石
      5: 'snow',  // 雪
      6: 'lava'   // 溶岩
    };
    
    // オブジェクトタイルマッピング
    this.objectTilesets = {
      0: 'wall',  // 壁
      1: 'chest'  // 宝箱
    };
    
    // タイルマップとレイヤー
    this.map = null;
    this.groundLayer = null;
    this.objectLayer = null;
    
    // パスファインディング用グリッド
    this.pathfindingGrid = null;
    
    // エンティティ管理用配列
    this.entities = [];
    
    // デバッグモードフラグの取得
    this.isDebugMode = isDebugMode || process.env.NODE_ENV !== 'production';
    
    // 統合タイルセット使用フラグ
    this.useIntegratedTilesets = options.useIntegratedTilesets !== false;
    
    // 初期化
    this.initAsync();
  }
  
  // 初期化
  async initAsync() {
    this.TileMaps = await getTilemapsClass();
    
    // AssetManagerの初期化確認
    if (this.scene && !AssetManager.initialized) {
      AssetManager.initialize(this.scene);
    }
    
    // 統合タイルセットを使う場合
    if (this.useIntegratedTilesets) {
      console.log("統合タイルセットを使用します");
    }
    
    // マップデータがあれば生成を開始
    if (this.mapData) {
      // 統合タイルセットを使う場合は準備
      if (this.useIntegratedTilesets) {
        MapLoader.prepareTilesets(); //タイル生成
        this.integratedTilesets = MapLoader.tilesets;
      }
      
      this.createMap();
      this.initPathfindingGrid();
    }
  }
  
  // プレースホルダーを確保
  ensurePlaceholders() {
    // AssetManagerが初期化されていることを確認
    if (this.scene && !AssetManager.initialized) {
      console.log('初期化: AssetManager for TopDownMap');
      AssetManager.initialize(this.scene);
    }
    
    // タイル用のプレースホルダーを確保
    const tileTypes = ['tile_water', 'tile_grass', 'tile_dirt', 'tile_sand', 'tile_stone', 'tile_snow', 'tile_lava', 'tile_wall', 'item_chest'];
    
    tileTypes.forEach(tileType => {
      // AssetManagerを使って存在チェック
      const subtype = tileType.replace('tile_', '').replace('item_', '');
      const type = tileType.startsWith('tile_') ? 'tile' : 'item';
      
      if (!AssetManager.hasAsset(tileType, 'texture')) {
        console.log(`Creating placeholder for ${tileType}`);
        // AssetManagerを通してプレースホルダーを取得または生成
        AssetManager.getPlaceholderTexture(type, subtype);
      }
    });
  }
  
  // プレースホルダーテクスチャの取得/生成
  getPlaceholderTexture(tileType) {
    // タイルタイプをAssetManagerの形式に合わせる
    const parts = tileType.split('_');
    const type = parts[0]; // tile または item
    const subtype = parts[1]; // water, grass, chest 等
    
    // AssetManagerを使用してテクスチャキーを取得
    return AssetManager.getTextureKey(type, subtype);
  }
  
  // マップデータの設定
  setMapData(mapData) {
    this.mapData = mapData;
    this.width = mapData.width;
    this.height = mapData.height;
    
    // 既存のマップとレイヤーを破棄
    if (this.map) {
      this.map.destroy();
      this.map = null;
      this.groundLayer = null;
      this.objectLayer = null;
    }
    
    // エンティティリストをクリア
    this.entities = [];

    this.initPathfindingGrid();
    
    // 統合タイルセットを使う場合は準備
    if (this.useIntegratedTilesets) {
      if (!MapLoader.initialized) {
        MapLoader.initialize(this.scene);
        MapLoader.prepareTilesets();
      }
      this.integratedTilesets = MapLoader.tilesets;
    } else {
      // AssetManagerを通してプレースホルダーを確保
      if (this.isDebugMode) {
        this.ensurePlaceholders();
      }
    }
    
    // 新しいマップを生成
    this.createMap();
  }
  
  // マップの作成
  async createMap() {
    if (!this.mapData || !this.mapData.heightMap || !this.mapData.objectPlacement) {
      console.error('Invalid map data for map creation');
      return this;
    }
    
    try {
      // TileMapsがまだ読み込まれていない場合は待機
      if (!this.TileMaps) {
        this.TileMaps = await getTilemapsClass();
      }

      // マップデータをPhaserのタイルマップに変換
      this.map = this.scene.make.tilemap({
        tileWidth: this.tileSize,
        tileHeight: this.tileSize,
        width: this.width,
        height: this.height
      });
      
      // 統合タイルセットを使用するかどうかで処理を分岐
      if (this.useIntegratedTilesets && this.integratedTilesets) {
        // 統合タイルセットを使用
        this.createMapWithIntegratedTilesets();
      } else {
        // 従来の個別タイルセットを使用
        this.createMapWithIndividualTilesets();
      }
      
      // 衝突判定の設定
      if (this.scene.physics && this.scene.physics.world) {
        this.scene.physics.world.setBounds(0, 0, this.width * this.tileSize, this.height * this.tileSize);
        this.scene.physics.world.enable(this.objectLayer);
        this.objectLayer.setCollisionByExclusion([-1]); // -1は空タイル
      }
      
    } catch (e) {
      console.error('Error creating map:', e);
    }
    
    return this;
  }
  
  // 統合タイルセットでマップを作成
  createMapWithIntegratedTilesets() {
    console.log('🔄 統合タイルセットでマップを作成...');
    
    // 地形タイルセット
    const terrainTileset = this.map.addTilesetImage(
      this.integratedTilesets.terrain,
      this.integratedTilesets.terrain,
      this.tileSize,
      this.tileSize
    );
    
    // オブジェクトタイルセット
    const objectsTileset = this.map.addTilesetImage(
      this.integratedTilesets.objects,
      this.integratedTilesets.objects,
      this.tileSize,
      this.tileSize
    );
    
    if (!terrainTileset || !objectsTileset) {
      console.error('タイルセットの追加に失敗しました');
      return;
    }
    
    // レイヤーの作成
    this.groundLayer = this.map.createBlankLayer('ground', terrainTileset);
    this.objectLayer = this.map.createBlankLayer('objects', objectsTileset);
    
    // マップデータをもとにタイルを配置
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        try {
          // 高さデータに基づくタイルタイプの決定
          const heightValue = this.mapData.heightMap[y][x];
          
          if (heightValue === undefined) {
            console.log(`undefined heightValue at ${x},${y}`);
            continue;
          }
          
          // 高さ値からタイルタイプを決定
          const tileIndex = this.getTerrainTileIndex(heightValue);
          
          // 地面レイヤーにタイルを配置
          this.groundLayer.putTileAt(tileIndex, x, y);
          
          // オブジェクト配置情報
          const objectType = this.mapData.objectPlacement[y][x];
          
          if (objectType === undefined) {
            console.log(`undefined objectType at ${x},${y}`);
            continue;
          }
          
          // オブジェクトタイプが0でない場合（何かオブジェクトがある場合）
          if (objectType !== 0 && heightValue >= 0.3) {
            // オブジェクトタイプからテクスチャを取得
            const objectTexture = this.getObjectTexture(objectType);
            
            if (objectTexture && objectTexture.index !== null) {
              this.objectLayer.putTileAt(objectTexture.index, x, y);
              
              // 障害物は通行不可に設定
              if (objectType === 3) {
                const tile = this.objectLayer.getTileAt(x, y);
                if (tile) {
                  tile.setCollision(true);
                }
              }
            }
          }
        } catch (e) {
          console.warn(`Error placing tile at ${x},${y}: ${e.message}`);
        }
      }
    }
    
    console.log('✅ 統合タイルセットでのマップ作成完了');
  }
  
  // 個別タイルセットでマップを作成（従来の方法）
  createMapWithIndividualTilesets() {
    console.log('🔄 個別タイルセットでマップを作成...');
    
    // タイルセットの作成（各タイプのタイルを登録）
    const tilesetKeys = [
      'tile_water', 'tile_grass', 'tile_dirt', 'tile_sand', 
      'tile_stone', 'tile_snow', 'tile_lava', 'tile_wall', 'item_chest'
    ];
    
    // 実際に利用可能なtilesetを保持
    const tilesets = {};
    
    // AssetManagerを使用してタイルセットを作成
    for (const key of tilesetKeys) {
      // タイルタイプをAssetManagerの形式に合わせる
      const parts = key.split('_');
      const type = parts[0]; // tile または item
      const subtype = parts[1]; // water, grass 等
      
      // AssetManagerからテクスチャキーを取得
      const textureKey = AssetManager.getTextureKey(type, subtype);
      
      if (textureKey && this.scene.textures.exists(textureKey)) {
        try {
          const tileset = this.map.addTilesetImage(textureKey, textureKey, this.tileSize, this.tileSize);
          if (tileset) {
            tilesets[key] = tileset;
          }
        } catch (e) {
          console.warn(`Failed to add tileset ${textureKey}: ${e.message}`);
        }
      }
    }
    
    console.log("tilesets : ", tilesets);
    
    // レイヤーの作成
    this.groundLayer = this.map.createBlankLayer('ground', tilesets);
    this.objectLayer = this.map.createBlankLayer('objects', Object.values(tilesets));
    
    console.log("heightmap : ", this.mapData.heightMap.length);
    console.log("objectPlacementmap : ", this.mapData.objectPlacement.length);
    
    // マップデータをもとにタイルを配置
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        try {
          // 高さデータに基づくタイルタイプの決定
          const heightValue = this.mapData.heightMap[y][x];
          
          if (heightValue === undefined) {
            console.log(`undefined heightValue at ${x},${y}`);
            continue;
          }
          
          const objectType = this.mapData.objectPlacement[y][x];
          
          if (objectType === undefined) {
            console.log(`undefined objectType at ${x},${y}`);
            continue;
          }
          
          // 高さ値からテクスチャを選択
          const tileTextureKey = this.getTextureFromHeight(heightValue);
          
          // 地面レイヤーにタイルを配置
          const groundTileIndex = this.getTileIndexForType(tileTextureKey);
          
          // タイルを配置
          this.groundLayer.putTileAt(groundTileIndex, x, y);
          
          // オブジェクト配置情報に基づくオブジェクト配置
          // MapGeneratorに合わせたオブジェクトタイプ:
          // 0: 空き/移動可能 (何も配置しない)
          // 2: 宝箱
          // 3: 壁/障害物
          if (objectType === 3  && heightValue >= 0.3) { // 壁/障害物
            const wallTextureKey = 'tile_stone';
            const wallTileIndex = this.getTileIndexForType(wallTextureKey);
            
            if (this.objectLayer) {
              this.objectLayer.putTileAt(wallTileIndex, x, y);
              
              // 衝突判定を追加
              const tile = this.objectLayer.getTileAt(x, y);
              if (tile) {
                tile.setCollision(true);
              }
            }
          } else if (objectType === 2  && heightValue >= 0.3) { // 宝箱
            // 宝箱用テクスチャの取得
            const chestTextureKey = AssetManager.getTextureKey('item', 'chest');
            // キーが存在しない場合はフォールバックとして雪のテクスチャを使用
            const usedKey = chestTextureKey || 'tile_snow';
            const chestTileIndex = this.getTileIndexForType(usedKey);
            
            if (this.objectLayer) {
              this.objectLayer.putTileAt(chestTileIndex, x, y);
            }
          }
          // objectType === 0 は空きスペースなので何も配置しない
        } catch (e) {
          console.warn(`Error placing tile at ${x},${y}: ${e.message}`);
        }
      }
    }
    
    console.log('✅ 個別タイルセットでのマップ作成完了');
  }
  
  // 統合タイルセット用：高さ値から地形タイルインデックスを取得
  getTerrainTileIndex(heightValue) {
    let terrainType;
    
    if (heightValue < 0.3) {
      terrainType = 'water'; // 低い地形（水域）
    } else if (heightValue < 0.5) {
      terrainType = 'grass'; // 中程度の地形（草原）
    } else if (heightValue < 0.7) {
      terrainType = 'dirt';  // 中高地形（土）
    } else if (heightValue < 0.85) {
      terrainType = 'stone'; // 高地形（石）
    } else {
      terrainType = 'snow';  // 最高地（雪）
    }
    
    // タイルマッピング
    const tileMapping = {
      'water': 0,
      'grass': 1,
      'dirt': 2,
      'sand': 3,
      'stone': 4,
      'snow': 5,
      'lava': 6
    };
    
    return tileMapping[terrainType] || 0;
  }
  
  // 統合タイルセット用：オブジェクトタイプからオブジェクトタイルインデックスを取得
  getObjectTileIndex(objectType) {
    // MapGeneratorのオブジェクトタイプに基づいてインデックスを決定
    // 0: 空き/移動可能
    // 2: 宝箱
    // 3: 壁/障害物
    if (objectType === 3) { // 壁/障害物
      return 0; // 壁のインデックス
    } else if (objectType === 2) { // 宝箱
      return 1; // 宝箱のインデックス
    }
    
    return null; // 配置しない
  }
  
  /**
   * getTextureFromHeight - MapGeneratorの高さマップに合わせて修正
   * 高さ値（0.0〜1.0）からテクスチャタイプを決定
   * @param {number} heightValue - 高さ値（0.0〜1.0）
   * @returns {string} テクスチャキー
   */
  getTextureFromHeight(heightValue) {
    let subtype;
    
    if (heightValue < 0.3) {
      subtype = 'water'; // 低い地形（水域）- 通行不可
    } else if (heightValue < 0.5) {
      subtype = 'grass'; // 中程度の地形（草原）
    } else if (heightValue < 0.7) {
      subtype = 'dirt';  // 中高地形（土）
    } else if (heightValue < 0.85) {
      subtype = 'stone'; // 高地形（石）
    } else {
      subtype = 'snow';  // 最高地（雪）
    }
    
    // 統合タイルセットを使用する場合は、異なる形式でテクスチャ情報を返す
    if (this.useIntegratedTilesets && this.integratedTilesets) {
      const tileMapping = {
        'water': 0,
        'grass': 1,
        'dirt': 2,
        'sand': 3,
        'stone': 4,
        'snow': 5,
        'lava': 6
      };
      
      return {
        key: this.integratedTilesets.terrain,
        index: tileMapping[subtype] || 0
      };
    }
    
    // 従来の処理：AssetManagerの命名規則に合わせて返す
    return `tile_${subtype}`;
  }

  /**
   * オブジェクトタイプからテクスチャを取得する関数
   * 障害物タイプ（tree, rock, bush, crate）に対応
   * @param {number} objectType - MapGeneratorのオブジェクトタイプ（0=空き、2=宝箱、3=障害物）
   * @returns {string|object} テクスチャキーまたはオブジェクト
   */
  getObjectTexture(objectType) {
    let tileKey;
    
    // MapGeneratorのオブジェクトタイプに基づいてタイルキーを決定
    switch (objectType) {
      case 2: // 宝箱
        tileKey = 'item_chest';
        break;
      case 3: // 壁/障害物 - ランダムな障害物タイプを選択
        const obstacleTypes = ['tile_wall', 'obstacle_tree', 'obstacle_rock', 'obstacle_bush', 'obstacle_crate'];
        tileKey = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        break;
      default:
        return null;
    }
    
    // 統合タイルセットを使用する場合
    if (this.useIntegratedTilesets && this.integratedTilesets) {
      const tileMapping = {
        'tile_wall': 0,
        'item_chest': 1,
        'obstacle_tree': 2,
        'obstacle_rock': 3,
        'obstacle_bush': 4,
        'obstacle_crate': 5
      };
      
      return {
        key: this.integratedTilesets.objects,
        index: tileMapping[tileKey] || 0
      };
    }
    
    // 従来の処理：シンプルにタイルキーを返す
    return tileKey;
  }

  // タイルタイプからインデックスを取得（シンプルなマッピング）
  getTileIndexForType(tileType) {
    const typeMap = {
      'tile_water': 0,
      'tile_grass': 1,
      'tile_dirt': 2,
      'tile_sand': 3,
      'tile_stone': 4,
      'tile_snow': 5,
      'tile_lava': 6,
      'tile_wall': 0,    // オブジェクトタイルセットの最初のタイル
      'item_chest': 1    // オブジェクトタイルセットの2番目のタイル
    };
    
    return typeMap[tileType] !== undefined ? typeMap[tileType] : 0;
  }

  // オブジェクト（敵、NPC、アイテムなど）の配置
  placeObjects() {
    if (!this.mapData) return this;
    
    // 既存の敵やNPCをクリア
    if (this.scene.enemies) {
      this.scene.enemies.forEach(enemy => {
        this.removeEntity(enemy);
        enemy.destroy();
      });
      this.scene.enemies = [];
    }
    
    if (this.scene.npcs) {
      this.scene.npcs.forEach(npc => {
        this.removeEntity(npc);
        npc.destroy();
      });
      this.scene.npcs = [];
    }
    
    if (this.scene.items) {
      this.scene.items.forEach(item => {
        this.removeEntity(item);
        item.destroy();
      });
      this.scene.items = [];
    }
    
    // 敵の配置
    if (this.mapData.enemyPlacement && this.mapData.enemyPlacement.length > 0) {
      this.placeEnemies();
    }
    
    // NPCの配置
    if (this.mapData.npcPlacement && this.mapData.npcPlacement.length > 0) {
      this.placeNPCs();
    }
    
    // アイテム/宝箱の配置
    this.placeChestsAndItems();
    
    return this;
  }
  
  // 敵の配置
  placeEnemies() {
    if (!this.scene.characterFactory || !this.mapData.enemyPlacement) return;
    
    // 敵配列の初期化
    if (!this.scene.enemies) this.scene.enemies = [];
    
    // MapGeneratorが生成したenemyPlacementデータを使用
    for (const enemyData of this.mapData.enemyPlacement) {
      // トップダウン座標の計算
      const x = enemyData.x * this.tileSize + this.tileSize / 2;
      const y = enemyData.y * this.tileSize + this.tileSize / 2;
      
      // 統合タイルセットを使用する場合は別のテクスチャ取得方法
      let texture;
      if (this.useIntegratedTilesets && this.integratedTilesets) {
        texture = `enemy_${enemyData.type || 'skeleton'}`;
      } else {
        // AssetManagerから敵のテクスチャキーを取得
        texture = AssetManager.getTextureKey('enemy', enemyData.type || 'skeleton');
      }
      
      // 敵の生成
      const enemy = this.scene.characterFactory.createEnemy({
        scene: this.scene,
        x: x,
        y: y,
        texture: texture,
        level: enemyData.level || this.scene.gameData?.currentLevel || 1,
        type: enemyData.type || 'skeleton'
      });
      
      if (enemy) {
        // 敵がボスかどうかを設定
        if (enemyData.type === 'boss') {
          enemy.setScale(1.5);
          this.scene.boss = enemy;
        }
        
        // シーンに追加
        this.scene.add.existing(enemy);
        
        // 敵リストに追加
        this.scene.enemies.push(enemy);
        
        // エンティティリストに追加
        this.addEntity(enemy);
      }
    }
  }
  
  // NPCの配置
  placeNPCs() {
    if (!this.scene.characterFactory || !this.mapData.npcPlacement) return;
    
    // NPC配列の初期化
    if (!this.scene.npcs) this.scene.npcs = [];
    
    // MapGeneratorが生成したnpcPlacementデータを使用
    for (const npcData of this.mapData.npcPlacement) {
      // トップダウン座標の計算
      const x = npcData.x * this.tileSize + this.tileSize / 2;
      const y = npcData.y * this.tileSize + this.tileSize / 2;
      
      // 統合タイルセットを使用する場合は別のテクスチャ取得方法
      let texture;
      if (this.useIntegratedTilesets && this.integratedTilesets) {
        texture = `npc_${npcData.type || 'villager'}`;
      } else {
        // AssetManagerからNPCのテクスチャキーを取得
        texture = AssetManager.getTextureKey('npc', npcData.type || 'villager');
      }
      
      // NPCの生成
      const npc = this.scene.characterFactory.createNPC({
        scene: this.scene,
        x: x,
        y: y,
        texture: texture,
        type: npcData.type || 'villager',
        isShop: npcData.isShop || false,
        dialogues: npcData.dialogues || []
      });
      
      if (npc) {
        // ショップデータの設定
        if (npcData.isShop && npcData.shopType) {
          npc.setShopType(npcData.shopType);
          npc.setShopItems(npcData.items || []);
        }
        
        // シーンに追加
        this.scene.add.existing(npc);
        
        // NPCリストに追加
        this.scene.npcs.push(npc);
        
        // エンティティリストに追加
        this.addEntity(npc);
      }
    }
  }
  
  // 宝箱とアイテムの配置
  placeChestsAndItems() {
    if (!this.scene.itemFactory) return;
    
    // アイテム配列の初期化
    if (!this.scene.items) this.scene.items = [];
    
    // オブジェクト配置データから宝箱を探して配置
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // MapGeneratorの仕様: 2は宝箱を表す
        if ( this.mapData.objectPlacement[y][x] === 2 && this.mapData.heightMap[y][x] >= 0.3 ) {
          // トップダウン座標
          const itemX = x * this.tileSize + this.tileSize / 2;
          const itemY = y * this.tileSize + this.tileSize / 2;
          
          // 統合タイルセットを使用する場合は別のテクスチャ取得方法
          let texture;
          if (this.useIntegratedTilesets && this.integratedTilesets) {
            texture = 'item_chest';
          } else {
            // AssetManagerから宝箱のテクスチャキーを取得
            texture = AssetManager.getTextureKey('item', 'chest');
          }
          
          // 宝箱またはアイテムの生成
          const item = this.scene.itemFactory.createItem({
            scene: this.scene,
            x: itemX,
            y: itemY,
            texture: texture,
            type: 'chest',
            level: this.scene.gameData?.currentLevel || 1
          });
          
          if (item) {
            // シーンに追加
            this.scene.add.existing(item);
            
            // アイテムリストに追加
            this.scene.items.push(item);
            
            // エンティティリストに追加
            this.addEntity(item);
          }
        }
      }
    }
  }

  // パスファインディンググリッドの初期化
  initPathfindingGrid() {
    if (!this.mapData || !this.mapData.objectPlacement) return;
    
    // パスファインディンググリッドの初期化
    this.pathfindingGrid = [];
    
    for (let y = 0; y < this.height; y++) {
      this.pathfindingGrid[y] = [];
      
      for (let x = 0; x < this.width; x++) {
        // 高さが0.3未満（水や溶岩）は通行不可
        const isWaterOrLava = this.mapData.heightMap && this.mapData.heightMap[y][x] < 0.3;
        
        // objectPlacement: 0は移動可能、3は壁/障害物
        // pathfindingGrid: 0は通行可能、1は通行不可
        if (isWaterOrLava || this.mapData.objectPlacement[y][x] === 3) {
          this.pathfindingGrid[y][x] = 1; // 通行不可
        } else {
          this.pathfindingGrid[y][x] = 0; // 通行可能
        }
      }
    }
  }

  // パスファインディンググリッドの更新
  updatePathfindingGrid(x, y, walkable) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height && this.pathfindingGrid) {
      this.pathfindingGrid[y][x] = walkable ? 0 : 1;
    }
  }

  // 経路探索（A*アルゴリズム）
  findPath(startX, startY, endX, endY) {
    // パスファインディンググリッドがなければ初期化
    if (!this.pathfindingGrid) {
      this.initPathfindingGrid();
    }
    
    // 開始または終了位置が範囲外
    if (startX < 0 || startX >= this.width || startY < 0 || startY >= this.height ||
        endX < 0 || endX >= this.width || endY < 0 || endY >= this.height) {
      return null;
    }
    
    // 終了位置が通行不可能
    if (this.pathfindingGrid[endY][endX] !== 0) {
      return null;
    }
    
    // ヒューリスティック関数（マンハッタン距離）
    const heuristic = (x1, y1, x2, y2) => {
      return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    };
    
    // オープンリストとクローズドリスト
    const openList = [];
    const closedList = {};
    const cameFrom = {};
    
    // コスト
    const gScore = {};
    const fScore = {};
    
    // 開始位置の初期化
    const startKey = `${startX},${startY}`;
    gScore[startKey] = 0;
    fScore[startKey] = heuristic(startX, startY, endX, endY);
    
    // 開始位置をオープンリストに追加
    openList.push({
      x: startX,
      y: startY,
      f: fScore[startKey]
    });
    
    // メインループ
    while (openList.length > 0) {
      // fスコアが最小のノードを取得
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift();
      const currentKey = `${current.x},${current.y}`;
      
      // 目的地に到達
      if (current.x === endX && current.y === endY) {
        // パスを再構築
        return this.reconstructPath(cameFrom, current);
      }
      
      // クローズドリストに追加
      closedList[currentKey] = true;
      
      // 隣接ノードを探索
      const neighbors = this.getNeighbors(current.x, current.y);
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        // 既に探索済み
        if (closedList[neighborKey]) {
          continue;
        }
        
        // 現在のノードからの仮のgスコア
        const tentativeGScore = gScore[currentKey] + 1;
        
        // オープンリストになければ追加
        const neighborInOpen = openList.find(
          node => node.x === neighbor.x && node.y === neighbor.y
        );
        
        if (!neighborInOpen) {
          openList.push({
            x: neighbor.x,
            y: neighbor.y,
            f: tentativeGScore + heuristic(neighbor.x, neighbor.y, endX, endY)
          });
        } 
        // 既にオープンリストにあるがより良い経路が見つかった
        else if (tentativeGScore < (gScore[neighborKey] || Infinity)) {
          neighborInOpen.f = tentativeGScore + heuristic(neighbor.x, neighbor.y, endX, endY);
        } else {
          // このノードを探索しない
          continue;
        }
        
        // このノードへの最良の経路を記録
        cameFrom[neighborKey] = { x: current.x, y: current.y };
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + heuristic(neighbor.x, neighbor.y, endX, endY);
      }
    }
    
    // パスが見つからなかった
    return null;
  }

  // 隣接ノードの取得
  getNeighbors(x, y) {
    const neighbors = [];
    
    // 上下左右の4方向
    const directions = [
      { dx: 0, dy: -1 }, // 上
      { dx: 1, dy: 0 },  // 右
      { dx: 0, dy: 1 },  // 下
      { dx: -1, dy: 0 }  // 左
    ];
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      // マップ範囲内かつ通行可能
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && 
          this.pathfindingGrid && this.pathfindingGrid[ny][nx] === 0) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    
    return neighbors;
  }

  // パスの再構築
  reconstructPath(cameFrom, current) {
    const path = [];
    let currentNode = current;
    
    // 開始位置まで遡る
    while (currentNode) {
      path.unshift({
        x: currentNode.x,
        y: currentNode.y
      });
      
      const key = `${currentNode.x},${currentNode.y}`;
      currentNode = cameFrom[key];
    }
    
    return path;
  }

  // TopDownMap-Updated.jsの続き - 座標変換とエンティティ管理

  // タイル座標がマップ範囲内かチェック
  isValidTile(tileX, tileY) {
    return tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height;
  }

  // ワールド座標からタイル座標への変換
  worldToTileXY(worldX, worldY) {
    // トップダウン座標からタイル座標への変換（単純に除算）
    const tileX = Math.floor(worldX / this.tileSize);
    const tileY = Math.floor(worldY / this.tileSize);
    
    return { x: tileX, y: tileY };
  }

  // タイル座標からワールド座標への変換
  tileToWorldXY(tileX, tileY) {
    // タイル座標からトップダウン座標への変換（単純に乗算し、中心に調整）
    const worldX = tileX * this.tileSize + this.tileSize / 2;
    const worldY = tileY * this.tileSize + this.tileSize / 2;
    
    return { x: worldX, y: worldY };
  }

  // エンティティの追加
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }

  // エンティティの削除
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }

  // マップ上に物体が存在するか確認
  hasEntityAt(tileX, tileY) {
    // プレイヤー
    if (this.scene.player) {
      const playerTile = this.worldToTileXY(this.scene.player.x, this.scene.player.y);
      if (playerTile.x === tileX && playerTile.y === tileY) {
        return true;
      }
    }
    
    // 敵
    if (this.scene.enemies) {
      for (const enemy of this.scene.enemies) {
        const enemyTile = this.worldToTileXY(enemy.x, enemy.y);
        if (enemyTile.x === tileX && enemyTile.y === tileY) {
          return true;
        }
      }
    }
    
    // NPC
    if (this.scene.npcs) {
      for (const npc of this.scene.npcs) {
        const npcTile = this.worldToTileXY(npc.x, npc.y);
        if (npcTile.x === tileX && npcTile.y === tileY) {
          return true;
        }
      }
    }
    
    // アイテム
    if (this.scene.items) {
      for (const item of this.scene.items) {
        const itemTile = this.worldToTileXY(item.x, item.y);
        if (itemTile.x === tileX && itemTile.y === tileY) {
          return true;
        }
      }
    }
    
    return false;
  }

  // マップ上の特定位置にあるエンティティを取得
  getEntityAt(tileX, tileY) {
    // プレイヤー
    if (this.scene.player) {
      const playerTile = this.worldToTileXY(this.scene.player.x, this.scene.player.y);
      if (playerTile.x === tileX && playerTile.y === tileY) {
        return this.scene.player;
      }
    }
    
    // 敵
    if (this.scene.enemies) {
      for (const enemy of this.scene.enemies) {
        const enemyTile = this.worldToTileXY(enemy.x, enemy.y);
        if (enemyTile.x === tileX && enemyTile.y === tileY) {
          return enemy;
        }
      }
    }
    
    // NPC
    if (this.scene.npcs) {
      for (const npc of this.scene.npcs) {
        const npcTile = this.worldToTileXY(npc.x, npc.y);
        if (npcTile.x === tileX && npcTile.y === tileY) {
          return npc;
        }
      }
    }
    
    // アイテム
    if (this.scene.items) {
      for (const item of this.scene.items) {
        const itemTile = this.worldToTileXY(item.x, item.y);
        if (itemTile.x === tileX && itemTile.y === tileY) {
          return item;
        }
      }
    }
    
    return null;
  }

  /**
   * 特定のタイル座標のタイルデータを取得
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   * @returns {Object} タイルデータ（タイルの種類や高さなど）
   */
  getTileData(tileX, tileY) {
    // マップ範囲内かチェック
    if (!this.isValidTile(tileX, tileY)) {
      return null;
    }
    
    try {
      // 高さデータ
      const heightValue = this.mapData.heightMap[tileY][tileX];
      
      // オブジェクトタイプ
      const objectType = this.mapData.objectPlacement[tileY][tileX];
      
      // 地形タイプを決定
      let terrainType;
      if (heightValue < 0.3) {
        terrainType = 'water';
      } else if (heightValue < 0.5) {
        terrainType = 'grass';
      } else if (heightValue < 0.7) {
        terrainType = 'dirt';
      } else if (heightValue < 0.85) {
        terrainType = 'stone';
      } else {
        terrainType = 'snow';
      }
      
      // オブジェクトタイプに基づく名前
      let objectName = null;
      let objectKey = null;
      
      if (objectType === 2) {
        objectName = 'chest';
        objectKey = 'item_chest';
      } else if (objectType === 3) {
        // 実際に配置されたオブジェクトのタイプを取得
        // 統合タイルセットを使用している場合、これは推測になる
        const tileIndex = this.objectLayer?.getTileAt(tileX, tileY)?.index || -1;
        
        if (tileIndex >= 0 && this.integratedTilesets) {
          // インデックスから障害物タイプを推測
          const obstacleMapping = {
            0: 'wall',
            2: 'tree',
            3: 'rock',
            4: 'bush',
            5: 'crate'
          };
          
          objectName = obstacleMapping[tileIndex] || 'wall';
          objectKey = objectName === 'wall' ? 'tile_wall' : `obstacle_${objectName}`;
        } else {
          objectName = 'wall';
          objectKey = 'tile_wall';
        }
      }
      
      // 通行可能かどうか
      let walkable = this.isWalkableAt(tileX, tileY);
      
      return {
        x: tileX,
        y: tileY,
        height: heightValue,
        terrainType: terrainType,
        objectType: objectType,
        objectName: objectName,
        walkable: walkable,
        terrainKey: `tile_${terrainType}`,
        objectKey: objectKey
      };
    } catch (e) {
      console.warn(`Error getting tile data at ${tileX},${tileY}: ${e.message}`);
      return null;
    }
  }



  /**
   * 指定された座標がマップの境界内にあるかどうかを判定します
   * @param {number} x - 検証するX座標
   * @param {number} y - 検証するY座標
   * @returns {boolean} 境界内にある場合はtrue、境界外の場合はfalse
   */
  isInBounds(x, y) {
    // マップのサイズを取得
    if (!this.map) return false;
    
    // タイルマップのピクセルサイズを取得
    const mapWidth = this.width * this.tileSize;
    const mapHeight = this.height * this.tileSize;
    
    // 境界チェック
    return (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight);
  }

  /**
   * 指定された座標が障害物（衝突タイル）と衝突するかどうかを判定します
   * @param {number} x - 検証するX座標
   * @param {number} y - 検証するY座標
   * @returns {boolean} 衝突する場合はtrue、衝突しない場合はfalse
   */
  isColliding(x, y) {
    if (!this.map || !this.objectLayer) return false;
    
    // 座標をタイル座標に変換
    const tilePos = this.worldToTileXY(x, y);
    
    // 障害物レイヤーでタイルが存在するか確認
    const tile = this.objectLayer.getTileAt(tilePos.x, tilePos.y);
    
    // タイルが存在し、そのタイルが衝突プロパティを持っている場合は衝突と判断
    return tile !== null && tile.collides;
  }

  // 使用可能なタイルのランダムな位置を取得
  getRandomWalkablePosition() {
    if (!this.mapData || !this.mapData.objectPlacement) return { x: 0, y: 0 };
    
    // 試行回数制限（無限ループ防止）
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const tileX = Math.floor(Math.random() * this.width);
      const tileY = Math.floor(Math.random() * this.height);
      
      if (this.isWalkableAt(tileX, tileY)) {
        return { x: tileX, y: tileY };
      }
      
      attempts++;
    }
    
    // 見つからなかった場合はマップの中央付近で探す
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    
    for (let y = centerY - 5; y <= centerY + 5; y++) {
      for (let x = centerX - 5; x <= centerX + 5; x++) {
        if (this.isWalkableAt(x, y)) {
          return { x, y };
        }
      }
    }
    
    // それでも見つからない場合は(0,0)を返す
    console.warn('No walkable position found, returning (0,0)');
    return { x: 0, y: 0 };
  }

  // タイル座標が通行可能かチェック
  isWalkableAt(tileX, tileY) {
    // 範囲チェック
    if (!this.isValidTile(tileX, tileY)) {
      return false;
    }
    
    // 高さマップで通行不可を判定（水や溶岩）
    if (this.mapData && this.mapData.heightMap && this.mapData.heightMap[tileY][tileX] < 0.3) {
      return false;
    }
    
    // 通行可能かチェック（pathfindingGridがない場合はobjectPlacementを使用）
    if (this.pathfindingGrid) {
      return this.pathfindingGrid[tileY][tileX] === 0;
    } else if (this.mapData && this.mapData.objectPlacement) {
      return this.mapData.objectPlacement[tileY][tileX] !== 3; // 3は壁
    }
    
    return false;
  }

  // マップを更新
  update() {
    // 統合タイルセットの場合の追加処理
    if (this.useIntegratedTilesets && this.integratedTilesets) {
      // 必要に応じて追加の更新処理
    }
  }
}