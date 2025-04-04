// MapFactoryクラス
class MapFactory {
    /**
     * マップタイプに応じた最適なパラメータを取得
     * @param {string} mapType - マップタイプ
     * @param {object} customOptions - カスタムオプション（オプション）
     * @returns {object} 最適化されたパラメータ
     */
    static getMapParameters(mapType, customOptions = {}) {
      // デフォルトパラメータ
      const defaultParams = {
        seed: Math.random(),
        tileSize: 32,
        difficultyLevel: 'normal'
      };
      
      // マップタイプに応じたパラメータ
      let typeParams = {};
      
      switch (mapType) {
        case 'dungeon':
          typeParams = {
            width: 80,
            height: 80,
            noiseScale: 0.08,
            roomMinSize: 5,
            roomMaxSize: 15,
            roomCount: 12,
            enemyDensity: 0.06,
            chestDensity: 0.03,
            obstacleDensity: 0.015,
            wallDensity: 0.025, // ダンジョンは壁が多め
            npcDensity: 0.005
          };
          break;
          
        case 'field':
          typeParams = {
            width: 120,
            height: 120,
            noiseScale: 0.05,
            roomMinSize: 0,
            roomMaxSize: 0,
            roomCount: 0,
            enemyDensity: 0.04,
            chestDensity: 0.01,
            obstacleDensity: 0.025,
            wallDensity: 0.01, // フィールドは壁が少なめ
            npcDensity: 0.008
          };
          break;
          
        case 'arena':
          typeParams = {
            width: 60,
            height: 60,
            noiseScale: 0.1,
            roomMinSize: 20,
            roomMaxSize: 40,
            roomCount: 1,
            enemyDensity: 0.08,
            chestDensity: 0.005,
            obstacleDensity: 0.02,
            wallDensity: 0.015, // アリーナは適度な壁
            npcDensity: 0.001
          };
          break;
          
        case 'town':
          typeParams = {
            width: 100,
            height: 100,
            noiseScale: 0.03,
            roomMinSize: 6,
            roomMaxSize: 12,
            roomCount: 15,
            enemyDensity: 0.01,
            chestDensity: 0.005,
            obstacleDensity: 0.02,
            wallDensity: 0.03, // 町は壁/建物が多め
            npcDensity: 0.05
          };
          break;
      }
      
      // デフォルト + タイプ別 + カスタムオプションを結合
      return {
        ...defaultParams,
        ...typeParams,
        ...customOptions
      };
    }
    
    /**
     * マップを作成
     * @param {string} mapType - マップタイプ
     * @param {object} customOptions - カスタムオプション（オプション）
     * @returns {object} 生成されたマップ
     */
    static createMap(mapType, customOptions = {}) {
      // パラメータを取得
      const parameters = this.getMapParameters(mapType, customOptions);
      
      // MapGeneratorを使用してマップを生成
      const generator = new MapGenerator(parameters);
      return generator.generateMap(mapType);
    }
    
    /**
     * 難易度に応じたマップを作成
     * @param {string} mapType - マップタイプ
     * @param {string} difficulty - 難易度（normal, nightmare, hell）
     * @param {object} customOptions - カスタムオプション（オプション）
     * @returns {object} 生成されたマップ
     */
    static createMapWithDifficulty(mapType, difficulty, customOptions = {}) {
      return this.createMap(mapType, {
        difficultyLevel: difficulty,
        ...customOptions
      });
    }
    
    /**
     * シード値を指定してマップを作成（再現性のため）
     * @param {string} mapType - マップタイプ
     * @param {number} seed - シード値
     * @param {object} customOptions - カスタムオプション（オプション）
     * @returns {object} 生成されたマップ
     */
    static createMapWithSeed(mapType, seed, customOptions = {}) {
      return this.createMap(mapType, {
        seed: seed,
        ...customOptions
      });
    }
  }