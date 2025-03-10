export default class IsometricMap {
    constructor(scene, mapData, tileSize = { width: 64, height: 32 }) {
      this.scene = scene;
      this.mapData = mapData;
      this.tileSize = tileSize;
      
      // マップサイズ
      this.width = mapData.terrain[0].length;
      this.height = mapData.terrain.length;
      
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
      
      // パスファインディンググリッドの初期化
      this.initPathfindingGrid();
    }
    
    // マップの作成
    create() {
      this.createTerrainTiles();
      return this;
    }
    
    // 地形タイルの作成
    createTerrainTiles() {
      // 2Dタイルのアイソメトリック投影座標に変換しながら配置
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const tileType = this.mapData.terrain[y][x];
          const tileTexture = `tile_${this.terrainTilesets[tileType]}`;
          
          // アイソメトリック座標での位置
          const isoX = (x - y) * this.tileSize.width / 2;
          const isoY = (x + y) * this.tileSize.height / 2;
          
          // タイルの作成
          const tile = this.scene.add.isoSprite(
            isoX, isoY, 0, // x, y, z
            tileTexture
          );
          
          // タイルのプロパティ設定
          tile.tileX = x;
          tile.tileY = y;
          tile.tileType = tileType;
          tile.walkable = this.mapData.walkable[y][x];
          
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
      this.depthSort();
    }
    
    // タイルのクリックイベント
    onTileClicked(tile, pointer) {
      // 右クリックの場合
      if (pointer.rightButtonDown()) {
        // プレイヤーのみアクセス可能
        const player = this.scene.player;
        
        if (player && !player.isPerformingAction && tile.walkable) {
          // クリックされたタイルのワールド座標
          const worldX = tile.tileX * this.tileSize.width;
          const worldY = tile.tileY * this.tileSize.height;
          
          // 移動先タイルがプレイヤーの現在位置と同じでなければ移動
          const playerTileX = Math.floor(player.x / this.tileSize.width);
          const playerTileY = Math.floor(player.y / this.tileSize.height);
          
          if (playerTileX !== tile.tileX || playerTileY !== tile.tileY) {
            // パスファインディングで経路探索
            const path = this.findPath(
              playerTileX, playerTileY,
              tile.tileX, tile.tileY
            );
            
            if (path && path.length > 0) {
              // 移動アクションの実行
              this.scene.movePlayerAlongPath(path);
            }
          }
        }
      }
      
      // イベント発火
      this.scene.events.emit('tile-clicked', {
        tile: tile,
        x: tile.tileX,
        y: tile.tileY,
        button: pointer.button
      });
    }
    
    // オブジェクトの配置
    placeObjects() {
      // マップデータ内のオブジェクトを配置
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const objectType = this.mapData.objects[y][x];
          
          // オブジェクトがある場合のみ処理
          if (objectType === 0) continue;
          
          // アイソメトリック座標
          const isoX = (x - y) * this.tileSize.width / 2;
          const isoY = (x + y) * this.tileSize.height / 2;
          
          // オブジェクトタイプに応じた処理
          switch (objectType) {
            case 1: // 敵
              this.placeEnemy(x, y, isoX, isoY);
              break;
            case 2: // 宝箱
              this.placeChest(x, y, isoX, isoY);
              break;
            case 3: // 障害物
              this.placeObstacle(x, y, isoX, isoY);
              break;
            case 4: // NPC
              this.placeNPC(x, y, isoX, isoY, false);
              break;
            case 9: // ショップNPC
              this.placeNPC(x, y, isoX, isoY, true);
              break;
            case 10: // ボス敵
              this.placeBoss(x, y, isoX, isoY);
              break;
          }
        }
      }
      
      return this;
    }
    
    // 敵の配置
    placeEnemy(x, y, isoX, isoY) {
      if (!this.scene.characterFactory) return;
      
      // 敵の生成
      const enemy = this.scene.characterFactory.createEnemy({
        x: x * this.tileSize.width,
        y: y * this.tileSize.height,
        level: this.scene.level,
        difficulty: this.scene.difficulty
      });
      
      if (enemy) {
        // 敵の位置をアイソメトリック座標に調整
        enemy.setPosition(isoX, isoY);
        
        // シーンに追加
        this.scene.add.existing(enemy);
        
        // 敵リストに追加
        if (!this.scene.enemies) this.scene.enemies = [];
        this.scene.enemies.push(enemy);
        
        // デプスソート用配列に追加
        this.depthSortedObjects.push(enemy);
      }
    }
    
    // ボス敵の配置
    placeBoss(x, y, isoX, isoY) {
      if (!this.scene.characterFactory || !this.mapData.boss) return;
      
      // ボスの生成
      const boss = this.scene.characterFactory.createEnemy({
        x: x * this.tileSize.width,
        y: y * this.tileSize.height,
        level: this.mapData.boss.level,
        difficulty: this.scene.difficulty,
        enemyType: 'boss'
      });
      
      if (boss) {
        // ボスの位置をアイソメトリック座標に調整
        boss.setPosition(isoX, isoY);
        
        // サイズ調整
        boss.setScale(1.5);
        
        // シーンに追加
        this.scene.add.existing(boss);
        
        // 敵リストに追加
        if (!this.scene.enemies) this.scene.enemies = [];
        this.scene.enemies.push(boss);
        
        // ボス参照の保存
        this.scene.boss = boss;
        
        // デプスソート用配列に追加
        this.depthSortedObjects.push(boss);
      }
    }
    
    // 宝箱の配置
    placeChest(x, y, isoX, isoY) {
      if (!this.scene.itemFactory) return;
      
      // 宝箱の生成
      const chest = this.scene.itemFactory.createChest({
        x: x * this.tileSize.width,
        y: y * this.tileSize.height,
        level: this.scene.level,
        difficulty: this.scene.difficulty
      });
      
      if (chest) {
        // 宝箱の位置をアイソメトリック座標に調整
        chest.setPosition(isoX, isoY);
        
        // シーンに追加
        this.scene.add.existing(chest);
        
        // アイテムリストに追加
        if (!this.scene.items) this.scene.items = [];
        this.scene.items.push(chest);
        
        // デプスソート用配列に追加
        this.depthSortedObjects.push(chest);
      }
    }
    
    // 障害物の配置
    placeObstacle(x, y, isoX, isoY) {
      // 障害物のタイプをランダムに選択
      const obstacleTypes = ['rock', 'tree', 'bush', 'crate'];
      const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      // テクスチャ名
      const textureName = `obstacle_${obstacleType}`;
      
      // 障害物の作成
      const obstacle = this.scene.add.isoSprite(
        isoX, isoY, 0, // x, y, z
        textureName
      );
      
      // プロパティ設定
      obstacle.tileX = x;
      obstacle.tileY = y;
      obstacle.walkable = false;
      
      // デプスソート用配列に追加
      this.depthSortedObjects.push(obstacle);
      
      // 衝突情報の更新
      this.mapData.walkable[y][x] = false;
      this.updatePathfindingGrid(x, y, false);
    }
    
    // NPCの配置
    placeNPC(x, y, isoX, isoY, isShop = false) {
      if (!this.scene.characterFactory) return;
      
      // NPCの生成
      const npc = this.scene.characterFactory.createNPC({
        x: x * this.tileSize.width,
        y: y * this.tileSize.height,
        isShop: isShop
      });
      
      if (npc) {
        // NPCの位置をアイソメトリック座標に調整
        npc.setPosition(isoX, isoY);
        
        // シーンに追加
        this.scene.add.existing(npc);
        
        // NPCリストに追加
        if (!this.scene.npcs) this.scene.npcs = [];
        this.scene.npcs.push(npc);
        
        // デプスソート用配列に追加
        this.depthSortedObjects.push(npc);
      }
    }
    
    // パスファインディンググリッドの初期化
    initPathfindingGrid() {
      // EasyStar.js用のグリッド
      this.pathfindingGrid = [];
      
      for (let y = 0; y < this.height; y++) {
        this.pathfindingGrid[y] = [];
        
        for (let x = 0; x < this.width; x++) {
          // 0: 通行可能、1: 通行不可
          this.pathfindingGrid[y][x] = this.mapData.walkable[y][x] ? 0 : 1;
        }
      }
    }
    
    // パスファインディンググリッドの更新
    updatePathfindingGrid(x, y, walkable) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.pathfindingGrid[y][x] = walkable ? 0 : 1;
      }
    }
    
    // A*アルゴリズムによるパスファインディング
    findPath(startX, startY, endX, endY) {
      // シンプルなA*実装
      
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
            this.pathfindingGrid[ny][nx] === 0) {
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
    depthSort() {
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
    
    // タイル座標からワールド座標への変換
    tileToWorldXY(tileX, tileY) {
      return {
        x: tileX * this.tileSize.width,
        y: tileY * this.tileSize.height
      };
    }
    
    // ワールド座標からタイル座標への変換
    worldToTileXY(worldX, worldY) {
      return {
        x: Math.floor(worldX / this.tileSize.width),
        y: Math.floor(worldY / this.tileSize.height)
      };
    }
    
    // ワールド座標がマップ内かつ通行可能かチェック
    isWalkableAt(worldX, worldY) {
      const { x: tileX, y: tileY } = this.worldToTileXY(worldX, worldY);
      
      // マップ範囲内かチェック
      if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
        return false;
      }
      
      // 通行可能かチェック
      return this.mapData.walkable[tileY][tileX];
    }
    
    // デプスソート用オブジェクトの追加
    addToDepthSortedObjects(object) {
      this.depthSortedObjects.push(object);
      this.depthSort();
    }
    
    // デプスソート用オブジェクトの削除
    removeFromDepthSortedObjects(object) {
      const index = this.depthSortedObjects.indexOf(object);
      if (index !== -1) {
        this.depthSortedObjects.splice(index, 1);
      }
    }
    
    // 更新処理
    update() {
      // デプスソート
      this.depthSort();
    }
}