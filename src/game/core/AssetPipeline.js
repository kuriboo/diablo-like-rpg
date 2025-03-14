// src/game/core/AssetPipeline.js
import AssetManager from './AssetManager';
import AnimationFactory from '../factories/AnimationFactory';
import ObjectFactory from '../factories/ObjectFactory';

/**
 * アセットパイプライン
 * ロードされたアセットをゲームオブジェクトに適用するためのパイプライン
 */
export default class AssetPipeline {
  constructor(scene) {
    this.scene = scene;
    this.isInitialized = false;
    
    // 各マネージャー・ファクトリーの初期化
    this.assetManager = null;
    this.animationFactory = null;
    this.objectFactory = null;
    
    // 依存関係のあるコンポーネント
    this.requiredComponents = [
      'textures',      // テクスチャ管理
      'anims',         // アニメーション管理
      'sound',         // サウンド管理
      'add',           // ゲームオブジェクト追加
      'physics'        // 物理演算
    ];
  }
  
  /**
   * パイプラインの初期化
   * @returns {boolean} - 初期化が成功したかどうか
   */
  initialize() {
    if (this.isInitialized) return true;
    
    console.log('AssetPipeline: Initializing...');
    
    // シーンの有効性チェック
    if (!this.scene) {
      console.error('AssetPipeline: No scene provided.');
      return false;
    }
    
    // 必要なコンポーネントのチェック
    for (const component of this.requiredComponents) {
      if (!this.scene[component]) {
        console.error(`AssetPipeline: Scene is missing required component '${component}'.`);
        return false;
      }
    }
    
    try {
      // 各マネージャー・ファクトリーの初期化
      this.assetManager = new AssetManager(this.scene);
      this.animationFactory = new AnimationFactory(this.scene);
      this.objectFactory = new ObjectFactory(this.scene);
      
      this.isInitialized = true;
      console.log('AssetPipeline: Initialization complete.');
      return true;
    } catch (error) {
      console.error('AssetPipeline: Initialization failed', error);
      return false;
    }
  }
  
  /**
   * プレイヤーの作成
   * @param {object} config - プレイヤー設定
   * @returns {Player} - プレイヤーインスタンス
   */
  createPlayer(config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.objectFactory.createPlayer(config);
  }
  
  /**
   * 敵の作成
   * @param {object} config - 敵設定
   * @returns {Enemy} - 敵インスタンス
   */
  createEnemy(config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.objectFactory.createEnemy(config);
  }
  
  /**
   * NPCの作成
   * @param {object} config - NPC設定
   * @returns {NPC} - NPCインスタンス
   */
  createNPC(config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.objectFactory.createNPC(config);
  }
  
  /**
   * アイテムの作成
   * @param {object} config - アイテム設定
   * @returns {Item} - アイテムインスタンス
   */
  createItem(config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.objectFactory.createItem(config);
  }
  
  /**
   * 装備品の作成
   * @param {object} config - 装備品設定
   * @returns {Equipment} - 装備品インスタンス
   */
  createEquipment(config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.objectFactory.createEquipment(config);
  }
  
  /**
   * 障害物の作成
   * @param {object} config - 障害物設定
   * @returns {Obstacle} - 障害物インスタンス
   */
  createObstacle(config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.objectFactory.createObstacle(config);
  }
  
