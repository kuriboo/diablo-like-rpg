/**
 * MapLoader.js - PlaceholderAssetsとの連携を強化したマップローダー
 * 
 * 障害物タイプ（tree, rock, bush, crate）やタイルの通行可能性を考慮して
 * TopDownMapが利用できるように変換する機能を提供します。
 */

import PlaceholderAssets from './PlaceholderAssets';
import TilesetGenerator from './TilesetGenerator';

class MapLoader {
  constructor() {
    // シングルトンの実装のため、インスタンスは一度だけ生成
    if (MapLoader.instance) {
      return MapLoader.instance;
    }
    
    // インスタンスをstaticプロパティに格納
    MapLoader.instance = this;
    
    this.scene = null;
    this.initialized = false;
    
    // タイルタイプとIDのマッピング
    this.tileMapping = {
      // 地形タイル
      'tile_water': 0, // 通行不可
      'tile_grass': 1,
      'tile_dirt': 2,
      'tile_sand': 3,
      'tile_stone': 4,
      'tile_snow': 5,
      'tile_lava': 6, // 通行不可
      
      // オブジェクトタイル
      'tile_wall': 0,
      'item_chest': 1,
      'obstacle_tree': 2,
      'obstacle_rock': 3,
      'obstacle_bush': 4,
      'obstacle_crate': 5
    };
    
    // タイルの通行可能性マッピング（true: 通行可能, false: 通行不可）
    this.tileWalkability = {
      'tile_water': false,
      'tile_grass': true,
      'tile_dirt': true,
      'tile_sand': true,
      'tile_stone': true,
      'tile_snow': true,
      'tile_lava': false,
      'tile_wall': false,
      'item_chest': false, // 通行不可（アイテム取得時に通行可能になる場合は、ゲームロジックで処理）
      'obstacle_tree': false,
      'obstacle_rock': false,
      'obstacle_bush': false,
      'obstacle_crate': false
    };
    
    // 生成されたタイルセットの情報
    this.tilesets = {
      terrain: null,
      objects: null
    };
  }
  
  /**
   * シングルトンインスタンスを取得
   * @returns {MapLoader} インスタンス
   */
  static getInstance() {
    if (!MapLoader.instance) {
      MapLoader.instance = new MapLoader();
    }
    return MapLoader.instance;
  }
  
  /**
   * 初期化処理
   * @param {Phaser.Scene} scene - Phaserシーン
   * @returns {boolean} 初期化が成功したかどうか
   */
  initialize(scene) {
    if (!scene || !scene.textures) {
      console.error('MapLoader: 有効なPhaserシーンが必要です');
      return false;
    }
    
    this.scene = scene;
    console.log('🗺️ MapLoader: 初期化開始...');
    
    // PlaceholderAssetsが初期化されていることを確認
    if (!PlaceholderAssets.initialized) {
      PlaceholderAssets.initialize(scene);
    }
    
    // TilesetGeneratorを初期化
    TilesetGenerator.initialize(scene);
    
    this.initialized = true;
    console.log('✅ MapLoader: 初期化完了');
    return true;
  }
  
  /**
   * タイルセットを準備
   * @returns {Object} 生成されたタイルセットの情報
   */
  prepareTilesets() {
    if (!this.initialized) {
      if (!this.initialize(this.scene)) {
        return null;
      }
    }
    
    console.log('🔄 タイルセットの準備...');
    
    // 地形タイルが存在するか確認
    const terrainTiles = [
      'tile_water', 'tile_grass', 'tile_dirt', 'tile_sand',
      'tile_stone', 'tile_snow', 'tile_lava'
    ];
    
    // オブジェクトタイルが存在するか確認
    const objectTiles = [
      'tile_wall', 'item_chest', 'obstacle_tree',
      'obstacle_rock', 'obstacle_bush', 'obstacle_crate'
    ];
    
    // 不足しているタイルをPlaceholderAssetsで生成
    this.ensureTilesExist(terrainTiles.concat(objectTiles));
    
    // タイルセットを生成
    this.tilesets = TilesetGenerator.generateAllTilesets({
      terrain: {
        tileKeys: terrainTiles,
        outputKey: 'tileset_terrain'
      },
      objects: {
        tileKeys: objectTiles,
        outputKey: 'tileset_objects'
      }
    });
    
    console.log('✅ タイルセット準備完了');
    return this.tilesets;
  }
  
