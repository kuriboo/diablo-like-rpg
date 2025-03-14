import Phaser from 'phaser';

export default class IsometricMap {
  constructor(options = {}) {
    this.scene = options.scene;
    this.mapData = options.mapData || null;
    this.tileSize = options.tileSize || { width: 64, height: 32 };
    
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
    
    // タイルグループ
    this.tileGroup = null;
    
    // デプスソート用オブジェクト配列
    this.depthSortedObjects = [];
    
    // パスファインディング用グリッド
    this.pathfindingGrid = null;
    
    // アイソメトリックプラグイン
    this.isometricPlugin = null;
    this.iso = null;
    
    // 初期化
    this.init();
  }
  
  // 初期化
  init() {
    // アイソメトリックプラグインのセットアップ
    if (this.scene.plugins.get('IsometricPlugin')) {
      this.isometricPlugin = this.scene.plugins.get('IsometricPlugin');
      this.iso = this.isometricPlugin.projector;
    } else {
      console.error('IsometricPlugin is not available');
      return;
    }
    
    // タイルグループの作成
    this.tileGroup = this.scene.add.group();
    
    // マップデータがあれば生成を開始
    if (this.mapData) {
      this.createTerrain();
      this.initPathfindingGrid();
    }
  }
  
  // マップデータの設定
  setMapData(mapData) {
    this.mapData = mapData;
    this.width = mapData.width;
    this.height = mapData.height;
    
    // 既存のタイルをクリア
    if (this.tileGroup) {
      this.tileGroup.clear(true, true);
    }
    
    // デプスソートオブジェクトから地形タイルを削除
    this.depthSortedObjects = this.depthSortedObjects.filter(obj => 
      !obj.isTile // タイル以外のオブジェクトだけを残す
    );
    
    // 地形生成とパスファインディング初期化
    this.createTerrain();
    this.initPathfindingGrid();
  }
  
