import { createNoise2D, createNoise3D } from 'simplex-noise';

// TensorFlowを動的にインポート
let tf = null;
if (typeof window !== 'undefined') {
  import('@tensorflow/tfjs').then(module => {
    tf = module;
  });
}

/**
 * マップ自動生成クラス
 * 様々なタイプのマップを生成します
 */
class MapGenerator {
  /**
   * マップジェネレーターを初期化
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      width: 100, // マップの幅
      height: 100, // マップの高さ
      seed: Math.random(), // 乱数シード
      tileSize: 64, // タイルサイズ
      noiseScale: 0.1, // ノイズスケール
      roomMinSize: 5, // 部屋の最小サイズ
      roomMaxSize: 15, // 部屋の最大サイズ
      roomCount: 10, // 部屋の数
      enemyDensity: 0.05, // 敵の密度
      chestDensity: 0.02, // 宝箱の密度
      obstacleDensity: 0.1, // 障害物の密度
      npcDensity: 0.01, // NPCの密度
      difficultyLevel: 'normal', // 難易度: normal, nightmare, hell
      ...options
    };
    
    // 乱数ジェネレーター
    this.rng = this.createRNG(this.options.seed);
    
    // ノイズジェネレーター
    this.noise2D = createNoise2D(this.rng);
    this.noise3D = createNoise3D(this.rng);
    
    // 地形データ
    this.heightMap = [];
    
    // オブジェクト配置データ
    this.objectPlacement = [];
    
    // 敵配置データ
    this.enemyPlacement = [];
    
    // NPC配置データ
    this.npcPlacement = [];
    
    // TensorFlowモデル（必要に応じて）
    this.tfModel = null;
    
    // 部屋データ（ダンジョン生成用）
    this.rooms = [];
    
    // 難易度に基づく設定を調整
    this.adjustDifficultySettings();
  }

  /**
   * 乱数ジェネレーターを作成
   * @param {number} seed - 乱数シード
   * @returns {function} 乱数生成関数
   */
  createRNG(seed) {
    const m = 0x80000000; // 2^31
    const a = 1103515245;
    const c = 12345;
    let state = seed ? seed : Math.floor(Math.random() * m);
    
    return function() {
      state = (a * state + c) % m;
      return state / m;
    };
  }

  /**
   * 難易度設定を調整
   */
  adjustDifficultySettings() {
    switch (this.options.difficultyLevel) {
      case 'nightmare':
        this.options.enemyDensity *= 1.5;
        this.options.obstacleDensity *= 1.2;
        break;
      case 'hell':
        this.options.enemyDensity *= 2.5;
        this.options.obstacleDensity *= 1.5;
        this.options.chestDensity *= 1.3; // 報酬も増加
        break;
      default: // normal
        break;
    }
  }
  
  /**
   * 2次元配列を作成
   * @param {number} width - 配列の幅
   * @param {number} height - 配列の高さ
   * @param {any} defaultValue - デフォルト値
   * @returns {Array} 2次元配列
   */
  create2DArray(width, height, defaultValue) {
    const arr = new Array(height);
    for (let i = 0; i < height; i++) {
      arr[i] = new Array(width).fill(defaultValue);
    }
    return arr;
  }

  /**
   * マップを生成
   * @param {string} mapType - マップタイプ（'dungeon', 'field', 'arena', 'town'）
   * @returns {object} 生成されたマップデータ
   */
  generateMap(mapType = 'dungeon') {
    // 生成前に初期化
    this.heightMap = this.create2DArray(this.options.width, this.options.height, 0);
    this.objectPlacement = this.create2DArray(this.options.width, this.options.height, 0);
    this.enemyPlacement = [];
    this.npcPlacement = [];
    this.rooms = [];
    
    // マップタイプに応じた生成処理
    switch(mapType) {
      case 'dungeon':
        this.generateDungeonMap();
        break;
      case 'field':
        this.generateFieldMap();
        break;
      case 'arena':
        this.generateArenaMap();
        break;
      case 'town':
        this.generateTownMap();
        break;
      default:
        this.generateDungeonMap();
    }
    
    // オブジェクト配置
    this.placeObjects(mapType);
    
    // 敵を配置
    this.placeEnemies(mapType);
    
    // 必要に応じてNPCを配置（主に町マップ用）
    if (mapType === 'town') {
      this.placeNPCs();
    }
    
    // 生成されたマップを返す
    return {
      width: this.options.width,
      height: this.options.height,
      tileSize: this.options.tileSize,
      heightMap: this.heightMap,
      objectPlacement: this.objectPlacement,
      enemyPlacement: this.enemyPlacement,
      npcPlacement: this.npcPlacement,
      rooms: this.rooms,
      type: mapType,
      difficulty: this.options.difficultyLevel
    };
  }

  /**
   * ダンジョンマップを生成（部屋と通路の迷宮）
   */
  generateDungeonMap() {
    // 部屋を生成
    this.generateRooms();
    
    // 部屋同士を通路で接続
    this.connectRooms();
    
    // 壁を生成
    this.generateWalls();
    
    // 地形の高さマップを生成（床の微妙な凹凸など）
    this.generateHeightMapFromRooms();
  }

  /**
   * ランダムな部屋を生成
   */
  generateRooms() {
    const { width, height, roomMinSize, roomMaxSize, roomCount } = this.options;
    
    // 部屋の生成を試行
    let attempts = 0;
    const maxAttempts = roomCount * 10; // 無限ループ防止
    
    while (this.rooms.length < roomCount && attempts < maxAttempts) {
      // ランダムなサイズと位置
      const roomWidth = Math.floor(this.rng() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;
      const roomHeight = Math.floor(this.rng() * (roomMaxSize - roomMinSize + 1)) + roomMinSize;
      const x = Math.floor(this.rng() * (width - roomWidth - 2)) + 1;
      const y = Math.floor(this.rng() * (height - roomHeight - 2)) + 1;
      
      // 新しい部屋
      const newRoom = {
        x, y, width: roomWidth, height: roomHeight,
        centerX: Math.floor(x + roomWidth / 2),
        centerY: Math.floor(y + roomHeight / 2)
      };
      
      // 他の部屋との重なりチェック
      let overlaps = false;
      for (const room of this.rooms) {
        if (this.roomsOverlap(newRoom, room, 1)) { // 1マスの余裕を持って判定
          overlaps = true;
          break;
        }
      }
      
      // 重なっていなければ部屋を追加
      if (!overlaps) {
        this.rooms.push(newRoom);
        
        // 部屋の領域を通路可能にマーク
        for (let ry = newRoom.y; ry < newRoom.y + newRoom.height; ry++) {
          for (let rx = newRoom.x; rx < newRoom.x + newRoom.width; rx++) {
            if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
              this.objectPlacement[ry][rx] = 0; // 空きスペースとしてマーク
            }
          }
        }
      }
      
      attempts++;
    }
  }

