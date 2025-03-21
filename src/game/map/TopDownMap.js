import PlaceholderAssets from '../../debug/PlaceholderAssets';
import { isDebugMode } from '../../debug';

export default class TopDownMap {
  constructor(options = {}) {
    this.scene = options.scene;
    this.mapData = options.mapData || null;
    
    // タイルサイズ（トップダウン向けに正方形に）
    this.tileSize = options.tileSize || 32;
    
    // マップサイズ
    this.width = this.mapData ? this.mapData.width : 50;
    this.height = this.mapData ? this.mapData.height : 50;
    
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
    
    // 初期化
    this.init();
  }
  
  // 初期化
  init() {
    // マップデータがあれば生成を開始
    if (this.mapData) {
      // デバッグモードではプレースホルダーを確保
      if (this.isDebugMode) {
        this.ensurePlaceholders();
      }
      this.createMap();
      this.initPathfindingGrid();
    }
  }
  
  // プレースホルダーを確保
  ensurePlaceholders() {
    // PlaceholderAssetsが初期化されていることを確認
    if (!PlaceholderAssets.initialized) {
      console.log('Initializing PlaceholderAssets for TopDownMap');
      PlaceholderAssets.initialize(this.scene);
    }
    
    // タイル用のプレースホルダーを確保
    const tileTypes = ['tile_water', 'tile_grass', 'tile_dirt', 'tile_sand', 'tile_stone', 'tile_snow', 'tile_lava'];
    
    tileTypes.forEach(tileType => {
      if (!this.scene.textures.exists(tileType)) {
        console.log(`Creating placeholder for ${tileType}`);
        // プレースホルダーを取得または生成
        this.getPlaceholderTexture(tileType);
      }
    });
  }
  
  // プレースホルダーテクスチャの取得/生成
  getPlaceholderTexture(tileType) {
    // テクスチャがすでに存在するか確認
    if (this.scene.textures.exists(tileType)) {
      return tileType;
    }
    
    // PlaceholderAssetsから対応するタイプのプレースホルダーを取得
    let color;
    switch (tileType) {
      case 'tile_water':
        color = 0x1E90FF; // ドジャーブルー
        break;
      case 'tile_grass':
        color = 0x3CB371; // ミディアムシーグリーン
        break;
      case 'tile_dirt':
        color = 0x8B4513; // サドルブラウン
        break;
      case 'tile_sand':
        color = 0xF4A460; // サンディブラウン
        break;
      case 'tile_stone':
        color = 0x708090; // スレートグレー
        break;
      case 'tile_snow':
        color = 0xFFFAFA; // スノー
        break;
      case 'tile_lava':
        color = 0xFF4500; // オレンジレッド
        break;
      default:
        color = 0x888888; // グレー
    }
    
    // PlaceholderAssetsの適切なメソッドを使用
    if (typeof PlaceholderAssets.createTileWithPattern === 'function') {
      // 直接対応するメソッドを呼び出し
      PlaceholderAssets.createTileWithPattern(this.scene, tileType, color);
    } else {
      // 汎用的なプレースホルダー生成メソッドを使用
      PlaceholderAssets.createColorRect(this.scene, tileType, this.tileSize, this.tileSize, color);
    }
    
    return tileType;
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
    
    // デバッグモードではプレースホルダーを確保
    if (this.isDebugMode) {
      this.ensurePlaceholders();
    }
    
    // 新しいマップを生成
    this.createMap();
    this.initPathfindingGrid();
  }
  
