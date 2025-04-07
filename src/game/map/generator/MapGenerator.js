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
      tileSize: 32, // タイルサイズ
      noiseScale: 0.1, // ノイズスケール
      roomMinSize: 5, // 部屋の最小サイズ
      roomMaxSize: 15, // 部屋の最大サイズ
      roomCount: 10, // 部屋の数
      enemyDensity: 0.05, // 敵の密度
      chestDensity: 0.02, // 宝箱の密度
      obstacleDensity: 0.01, // 障害物の密度
      wallDensity: 0.015, // 壁の密度
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
    
    // オブジェクト配置データ (0: 床, 1: 水, 2: 宝箱, 3: 障害物, 4: 壁)
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
    const arr = new Array(width);
    for (let x = 0; x < width; x++) {
      arr[x] = new Array(height).fill(defaultValue);
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
    
    // オブジェクト配置（宝箱と障害物のみ - 壁は各マップジェネレーターで処理済み）
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
   * 敵を配置
   * @param {string} mapType - マップタイプ
   */
  placeEnemies(mapType) {
    const { width, height, enemyDensity, difficultyLevel } = this.options;
    
    // マップタイプに応じて敵の配置密度や種類を調整
    let adjustedEnemyDensity = enemyDensity;
    let enemyTypeDistribution = {
      normal: 0.6,   // 通常の敵
      elite: 0.3,    // エリート敵
      boss: 0.1      // ボス敵
    };
    
    switch (mapType) {
      case 'dungeon':
        adjustedEnemyDensity *= 1.2;
        break;
      case 'field':
        adjustedEnemyDensity *= 0.8;
        enemyTypeDistribution.normal = 0.7;
        enemyTypeDistribution.elite = 0.25;
        enemyTypeDistribution.boss = 0.05;
        break;
      case 'arena':
        // アリーナにはボスを確実に配置
        if (difficultyLevel === 'hell') {
          // 最高難易度には複数のボスを配置
          enemyTypeDistribution.normal = 0.3;
          enemyTypeDistribution.elite = 0.4;
          enemyTypeDistribution.boss = 0.3;
        } else {
          enemyTypeDistribution.normal = 0.4;
          enemyTypeDistribution.elite = 0.4;
          enemyTypeDistribution.boss = 0.2;
        }
        break;
      case 'town':
        // 町には敵をほとんど配置しない
        adjustedEnemyDensity *= 0.1;
        enemyTypeDistribution.normal = 0.9;
        enemyTypeDistribution.elite = 0.1;
        enemyTypeDistribution.boss = 0;
        break;
    }
    
    // ボスの配置（アリーナの場合）
    if (mapType === 'arena') {
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      
      this.enemyPlacement.push({
        x: centerX,
        y: centerY,
        type: 'boss',
        level: difficultyLevel === 'hell' ? 3 : (difficultyLevel === 'nightmare' ? 2 : 1)
      });
    }
    
    // 残りの敵をランダムに配置
    const totalEnemies = Math.floor(width * height * adjustedEnemyDensity);
    let enemiesPlaced = this.enemyPlacement.length;
    
    while (enemiesPlaced < totalEnemies) {
      const x = Math.floor(this.rng() * width);
      const y = Math.floor(this.rng() * height);
      
      // 移動可能なスペースのみに敵を配置
      if (this.objectPlacement[x][y] === 0 && this.heightMap[x][y] >= 0.3) {
        // 敵の種類をランダムに決定
        const enemyRoll = this.rng();
        let enemyType;
        
        if (enemyRoll < enemyTypeDistribution.normal) {
          enemyType = 'normal';
        } else if (enemyRoll < enemyTypeDistribution.normal + enemyTypeDistribution.elite) {
          enemyType = 'elite';
        } else {
          enemyType = 'boss';
        }
        
        // 難易度に基づいて敵のレベルを調整
        let enemyLevel = 1;
        if (difficultyLevel === 'nightmare') {
          enemyLevel += this.rng() < 0.5 ? 1 : 0;
        } else if (difficultyLevel === 'hell') {
          enemyLevel += 1 + (this.rng() < 0.3 ? 1 : 0);
        }
        
        this.enemyPlacement.push({
          x, y, type: enemyType, level: enemyLevel
        });
        
        enemiesPlaced++;
      }
    }
  }

  /**
   * NPCを配置（主に町マップ用）
   */
  placeNPCs() {
    const { width, height, npcDensity } = this.options;
    
    // NPCの種類（職業など）
    const npcTypes = [
      'merchant', 'blacksmith', 'innkeeper', 'guard', 'citizen', 
      'questgiver', 'healer', 'elder', 'child', 'farmer'
    ];
    
    // NPCの総数
    const totalNPCs = Math.floor(width * height * npcDensity);
    
    // NPCをランダムに配置
    for (let i = 0; i < totalNPCs; i++) {
      const x = Math.floor(this.rng() * width);
      const y = Math.floor(this.rng() * height);
      
      // 移動可能なスペースのみにNPCを配置
      if (this.objectPlacement[x][y] === 0 && this.heightMap[x][y] >= 0.3) {
        // NPCの種類をランダムに決定
        const npcType = npcTypes[Math.floor(this.rng() * npcTypes.length)];
        
        // NPCの名前（本来は名前生成アルゴリズムを使用）
        const npcName = `NPC_${i}`;
        
        this.npcPlacement.push({
          x, y, type: npcType, name: npcName
        });
      }
    }
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
      console.warn('TensorFlow model initialization skipped');
      return {};
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