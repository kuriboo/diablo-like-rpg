import MapGenerator from '../MapGenerator';

/**
 * MapGeneratorのオブジェクト配置機能の拡張
 */
class ObjectPlacementGenerator extends MapGenerator {
  /**
   * オブジェクト（宝箱、障害物など）を配置
   * @param {string} mapType - マップタイプ
   */
  placeObjects(mapType) {
    const { width, height, chestDensity, obstacleDensity, wallDensity } = this.options;
    
    // マップタイプに基づいてオブジェクト密度を調整
    let adjustedChestDensity = chestDensity;
    let adjustedObstacleDensity = obstacleDensity;
    let adjustedWallDensity = wallDensity;
    
    switch (mapType) {
      case 'dungeon':
        // ダンジョンは宝箱が多め、障害物は少なめ、壁は多め
        adjustedChestDensity *= 1.5;
        adjustedObstacleDensity *= 0.7;
        adjustedWallDensity *= 1.3;
        break;
      case 'field':
        // フィールドは自然の障害物が多め、壁は少なめ
        adjustedObstacleDensity *= 1.3;
        adjustedWallDensity *= 0.5;
        break;
      case 'arena':
        // アリーナは宝箱が少なく、障害物も少なめ、戦術的な壁
        adjustedChestDensity *= 0.5;
        adjustedObstacleDensity *= 0.5;
        adjustedWallDensity *= 0.8;
        break;
      case 'town':
        // 町は宝箱がほとんどなく、障害物も配置済み、壁は建物として多め
        adjustedChestDensity *= 0.1;
        adjustedObstacleDensity *= 0.2;
        adjustedWallDensity *= 1.5;
        break;
    }
    
    // マップを走査してオブジェクトを配置
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // 移動可能なスペースのみにオブジェクトを配置
        // 高さが0.3未満（水や溶岩）の場所にはオブジェクトを配置しない
        if (this.objectPlacement[x][y] === 0 && this.heightMap[x][y] >= 0.3) {
          // 宝箱を配置
          if (this.rng() < adjustedChestDensity) {
            this.objectPlacement[x][y] = 2; // 宝箱
          }
          // 壁を配置 (新しく壁のタイプとして4を使用)
          else if (this.rng() < adjustedWallDensity) {
            this.objectPlacement[x][y] = 4; // 壁
            this.placeMapSpecificWall(x, y, mapType);
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
   * マップタイプに応じた壁を配置
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} mapType - マップタイプ
   */
  placeMapSpecificWall(x, y, mapType) {
    const { width, height } = this.options;
    
    // 既に通行不可能なタイルには壁を配置しない
    if (this.heightMap[x][y] < 0.3) {
      return;
    }
    
    // 壁のタイプ
    let wallType = 4; // 壁
    
    // マップタイプに応じて壁のバリエーションや特性を調整できる
    switch (mapType) {
      case 'dungeon':
        // ダンジョンの壁（石壁など）
        this.heightMap[x][y] = Math.max(0.6, this.heightMap[x][y]); // 高めの壁
        break;
      case 'field':
        // フィールドの壁（岩壁や崖など）
        this.heightMap[x][y] = Math.max(0.7, this.heightMap[x][y]); // より高い壁
        break;
      case 'arena':
        // アリーナの壁（低い壁、柵など）
        this.heightMap[x][y] = Math.max(0.5, this.heightMap[x][y]); // 低めの壁
        break;
      case 'town':
        // 町の壁（建物の壁や塀など）
        this.heightMap[x][y] = Math.max(0.65, this.heightMap[x][y]); // 標準的な高さ
        break;
    }
    
    // 壁を配置
    this.objectPlacement[x][y] = wallType;
  }

  /**
   * マップタイプに応じた障害物を配置
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} mapType - マップタイプ
   */
  placeMapSpecificObstacle(x, y, mapType) {
    const { width, height } = this.options;
    
    // 既に通行不可能なタイルには障害物を配置しない
    if (this.heightMap[x][y] < 0.3) {
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
  placeMapSpecificWall: ObjectPlacementGenerator.prototype.placeMapSpecificWall,
  placeMapSpecificObstacle: ObjectPlacementGenerator.prototype.placeMapSpecificObstacle
});

export default MapGenerator;