  /**
   * 2つの部屋が重なるかチェック
   * @param {object} roomA - 部屋A
   * @param {object} roomB - 部屋B
   * @param {number} padding - パディング（余裕）
   * @returns {boolean} 重なるかどうか
   */
  roomsOverlap(roomA, roomB, padding = 0) {
    return (
      roomA.x - padding < roomB.x + roomB.width + padding &&
      roomA.x + roomA.width + padding > roomB.x - padding &&
      roomA.y - padding < roomB.y + roomB.height + padding &&
      roomA.y + roomA.height + padding > roomB.y - padding
    );
  }

  /**
   * 部屋同士を通路で接続
   */
  connectRooms() {
    if (this.rooms.length <= 1) return;
    
    // 全ての部屋を通路でつなぐ
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const roomA = this.rooms[i];
      const roomB = this.rooms[i + 1];
      
      // 部屋の中心点を取得
      const startX = roomA.centerX;
      const startY = roomA.centerY;
      const endX = roomB.centerX;
      const endY = roomB.centerY;
      
      // ランダムに水平→垂直 or 垂直→水平を選択
      if (this.rng() > 0.5) {
        this.createHorizontalCorridor(startX, endX, startY);
        this.createVerticalCorridor(startY, endY, endX);
      } else {
        this.createVerticalCorridor(startY, endY, startX);
        this.createHorizontalCorridor(startX, endX, endY);
      }
    }
    
