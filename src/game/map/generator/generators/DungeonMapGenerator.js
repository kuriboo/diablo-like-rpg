import MapGenerator from '../MapGenerator';

/**
 * MapGeneratorのダンジョン生成機能の拡張
 */
class DungeonMapGenerator extends MapGenerator {
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
        for (let x = newRoom.x; x < newRoom.x + newRoom.width; x++) {
          for (let y = newRoom.y; y < newRoom.y + newRoom.height; y++) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              this.objectPlacement[x][y] = 0; // 空きスペースとしてマーク
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
        this.objectPlacement[x][y] = 0; // 通路をマーク
        
        // 通路の両側に壁を設置（既存の部屋や通路を上書きしない）
        if (y - 1 >= 0 && this.objectPlacement[x][y - 1] !== 0) {
          this.objectPlacement[x][y - 1] = 4; // 壁としてマーク
        }
        if (y + 1 < height && this.objectPlacement[x][y + 1] !== 0) {
          this.objectPlacement[x][y + 1] = 4; // 壁としてマーク
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
        this.objectPlacement[x][y] = 0; // 通路をマーク
        
        // 通路の両側に壁を設置（既存の部屋や通路を上書きしない）
        if (x - 1 >= 0 && this.objectPlacement[x - 1][y] !== 0) {
          this.objectPlacement[x - 1][y] = 4; // 壁としてマーク
        }
        if (x + 1 < width && this.objectPlacement[x + 1][y] !== 0) {
          this.objectPlacement[x + 1][y] = 4; // 壁としてマーク
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
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        tempMap[x][y] = this.objectPlacement[x][y];
      }
    }
    
    // 空きスペースの周りに壁を配置
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // 現在のセルが空きスペースの場合
        if (tempMap[x][y] === 0) {
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
              if (tempMap[nx][ny] !== 0 && this.objectPlacement[nx][ny] !== 3) {
                this.objectPlacement[nx][ny] = 4; // 壁としてマーク
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
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // 部屋や通路は平らに、壁は高くする
        if (this.objectPlacement[x][y] === 0) {
          // 部屋や通路には微妙な凹凸を追加 - 常に0.3以上に
          const noise = this.noise2D(x * noiseScale * 0.5, y * noiseScale * 0.5) * 0.1;
          this.heightMap[x][y] = 0.4 + noise; // 0.3ではなく0.4から始めて安全マージンを確保
        } else if (this.objectPlacement[x][y] === 3 || this.objectPlacement[x][y] === 4) {
          // 壁は高くする
          const noise = this.noise2D(x * noiseScale, y * noiseScale) * 0.2;
          this.heightMap[x][y] = 0.8 + noise;
        } else {
          // その他の領域
          const noise = this.noise2D(x * noiseScale, y * noiseScale) * 0.5;
          this.heightMap[x][y] = 0.5 + noise;
        }
      }
    }
  }
}

// MapGeneratorクラスにミックスイン
Object.assign(MapGenerator.prototype, {
  generateDungeonMap: DungeonMapGenerator.prototype.generateDungeonMap,
  generateRooms: DungeonMapGenerator.prototype.generateRooms,
  roomsOverlap: DungeonMapGenerator.prototype.roomsOverlap,
  connectRooms: DungeonMapGenerator.prototype.connectRooms,
  createHorizontalCorridor: DungeonMapGenerator.prototype.createHorizontalCorridor,
  createVerticalCorridor: DungeonMapGenerator.prototype.createVerticalCorridor,
  generateWalls: DungeonMapGenerator.prototype.generateWalls,
  generateHeightMapFromRooms: DungeonMapGenerator.prototype.generateHeightMapFromRooms
});

export default MapGenerator;