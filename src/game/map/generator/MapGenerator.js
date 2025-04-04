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
      wallDensity: 0.015, // 壁の密度（新しく追加）
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