    // ランダムにいくつかのループ通路を追加（迷路性を高める）
    const extraConnections = Math.floor(this.rooms.length * 0.3);
    for (let i = 0; i < extraConnections; i++) {
      const roomA = this.rooms[Math.floor(this.rng() * this.rooms.length)];
      const roomB = this.rooms[Math.floor(this.rng() * this.rooms.length)];
      
      if (roomA !== roomB) {
        const startX = roomA.centerX;
        const startY = roomA.centerY;
        const endX = roomB.centerX;
        const endY = roomB.centerY;
        
        if (this.rng() > 0.5) {
          this.createHorizontalCorridor(startX, endX, startY);
          this.createVerticalCorridor(startY, endY, endX);
        } else {
          this.createVerticalCorridor(startY, endY, startX);
          this.createHorizontalCorridor(startX, endX, endY);
        }
      }
    }
  }

  /**
   * 水平方向の通路を作成
   * @param {number} x1 - 開始X座標
   * @param {number} x2 - 終了X座標
   * @param {number} y - Y座標
   */
  createHorizontalCorridor(x1, x2, y) {
    const { width, height } = this.options;
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    
    for (let x = startX; x <= endX; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        this.objectPlacement[y][x] = 0; // 通路をマーク
        
        // 通路の両側に壁を設置（既存の部屋や通路を上書きしない）
        if (y - 1 >= 0 && this.objectPlacement[y - 1][x] !== 0) {
          this.objectPlacement[y - 1][x] = 3; // 壁としてマーク
        }
        if (y + 1 < height && this.objectPlacement[y + 1][x] !== 0) {
          this.objectPlacement[y + 1][x] = 3; // 壁としてマーク
        }
      }
    }
  }

  /**
   * 垂直方向の通路を作成
   * @param {number} y1 - 開始Y座標
   * @param {number} y2 - 終了Y座標
   * @param {number} x - X座標
   */
  createVerticalCorridor(y1, y2, x) {
    const { width, height } = this.options;
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);
    
    for (let y = startY; y <= endY; y++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        this.objectPlacement[y][x] = 0; // 通路をマーク
        
        // 通路の両側に壁を設置（既存の部屋や通路を上書きしない）
        if (x - 1 >= 0 && this.objectPlacement[y][x - 1] !== 0) {
          this.objectPlacement[y][x - 1] = 3; // 壁としてマーク
        }
        if (x + 1 < width && this.objectPlacement[y][x + 1] !== 0) {
          this.objectPlacement[y][x + 1] = 3; // 壁としてマーク
        }
      }
    }
  }

  /**
   * 部屋と通路の周りに壁を生成
   */
  generateWalls() {
    const { width, height } = this.options;
    
    // 一時的な配列にコピー
    const tempMap = this.create2DArray(width, height, 0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tempMap[y][x] = this.objectPlacement[y][x];
      }
    }
    
    // 空きスペースの周りに壁を配置
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 現在のセルが空きスペースの場合
        if (tempMap[y][x] === 0) {
          // 周囲8方向を調べる
          const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
          ];
          
          for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              // 隣接セルが何もない場合、壁に設定
              if (tempMap[ny][nx] !== 0 && this.objectPlacement[ny][nx] !== 3) {
                this.objectPlacement[ny][nx] = 3; // 壁としてマーク
              }
            }
          }
        }
      }
    }
  }

  /**
   * 部屋と通路に基づいて高さマップを生成
   */
  generateHeightMapFromRooms() {
    const { width, height, noiseScale } = this.options;
    
    // 高さマップを初期化
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 部屋や通路は平らに、壁は高くする
        if (this.objectPlacement[y][x] === 0) {
          // 部屋や通路には微妙な凹凸を追加
          const noise = this.noise2D(x * noiseScale * 0.5, y * noiseScale * 0.5) * 0.1;
          this.heightMap[y][x] = 0.2 + noise;
        } else if (this.objectPlacement[y][x] === 3) {
          // 壁は高くする
          const noise = this.noise2D(x * noiseScale, y * noiseScale) * 0.2;
          this.heightMap[y][x] = 0.8 + noise;
        } else {
          // その他の領域
          const noise = this.noise2D(x * noiseScale, y * noiseScale) * 0.5;
          this.heightMap[y][x] = 0.5 + noise;
        }
      }
    }
  }

  /**
   * フィールドマップを生成（草原や荒野など）
   */
  generateFieldMap() {
    const { width, height, noiseScale } = this.options;
    
    // ノイズを使用して自然な地形を生成
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // simplex-noiseを使用して地形の高さを計算
        const baseNoise = this.noise2D(x * noiseScale, y * noiseScale);
        const detailNoise = this.noise2D(x * noiseScale * 4, y * noiseScale * 4) * 0.2;
        
        // 高さマップに設定（0.0～1.0の範囲）
        this.heightMap[y][x] = (baseNoise + detailNoise) * 0.5 + 0.5;
        
        // 地形の高さに基づいてオブジェクト配置を設定
        if (this.heightMap[y][x] < 0.3) {
          // 低地（水域など）
          this.objectPlacement[y][x] = 0; // 移動可能な低地
        } else if (this.heightMap[y][x] > 0.75) {
          // 高地（山や丘など）
          this.objectPlacement[y][x] = 3; // 移動不可能な障害物
        } else {
          // 中間地形（草原など）
          this.objectPlacement[y][x] = 0; // 基本は移動可能
        }
      }
    }
    
    // いくつかのフィールド特有のエリアを作成（森、湖など）
    this.createFieldFeatures();
  }

  /**
   * フィールドマップの特徴的な地形を生成
   */
  createFieldFeatures() {
    const { width, height } = this.options;
    
    // 森エリアをいくつか生成
    const forestCount = Math.floor(3 + this.rng() * 5);
    for (let i = 0; i < forestCount; i++) {
      const forestX = Math.floor(this.rng() * width);
      const forestY = Math.floor(this.rng() * height);
      const forestSize = Math.floor(5 + this.rng() * 15);
      
      this.createForest(forestX, forestY, forestSize);
    }
    
    // 湖をいくつか生成
    const lakeCount = Math.floor(1 + this.rng() * 3);
    for (let i = 0; i < lakeCount; i++) {
      const lakeX = Math.floor(this.rng() * width);
      const lakeY = Math.floor(this.rng() * height);
      const lakeSize = Math.floor(8 + this.rng() * 15);
      
      this.createLake(lakeX, lakeY, lakeSize);
    }
    
    // 小道をいくつか生成
    const pathCount = Math.floor(2 + this.rng() * 4);
    for (let i = 0; i < pathCount; i++) {
      const startX = Math.floor(this.rng() * width);
      const startY = Math.floor(this.rng() * height);
      const endX = Math.floor(this.rng() * width);
      const endY = Math.floor(this.rng() * height);
      
      this.createPath(startX, startY, endX, endY);
    }
  }

  /**
   * 森エリアを生成
   * @param {number} centerX - 中心X座標
   * @param {number} centerY - 中心Y座標
   * @param {number} size - 森のサイズ
   */
  createForest(centerX, centerY, size) {
    const { width, height } = this.options;
    
    // 木の密度（0.0～1.0）
    const density = 0.6 + this.rng() * 0.3;
    
    for (let y = centerY - size; y <= centerY + size; y++) {
      for (let x = centerX - size; x <= centerX + size; x++) {
        // 範囲内かつ円形の範囲内にあるかチェック
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distance <= size) {
            // 確率に基づいて木を配置
            if (this.rng() < density * (1 - distance / size)) {
              // 木を配置（移動できない障害物として）
              this.objectPlacement[y][x] = 3;
              // 木の高さを設定
              this.heightMap[y][x] = 0.6 + this.rng() * 0.3;
            } else {
              // 森の地面
              this.heightMap[y][x] = 0.4 + this.rng() * 0.1;
            }
          }
        }
      }
    }
  }

  /**
   * 湖を生成
   * @param {number} centerX - 中心X座標
   * @param {number} centerY - 中心Y座標
   * @param {number} size - 湖のサイズ
   */
  createLake(centerX, centerY, size) {
    const { width, height } = this.options;
    
    for (let y = centerY - size; y <= centerY + size; y++) {
      for (let x = centerX - size; x <= centerX + size; x++) {
        // 範囲内かつ楕円形の範囲内にあるかチェック
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(((x - centerX) ** 2) / 1.5 + (y - centerY) ** 2);
          if (distance <= size) {
            // 湖の中心に近いほど深くなる
            const depth = 0.3 - (0.3 * distance / size);
            this.heightMap[y][x] = depth;
            
            // 湖は移動不可
            this.objectPlacement[y][x] = 3;
            
            // 湖の淵は移動可能に
            if (distance > size * 0.8) {
              this.objectPlacement[y][x] = 0;
            }
          }
        }
      }
    }
  }

  /**
   * 小道を生成
   * @param {number} startX - 開始X座標
   * @param {number} startY - 開始Y座標
   * @param {number} endX - 終了X座標
   * @param {number} endY - 終了Y座標
   */
  createPath(startX, startY, endX, endY) {
    // A*アルゴリズムや単純なブレゼンハムのラインアルゴリズムで小道を生成
    // ここでは単純な方法で実装
    
    const points = this.getLinePoints(startX, startY, endX, endY);
    const pathWidth = 1 + Math.floor(this.rng() * 2); // 小道の幅
    
    for (const point of points) {
      const { x, y } = point;
      
      // 小道の周辺を処理
      for (let dy = -pathWidth; dy <= pathWidth; dy++) {
        for (let dx = -pathWidth; dx <= pathWidth; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < this.options.width && ny >= 0 && ny < this.options.height) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= pathWidth) {
              // 小道は移動可能
              this.objectPlacement[ny][nx] = 0;
              
              // 小道の高さを少し低めに設定
              this.heightMap[ny][nx] = 0.4 - (distance / pathWidth) * 0.05;
            }
          }
        }
      }
    }
  }

  /**
   * 2点間の線分上の点を取得
   * @param {number} x0 - 開始X座標
   * @param {number} y0 - 開始Y座標
   * @param {number} x1 - 終了X座標
   * @param {number} y1 - 終了Y座標
   * @returns {Array} 線分上の点の配列
   */
  getLinePoints(x0, y0, x1, y1) {
    const points = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    
    let x = x0;
    let y = y0;
    
    while (true) {
      points.push({ x, y });
      
      if (x === x1 && y === y1) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
    
    return points;
  }

  /**
   * アリーナマップを生成（ボス戦用の広い空間）
   */
  generateArenaMap() {
    const { width, height, noiseScale } = this.options;
    
    // 中央に広い空間を作り、周囲に壁や障害物を配置
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const arenaRadius = Math.min(width, height) * 0.4; // マップサイズの40%を使用
    
    // まず全体を壁で埋める
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.objectPlacement[y][x] = 3; // 壁
        this.heightMap[y][x] = 0.7 + this.noise2D(x * noiseScale, y * noiseScale) * 0.2;
      }
    }
    
    // アリーナの中央部分を空けていく
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (distance < arenaRadius) {
          // アリーナ内部（移動可能）
          this.objectPlacement[y][x] = 0;
          
          // ノイズを使って高さに微妙な変化をつける
          const noise = this.noise2D(x * noiseScale * 2, y * noiseScale * 2) * 0.1;
          this.heightMap[y][x] = 0.4 + noise;
          
          // ボス戦用の特徴を追加（例：中央の台座など）
          if (distance < arenaRadius * 0.2) {
            // 中央の台座を高くする
            this.heightMap[y][x] += 0.1;
          }
        } else if (distance < arenaRadius + 5) {
          // アリーナの外周（壁との緩衝地帯）
          this.objectPlacement[y][x] = 0;
          
          // 外周の高さを調整
          const gradientFactor = (distance - arenaRadius) / 5;
          this.heightMap[y][x] = 0.4 + gradientFactor * 0.3;
        }
      }
    }
    
    // アリーナ内に戦略的な障害物や柱を配置
    this.addArenaFeatures(centerX, centerY, arenaRadius);
    
    // 入口を作成
    this.createArenaEntrance(centerX, centerY, arenaRadius);
  }

  /**
   * アリーナ内の特徴を追加
   * @param {number} centerX - アリーナの中心X座標
   * @param {number} centerY - アリーナの中心Y座標
   * @param {number} radius - アリーナの半径
   */
  addArenaFeatures(centerX, centerY, radius) {
    // 柱や障害物の数
    const pillarCount = Math.floor(4 + this.rng() * 8);
    
    // 中央部に柱を配置
    for (let i = 0; i < pillarCount; i++) {
      // ランダムな角度と距離
      const angle = this.rng() * Math.PI * 2;
      const distance = radius * (0.3 + this.rng() * 0.5); // 半径の30%～80%の位置
      
      // 柱の位置を計算
      const pillarX = Math.floor(centerX + Math.cos(angle) * distance);
      const pillarY = Math.floor(centerY + Math.sin(angle) * distance);
      
      // 柱のサイズ
      const pillarSize = 1 + Math.floor(this.rng() * 2);
      
      // 柱を配置
      for (let y = pillarY - pillarSize; y <= pillarY + pillarSize; y++) {
        for (let x = pillarX - pillarSize; x <= pillarX + pillarSize; x++) {
          if (x >= 0 && x < this.options.width && y >= 0 && y < this.options.height) {
            const distFromPillar = Math.sqrt((x - pillarX) ** 2 + (y - pillarY) ** 2);
            
            if (distFromPillar <= pillarSize) {
              // 柱は移動不可
              this.objectPlacement[y][x] = 3;
              
              // 柱の高さを設定
              this.heightMap[y][x] = 0.7 + this.rng() * 0.2;
            }
          }
        }
      }
    }
    
    // ボス戦用の特殊要素（例：中央の祭壇など）
    const altarSize = Math.floor(radius * 0.15);
    
    for (let y = centerY - altarSize; y <= centerY + altarSize; y++) {
      for (let x = centerX - altarSize; x <= centerX + altarSize; x++) {
        if (x >= 0 && x < this.options.width && y >= 0 && y < this.options.height) {
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter <= altarSize) {
            // 祭壇の高さを設定（中心ほど高い）
            const heightFactor = 1 - (distFromCenter / altarSize);
            this.heightMap[y][x] = 0.5 + heightFactor * 0.2;
            
            // 祭壇は移動可能
            this.objectPlacement[y][x] = 0;
          }
        }
      }
    }
  }

  /**
   * アリーナの入口を作成
   * @param {number} centerX - アリーナの中心X座標
   * @param {number} centerY - アリーナの中心Y座標
   * @param {number} radius - アリーナの半径
   */
  createArenaEntrance(centerX, centerY, radius) {
    const { width, height } = this.options;
    
    // ランダムな角度で入口を設置
    const entranceAngle = this.rng() * Math.PI * 2;
    const entranceX = Math.floor(centerX + Math.cos(entranceAngle) * radius);
    const entranceY = Math.floor(centerY + Math.sin(entranceAngle) * radius);
    
    // 入口から外側に通路を伸ばす
    const corridorLength = 10;
    const dirX = Math.cos(entranceAngle);
    const dirY = Math.sin(entranceAngle);
    
    for (let i = 0; i <= corridorLength; i++) {
      const x = Math.floor(entranceX + dirX * i);
      const y = Math.floor(entranceY + dirY * i);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        // 通路を作成（移動可能）
        this.objectPlacement[y][x] = 0;
        
        // 通路の両側に壁を作成
        const perpX = Math.sin(entranceAngle);
        const perpY = -Math.cos(entranceAngle);
        
        for (let side = -1; side <= 1; side += 2) {
          const wallX = Math.floor(x + perpX * side);
          const wallY = Math.floor(y + perpY * side);
          
          if (wallX >= 0 && wallX < width && wallY >= 0 && wallY < height) {
            this.objectPlacement[wallY][wallX] = 3; // 壁
          }
        }
      }
    }
  }

  /**
   * 町マップを生成（NPC、ショップなど）
   */
  generateTownMap() {
    const { width, height, noiseScale } = this.options;
    
    // 基本的な地形を生成（平坦な地形）
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 基本的に移動可能
        this.objectPlacement[y][x] = 0;
        
        // 高さは平坦だが、微妙な凹凸を付ける
        const noise = this.noise2D(x * noiseScale * 0.5, y * noiseScale * 0.5) * 0.05;
        this.heightMap[y][x] = 0.4 + noise;
      }
    }
    
    // 町の中心点を決定
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // 町の建物を生成
    this.generateTownBuildings(centerX, centerY);
    
    // 町の道路を生成
    this.generateTownRoads(centerX, centerY);
    
    // 町の周囲に壁を生成
    this.generateTownWalls(centerX, centerY);
    
    // 町の装飾（噴水、ベンチなど）を追加
    this.addTownDecorations(centerX, centerY);
  }

  /**
   * 町の建物を生成
   * @param {number} centerX - 町の中心X座標
   * @param {number} centerY - 町の中心Y座標
   */
  generateTownBuildings(centerX, centerY) {
    const { width, height } = this.options;
    
    // 建物の数
    const buildingCount = Math.floor(5 + this.rng() * 10);
    
    // 建物のサイズ範囲
    const minBuildingSize = 5;
    const maxBuildingSize = 10;
    
    // 町の大きさ（中心からの最大距離）
    const townRadius = Math.min(width, height) * 0.4;
    
    // 建物を配置
    for (let i = 0; i < buildingCount; i++) {
      // ランダムな角度と距離
      const angle = this.rng() * Math.PI * 2;
      const distance = townRadius * (0.2 + this.rng() * 0.7); // 中心から20%～90%の位置
      
      // 建物の中心位置
      const buildingCenterX = Math.floor(centerX + Math.cos(angle) * distance);
      const buildingCenterY = Math.floor(centerY + Math.sin(angle) * distance);
      
      // 建物のサイズ
      const buildingWidth = minBuildingSize + Math.floor(this.rng() * (maxBuildingSize - minBuildingSize));
      const buildingHeight = minBuildingSize + Math.floor(this.rng() * (maxBuildingSize - minBuildingSize));
      
      // 建物の左上隅
      const buildingX = buildingCenterX - Math.floor(buildingWidth / 2);
      const buildingY = buildingCenterY - Math.floor(buildingHeight / 2);
      
      // 建物を配置
      for (let y = buildingY; y < buildingY + buildingHeight; y++) {
        for (let x = buildingX; x < buildingX + buildingWidth; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            // 建物の壁（外周）
            if (x === buildingX || x === buildingX + buildingWidth - 1 || 
                y === buildingY || y === buildingY + buildingHeight - 1) {
              this.objectPlacement[y][x] = 3; // 壁
              this.heightMap[y][x] = 0.7;
            } else {
              // 建物の内部（床）
              this.objectPlacement[y][x] = 0; // 移動可能
              this.heightMap[y][x] = 0.5;
            }
          }
        }
      }
      
      // 建物にドア（入口）を追加
      const doorSide = Math.floor(this.rng() * 4); // 0:上, 1:右, 2:下, 3:左
      let doorX, doorY;
      
      switch (doorSide) {
        case 0: // 上側
          doorX = buildingX + Math.floor(buildingWidth / 2);
          doorY = buildingY;
          break;
        case 1: // 右側
          doorX = buildingX + buildingWidth - 1;
          doorY = buildingY + Math.floor(buildingHeight / 2);
          break;
        case 2: // 下側
          doorX = buildingX + Math.floor(buildingWidth / 2);
          doorY = buildingY + buildingHeight - 1;
          break;
        case 3: // 左側
          doorX = buildingX;
          doorY = buildingY + Math.floor(buildingHeight / 2);
          break;
      }
      
      // ドアを設置（移動可能）
      if (doorX >= 0 && doorX < width && doorY >= 0 && doorY < height) {
        this.objectPlacement[doorY][doorX] = 0;
        this.heightMap[doorY][doorX] = 0.5;
        
        // ドアの位置を記録（NPC配置用）
        if (i < 3) { // 最初の数棟をショップにする
          this.rooms.push({
            x: buildingCenterX,
            y: buildingCenterY,
            doorX: doorX,
            doorY: doorY,
            isShop: true
          });
        } else {
          this.rooms.push({
            x: buildingCenterX,
            y: buildingCenterY,
            doorX: doorX,
            doorY: doorY,
            isShop: false
          });
        }
      }
    }
  }

  /**
   * 町の道路を生成
   * @param {number} centerX - 町の中心X座標
   * @param {number} centerY - 町の中心Y座標
   */
  generateTownRoads(centerX, centerY) {
    const { width, height } = this.options;
    
    // 中央広場を作成
    const plazaSize = Math.floor(Math.min(width, height) * 0.15);
    
    for (let y = centerY - plazaSize; y <= centerY + plazaSize; y++) {
      for (let x = centerX - plazaSize; x <= centerX + plazaSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter <= plazaSize) {
            // 広場は移動可能
            this.objectPlacement[y][x] = 0;
            
            // 広場の高さを設定
            this.heightMap[y][x] = 0.4;
          }
        }
      }
    }
    
    // 各建物から中央広場へ道路を伸ばす
    for (const room of this.rooms) {
      this.createPath(room.doorX, room.doorY, centerX, centerY);
    }
    
    // 追加の道路を生成（建物同士を接続）
    const extraRoadCount = Math.floor(this.rooms.length * 0.5);
    for (let i = 0; i < extraRoadCount; i++) {
      const roomA = this.rooms[Math.floor(this.rng() * this.rooms.length)];
      const roomB = this.rooms[Math.floor(this.rng() * this.rooms.length)];
      
      if (roomA !== roomB) {
        this.createPath(roomA.doorX, roomA.doorY, roomB.doorX, roomB.doorY);
      }
    }
  }

  /**
   * 町の周囲に壁を生成
   * @param {number} centerX - 町の中心X座標
   * @param {number} centerY - 町の中心Y座標
   */
  generateTownWalls(centerX, centerY) {
    const { width, height } = this.options;
    
    // 町の半径（最大距離）
    const townRadius = Math.min(width, height) * 0.45;
    
    // 壁と門の設置
    for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
      const wallX = Math.floor(centerX + Math.cos(angle) * townRadius);
      const wallY = Math.floor(centerY + Math.sin(angle) * townRadius);
      
      if (wallX >= 0 && wallX < width && wallY >= 0 && wallY < height) {
        // 4方向に門を設置
        const isGate = 
          (Math.abs(angle - 0) < 0.1) ||
          (Math.abs(angle - Math.PI / 2) < 0.1) ||
          (Math.abs(angle - Math.PI) < 0.1) ||
          (Math.abs(angle - Math.PI * 3 / 2) < 0.1);
        
        if (isGate) {
          // 門は移動可能
          this.objectPlacement[wallY][wallX] = 0;
          this.heightMap[wallY][wallX] = 0.4;
        } else {
          // 壁は移動不可
          this.objectPlacement[wallY][wallX] = 3;
          this.heightMap[wallY][wallX] = 0.8;
        }
      }
    }
  }

  /**
   * 町の装飾を追加
   * @param {number} centerX - 町の中心X座標
   * @param {number} centerY - 町の中心Y座標
   */
  addTownDecorations(centerX, centerY) {
    const { width, height } = this.options;
    
    // 中央に噴水を設置
    const fountainSize = 3;
    
    for (let y = centerY - fountainSize; y <= centerY + fountainSize; y++) {
      for (let x = centerX - fountainSize; x <= centerX + fountainSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter <= fountainSize) {
            // 噴水は移動不可
            this.objectPlacement[y][x] = 3;
            
            // 噴水の高さを設定
            this.heightMap[y][x] = 0.5 + (1 - distFromCenter / fountainSize) * 0.3;
          }
        }
      }
    }
    
    // ベンチや街灯などの小さな装飾を追加
    const decorationCount = Math.floor(10 + this.rng() * 15);
    const townRadius = Math.min(width, height) * 0.4;
    
    for (let i = 0; i < decorationCount; i++) {
      const angle = this.rng() * Math.PI * 2;
      const distance = townRadius * (0.1 + this.rng() * 0.8);
      
      const decorX = Math.floor(centerX + Math.cos(angle) * distance);
      const decorY = Math.floor(centerY + Math.sin(angle) * distance);
      
      if (decorX >= 0 && decorX < width && decorY >= 0 && decorY < height) {
        // 既に何かが配置されていないかチェック
        if (this.objectPlacement[decorY][decorX] === 0) {
          // 装飾物を配置（移動不可）
          this.objectPlacement[decorY][decorX] = 3;
          
          // 装飾物の高さを設定
          this.heightMap[decorY][decorX] = 0.6;
        }
      }
    }
  }

  /**
   * オブジェクト（宝箱、障害物など）を配置
   * @param {string} mapType - マップタイプ
   */
  placeObjects(mapType) {
    const { width, height, chestDensity, obstacleDensity } = this.options;
    
    // マップタイプに基づいてオブジェクト密度を調整
    let adjustedChestDensity = chestDensity;
    let adjustedObstacleDensity = obstacleDensity;
    
    switch (mapType) {
      case 'dungeon':
        // ダンジョンは宝箱が多め、障害物は少なめ
        adjustedChestDensity *= 1.5;
        adjustedObstacleDensity *= 0.7;
        break;
      case 'field':
        // フィールドは自然の障害物が多め
        adjustedObstacleDensity *= 1.3;
        break;
      case 'arena':
        // アリーナは宝箱が少なく、障害物も少なめ
        adjustedChestDensity *= 0.5;
        adjustedObstacleDensity *= 0.5;
        break;
      case 'town':
        // 町は宝箱がほとんどなく、障害物も配置済み
        adjustedChestDensity *= 0.1;
        adjustedObstacleDensity *= 0.2;
        break;
    }
    
    // マップを走査してオブジェクトを配置
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 移動可能なスペースのみにオブジェクトを配置
        if (this.objectPlacement[y][x] === 0) {
          // 宝箱を配置
          if (this.rng() < adjustedChestDensity) {
            this.objectPlacement[y][x] = 2; // 宝箱
          }
          // 障害物を配置
          else if (this.rng() < adjustedObstacleDensity) {
            // マップタイプに応じた障害物
            this.placeMapSpecificObstacle(x, y, mapType);
          }
        }
      }
    }
  }

  /**
   * マップタイプに応じた障害物を配置
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} mapType - マップタイプ
   */
  placeMapSpecificObstacle(x, y, mapType) {
    const { width, height } = this.options;
    
    // デフォルトは通常の障害物
    let obstacleType = 3; // 壁/障害物
    
    // マップタイプに応じて調整
    switch (mapType) {
      case 'dungeon':
        // ダンジョンの障害物（落石、破壊された柱など）
        obstacleType = 3;
        this.heightMap[y][x] = 0.6 + this.rng() * 0.2;
        break;
      case 'field':
        // フィールドの障害物（岩、低木など）
        obstacleType = 3;
        this.heightMap[y][x] = 0.5 + this.rng() * 0.3;
        break;
      case 'arena':
        // アリーナの障害物（壊れた武器、盾など）
        obstacleType = 3;
        this.heightMap[y][x] = 0.5 + this.rng() * 0.1;
        break;
      case 'town':
        // 町の障害物（樽、荷車など）
        obstacleType = 3;
        this.heightMap[y][x] = 0.5 + this.rng() * 0.1;
        break;
    }
    
    // 障害物を配置
    this.objectPlacement[y][x] = obstacleType;
  }

  /**
   * 敵を配置
   * @param {string} mapType - マップタイプ
   */
  placeEnemies(mapType) {
    const { width, height, enemyDensity, difficultyLevel } = this.options;
    
    // マップタイプに基づいて敵の密度を調整
    let adjustedEnemyDensity = enemyDensity;
    
    switch (mapType) {
      case 'dungeon':
        // ダンジョンは敵が多め
        adjustedEnemyDensity *= 1.2;
        break;
      case 'field':
        // フィールドは敵がやや少なめ
        adjustedEnemyDensity *= 0.8;
        break;
      case 'arena':
        // アリーナは中央にボスを配置
        this.placeArenaEnemies();
        return; // 別途処理するので以降はスキップ
      case 'town':
        // 町は敵がほとんどいない
        adjustedEnemyDensity *= 0.1;
        break;
    }
    
    // 候補位置を収集
    const candidatePositions = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 移動可能なスペースのみに敵を配置
        if (this.objectPlacement[y][x] === 0) {
          // 敵を配置できる場所を候補に追加
          candidatePositions.push({ x, y });
        }
      }
    }
    
    // 敵の数を計算
    const totalEnemyCount = Math.floor(candidatePositions.length * adjustedEnemyDensity);
    
    // 敵を配置
    for (let i = 0; i < totalEnemyCount; i++) {
      if (candidatePositions.length === 0) break;
      
      // ランダムな位置を選択
      const randomIndex = Math.floor(this.rng() * candidatePositions.length);
      const position = candidatePositions[randomIndex];
      
      // 配置済みの位置を候補から削除
      candidatePositions.splice(randomIndex, 1);
      
      // 敵のタイプを決定（マップタイプと難易度に基づく）
      const enemyType = this.determineEnemyType(mapType, difficultyLevel, position);
      
      // 敵を配置
      this.enemyPlacement.push({
        x: position.x,
        y: position.y,
        type: enemyType,
        level: this.determineEnemyLevel(difficultyLevel, enemyType)
      });
    }
    
    // グループでの敵配置（複数の敵が近くに集まる）
    this.placeEnemyGroups(mapType, difficultyLevel, candidatePositions);
  }

  /**
   * アリーナ用の敵を配置（ボスなど）
   */
  placeArenaEnemies() {
    const { width, height, difficultyLevel } = this.options;
    
    // アリーナの中央座標
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // ボスを中央に配置
    this.enemyPlacement.push({
      x: centerX,
      y: centerY,
      type: 'boss',
      level: this.determineBossLevel(difficultyLevel)
    });
    
    // ボスの周りに複数の敵を配置
    const minionsCount = 4 + Math.floor(this.rng() * 4); // 4～7体
    
    for (let i = 0; i < minionsCount; i++) {
      // ボスの周りにランダムに配置
      const angle = this.rng() * Math.PI * 2;
      const distance = 5 + this.rng() * 5; // ボスから5～10マス離れた位置
      
      const minionX = Math.floor(centerX + Math.cos(angle) * distance);
      const minionY = Math.floor(centerY + Math.sin(angle) * distance);
      
      // マップ範囲内かつ移動可能なスペースにのみ配置
      if (minionX >= 0 && minionX < width && minionY >= 0 && minionY < height &&
          this.objectPlacement[minionY][minionX] === 0) {
        this.enemyPlacement.push({
          x: minionX,
          y: minionY,
          type: 'elite',
          level: this.determineEnemyLevel(difficultyLevel, 'elite')
        });
      }
    }
  }

  /**
   * 敵をグループで配置
   * @param {string} mapType - マップタイプ
   * @param {string} difficultyLevel - 難易度
   * @param {Array} candidatePositions - 配置候補位置
   */
  placeEnemyGroups(mapType, difficultyLevel, candidatePositions) {
    // グループの数
    const groupCount = Math.floor(3 + this.rng() * 5); // 3～7グループ
    
    for (let g = 0; g < groupCount; g++) {
      if (candidatePositions.length === 0) break;
      
      // ランダムな位置をグループの中心として選択
      const randomIndex = Math.floor(this.rng() * candidatePositions.length);
      const centerPosition = candidatePositions[randomIndex];
      
      // 配置済みの位置を候補から削除
      candidatePositions.splice(randomIndex, 1);
      
      // グループの敵の種類を決定
      const groupEnemyType = this.determineEnemyType(mapType, difficultyLevel, centerPosition);
      
      // グループの敵の数
      const groupSize = 3 + Math.floor(this.rng() * 4); // 3～6体
      
      // グループの敵を配置
      for (let i = 0; i < groupSize; i++) {
        // グループの中心から近い位置を探す
        const radius = 1 + Math.floor(this.rng() * 3); // 中心から1～3マス
        const angle = this.rng() * Math.PI * 2;
        
        const enemyX = Math.floor(centerPosition.x + Math.cos(angle) * radius);
        const enemyY = Math.floor(centerPosition.y + Math.sin(angle) * radius);
        
        // マップ範囲内かつ移動可能なスペースにのみ配置
        if (enemyX >= 0 && enemyX < this.options.width && 
            enemyY >= 0 && enemyY < this.options.height &&
            this.objectPlacement[enemyY][enemyX] === 0) {
          
          // 既に配置候補から除外
          const posIndex = candidatePositions.findIndex(p => p.x === enemyX && p.y === enemyY);
          if (posIndex !== -1) {
            candidatePositions.splice(posIndex, 1);
          }
          
          // 敵を配置
          this.enemyPlacement.push({
            x: enemyX,
            y: enemyY,
            type: groupEnemyType,
            level: this.determineEnemyLevel(difficultyLevel, groupEnemyType),
            groupId: g // グループID
          });
        }
      }
    }
  }

  /**
   * 敵のタイプを決定
   * @param {string} mapType - マップタイプ
   * @param {string} difficultyLevel - 難易度
   * @param {object} position - 位置
   * @returns {string} 敵のタイプ
   */
  determineEnemyType(mapType, difficultyLevel, position) {
    // 敵のタイプリスト（マップタイプに応じて変更）
    let enemyTypes = [];
    
    switch (mapType) {
      case 'dungeon':
        enemyTypes = ['skeleton', 'zombie', 'ghost', 'spider', 'slime'];
        break;
      case 'field':
        enemyTypes = ['wolf', 'bandit', 'goblin', 'troll', 'ogre'];
        break;
      case 'town':
        enemyTypes = ['thief', 'drunkard', 'rat', 'stray_dog'];
        break;
      default:
        enemyTypes = ['goblin', 'orc', 'troll', 'skeleton'];
    }
    
    // 難易度に応じてエリート敵の確率を調整
    let eliteChance = 0.05; // 通常の難易度では5%
    
    switch (difficultyLevel) {
      case 'nightmare':
        eliteChance = 0.15; // ナイトメアでは15%
        break;
      case 'hell':
        eliteChance = 0.25; // ヘルでは25%
        break;
    }
    
    // エリート敵かどうか
    if (this.rng() < eliteChance) {
      return 'elite';
    }
    
    // ランダムに敵のタイプを選択
    return enemyTypes[Math.floor(this.rng() * enemyTypes.length)];
  }

  /**
   * 敵のレベルを決定
   * @param {string} difficultyLevel - 難易度
   * @param {string} enemyType - 敵のタイプ
   * @returns {number} 敵のレベル
   */
  determineEnemyLevel(difficultyLevel, enemyType) {
    // 基本レベル範囲
    let minLevel = 1;
    let maxLevel = 10;
    
    // 難易度に応じて調整
    switch (difficultyLevel) {
      case 'normal':
        minLevel = 1;
        maxLevel = 30;
        break;
      case 'nightmare':
        minLevel = 30;
        maxLevel = 60;
        break;
      case 'hell':
        minLevel = 60;
        maxLevel = 100;
        break;
    }
    
    // 敵タイプに応じて調整
    if (enemyType === 'elite') {
      minLevel = Math.floor(minLevel * 1.5);
      maxLevel = Math.floor(maxLevel * 1.2);
    } else if (enemyType === 'boss') {
      minLevel = Math.floor(minLevel * 2);
      maxLevel = Math.floor(maxLevel * 1.5);
    }
    
    // ランダムにレベルを決定
    return Math.floor(minLevel + this.rng() * (maxLevel - minLevel));
  }

  /**
   * ボスのレベルを決定
   * @param {string} difficultyLevel - 難易度
   * @returns {number} ボスのレベル
   */
  determineBossLevel(difficultyLevel) {
    // 難易度に応じたボスのレベル
    switch (difficultyLevel) {
      case 'normal':
        return 25 + Math.floor(this.rng() * 10); // 25-34
      case 'nightmare':
        return 55 + Math.floor(this.rng() * 10); // 55-64
      case 'hell':
        return 90 + Math.floor(this.rng() * 11); // 90-100
      default:
        return 30;
    }
  }

  /**
   * NPCを配置（主に町マップ用）
   */
  placeNPCs() {
    // 町の建物内にNPCを配置
    for (const room of this.rooms) {
      // ショップNPCを配置
      if (room.isShop) {
        this.placeShopNPC(room);
      } 
      // 通常NPCを配置
      else if (this.rng() < 0.7) { // 70%の確率で部屋にNPCを配置
        this.placeRegularNPC(room);
      }
    }
    
    // 町の広場や道路にもいくつかのNPCを配置
    const { width, height, npcDensity } = this.options;
    const townCenterX = Math.floor(width / 2);
    const townCenterY = Math.floor(height / 2);
    const townRadius = Math.min(width, height) * 0.4;
    
    // 配置できる候補位置を収集
    const candidatePositions = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 移動可能なスペースにのみNPCを配置
        if (this.objectPlacement[y][x] === 0) {
          // 町の中心からの距離を計算
          const distFromCenter = Math.sqrt((x - townCenterX) ** 2 + (y - townCenterY) ** 2);
          
          // 町の範囲内かつ建物の中ではない場所
          if (distFromCenter < townRadius && !this.isInsideBuilding(x, y)) {
            candidatePositions.push({ x, y });
          }
        }
      }
    }
    
    // 追加NPCの数
    const additionalNpcCount = Math.floor(candidatePositions.length * npcDensity);
    
    // 追加NPCを配置
    for (let i = 0; i < additionalNpcCount; i++) {
      if (candidatePositions.length === 0) break;
      
      // ランダムな位置を選択
      const randomIndex = Math.floor(this.rng() * candidatePositions.length);
      const position = candidatePositions[randomIndex];
      
      // 配置済みの位置を候補から削除
      candidatePositions.splice(randomIndex, 1);
      
      // 通常NPC（町の広場/道路にいるNPC）
      this.npcPlacement.push({
        x: position.x,
        y: position.y,
        type: this.determineNPCType(false),
        isShop: false,
        dialogues: this.generateNPCDialogues(false)
      });
    }
  }

  /**
   * ショップNPCを配置
   * @param {object} room - 部屋情報
   */
  placeShopNPC(room) {
    // ショップNPCは部屋の中央付近に配置
    this.npcPlacement.push({
      x: room.x,
      y: room.y,
      type: this.determineNPCType(true),
      isShop: true,
      shopType: this.determineShopType(),
      items: this.generateShopItems(),
      dialogues: this.generateNPCDialogues(true)
    });
  }

  /**
   * 通常NPCを配置
   * @param {object} room - 部屋情報
   */
  placeRegularNPC(room) {
    // 通常NPCは部屋の中央付近に配置
    this.npcPlacement.push({
      x: room.x,
      y: room.y,
      type: this.determineNPCType(false),
      isShop: false,
      dialogues: this.generateNPCDialogues(false)
    });
  }

  /**
   * NPCのタイプを決定
   * @param {boolean} isShop - ショップNPCかどうか
   * @returns {string} NPCのタイプ
   */
  determineNPCType(isShop) {
    // ショップNPCのタイプ
    if (isShop) {
      const shopkeeperTypes = ['blacksmith', 'merchant', 'alchemist', 'jeweler', 'armorer'];
      return shopkeeperTypes[Math.floor(this.rng() * shopkeeperTypes.length)];
    }
    
    // 通常NPCのタイプ
    const regularNpcTypes = ['villager', 'guard', 'child', 'elder', 'noble', 'beggar', 'bard'];
    return regularNpcTypes[Math.floor(this.rng() * regularNpcTypes.length)];
  }

  /**
   * ショップのタイプを決定
   * @returns {string} ショップのタイプ
   */
  determineShopType() {
    const shopTypes = ['weapon', 'armor', 'potion', 'general', 'magic'];
    return shopTypes[Math.floor(this.rng() * shopTypes.length)];
  }

  /**
   * ショップのアイテムを生成
   * @returns {Array} ショップアイテムのリスト
   */
  generateShopItems() {
    // 簡易的なアイテム生成（実際の実装ではItemFactory等を使用）
    const itemCount = 5 + Math.floor(this.rng() * 10); // 5～14個のアイテム
    const items = [];
    
    for (let i = 0; i < itemCount; i++) {
      items.push({
        id: `item_${i}`,
        price: Math.floor(10 + this.rng() * 1000), // 10～1009のランダムな価格
        // 実際の実装ではここにアイテムの詳細情報を追加
      });
    }
    
    return items;
  }

  /**
   * NPCの会話を生成
   * @param {boolean} isShop - ショップNPCかどうか
   * @returns {Array} 会話のリスト
   */
  generateNPCDialogues(isShop) {
    const dialogues = [];
    const dialogueCount = 2 + Math.floor(this.rng() * 4); // 2～5個の会話
    
    // ショップNPCの会話
    if (isShop) {
      dialogues.push("いらっしゃい！何かお探しかな？");
      dialogues.push("良い品を取り揃えておりますよ。");
      dialogues.push("この品は特別価格でどうだ？");
    } 
    // 通常NPCの会話
    else {
      const possibleDialogues = [
        "今日はいい天気ですね。",
        "この町は昔から平和なところです。",
        "最近、近くの森で奇妙な音が聞こえるという噂があります。",
        "冒険者ですか？素晴らしい！",
        "遠くからいらしたのですか？",
        "東の山には危険な魔物が出るという噂です。気をつけてください。",
        "南の洞窟に宝が眠っているという伝説があります。",
        "町長は最近姿を見せていません。何かあったのでしょうか？",
        "商人のギルドは北側にあります。",
        "西の森では最近、狼の群れが出没しているようです。"
      ];
      
      // ランダムに会話を選択
      for (let i = 0; i < dialogueCount; i++) {
        const randomIndex = Math.floor(this.rng() * possibleDialogues.length);
        dialogues.push(possibleDialogues[randomIndex]);
        // 同じ会話を避けるために使用済みの会話を削除
        possibleDialogues.splice(randomIndex, 1);
        if (possibleDialogues.length === 0) break;
      }
    }
    
    return dialogues;
  }

  /**
   * 指定された座標が建物内かどうかをチェック
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {boolean} 建物内かどうか
   */
  isInsideBuilding(x, y) {
    // 座標の周囲8方向に壁があるかをチェック
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];
    
    let wallCount = 0;
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < this.options.width && ny >= 0 && ny < this.options.height) {
        if (this.objectPlacement[ny][nx] === 3) { // 壁
          wallCount++;
        }
      }
    }
    
    // 周囲に3つ以上の壁があれば建物内と判断
    return wallCount >= 3;
  }

  /**
   * TensorFlowでマップ生成を拡張（初歩的な実装）
   */
  async initializeTensorFlowModel() {
    if (!tf) {
      console.warn('TensorFlow is not available in this environment');
      return {};
    }
    
    if (!this.tfModel) {
      await this.initializeTensorFlowModel();
    }
    
    if (!this.tfModel) {
      return {}; // モデル初期化に失敗した場合
    }
    
    try {
      // 入力特徴量を準備
      const difficultyIndex = 
        this.options.difficultyLevel === 'normal' ? 0.0 : 
        this.options.difficultyLevel === 'nightmare' ? 0.5 : 1.0;
      
      const inputTensor = tf.tensor2d([
        [
          this.options.width / 100,  // 幅を正規化
          this.options.height / 100,  // 高さを正規化
          difficultyIndex,  // 難易度指数
          this.options.noiseScale * 10,  // ノイズスケール
          this.options.seed % 1000 / 1000  // シード値（正規化）
        ]
      ]);
      
      // 予測実行
      const outputTensor = this.tfModel.predict(inputTensor);
      const outputArray = await outputTensor.array();
      const adjustedParams = outputArray[0];
      
      // テンソルを破棄（メモリリーク防止）
      inputTensor.dispose();
      outputTensor.dispose();
      
      // 調整されたパラメータを返す
      return {
        roomMinSize: Math.max(3, Math.floor(adjustedParams[0] * 10) + 3),
        roomMaxSize: Math.max(5, Math.floor(adjustedParams[1] * 15) + 5),
        roomCount: Math.max(5, Math.floor(adjustedParams[2] * 20) + 5),
        enemyDensity: Math.max(0.01, adjustedParams[3] * 0.1),
        chestDensity: Math.max(0.005, adjustedParams[4] * 0.05),
        obstacleDensity: Math.max(0.01, adjustedParams[5] * 0.15),
        npcDensity: Math.max(0.005, adjustedParams[6] * 0.03)
      };
    } catch (error) {
      console.error('TensorFlow parameter adjustment failed:', error);
      // デフォルトのパラメータを返す
      return {};
    }
  }
}

export default MapGenerator;