  // マップの作成
  createMap() {
    if (!this.mapData || !this.mapData.heightMap || !this.mapData.objectPlacement) {
      console.error('Invalid map data for map creation');
      return this;
    }
    
    try {
      // マップデータをPhaserのタイルマップに変換
      this.map = this.scene.make.tilemap({
        tileWidth: this.tileSize,
        tileHeight: this.tileSize,
        width: this.width,
        height: this.height
      });
      
      // タイルセットの作成（各タイプのタイルを登録）
      const tilesetKeys = [
        'tile_water', 'tile_grass', 'tile_dirt', 'tile_sand', 
        'tile_stone', 'tile_snow', 'tile_lava'
      ];
      
      // 実際に利用可能なtilesetを保持
      const tilesets = {};
      
      // デバッグモードの場合はプレースホルダーを使用
      if (this.isDebugMode) {
        for (const key of tilesetKeys) {
          // プレースホルダーを確保
          this.getPlaceholderTexture(key);
          
          try {
            const tileset = this.map.addTilesetImage(key, key, this.tileSize, this.tileSize);
            if (tileset) {
              tilesets[key] = tileset;
            }
          } catch (e) {
            console.warn(`Failed to add tileset ${key} in debug mode: ${e.message}`);
          }
        }
      } else {
        // 通常モードではアセットパイプラインから取得
        for (const key of tilesetKeys) {
          if (this.scene.textures.exists(key)) {
            try {
              const tileset = this.map.addTilesetImage(key, key, this.tileSize, this.tileSize);
              if (tileset) {
                tilesets[key] = tileset;
              }
            } catch (e) {
              console.warn(`Failed to add tileset ${key}: ${e.message}`);
            }
          }
        }
      }
      
      // tilesetが一つも作成できなかった場合のフォールバック
      if (Object.keys(tilesets).length === 0) {
        console.warn('No tilesets created, using fallback tileset');
        
        // フォールバックタイルセットの作成
        const fallbackKey = 'fallback_tile';
        this.scene.textures.createCanvas(fallbackKey, this.tileSize, this.tileSize);
        const ctx = this.scene.textures.getCanvas(fallbackKey).getContext('2d');
        ctx.fillStyle = '#888888';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(0, 0, this.tileSize, this.tileSize);
        this.scene.textures.refresh(fallbackKey);
        
        try {
          const fallbackTileset = this.map.addTilesetImage(fallbackKey, fallbackKey, this.tileSize, this.tileSize);
          tilesets[fallbackKey] = fallbackTileset;
        } catch (e) {
          console.error('Failed to create fallback tileset:', e);
          return this;
        }
      }
      
      // レイヤーの作成
      this.groundLayer = this.map.createBlankLayer('ground', Object.values(tilesets));
      this.objectLayer = this.map.createBlankLayer('objects', Object.values(tilesets));
      
      // タイルセットの取得
      const getActiveTileset = (textureKey) => {
        if (tilesets[textureKey]) {
          return tilesets[textureKey];
        }
        // フォールバック
        return Object.values(tilesets)[0];
      };
      
      // マップデータをもとにタイルを配置
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          try {
            // 高さデータに基づくタイルタイプの決定
            const heightValue = this.mapData.heightMap[y][x];
            const objectType = this.mapData.objectPlacement[y][x];
            
            // 高さ値からテクスチャを選択
            const tileTextureKey = this.getTextureFromHeight(heightValue);
            
            // 地面レイヤーにタイルを配置
            const groundTileset = getActiveTileset(tileTextureKey);
            const groundTileIndex = this.getTileIndexForType(tileTextureKey);
            
            if (this.groundLayer) {
              this.groundLayer.putTileAt(groundTileIndex, x, y);
            }
            
            // オブジェクト配置情報に基づく障害物配置
            if (objectType === 3) { // 3は壁/障害物
              const wallTextureKey = 'tile_stone';
              const wallTileset = getActiveTileset(wallTextureKey);
              const wallTileIndex = this.getTileIndexForType(wallTextureKey);
              
              if (this.objectLayer) {
                this.objectLayer.putTileAt(wallTileIndex, x, y);
                
                // 衝突判定を追加
                const tile = this.objectLayer.getTileAt(x, y);
                if (tile) {
                  tile.setCollision(true);
                }
              }
            } else if (objectType === 2) { // 2は宝箱
              const chestTextureKey = 'tile_snow';
              const chestTileset = getActiveTileset(chestTextureKey);
              const chestTileIndex = this.getTileIndexForType(chestTextureKey);
              
              if (this.objectLayer) {
                this.objectLayer.putTileAt(chestTileIndex, x, y);
              }
            }
          } catch (e) {
            console.warn(`Error placing tile at ${x},${y}: ${e.message}`);
          }
        }
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
  
  // 高さ値からテクスチャを決定
  getTextureFromHeight(heightValue) {
    if (heightValue < 0.3) {
      return 'tile_water'; // 低い地形（水域）
    } else if (heightValue < 0.5) {
      return 'tile_grass'; // 中程度の地形（草原）
    } else if (heightValue < 0.7) {
      return 'tile_dirt';  // 中高地形（土）
    } else if (heightValue < 0.85) {
      return 'tile_stone'; // 高地形（石）
    } else {
      return 'tile_snow';  // 最高地（雪）
    }
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
      'fallback_tile': 0 // フォールバック用
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
    
    // 全ての敵配置データを処理
    for (const enemyData of this.mapData.enemyPlacement) {
      // トップダウン座標
      const x = enemyData.x * this.tileSize + this.tileSize / 2;
      const y = enemyData.y * this.tileSize + this.tileSize / 2;
      
      // 敵の生成
      const enemy = this.scene.characterFactory.createEnemy({
        scene: this.scene,
        x: x,
        y: y,
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
    
    // 全てのNPC配置データを処理
    for (const npcData of this.mapData.npcPlacement) {
      // トップダウン座標
      const x = npcData.x * this.tileSize + this.tileSize / 2;
      const y = npcData.y * this.tileSize + this.tileSize / 2;
      
      // NPCの生成
      const npc = this.scene.characterFactory.createNPC({
        scene: this.scene,
        x: x,
        y: y,
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
        // 2は宝箱を表す
        if (this.mapData.objectPlacement[y][x] === 2) {
          // トップダウン座標
          const itemX = x * this.tileSize + this.tileSize / 2;
          const itemY = y * this.tileSize + this.tileSize / 2;
          
          // 宝箱またはアイテムの生成
          const item = this.scene.itemFactory.createItem({
            scene: this.scene,
            x: itemX,
            y: itemY,
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
        // objectPlacement: 0は移動可能、3は壁/障害物
        // pathfindingGrid: 0は通行可能、1は通行不可
        this.pathfindingGrid[y][x] = this.mapData.objectPlacement[y][x] === 3 ? 1 : 0;
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
  
  // タイル座標がマップ範囲内かチェック
  isValidTile(tileX, tileY) {
    return tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height;
  }
  
  // タイル座標が通行可能かチェック
  isWalkableAt(tileX, tileY) {
    // マップ範囲内かチェック
    if (!this.isValidTile(tileX, tileY)) {
      return false;
    }
    
    // 通行可能かチェック（pathfindingGridがない場合はobjectPlacementを使用）
    if (this.pathfindingGrid) {
      return this.pathfindingGrid[tileY][tileX] === 0;
    } else if (this.mapData && this.mapData.objectPlacement) {
      return this.mapData.objectPlacement[tileY][tileX] !== 3;
    }
    
    return false;
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
  
  // マップを更新
  update() {
    // トップダウンマップでは特に更新処理は必要ないが、
    // 必要に応じて拡張可能
  }
}