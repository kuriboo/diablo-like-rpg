import MapGenerator from '../MapGenerator';

/**
 * MapGeneratorのオブジェクト配置機能の拡張
 * 各マップジェネレーターの仕様に沿ってオブジェクトのみを配置
 */
class ObjectPlacementGenerator extends MapGenerator {
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
    
    // マップを走査してオブジェクトを配置（壁以外）
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // 移動可能なスペースのみにオブジェクトを配置
        // 高さが0.3未満（水や溶岩）の場所や壁(4)にはオブジェクトを配置しない
        if (this.objectPlacement[x][y] === 0 && this.heightMap[x][y] >= 0.3) {
          // 宝箱を配置
          if (this.rng() < adjustedChestDensity) {
            this.objectPlacement[x][y] = 2; // 宝箱
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
    // 既に通行不可能なタイルには障害物を配置しない
    if (this.heightMap[x][y] < 0.3 || this.objectPlacement[x][y] !== 0) {
      return;
    }
    
    // デフォルトは通常の障害物
    let obstacleType = 3; // 障害物（壁ではない）
    
    // マップタイプに応じて調整
    switch (mapType) {
      case 'dungeon':
        // ダンジョンの障害物（落石、破壊された柱など）
        this.heightMap[x][y] = Math.max(0.4, this.heightMap[x][y]); // 障害物は壁より低め
        break;
      case 'field':
        // フィールドの障害物（岩、低木など）
        this.heightMap[x][y] = Math.max(0.4, this.heightMap[x][y]);
        break;
      case 'arena':
        // アリーナの障害物（壊れた武器、盾など）
        this.heightMap[x][y] = Math.max(0.35, this.heightMap[x][y]); // 低めの障害物
        break;
      case 'town':
        // 町の障害物（樽、荷車など）
        this.heightMap[x][y] = Math.max(0.4, this.heightMap[x][y]);
        break;
    }
    
    // 障害物を配置
    this.objectPlacement[x][y] = obstacleType;
  }
}

// MapGeneratorクラスにミックスイン
Object.assign(MapGenerator.prototype, {
  placeObjects: ObjectPlacementGenerator.prototype.placeObjects,
  placeMapSpecificObstacle: ObjectPlacementGenerator.prototype.placeMapSpecificObstacle
});

export default MapGenerator;