  /**
   * エフェクトの作成
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} effectType - エフェクトタイプ
   * @returns {Phaser.GameObjects.Sprite} - エフェクトスプライト
   */
  createEffect(x, y, effectType) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.objectFactory.createEffect(x, y, effectType);
  }
  
  /**
   * BGMの再生
   * @param {string} trackName - トラック名
   * @param {object} config - 再生設定
   * @returns {Phaser.Sound.BaseSound} - サウンドオブジェクト
   */
  playBGM(trackName, config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.assetManager.playBGM(trackName, config);
  }
  
  /**
   * 効果音の再生
   * @param {string} soundName - 効果音名
   * @param {object} config - 再生設定
   * @returns {Phaser.Sound.BaseSound} - サウンドオブジェクト
   */
  playSFX(soundName, config = {}) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    return this.assetManager.playSound('sfx', soundName, config);
  }
  
  /**
   * マップにオブジェクトを配置
   * @param {Phaser.GameObjects.GameObject} object - 配置するオブジェクト
   * @param {Phaser.Tilemaps.Tilemap} tilemap - タイルマップ
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   */
  placeObjectOnMap(object, tilemap, tileX, tileY) {
    if (!this.isInitialized && !this.initialize()) {
      return;
    }
    
    this.objectFactory.placeObjectAtTile(object, tilemap, tileX, tileY);
  }
  
  /**
   * ゲームマップのセットアップ（タイルとオブジェクト）
   * @param {object} mapData - マップデータ
   * @param {Phaser.Tilemaps.Tilemap} tilemap - タイルマップ
   * @returns {object} - 生成されたオブジェクトのコレクション
   */
  setupGameMap(mapData, tilemap) {
    if (!this.isInitialized && !this.initialize()) {
      return null;
    }
    
    const gameObjects = {
      enemies: [],
      npcs: [],
      items: [],
      obstacles: []
    };
    
    try {
      // マップデータに含まれるオブジェクトを配置
      if (mapData.objects) {
        // 敵の配置
        if (mapData.objects.enemies) {
          mapData.objects.enemies.forEach(enemyData => {
            const enemy = this.createEnemy({
              ...enemyData,
              x: 0,
              y: 0
            });
            
            if (enemy) {
              this.placeObjectOnMap(enemy, tilemap, enemyData.tileX, enemyData.tileY);
              gameObjects.enemies.push(enemy);
            }
          });
        }
        
        // NPCの配置
        if (mapData.objects.npcs) {
          mapData.objects.npcs.forEach(npcData => {
            const npc = this.createNPC({
              ...npcData,
              x: 0,
              y: 0
            });
            
            if (npc) {
              this.placeObjectOnMap(npc, tilemap, npcData.tileX, npcData.tileY);
              gameObjects.npcs.push(npc);
            }
          });
        }
        
        // アイテムの配置
        if (mapData.objects.items) {
          mapData.objects.items.forEach(itemData => {
            const item = this.createItem({
              ...itemData,
              x: 0,
              y: 0
            });
            
            if (item) {
              this.placeObjectOnMap(item, tilemap, itemData.tileX, itemData.tileY);
              gameObjects.items.push(item);
            }
          });
        }
        
        // 障害物の配置
        if (mapData.objects.obstacles) {
          mapData.objects.obstacles.forEach(obstacleData => {
            const obstacle = this.createObstacle({
              ...obstacleData,
              x: 0,
              y: 0
            });
            
            if (obstacle) {
              this.placeObjectOnMap(obstacle, tilemap, obstacleData.tileX, obstacleData.tileY);
              gameObjects.obstacles.push(obstacle);
            }
          });
        }
      }
      
      console.log('AssetPipeline: Game map setup complete.', gameObjects);
      return gameObjects;
      
    } catch (error) {
      console.error('AssetPipeline: Failed to setup game map', error);
      return gameObjects;
    }
  }
  
  /**
   * キャラクターの向きに応じたアニメーション設定
   * @param {Character} character - キャラクター
   * @param {string} action - アクション（'idle', 'walk'など）
   * @param {string} direction - 方向（'down', 'up', 'left', 'right'）
   */
  setCharacterDirectionalAnimation(character, action, direction) {
    if (!character || !action || !direction) return;
    
    // キャラクタータイプとサブタイプの取得
    let type = 'player';
    let subtype = 'warrior';
    
    if (character.constructor.name === 'Player') {
      type = 'player';
      subtype = character.classType ? character.classType.name.toLowerCase() : 'warrior';
    } else if (character.constructor.name === 'Enemy') {
      type = 'enemy';
      subtype = character.enemyType || 'skeleton';
    } else if (character.constructor.name === 'NPC') {
      type = 'npc';
      subtype = character.npcType || 'villager';
    }
    
    // 方向付きアニメーションキー
    const animKey = `${type}_${subtype}_${action}_${direction}`;
    
    // 方向付きアニメーションがあればそれを使用
    if (this.scene.anims.exists(animKey)) {
      character.anims.play(animKey, true);
    } else {
      // なければ通常のアニメーションを使用
      const fallbackKey = `${type}_${subtype}_${action}`;
      if (this.scene.anims.exists(fallbackKey)) {
        character.anims.play(fallbackKey, true);
      }
    }
  }
  
  /**
   * アセットパイプラインのクリーンアップ
   */
  cleanup() {
    if (this.assetManager) {
      // BGMの停止など
      this.assetManager.stopAllSounds();
    }
    
    if (this.animationFactory) {
      // アニメーションのリセット
      this.animationFactory.resetAnimations();
    }
    
    this.isInitialized = false;
    console.log('AssetPipeline: Cleanup complete.');
  }
}