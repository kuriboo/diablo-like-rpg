import MapGenerator from '../MapGenerator';

/**
 * MapGeneratorのフィールド生成機能の拡張
 */
class FieldMapGenerator extends MapGenerator {
  /**
   * フィールドマップを生成（草原や荒野など）
   */
  generateFieldMap() {
    const { width, height, noiseScale } = this.options;
    
    // ノイズを使用して自然な地形を生成
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // simplex-noiseを使用して地形の高さを計算
        const baseNoise = this.noise2D(x * noiseScale, y * noiseScale);
        const detailNoise = this.noise2D(x * noiseScale * 4, y * noiseScale * 4) * 0.2;
        
        // 高さマップに設定（0.0～1.0の範囲）
        this.heightMap[x][y] = (baseNoise + detailNoise) * 0.5 + 0.5;
        
        // 地形の高さに基づいてオブジェクト配置を設定
        if (this.heightMap[x][y] < 0.3) {
          // 低地（水域など）- 移動不可能
          this.objectPlacement[x][y] = 3; // 移動不可能な障害物として設定
        } else if (this.heightMap[x][y] > 0.75) {
          // 高地（山や丘など）
          this.objectPlacement[x][y] = 3; // 移動不可能な障害物
        } else {
          // 中間地形（草原など）
          this.objectPlacement[x][y] = 0; // 基本は移動可能
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
    
    for (let x = centerX - size; x <= centerX + size; x++) {
      for (let y = centerY - size; y <= centerY + size; y++) {
        // 範囲内かつ円形の範囲内にあるかチェック
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distance <= size) {
            // 確率に基づいて木を配置
            if (this.rng() < density * (1 - distance / size)) {
              // 木を配置（移動できない障害物として）
              this.objectPlacement[x][y] = 3;
              // 木の高さを設定
              this.heightMap[x][y] = 0.6 + this.rng() * 0.3;
            } else {
              // 森の地面
              this.heightMap[x][y] = 0.4 + this.rng() * 0.1;
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
    
    for (let x = centerX - size; x <= centerX + size; x++) {
      for (let y = centerY - size; y <= centerY + size; y++) {
        // 範囲内かつ楕円形の範囲内にあるかチェック
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(((x - centerX) ** 2) / 1.5 + (y - centerY) ** 2);
          if (distance <= size) {
            // 湖の中心に近いほど深くなる
            const depth = 0.2 - (0.1 * distance / size); // 最大深度を0.2に設定
            this.heightMap[x][y] = depth;
            
            // 湖は全て移動不可
            this.objectPlacement[x][y] = 3;
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
      for (let dx = -pathWidth; dx <= pathWidth; dx++) {
        for (let dy = -pathWidth; dy <= pathWidth; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < this.options.width && ny >= 0 && ny < this.options.height) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= pathWidth) {
              // 小道は移動可能
              this.objectPlacement[nx][ny] = 0;
              
              // 小道の高さを少し低めに設定
              this.heightMap[nx][ny] = 0.4 - (distance / pathWidth) * 0.05;
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
}

// MapGeneratorクラスにミックスイン
Object.assign(MapGenerator.prototype, {
  generateFieldMap: FieldMapGenerator.prototype.generateFieldMap,
  createFieldFeatures: FieldMapGenerator.prototype.createFieldFeatures,
  createForest: FieldMapGenerator.prototype.createForest,
  createLake: FieldMapGenerator.prototype.createLake,
  createPath: FieldMapGenerator.prototype.createPath,
  getLinePoints: FieldMapGenerator.prototype.getLinePoints
});

export default MapGenerator;