  /**
   * 必要なタイルが存在することを確認
   * @param {string[]} tileKeys - 確認するタイルのキー配列
   */
  ensureTilesExist(tileKeys) {
    for (const key of tileKeys) {
      if (!this.scene.textures.exists(key)) {
        console.log(`🔍 タイル ${key} が不足しています。生成します...`);
        
        // PlaceholderAssetsを使ってタイルを生成
        if (key.startsWith('tile_')) {
          const tileType = key.replace('tile_', '');
          PlaceholderAssets.createTileWithPattern(this.scene, key, this.getTileColor(tileType));
        } else if (key === 'item_chest') {
          PlaceholderAssets.createChestItem(this.scene, key, 0x8B4513, false);
        } else if (key.startsWith('obstacle_')) {
          const obstacleType = key.replace('obstacle_', '');
          PlaceholderAssets.createObstacle(this.scene, key, this.getObstacleColor(obstacleType));
        }
        
        console.log(`✅ タイル ${key} を生成しました`);
      }
    }
  }
  
  /**
   * タイルタイプから色を取得
   * @param {string} tileType - タイルタイプ
   * @returns {number} 色（16進数）
   */
  getTileColor(tileType) {
    const tileColors = {
      'water': 0x1E90FF,
      'grass': 0x3CB371,
      'dirt': 0x8B4513,
      'sand': 0xF4A460,
      'stone': 0x708090,
      'snow': 0xFFFAFA,
      'lava': 0xFF4500,
      'wall': 0x808080
    };
    
    return tileColors[tileType] || 0x888888;
  }
  
  /**
   * 障害物タイプから色を取得
   * @param {string} obstacleType - 障害物タイプ
   * @returns {number} 色（16進数）
   */
  getObstacleColor(obstacleType) {
    const obstacleColors = {
      'tree': 0x228B22,    // フォレストグリーン
      'rock': 0x696969,    // ディムグレー
      'bush': 0x32CD32,    // ライムグリーン
      'crate': 0xCD853F    // ペルー
    };
    
    return obstacleColors[obstacleType] || 0x8B4513;
  }
  
  /**
   * TopDownMap用にマップデータを準備
   * @param {Object} mapData - 元のマップデータ
   * @returns {Object} 変換されたマップデータ
   */
  prepareMapData(mapData) {
    if (!this.tilesets.terrain || !this.tilesets.objects) {
      this.prepareTilesets();
    }
    
    console.log('🔄 マップデータ準備...');
    
    // マップデータのクローンを作成
    const preparedData = JSON.parse(JSON.stringify(mapData));
    
    // タイルセット情報を追加
    preparedData.tilesets = this.tilesets;
    
    // タイルマッピング情報を追加
    preparedData.tileMapping = this.tileMapping;
    
    // タイルの通行可能性情報を追加
    preparedData.tileWalkability = this.tileWalkability;
    
    // heightMapの高さ0.3未満のエリアを通行不可に設定
    this.adjustHeightMapForWalkability(preparedData);
    
    console.log('✅ マップデータ準備完了');
    return preparedData;
  }
  
