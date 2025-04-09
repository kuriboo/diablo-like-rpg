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

/**
 * TopDownMap - マップ管理クラス (AssetManager依存版)
 * AssetManagerを利用してタイルセットやアセットを管理
 */
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
    
    // タイルマップとレイヤー
    this.map = null;
    this.groundLayer = null;
    this.objectLayer = null;
    this.wallLayer = null;
    
    // パスファインディング用グリッド
    this.pathfindingGrid = null;
    
    // デバッグモードフラグの取得
    this.isDebugMode = isDebugMode || process.env.NODE_ENV !== 'production';
    
    // 初期化
    this.initAsync();
  }
  
  /**
   * 非同期初期化
   */
  async initAsync() {
    this.TileMaps = await getTilemapsClass();
    
    // AssetManagerの初期化確認
    if (this.scene && !AssetManager.initialized) {
      AssetManager.initialize(this.scene);
    }
    
    // マップデータがあれば生成を開始
    if (this.mapData) {
      this.createMap();
      this.initPathfindingGrid();
    }
  }
  
  /**
   * マップデータの設定
   * @param {Object} mapData - マップデータ
   * @returns {TopDownMap} このインスタンス
   */
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
      this.wallLayer = null;
    }
    
    // 新しいマップを生成
    this.createMap();
    this.initPathfindingGrid();
    
    return this;
  }
  
  /**
   * マップの作成
   * @returns {TopDownMap} このインスタンス
   */
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
      
      // AssetManagerを使用して統合タイルセットを取得
      const tilesets = this.getTilesetsFromAssetManager();
      
      // タイルセットを使用してマップを作成
      this.createMapWithTilesets(tilesets);
      
      // 衝突判定の設定
      if (this.scene.physics && this.scene.physics.world) {
        this.scene.physics.world.setBounds(0, 0, this.width * this.tileSize, this.height * this.tileSize);
        
        // オブジェクトレイヤーに衝突判定を設定
        if (this.objectLayer) {
          this.scene.physics.world.enable(this.objectLayer);
          this.objectLayer.setCollisionByExclusion([-1]); // -1は空タイル
        }
        
        // 壁レイヤーに衝突判定を設定（オブジェクトレイヤーと別の場合）
        if (this.wallLayer && this.wallLayer !== this.objectLayer) {
          this.scene.physics.world.enable(this.wallLayer);
          this.wallLayer.setCollisionByExclusion([-1]); // -1は空タイル
        }
      }
      
    } catch (e) {
      console.error('Error creating map:', e);
    }
    
    return this;
  }
  
  /**
   * AssetManagerからタイルセットを取得
   * @returns {Object} タイルセット情報
   */
  getTilesetsFromAssetManager() {
    try {
      // AssetManagerから統合タイルセット情報を取得
      const allTilesets = AssetManager.getAllTilesets();
      
      // AssetManagerが適切な値を返さない場合に備えたデフォルト値
      // キーがオブジェクトではなく文字列であることを確認
      const terrainKey = allTilesets && allTilesets.terrain && typeof allTilesets.terrain === 'string' 
        ? allTilesets.terrain : 'tileset_terrain';
      const objectsKey = allTilesets && allTilesets.objects && typeof allTilesets.objects === 'string' 
        ? allTilesets.objects : 'tileset_objects';
      const wallsKey = allTilesets && allTilesets.walls && typeof allTilesets.walls === 'string' 
        ? allTilesets.walls : 'tileset_walls';
      
      console.log('使用するタイルセットキー:', { terrainKey, objectsKey, wallsKey });
      
      // タイルセットが存在しているか確認
      if (!this.scene.textures.exists(terrainKey)) {
        console.warn(`地形タイルセットが見つかりません: ${terrainKey}`);
        // ここでデフォルトのタイルセットを作成することもできます
      }
      
      if (!this.scene.textures.exists(objectsKey)) {
        console.warn(`オブジェクトタイルセットが見つかりません: ${objectsKey}`);
        // ここでデフォルトのタイルセットを作成することもできます
      }
      
      if (!this.scene.textures.exists(wallsKey)) {
        console.warn(`壁タイルセットが見つかりません: ${wallsKey}`);
        // ここでデフォルトのタイルセットを作成することもできます
      }
      
      // タイルセットの作成を試みる
      let terrainTileset, objectsTileset, wallsTileset; // 壁タイルセットを追加
      
      try {
        terrainTileset = this.map.addTilesetImage(
          'terrain', // ソースタイルセット名（第1引数）
          terrainKey, // テクスチャキー（第2引数）
          this.tileSize,
          this.tileSize
        );
      } catch (e) {
        console.error(`地形タイルセットの追加に失敗: ${e.message}`);
        // フォールバックとして他のテクスチャを試す
        const fallbackKey = 'tile_grass';
        if (this.scene.textures.exists(fallbackKey)) {
          terrainTileset = this.map.addTilesetImage(
            'terrain_fallback',
            fallbackKey,
            this.tileSize,
            this.tileSize
          );
        }
      }
      
      try {
        objectsTileset = this.map.addTilesetImage(
          'objects', // ソースタイルセット名（第1引数）
          objectsKey, // テクスチャキー（第2引数）
          this.tileSize,
          this.tileSize
        );
      } catch (e) {
        console.error(`オブジェクトタイルセットの追加に失敗: ${e.message}`);
        // フォールバックとして他のテクスチャを試す
        const fallbackKey = 'tile_wall';
        if (this.scene.textures.exists(fallbackKey)) {
          objectsTileset = this.map.addTilesetImage(
            'objects_fallback',
            fallbackKey,
            this.tileSize,
            this.tileSize
          );
        }
      }
      
      // 壁タイルセットの追加
      try {
        wallsTileset = this.map.addTilesetImage(
          'walls', // ソースタイルセット名（第1引数）
          wallsKey, // テクスチャキー（第2引数）
          this.tileSize, 
          this.tileSize
        );
      } catch (e) {
        console.error(`壁タイルセットの追加に失敗: ${e.message}`);
        // フォールバックとして他のテクスチャを試す
        const fallbackKey = 'wall_stone';
        if (this.scene.textures.exists(fallbackKey)) {
          wallsTileset = this.map.addTilesetImage(
            'walls_fallback',
            fallbackKey,
            this.tileSize,
            this.tileSize
          );
        } else if (objectsTileset) {
          // オブジェクトタイルセットを壁タイルセットのフォールバックとして使用
          wallsTileset = objectsTileset;
        }
      }
      
      // デバッグ情報をコンソールに出力
      console.log('生成されたタイルセット:', {
        terrain: terrainTileset,
        objects: objectsTileset,
        walls: wallsTileset
      });
      
      // インデックスマッピングのデフォルト値
      const defaultIndices = {
        terrain: {
          water: 0,
          grass: 1,
          dirt: 2,
          sand: 3,
          stone: 4,
          snow: 5,
          lava: 6
        },
        objects: {
          wall: 0,
          chest: 1,
          tree: 2,
          rock: 3,
          bush: 4,
          crate: 5
        },
        walls: { // 壁タイルのインデックスを追加
          stone: 0,
          brick: 1,
          wood: 2,
          ice: 3,
          metal: 4
        }
      };
      
      // 通行可能性のデフォルト値
      const defaultWalkability = {
        terrain: {
          water: false,
          grass: true,
          dirt: true,
          sand: true,
          stone: true,
          snow: true,
          lava: false
        },
        objects: {
          wall: false,
          chest: false,
          tree: false,
          rock: false,
          bush: false,
          crate: false
        },
        walls: { // 壁タイルの通行可能性を追加
          stone: false,
          brick: false,
          wood: false,
          ice: false,
          metal: false
        }
      };
      
      return {
        terrain: terrainTileset,
        objects: objectsTileset,
        walls: wallsTileset, // 壁タイルセットを返り値に追加
        indices: allTilesets && allTilesets.indices ? allTilesets.indices : defaultIndices,
        walkability: allTilesets && allTilesets.walkability ? allTilesets.walkability : defaultWalkability
      };
    } catch (error) {
      console.error('タイルセット情報の取得に失敗:', error);
      
      // エラーが発生した場合はデフォルト値を返す
      return {
        terrain: null,
        objects: null,
        walls: null, // 壁タイルセットを追加
        indices: {
          terrain: {
            water: 0,
            grass: 1,
            dirt: 2,
            sand: 3,
            stone: 4,
            snow: 5,
            lava: 6
          },
          objects: {
            wall: 0,
            chest: 1,
            tree: 2,
            rock: 3,
            bush: 4,
            crate: 5
          },
          walls: { // 壁タイルのインデックスを追加
            stone: 0,
            brick: 1,
            wood: 2,
            ice: 3,
            metal: 4
          }
        },
        walkability: {
          terrain: {
            water: false,
            grass: true,
            dirt: true,
            sand: true,
            stone: true,
            snow: true,
            lava: false
          },
          objects: {
            wall: false,
            chest: false,
            tree: false,
            rock: false,
            bush: false,
            crate: false
          },
          walls: { // 壁タイルの通行可能性を追加
            stone: false,
            brick: false,
            wood: false,
            ice: false,
            metal: false
          }
        }
      };
    }
  }
  
  /**
   * タイルセットでマップを作成
   * @param {Object} tilesets - タイルセット情報
   */
  createMapWithTilesets(tilesets) {
    console.log('🔄 AssetManagerのタイルセットでマップを作成...');
    
    // タイルセットが有効かチェック
    if (!tilesets.terrain) {
      console.error('地形タイルセットの追加に失敗しました');
      return;
    }
    
    // レイヤーの作成
    try {
      this.groundLayer = this.map.createBlankLayer('ground', tilesets.terrain);
      
      // オブジェクトレイヤー（オブジェクトタイルセットがあれば）
      if (tilesets.objects) {
        this.objectLayer = this.map.createBlankLayer('objects', tilesets.objects);
      } else {
        // フォールバック: オブジェクトレイヤーも地形タイルセットを使用
        console.warn('オブジェクトタイルセットがないため、地形タイルセットを代用します');
        this.objectLayer = this.map.createBlankLayer('objects', tilesets.terrain);
      }
      
      // 壁レイヤーの作成（壁タイルセットがあれば）
      if (tilesets.walls) {
        this.wallLayer = this.map.createBlankLayer('walls', tilesets.walls);
      } else {
        // フォールバック：壁タイルセットがない場合はオブジェクトレイヤーを使用
        console.warn('壁タイルセットがないため、オブジェクトレイヤーを共用します');
        this.wallLayer = this.objectLayer;
      }
    } catch (error) {
      console.error('レイヤー作成エラー:', error);
      return;
    }
    
    // マップデータをもとにタイルを配置
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        try {
          // 高さデータに基づくタイルタイプの決定
          const heightValue = this.mapData.heightMap[x][y];
          
          if (heightValue === undefined) {
            console.log(`undefined heightValue at ${x},${y}`);
            continue;
          }
          
          // 高さ値から直接地形タイプを決定（AssetManagerに問題がある場合のフォールバック）
          let terrainType;
          let terrainIndex;
          
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
          
          // インデックスの取得
          terrainIndex = tilesets.indices.terrain[terrainType] !== undefined ? 
                         tilesets.indices.terrain[terrainType] : 0;
          
          // まずAssetManagerを試す
          try {
            const terrainInfo = AssetManager.getTerrainFromHeight(heightValue);
            if (terrainInfo && terrainInfo.index !== undefined) {
              terrainIndex = terrainInfo.index;
            }
          } catch (assetError) {
            console.warn(`AssetManager terrain error: ${assetError.message}, using fallback for ${x},${y}`);
          }
          
          // 地面レイヤーにタイルを配置
          if (this.groundLayer) {
            this.groundLayer.putTileAt(terrainIndex, x, y);
          }
          
          // オブジェクト配置情報
          const objectType = this.mapData.objectPlacement[x][y];
          
          if (objectType === undefined) {
            console.log(`undefined objectType at ${x},${y}`);
            continue;
          }
          
          // オブジェクトタイプが0でない場合（何かオブジェクトがある場合）
          if (objectType !== 0 && heightValue >= 0.3) {
            let objectInfo = null;
            let objectIndex = null;
            
            // オブジェクトタイプに応じて適切なレイヤーとインデックスを決定
            if (objectType === 1) { // 水
              // 水は通常地形レイヤーで表現され、既に処理済みなので何もしない
              continue;
            } else if (objectType === 2) { // 宝箱
              // 宝箱はオブジェクトレイヤーに配置
              try {
                objectInfo = AssetManager.getObjectInfo(objectType);
                if (objectInfo && objectInfo.index !== undefined) {
                  objectIndex = objectInfo.index;
                } else {
                  objectIndex = tilesets.indices.objects.chest !== undefined ? tilesets.indices.objects.chest : 1;
                }
                
                if (objectIndex !== null && this.objectLayer) {
                  this.objectLayer.putTileAt(objectIndex, x, y);
                  const tile = this.objectLayer.getTileAt(x, y);
                  if (tile) {
                    tile.setCollision(true);
                  }
                }
              } catch (assetError) {
                console.warn(`AssetManager object error: ${assetError.message}, using fallback for chest at ${x},${y}`);
              }
            } else if (objectType === 3) { // 障害物
              // 障害物はオブジェクトレイヤーに配置
              try {
                objectInfo = AssetManager.getObjectInfo(objectType);
                if (objectInfo && objectInfo.index !== undefined) {
                  objectIndex = objectInfo.index;
                } else {
                  objectIndex = tilesets.indices.objects.tree !== undefined ? tilesets.indices.objects.tree : 2;
                }
                
                if (objectIndex !== null && this.objectLayer) {
                  this.objectLayer.putTileAt(objectIndex, x, y);
                  const tile = this.objectLayer.getTileAt(x, y);
                  if (tile) {
                    tile.setCollision(true);
                  }
                }
              } catch (assetError) {
                console.warn(`AssetManager object error: ${assetError.message}, using fallback for obstacle at ${x},${y}`);
              }
            } else if (objectType === 4) { // 壁
              // 壁は壁レイヤーに配置
              try {
                // まずAssetManagerから壁情報を取得
                objectInfo = AssetManager.getObjectInfo(objectType);
                if (objectInfo && objectInfo.index !== undefined) {
                  objectIndex = objectInfo.index;
                } else {
                  // フォールバックインデックス
                  if (tilesets.indices.walls && tilesets.indices.walls.stone !== undefined) {
                    objectIndex = tilesets.indices.walls.stone;
                  } else if (tilesets.indices.objects && tilesets.indices.objects.wall !== undefined) {
                    objectIndex = tilesets.indices.objects.wall;
                  } else {
                    objectIndex = 0;
                  }
                }
                
                if (objectIndex !== null && this.wallLayer) {
                  this.wallLayer.putTileAt(objectIndex, x, y);
                  const tile = this.wallLayer.getTileAt(x, y);
                  if (tile) {
                    tile.setCollision(true);
                  }
                }
              } catch (assetError) {
                console.warn(`AssetManager object error: ${assetError.message}, using fallback for wall at ${x},${y}`);
              }
            }
          }
        } catch (e) {
          console.warn(`Error placing tile at ${x},${y}: ${e.message}`);
        }
      }
    }
    
    // レイヤーの深度を設定
    if (this.groundLayer) this.groundLayer.setDepth(0);
    if (this.objectLayer) this.objectLayer.setDepth(5);
    if (this.wallLayer && this.wallLayer !== this.objectLayer) this.wallLayer.setDepth(9);
    
    console.log('✅ マップ作成完了');
  }
  
  /**
   * パスファインディンググリッドの初期化
   */
  initPathfindingGrid() {
    if (!this.mapData || !this.mapData.objectPlacement) return;
    
    // パスファインディンググリッドの初期化
    this.pathfindingGrid = [];
    
    for (let x = 0; x < this.width; x++) {
      this.pathfindingGrid[x] = [];
      
      for (let y = 0; y < this.height; y++) {
        // 高さが0.3未満（水や溶岩）は通行不可
        const isWaterOrLava = this.mapData.heightMap && this.mapData.heightMap[x][y] < 0.3;
        
        // objectPlacement: 各値の意味
        // 0: 床（移動可能）
        // 1: 水（移動不可能）
        // 2: 宝箱（移動不可能）
        // 3: 障害物（移動不可能）
        // 4: 壁（移動不可能）
        
        // pathfindingGrid: 0は通行可能、1は通行不可
        if (isWaterOrLava || 
            this.mapData.objectPlacement[x][y] === 1 || // 水
            this.mapData.objectPlacement[x][y] === 2 || // 宝箱
            this.mapData.objectPlacement[x][y] === 3 || // 障害物
            this.mapData.objectPlacement[x][y] === 4) { // 壁
          this.pathfindingGrid[x][y] = 1; // 通行不可
        } else {
          this.pathfindingGrid[x][y] = 0; // 通行可能
        }
      }
    }
  }
  
  /**
   * パスファインディンググリッドの更新
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {boolean} walkable - 通行可能かどうか
   */
  updatePathfindingGrid(x, y, walkable) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height && this.pathfindingGrid) {
      this.pathfindingGrid[x][y] = walkable ? 0 : 1;
    }
  }
  
  /**
   * 経路探索（A*アルゴリズム）
   * @param {number} startX - 開始X座標
   * @param {number} startY - 開始Y座標
   * @param {number} endX - 終了X座標
   * @param {number} endY - 終了Y座標
   * @returns {Array|null} 経路またはnull
   */
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
    if (this.pathfindingGrid[endX][endY] !== 0) {
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

  /**
   * 隣接ノードの取得
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {Array} 隣接ノード
   */
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
          this.pathfindingGrid && this.pathfindingGrid[nx][ny] === 0) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    
    return neighbors;
  }

  /**
   * パスの再構築
   * @param {Object} cameFrom - 経路記録
   * @param {Object} current - 現在のノード
   * @returns {Array} 経路
   */
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

  /**
   * タイル座標がマップ範囲内かチェック
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   * @returns {boolean} 範囲内かどうか
   */
  isValidTile(tileX, tileY) {
    return tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height;
  }

  /**
   * ワールド座標からタイル座標への変換
   * @param {number} worldX - ワールドX座標
   * @param {number} worldY - ワールドY座標
   * @returns {Object} タイル座標
   */
  worldToTileXY(worldX, worldY) {
    // トップダウン座標からタイル座標への変換（単純に除算）
    const tileX = Math.floor(worldX / this.tileSize);
    const tileY = Math.floor(worldY / this.tileSize);
    
    return { x: tileX, y: tileY };
  }

  /**
   * タイル座標からワールド座標への変換
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   * @returns {Object} ワールド座標
   */
  tileToWorldXY(tileX, tileY) {
    // タイル座標からトップダウン座標への変換（単純に乗算し、中心に調整）
    const worldX = tileX * this.tileSize + this.tileSize / 2;
    const worldY = tileY * this.tileSize + this.tileSize / 2;
    
    return { x: worldX, y: worldY };
  }

  /**
   * マップ上に物体が存在するか確認
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   * @returns {boolean} 存在するかどうか
   */
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

  /**
   * 指定位置のエンティティを取得
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   * @returns {Object|null} エンティティまたはnull
   */
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
   * @returns {Object|null} タイルデータまたはnull
   */
  getTileData(tileX, tileY) {
    // マップ範囲内かチェック
    if (!this.isValidTile(tileX, tileY)) {
      return null;
    }
    
    try {
      // 高さデータ
      const heightValue = this.mapData.heightMap[tileX][tileY];
      
      // オブジェクトタイプ
      const objectType = this.mapData.objectPlacement[tileX][tileY];
      
      // AssetManagerを使って高さから地形情報を取得
      const terrainInfo = AssetManager.getTerrainFromHeight(heightValue);
      
      // オブジェクト情報を取得
      let objectInfo = null;
      if (objectType !== 0) {
        objectInfo = AssetManager.getObjectInfo(objectType);
      }
      
      // 通行可能かどうか
      let walkable = this.isWalkableAt(tileX, tileY);
      
      // オブジェクトタイプが4（壁）の場合の壁情報を設定
      let wallInfo = null;
      if (objectType === 4) {
        wallInfo = {
          type: objectInfo ? objectInfo.type : 'stone',
          key: objectInfo ? objectInfo.key : null
        };
      }
      
      return {
        x: tileX,
        y: tileY,
        height: heightValue,
        terrainType: terrainInfo ? terrainInfo.type : null,
        objectType: objectType,
        objectName: objectInfo ? objectInfo.type : null,
        wallInfo: wallInfo, // 壁情報を追加
        walkable: walkable,
        terrainKey: terrainInfo ? terrainInfo.key : null,
        objectKey: objectInfo ? objectInfo.key : null
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
    if (!this.map) return false;
    
    // 座標をタイル座標に変換
    const tilePos = this.worldToTileXY(x, y);
    
    // 障害物レイヤーでタイルが存在するか確認
    if (this.objectLayer) {
      const objectTile = this.objectLayer.getTileAt(tilePos.x, tilePos.y);
      if (objectTile !== null && objectTile.collides) {
        return true;
      }
    }
    
    // 壁レイヤーでタイルが存在するか確認（壁レイヤーが存在し、オブジェクトレイヤーとは別の場合）
    if (this.wallLayer && this.wallLayer !== this.objectLayer) {
      const wallTile = this.wallLayer.getTileAt(tilePos.x, tilePos.y);
      if (wallTile !== null && wallTile.collides) {
        return true;
      }
    }
    
    // 高さマップで水や溶岩の通行不可も確認
    if (this.mapData && this.mapData.heightMap) {
      const heightValue = this.mapData.heightMap[tilePos.x][tilePos.y];
      if (heightValue < 0.3) {
        return true; // 水や溶岩は通行不可
      }
    }
    
    // オブジェクトプレイスメントでも確認（宝箱や壁など）
    if (this.mapData && this.mapData.objectPlacement) {
      const objectType = this.mapData.objectPlacement[tilePos.x][tilePos.y];
      if (objectType === 1 || objectType === 2 || objectType === 3 || objectType === 4) {
        // 1=水、2=宝箱、3=障害物、4=壁 はすべて通行不可
        return true;
      }
    }
    
    return false;
  }

  /**
   * 使用可能なタイルのランダムな位置を取得
   * @returns {Object} 座標
   */
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
    
    for (let x = centerX - 5; x <= centerX + 5; x++) {
      for (let y = centerY - 5; y <= centerY + 5; y++) {
        if (this.isWalkableAt(x, y)) {
          return { x, y };
        }
      }
    }
    
    // それでも見つからない場合は(0,0)を返す
    console.warn('No walkable position found, returning (0,0)');
    return { x: 0, y: 0 };
  }

  /**
   * タイル座標が通行可能かチェック
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   * @returns {boolean} 通行可能かどうか
   */
  isWalkableAt(tileX, tileY) {
    // 範囲チェック
    if (!this.isValidTile(tileX, tileY)) {
      return false;
    }
    
    // 高さマップで通行不可を判定（水や溶岩）
    if (this.mapData && this.mapData.heightMap && this.mapData.heightMap[tileX][tileY] < 0.3) {
      return false;
    }
    
    // レイヤーに障害物があるかチェック
    if (this.objectLayer) {
      const objectTile = this.objectLayer.getTileAt(tileX, tileY);
      if (objectTile && objectTile.collides) {
        return false;
      }
    }
    
    // 壁レイヤーに障害物があるかチェック（壁レイヤーが存在し、オブジェクトレイヤーとは別の場合）
    if (this.wallLayer && this.wallLayer !== this.objectLayer) {
      const wallTile = this.wallLayer.getTileAt(tileX, tileY);
      if (wallTile && wallTile.collides) {
        return false;
      }
    }
    
    // 通行可能かチェック（pathfindingGridがない場合はobjectPlacementを使用）
    if (this.pathfindingGrid) {
      return this.pathfindingGrid[tileX][tileY] === 0;
    } else if (this.mapData && this.mapData.objectPlacement) {
      // 0以外は全て通行不可（1は水、2は宝箱、3は障害物、4は壁）
      return this.mapData.objectPlacement[tileX][tileY] === 0;
    }
    
    return false;
  }

  /**
   * オブジェクト（敵、NPC、アイテムなど）の配置
   * @returns {TopDownMap} このインスタンス
   */
  placeObjects() {
    if (!this.mapData) return this;
    
    // 既存の敵やNPCをクリア
    if (this.scene.enemies) {
      this.scene.enemies.forEach(enemy => {
        enemy.destroy();
      });
      this.scene.enemies = [];
    }
    
    if (this.scene.npcs) {
      this.scene.npcs.forEach(npc => {
        npc.destroy();
      });
      this.scene.npcs = [];
    }
    
    if (this.scene.items) {
      this.scene.items.forEach(item => {
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

  /**
   * 敵の配置
   */
  placeEnemies() {
    if (!this.scene.characterFactory || !this.mapData.enemyPlacement) return;
    
    // 敵配列の初期化
    if (!this.scene.enemies) this.scene.enemies = [];
    
    // MapGeneratorが生成したenemyPlacementデータを使用
    for (const enemyData of this.mapData.enemyPlacement) {
      if (!this.isWalkableAt(enemyData.x, enemyData.y)) {
        console.warn(`Enemy placement position not walkable: ${enemyData.x}, ${enemyData.y}`);
        continue; // 配置位置が歩行不可の場合はスキップ
      }
      
      // トップダウン座標の計算（マップエンジンが期待する順序でx,yを渡す）
      const worldPos = this.tileToWorldXY(enemyData.x, enemyData.y);
      
      // 敵の生成 - AssetManager/CharacterLoaderと連携
      const enemy = this.scene.characterFactory.createEnemy({
        x: worldPos.x,
        y: worldPos.y,
        level: enemyData.level || this.scene.gameData?.currentLevel || 1,
        enemyType: enemyData.type || 'skeleton',
        isBoss: enemyData.type === 'boss',
        isElite: enemyData.type === 'elite'
      });
      
      if (enemy) {
        // 敵がボスかどうかを設定
        if (enemyData.type === 'boss') {
          enemy.setScale(1.5);
          this.scene.boss = enemy;
        }
  
        enemy.setDepth(10);
        
        // シーンに追加
        this.scene.add.existing(enemy);
        
        // 敵リストに追加
        this.scene.enemies.push(enemy);
      }
    }
  }

  /**
   * NPCの配置
   */
  placeNPCs() {
    if (!this.scene.characterFactory || !this.mapData.npcPlacement) return;
    
    // NPC配列の初期化
    if (!this.scene.npcs) this.scene.npcs = [];
    
    // MapGeneratorが生成したnpcPlacementデータを使用
    for (const npcData of this.mapData.npcPlacement) {
      if (!this.isWalkableAt(npcData.x, npcData.y)) {
        console.warn(`NPC placement position not walkable: ${npcData.x}, ${npcData.y}`);
        continue; // 配置位置が歩行不可の場合はスキップ
      }
      
      // トップダウン座標の計算
      const worldPos = this.tileToWorldXY(npcData.x, npcData.y);
      
      // NPCの生成 - AssetManager/CharacterLoaderと連携
      const npc = this.scene.characterFactory.createNPC({
        x: worldPos.x,
        y: worldPos.y,
        type: npcData.type || 'villager',
        isShop: npcData.isShop || false,
        shopType: npcData.shopType,
        shopItems: npcData.items || [],
        dialogues: npcData.dialogues || []
      });
      
      if (npc) {
        // NPCのデプス設定
        npc.setDepth(10);
        
        // シーンに追加
        this.scene.add.existing(npc);
        
        // NPCリストに追加
        this.scene.npcs.push(npc);
      }
    }
  }

  /**
   * 宝箱とアイテムの配置
   */
  placeChestsAndItems() {
    if (!this.scene.itemFactory) return;
    
    // アイテム配列の初期化
    if (!this.scene.items) this.scene.items = [];
    
    // オブジェクト配置データから宝箱を探して配置
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        // MapGeneratorの仕様: 2は宝箱を表す
        if (this.mapData.objectPlacement[x][y] === 2 && this.mapData.heightMap[x][y] >= 0.3) {
          // トップダウン座標
          const worldPos = this.tileToWorldXY(x, y);
          
          // AssetManagerから宝箱のテクスチャキーを取得
          const texture = AssetManager.getTextureKey('item', 'chest');
          
          // 宝箱またはアイテムの生成
          const item = this.scene.itemFactory.createItem({
            scene: this.scene,
            x: worldPos.x,
            y: worldPos.y,
            texture: texture,
            type: 'chest',
            level: this.scene.gameData?.currentLevel || 1
          });
          
          if (item) {
            // シーンに追加
            this.scene.add.existing(item);
            
            // アイテムリストに追加
            this.scene.items.push(item);
          }
        }
      }
    }
  }

  /**
   * マップを更新
   */
  update() {
    // 将来的な拡張のための予約
  }
}