  // 地形の生成
  createTerrain() {
    if (!this.mapData || !this.mapData.heightMap || !this.mapData.objectPlacement) {
      console.error('Invalid map data for terrain creation');
      return this;
    }
    
    // 2Dタイルのアイソメトリック投影座標に変換しながら配置
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // 高さデータに基づくタイルタイプの決定
        const heightValue = this.mapData.heightMap[y][x];
        const objectType = this.mapData.objectPlacement[y][x];
        
        // 高さ値からテクスチャを選択
        let tileTextureKey = this.getTextureFromHeight(heightValue);
        
        // オブジェクト配置情報に基づく調整
        // 0は移動可能、3は壁/障害物
        const isWalkable = objectType !== 3;
        
        // アイソメトリック座標での位置
        const isoX = (x - y) * this.tileSize.width / 2;
        const isoY = (x + y) * this.tileSize.height / 2;
        
        // Z座標（高さに応じて）
        const isoZ = heightValue * 10; // 高さを視覚化
        
        // タイルの作成
        const tile = this.scene.add.isoSprite(
          isoX, isoY, isoZ, // x, y, z
          tileTextureKey
        );
        
        // タイルのプロパティ設定
        tile.tileX = x;
        tile.tileY = y;
        tile.heightValue = heightValue;
        tile.objectType = objectType;
        tile.walkable = isWalkable;
        tile.isTile = true; // タイルフラグ
        
        // インタラクティブ設定
        tile.setInteractive();
        
        // クリックイベント
        tile.on('pointerdown', (pointer) => {
          this.onTileClicked(tile, pointer);
        });
        
        // タイルグループに追加
        this.tileGroup.add(tile);
        
        // デプスソート用配列に追加
        this.depthSortedObjects.push(tile);
      }
    }
    
    // 初期デプスソート
    this.updateDepthSorting();
    
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
  
  // タイルのクリックイベント
  onTileClicked(tile, pointer) {
    // イベント発火
    this.scene.events.emit('tile-clicked', {
      tile: tile,
      x: tile.tileX,
      y: tile.tileY,
      button: pointer.button
    });
  }
  
  // オブジェクト（敵、NPC、アイテムなど）の配置
  placeObjects() {
    if (!this.mapData) return this;
    
    // 既存の敵やNPCを配置する前にクリア
    if (this.scene.enemies) {
      this.scene.enemies.forEach(enemy => {
        this.removeFromDepthSortedObjects(enemy);
        enemy.destroy();
      });
      this.scene.enemies = [];
    }
    
    if (this.scene.npcs) {
      this.scene.npcs.forEach(npc => {
        this.removeFromDepthSortedObjects(npc);
        npc.destroy();
      });
      this.scene.npcs = [];
    }
    
    if (this.scene.items) {
      this.scene.items.forEach(item => {
        this.removeFromDepthSortedObjects(item);
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
      // アイソメトリック座標
      const isoX = (enemyData.x - enemyData.y) * this.tileSize.width / 2;
      const isoY = (enemyData.x + enemyData.y) * this.tileSize.height / 2;
      
      // 敵の生成
      const enemy = this.scene.characterFactory.createEnemy({
        scene: this.scene,
        x: isoX,
        y: isoY,
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
        
        // デプスソート用配列に追加
        this.addToDepthSortedObjects(enemy);
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
      // アイソメトリック座標
      const isoX = (npcData.x - npcData.y) * this.tileSize.width / 2;
      const isoY = (npcData.x + npcData.y) * this.tileSize.height / 2;
      
      // NPCの生成
      const npc = this.scene.characterFactory.createNPC({
        scene: this.scene,
        x: isoX,
        y: isoY,
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
        
        // デプスソート用配列に追加
        this.addToDepthSortedObjects(npc);
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
          // アイソメトリック座標
          const isoX = (x - y) * this.tileSize.width / 2;
          const isoY = (x + y) * this.tileSize.height / 2;
          
          // 宝箱またはアイテムの生成
          const item = this.scene.itemFactory.createItem({
            scene: this.scene,
            x: isoX,
            y: isoY,
            type: 'chest',
            level: this.scene.gameData?.currentLevel || 1
          });
          
          if (item) {
            // シーンに追加
            this.scene.add.existing(item);
            
            // アイテムリストに追加
            this.scene.items.push(item);
            
            // デプスソート用配列に追加
            this.addToDepthSortedObjects(item);
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
  
  // デプスソート（奥から手前に描画）
  updateDepthSorting() {
    if (!this.depthSortedObjects || this.depthSortedObjects.length === 0) return;
    
    // y座標でソート
    this.depthSortedObjects.sort((a, b) => {
      return (a.y - b.y) || (a.x - b.x);
    });
    
    // 深度の設定
    this.depthSortedObjects.forEach((obj, index) => {
      if (obj.setDepth) {
        obj.setDepth(index);
      }
    });
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
    // アイソメトリック座標からタイル座標への変換
    const tileX = Math.floor((worldX / (this.tileSize.width / 2) + worldY / (this.tileSize.height / 2)) / 2);
    const tileY = Math.floor((worldY / (this.tileSize.height / 2) - worldX / (this.tileSize.width / 2)) / 2);
    
    return { x: tileX, y: tileY };
  }
  
  // タイル座標からワールド座標への変換
  tileToWorldXY(tileX, tileY) {
    // タイル座標からアイソメトリック座標への変換
    const worldX = (tileX - tileY) * this.tileSize.width / 2;
    const worldY = (tileX + tileY) * this.tileSize.height / 2;
    
    return { x: worldX, y: worldY };
  }
  
  // ワールド座標からアイソメトリック座標への変換
  worldToIso(worldX, worldY) {
    if (this.iso) {
      return this.iso.unproject({ x: worldX, y: worldY });
    }
    
    // フォールバック（プラグインがない場合）
    return this.worldToTileXY(worldX, worldY);
  }
  
  // アイソメトリック座標からワールド座標への変換
  isoToWorld(isoX, isoY) {
    if (this.iso) {
      return this.iso.project({ x: isoX, y: isoY });
    }
    
    // フォールバック（プラグインがない場合）
    return this.tileToWorldXY(isoX, isoY);
  }
  
  // デプスソート用オブジェクトの追加
  addToDepthSortedObjects(object) {
    if (!this.depthSortedObjects.includes(object)) {
      this.depthSortedObjects.push(object);
    }
    this.updateDepthSorting();
  }
  
  // デプスソート用オブジェクトの削除
  removeFromDepthSortedObjects(object) {
    const index = this.depthSortedObjects.indexOf(object);
    if (index !== -1) {
      this.depthSortedObjects.splice(index, 1);
      this.updateDepthSorting();
    }
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
    return { x: 0, y: 0 };
  }
  
  // マップを更新
  update() {
    // マップのデプスソート
    this.updateDepthSorting();
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
}