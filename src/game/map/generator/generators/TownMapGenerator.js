import MapGenerator from '../MapGenerator';

/**
 * MapGeneratorの町生成機能の拡張
 */
class TownMapGenerator extends MapGenerator {
  /**
   * 町マップを生成（NPC、ショップなど）
   */
  generateTownMap() {
    const { width, height, noiseScale, wallDensity } = this.options;
    const adjustedWallDensity = wallDensity * 1.5; // 町は建物が多いので壁密度高め
    
    // 基本的な地形を生成（平坦な地形、最初はすべて床）
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // 基本的に移動可能
        this.objectPlacement[x][y] = 0;
        
        // 高さは平坦だが、微妙な凹凸を付ける
        const noise = this.noise2D(x * noiseScale * 0.5, y * noiseScale * 0.5) * 0.05;
        this.heightMap[x][y] = 0.4 + noise;
      }
    }
    
    // 町の中心点を決定
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // 町の建物を生成（壁の配置を含む）
    this.generateTownBuildings(centerX, centerY, adjustedWallDensity);
    
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
   * @param {number} wallDensity - 壁の密度
   */
  generateTownBuildings(centerX, centerY, wallDensity) {
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
      for (let x = buildingX; x < buildingX + buildingWidth; x++) {
        for (let y = buildingY; y < buildingY + buildingHeight; y++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            // 建物の壁（外周）
            if (x === buildingX || x === buildingX + buildingWidth - 1 || 
                y === buildingY || y === buildingY + buildingHeight - 1) {
              this.objectPlacement[x][y] = 4; // 壁
              this.heightMap[x][y] = 0.7;
            } else {
              // 建物の内部（床）
              this.objectPlacement[x][y] = 0; // 移動可能
              this.heightMap[x][y] = 0.5;
              
              // 建物内部にランダムに家具などを配置
              if (this.rng() < wallDensity * 0.3) {
                this.objectPlacement[x][y] = 3; // 障害物（家具）
                this.heightMap[x][y] = 0.55;
              }
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
        this.objectPlacement[doorX][doorY] = 0;
        this.heightMap[doorX][doorY] = 0.5;
        
        // ドアの位置を記録（NPC配置用）
        if (i < 3) { // 最初の数棟をショップにする
          this.rooms.push({
            x: buildingCenterX,
            y: buildingCenterY,
            width: buildingWidth,
            height: buildingHeight,
            doorX: doorX,
            doorY: doorY,
            isShop: true
          });
        } else {
          this.rooms.push({
            x: buildingCenterX,
            y: buildingCenterY,
            width: buildingWidth,
            height: buildingHeight,
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
    
    for (let x = centerX - plazaSize; x <= centerX + plazaSize; x++) {
      for (let y = centerY - plazaSize; y <= centerY + plazaSize; y++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter <= plazaSize) {
            // 広場は移動可能
            this.objectPlacement[x][y] = 0;
            
            // 広場の高さを設定
            this.heightMap[x][y] = 0.4;
          }
        }
      }
    }
    
    // 各建物から中央広場へ道路を伸ばす
    for (const room of this.rooms) {
      this.createRoad(room.doorX, room.doorY, centerX, centerY);
    }
    
    // 追加の道路を生成（建物同士を接続）
    const extraRoadCount = Math.floor(this.rooms.length * 0.5);
    for (let i = 0; i < extraRoadCount; i++) {
      const roomA = this.rooms[Math.floor(this.rng() * this.rooms.length)];
      const roomB = this.rooms[Math.floor(this.rng() * this.rooms.length)];
      
      if (roomA !== roomB) {
        this.createRoad(roomA.doorX, roomA.doorY, roomB.doorX, roomB.doorY);
      }
    }
  }

  /**
   * 町の道路を作成
   * @param {number} startX - 開始X座標
   * @param {number} startY - 開始Y座標
   * @param {number} endX - 終了X座標
   * @param {number} endY - 終了Y座標
   */
  createRoad(startX, startY, endX, endY) {
    const points = this.getLinePoints(startX, startY, endX, endY);
    const roadWidth = 1 + Math.floor(this.rng() * 2); // 道路の幅
    
    for (const point of points) {
      const { x, y } = point;
      
      // 道路の周辺を処理
      for (let dx = -roadWidth; dx <= roadWidth; dx++) {
        for (let dy = -roadWidth; dy <= roadWidth; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < this.options.width && ny >= 0 && ny < this.options.height) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= roadWidth) {
              // 道路は移動可能（既存の壁は上書きしない）
              if (this.objectPlacement[nx][ny] !== 4) {
                this.objectPlacement[nx][ny] = 0;
                
                // 道路の高さを設定
                this.heightMap[nx][ny] = 0.4 - (distance / roadWidth) * 0.05;
              }
            }
          }
        }
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
          this.objectPlacement[wallX][wallY] = 0;
          this.heightMap[wallX][wallY] = 0.4;
        } else {
          // 壁は移動不可
          this.objectPlacement[wallX][wallY] = 4; // 壁として設定
          this.heightMap[wallX][wallY] = 0.8;
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
    
    for (let x = centerX - fountainSize; x <= centerX + fountainSize; x++) {
      for (let y = centerY - fountainSize; y <= centerY + fountainSize; y++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter <= fountainSize) {
            // 噴水は障害物として配置
            this.objectPlacement[x][y] = 3; // 障害物
            
            // 噴水の高さを設定
            this.heightMap[x][y] = 0.5 + (1 - distFromCenter / fountainSize) * 0.3;
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
        // 既に何かが配置されていないかチェック（床のみに配置）
        if (this.objectPlacement[decorX][decorY] === 0) {
          // 装飾物を配置（移動不可）
          this.objectPlacement[decorX][decorY] = 3; // 障害物
          
          // 装飾物の高さを設定
          this.heightMap[decorX][decorY] = 0.6;
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
}

// MapGeneratorクラスにミックスイン
Object.assign(MapGenerator.prototype, {
  generateTownMap: TownMapGenerator.prototype.generateTownMap,
  generateTownBuildings: TownMapGenerator.prototype.generateTownBuildings,
  generateTownRoads: TownMapGenerator.prototype.generateTownRoads,
  createRoad: TownMapGenerator.prototype.createRoad,
  generateTownWalls: TownMapGenerator.prototype.generateTownWalls,
  addTownDecorations: TownMapGenerator.prototype.addTownDecorations,
  getLinePoints: TownMapGenerator.prototype.getLinePoints
});

export default MapGenerator;