  /**
   * 高さマップを通行可能性に基づいて調整
   * @param {Object} mapData - マップデータ
   */
  adjustHeightMapForWalkability(mapData) {
    if (!mapData.heightMap || !mapData.objectPlacement) return;
    
    console.log('🔄 高さマップを通行可能性に基づいて調整中...');
    
    // 高さマップを走査
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        // 高さが0.3未満のエリア（水や溶岩）は通行不可
        if (mapData.heightMap[y][x] < 0.3) {
          // objectPlacementを3（通行不可）に設定
          // MapGeneratorの値を尊重する場合は条件を調整
          if (mapData.objectPlacement[y][x] === 0) {
            mapData.objectPlacement[y][x] = 3;
          }
        }
      }
    }
    
    console.log('✅ 高さマップの調整完了');
  }
  
  /**
   * TopDownMapインスタンスに統合されたタイルセットを適用
   * @param {TopDownMap} topDownMap - TopDownMapインスタンス
   * @returns {boolean} 成功したかどうか
   */
  applyTilesetsToMap(topDownMap) {
    if (!topDownMap || !topDownMap.scene) {
      console.error('有効なTopDownMapインスタンスが必要です');
      return false;
    }
    
    if (!this.initialized) {
      this.initialize(topDownMap.scene);
    }
    
    if (!this.tilesets.terrain || !this.tilesets.objects) {
      this.prepareTilesets();
    }
    
    console.log('🔄 タイルセットをTopDownMapに適用...');
    
    try {
      // タイルセット情報をTopDownMapにアタッチ
      topDownMap.integratedTilesets = this.tilesets;
      topDownMap.tileWalkability = this.tileWalkability;
      
      // isWalkableAtメソッドを拡張して水と溶岩を通行不可に
      this.enhanceWalkabilityCheck(topDownMap);
      
      // TopDownMapのgetTextureFromHeight関数をオーバーライド
      const originalGetTextureFromHeight = topDownMap.getTextureFromHeight;
      topDownMap.getTextureFromHeight = (heightValue) => {
        // 元の関数から元のテクスチャキーを取得
        const originalKey = originalGetTextureFromHeight.call(topDownMap, heightValue);
        
        // 統合タイルセットのキーに変換
        return {
          key: this.tilesets.terrain.terrain,
          index: this.tileMapping[originalKey] || 0
        };
      };
      
      // オブジェクトタイプを障害物タイプに変換する関数を追加
      topDownMap.getObjectTexture = (objectType) => {
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
        
        // 統合タイルセット内のインデックスを取得
        return {
          key: this.tilesets.objects.objects,
          index: this.tileMapping[tileKey] || 0
        };
      };
      
      console.log('✅ タイルセットの適用完了');
      return true;
    } catch (error) {
      console.error('タイルセット適用エラー:', error);
      return false;
    }
  }
  
  /**
   * isWalkableAtメソッドを拡張して水と溶岩を通行不可に
   * @param {TopDownMap} topDownMap - TopDownMapインスタンス
   */
  enhanceWalkabilityCheck(topDownMap) {
    const originalIsWalkableAt = topDownMap.isWalkableAt;
    
    topDownMap.isWalkableAt = function(tileX, tileY) {
      // 範囲チェック
      if (!this.isValidTile(tileX, tileY)) {
        return false;
      }
      
      // 高さマップで通行不可を判定（水や溶岩）
      if (this.mapData && this.mapData.heightMap && this.mapData.heightMap[tileY][tileX] < 0.3) {
        return false;
      }
      
      // 元のメソッドを呼び出す
      return originalIsWalkableAt.call(this, tileX, tileY);
    };
  }
  
  /**
   * 統合タイルセットで生成されたタイルインデックスをもとのキーに戻す
   * @param {string} tilesetType - タイルセットタイプ ('terrain' または 'objects')
   * @param {number} index - タイルインデックス
   * @returns {string} 元のタイルキー
   */
  getTileKeyFromIndex(tilesetType, index) {
    const mapping = this.tileMapping;
    
    for (const [key, value] of Object.entries(mapping)) {
      if (tilesetType === 'terrain' && key.startsWith('tile_') && !key.includes('wall') && value === index) {
        return key;
      } else if (tilesetType === 'objects' && !key.startsWith('tile_grass') && value === index) {
        return key;
      }
    }
    
    return null;
  }
  
  /**
   * MapGeneratorのオブジェクトタイプコードを障害物タイプに変換
   * @param {number} objectTypeCode - MapGeneratorのオブジェクトタイプコード
   * @returns {string} 障害物タイプ
   */
  convertObjectTypeToObstacleType(objectTypeCode) {
    // MapGeneratorの値：0=空きスペース、2=宝箱、3=壁/障害物
    switch (objectTypeCode) {
      case 2:
        return 'item_chest';
      case 3:
        // ランダムな障害物タイプを選択
        const obstacleTypes = ['tile_wall', 'obstacle_tree', 'obstacle_rock', 'obstacle_bush', 'obstacle_crate'];
        return obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      default:
        return null; // 空きスペース
    }
  }
  
  /**
   * 現在のシーンを更新
   * @param {Phaser.Scene} scene - 新しいシーン
   */
  updateScene(scene) {
    if (!scene) return;
    
    this.scene = scene;
    
    if (!this.initialized) {
      this.initialize(scene);
    }
  }
  
  /**
   * 全てのデータをクリア（シングルトンを初期化）
   */
  clearAll() {
    this.tilesets = {
      terrain: null,
      objects: null
    };
    
    this.initialized = false;
  }
}

// シングルトンインスタンスをエクスポート
export default MapLoader.getInstance();

// 個別の関数としてもエクスポート
export const initialize = (scene) => MapLoader.getInstance().initialize(scene);
export const prepareTilesets = () => MapLoader.getInstance().prepareTilesets();
export const prepareMapData = (mapData) => MapLoader.getInstance().prepareMapData(mapData);
export const applyTilesetsToMap = (topDownMap) => MapLoader.getInstance().applyTilesetsToMap(topDownMap);