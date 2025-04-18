import MapGenerator from '../MapGenerator';

/**
 * MapGeneratorのアリーナ生成機能の拡張
 */
class ArenaMapGenerator extends MapGenerator {
  /**
   * アリーナマップを生成（ボス戦用の広い空間）
   */
  generateArenaMap() {
    const { width, height, noiseScale, wallDensity } = this.options;
    const adjustedWallDensity = wallDensity * 0.8; // アリーナは戦術的な壁を配置
    
    // まず全体を壁で埋める
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        this.objectPlacement[x][y] = 4; // 壁
        this.heightMap[x][y] = 0.7 + this.noise2D(x * noiseScale, y * noiseScale) * 0.2;
      }
    }
    
    // 中央に広い空間を作り、周囲に壁や障害物を配置
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const arenaRadius = Math.min(width, height) * 0.4; // マップサイズの40%を使用
    
    // アリーナの中央部分を空けていく
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (distance < arenaRadius) {
          // アリーナ内部（移動可能）
          this.objectPlacement[x][y] = 0;
          
          // ノイズを使って高さに微妙な変化をつける
          const noise = this.noise2D(x * noiseScale * 2, y * noiseScale * 2) * 0.1;
          this.heightMap[x][y] = 0.4 + noise;
          
          // ボス戦用の特徴を追加（例：中央の台座など）
          if (distance < arenaRadius * 0.2) {
            // 中央の台座を高くする
            this.heightMap[x][y] += 0.1;
          }
        } else if (distance < arenaRadius + 5) {
          // アリーナの外周（壁との緩衝地帯）
          this.objectPlacement[x][y] = 0;
          
          // 外周の高さを調整
          const gradientFactor = (distance - arenaRadius) / 5;
          this.heightMap[x][y] = 0.4 + gradientFactor * 0.3;
        }
      }
    }
    
    // アリーナ内に戦略的な壁や柱を配置
    this.addArenaFeatures(centerX, centerY, arenaRadius, adjustedWallDensity);
    
    // 入口を作成
    this.createArenaEntrance(centerX, centerY, arenaRadius);
  }

  /**
   * アリーナ内の特徴を追加
   * @param {number} centerX - アリーナの中心X座標
   * @param {number} centerY - アリーナの中心Y座標
   * @param {number} radius - アリーナの半径
   * @param {number} wallDensity - 壁の密度
   */
  addArenaFeatures(centerX, centerY, radius, wallDensity) {
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
      for (let x = pillarX - pillarSize; x <= pillarX + pillarSize; x++) {
        for (let y = pillarY - pillarSize; y <= pillarY + pillarSize; y++) {
          if (x >= 0 && x < this.options.width && y >= 0 && y < this.options.height) {
            const distFromPillar = Math.sqrt((x - pillarX) ** 2 + (y - pillarY) ** 2);
            
            if (distFromPillar <= pillarSize) {
              // ここで壁と障害物の区別をつける
              // 低い柱は障害物、高い柱は壁として扱う
              if (this.rng() < 0.7) {
                this.objectPlacement[x][y] = 4; // 壁として柱を設置
                this.heightMap[x][y] = 0.7 + this.rng() * 0.2;
              } else {
                this.objectPlacement[x][y] = 3; // 障害物として設置
                this.heightMap[x][y] = 0.5 + this.rng() * 0.2;
              }
            }
          }
        }
      }
    }
    
    // ボス戦用の特殊要素（例：中央の祭壇など）
    const altarSize = Math.floor(radius * 0.15);
    
    for (let x = centerX - altarSize; x <= centerX + altarSize; x++) {
      for (let y = centerY - altarSize; y <= centerY + altarSize; y++) {
        if (x >= 0 && x < this.options.width && y >= 0 && y < this.options.height) {
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (distFromCenter <= altarSize) {
            // 祭壇の高さを設定（中心ほど高い）
            const heightFactor = 1 - (distFromCenter / altarSize);
            this.heightMap[x][y] = 0.5 + heightFactor * 0.2;
            
            // 祭壇は移動可能
            this.objectPlacement[x][y] = 0;
          }
        }
      }
    }
    
    // 追加の小さい壁を配置（戦略的なカバーとして）
    const additionalWallCount = Math.floor(pillarCount * 1.5);
    for (let i = 0; i < additionalWallCount; i++) {
      const angle = this.rng() * Math.PI * 2;
      const distance = radius * (0.4 + this.rng() * 0.4);
      
      const wallX = Math.floor(centerX + Math.cos(angle) * distance);
      const wallY = Math.floor(centerY + Math.sin(angle) * distance);
      
      // 壁のサイズ（小さいものにする）
      const wallSize = Math.floor(this.rng() * 2) + 1;
      
      // 壁の方向（水平または垂直）
      const isHorizontal = this.rng() < 0.5;
      
      // 戦略的な小さい壁を配置
      if (isHorizontal) {
        for (let x = wallX - wallSize; x <= wallX + wallSize; x++) {
          if (x >= 0 && x < this.options.width && this.objectPlacement[x][wallY] === 0) {
            this.objectPlacement[x][wallY] = 4; // 壁
            this.heightMap[x][wallY] = 0.6 + this.rng() * 0.1;
          }
        }
      } else {
        for (let y = wallY - wallSize; y <= wallY + wallSize; y++) {
          if (y >= 0 && y < this.options.height && this.objectPlacement[wallX][y] === 0) {
            this.objectPlacement[wallX][y] = 4; // 壁
            this.heightMap[wallX][y] = 0.6 + this.rng() * 0.1;
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
        this.objectPlacement[x][y] = 0;
        this.heightMap[x][y] = 0.4 + this.noise2D(x * 0.1, y * 0.1) * 0.1;
        
        // 通路の両側に壁を作成
        const perpX = Math.sin(entranceAngle);
        const perpY = -Math.cos(entranceAngle);
        
        for (let side = -1; side <= 1; side += 2) {
          const wallX = Math.floor(x + perpX * side);
          const wallY = Math.floor(y + perpY * side);
          
          if (wallX >= 0 && wallX < width && wallY >= 0 && wallY < height) {
            this.objectPlacement[wallX][wallY] = 4; // 壁
            this.heightMap[wallX][wallY] = 0.7 + this.noise2D(wallX * 0.1, wallY * 0.1) * 0.2;
          }
        }
      }
    }
  }
}

// MapGeneratorクラスにミックスイン
Object.assign(MapGenerator.prototype, {
  generateArenaMap: ArenaMapGenerator.prototype.generateArenaMap,
  addArenaFeatures: ArenaMapGenerator.prototype.addArenaFeatures,
  createArenaEntrance: ArenaMapGenerator.prototype.createArenaEntrance
});

export default MapGenerator;