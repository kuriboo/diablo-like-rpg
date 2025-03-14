// src/game/core/ObjectFactory.js
import AssetManager from '../core/AssetManager';
import AnimationFactory from './AnimationFactory';
import Player from '../characters/Player';
import Enemy from '../characters/Enemy';
import NPC from '../characters/NPC';
import Item from '../objects/Item';
import Equipment from '../objects/Equipment';
import Obstacle from '../objects/Obstacle';

/**
 * オブジェクトファクトリー
 * ゲーム内のさまざまなオブジェクト（キャラクター、アイテム、障害物など）を生成する
 */
export default class ObjectFactory {
  constructor(scene) {
    this.scene = scene;
    this.assetManager = new AssetManager(scene);
    this.animationFactory = new AnimationFactory(scene);
    
    // オブジェクトのデフォルト設定
    this.defaultConfig = {
      player: {
        scale: 1,
        depth: 10,
        health: 100,
        mana: 50,
        speed: 120
      },
      enemy: {
        scale: 1,
        depth: 10,
        health: 50,
        speed: 80
      },
      npc: {
        scale: 1,
        depth: 10,
        speed: 60
      },
      item: {
        scale: 0.8,
        depth: 5
      },
      obstacle: {
        scale: 1,
        depth: 8
      }
    };
  }
  
  /**
   * プレイヤーキャラクターの作成
   * @param {object} config - プレイヤー設定
   * @returns {Player} - プレイヤーインスタンス
   */
  createPlayer(config = {}) {
    const defaultConfig = this.defaultConfig.player;
    
    // クラスタイプの決定
    const classType = config.classType || 'warrior';
    
    // テクスチャキーの取得
    const textureKey = this.assetManager.getTextureKey('player', classType) || 'player_warrior';
    
    // プレイヤーインスタンスの作成
    const player = new Player(
      this.scene,
      config.x || 0,
      config.y || 0,
      textureKey,
      {
        ...defaultConfig,
        ...config,
        classType: classType // 明示的にクラスタイプを設定
      }
    );
    
    // スケールとデプスの設定
    player.setScale(config.scale || defaultConfig.scale);
    player.setDepth(config.depth || defaultConfig.depth);
    
    // アニメーションの初期化
    this.setupCharacterAnimations(player, 'player', classType);
    
    // 初期アニメーション再生
    player.anims.play(`player_${classType}_idle`, true);
    
    return player;
  }
  
  /**
   * 敵キャラクターの作成
   * @param {object} config - 敵設定
   * @returns {Enemy} - 敵インスタンス
   */
  createEnemy(config = {}) {
    const defaultConfig = this.defaultConfig.enemy;
    
    // 敵タイプの決定
    const enemyType = config.enemyType || 'skeleton';
    
    // テクスチャキーの取得
    const textureKey = this.assetManager.getTextureKey('enemy', enemyType) || 'enemy_skeleton';
    
    // 敵インスタンスの作成
    const enemy = new Enemy(
      this.scene,
      config.x || 0,
      config.y || 0,
      textureKey,
      {
        ...defaultConfig,
        ...config,
        enemyType: enemyType
      }
    );
    
    // スケールとデプスの設定
    enemy.setScale(config.scale || defaultConfig.scale);
    enemy.setDepth(config.depth || defaultConfig.depth);
    
    // アニメーションの初期化
    this.setupCharacterAnimations(enemy, 'enemy', enemyType);
    
    // 初期アニメーション再生
    enemy.anims.play(`enemy_${enemyType}_idle`, true);
    
    return enemy;
  }
  
  /**
   * NPCの作成
   * @param {object} config - NPC設定
   * @returns {NPC} - NPCインスタンス
   */
  createNPC(config = {}) {
    const defaultConfig = this.defaultConfig.npc;
    
    // NPCタイプの決定
    const npcType = config.npcType || 'villager';
    
    // テクスチャキーの取得
    const textureKey = this.assetManager.getTextureKey('npc', npcType) || 'npc_villager';
    
    // NPCインスタンスの作成
    const npc = new NPC(
      this.scene,
      config.x || 0,
      config.y || 0,
      textureKey,
      {
        ...defaultConfig,
        ...config,
        npcType: npcType
      }
    );
    
    // スケールとデプスの設定
    npc.setScale(config.scale || defaultConfig.scale);
    npc.setDepth(config.depth || defaultConfig.depth);
    
    // NPCの場合はアニメーションが限られている可能性があるため、
    // 対応するアニメーションがある場合のみ設定
    if (this.scene.anims.exists(`npc_${npcType}_idle`)) {
      npc.anims.play(`npc_${npcType}_idle`, true);
    }
    
    return npc;
  }
  
  /**
   * アイテムの作成
   * @param {object} config - アイテム設定
   * @returns {Item} - アイテムインスタンス
   */
  createItem(config = {}) {
    const defaultConfig = this.defaultConfig.item;
    
    // アイテムタイプの決定
    const itemType = config.itemType || 'potion_health';
    
    // テクスチャキーの取得
    const textureKey = this.assetManager.getTextureKey('item', itemType) || 'item_potion_health';
    
    // アイテムインスタンスの作成
    const item = new Item(
      this.scene,
      config.x || 0,
      config.y || 0,
      textureKey,
      {
        ...defaultConfig,
        ...config,
        itemType: itemType
      }
    );
    
    // スケールとデプスの設定
    item.setScale(config.scale || defaultConfig.scale);
    item.setDepth(config.depth || defaultConfig.depth);
    
    // アイテムの輝きエフェクトなど
    this.addItemEffects(item, itemType);
    
    return item;
  }
  
  /**
   * 装備品の作成
   * @param {object} config - 装備品設定
   * @returns {Equipment} - 装備品インスタンス
   */
  createEquipment(config = {}) {
    const defaultConfig = this.defaultConfig.item;
    
    // 装備品タイプの決定
    const equipType = config.equipType || 'weapon_sword';
    
    // テクスチャキーの取得
    const textureKey = this.assetManager.getTextureKey('item', equipType) || 'item_weapon_sword';
    
    // 装備品インスタンスの作成
    const equipment = new Equipment(
      this.scene,
      config.x || 0,
      config.y || 0,
      textureKey,
      {
        ...defaultConfig,
        ...config,
        equipType: equipType
      }
    );
    
    // スケールとデプスの設定
    equipment.setScale(config.scale || defaultConfig.scale);
    equipment.setDepth(config.depth || defaultConfig.depth);
    
    // 装備品の輝きエフェクトなど
    this.addItemEffects(equipment, equipType);
    
    return equipment;
  }
  
  /**
   * 障害物の作成
   * @param {object} config - 障害物設定
   * @returns {Obstacle} - 障害物インスタンス
   */
  createObstacle(config = {}) {
    const defaultConfig = this.defaultConfig.obstacle;
    
    // 障害物タイプの決定
    const obstacleType = config.obstacleType || 'tree';
    
    // テクスチャキーの取得
    const textureKey = this.assetManager.getTextureKey('obstacle', obstacleType) || 'obstacle_tree';
    
    // 障害物インスタンスの作成
    const obstacle = new Obstacle(
      this.scene,
      config.x || 0,
      config.y || 0,
      textureKey,
      {
        ...defaultConfig,
        ...config,
        obstacleType: obstacleType
      }
    );
    
    // スケールとデプスの設定
    obstacle.setScale(config.scale || defaultConfig.scale);
    obstacle.setDepth(config.depth || defaultConfig.depth);
    
    // 障害物の破壊可能フラグなど
    if (config.breakable) {
      obstacle.setBreakable(true);
      
      // 破壊可能な障害物のアニメーション設定
      this.setupObstacleAnimations(obstacle, obstacleType);
    }
    
    return obstacle;
  }
  
  /**
   * キャラクターアニメーションのセットアップ
   * @param {Phaser.GameObjects.Sprite} character - キャラクター
   * @param {string} type - キャラクタータイプ（'player', 'enemy'など）
   * @param {string} subtype - サブタイプ（'warrior', 'skeleton'など）
   */
  setupCharacterAnimations(character, type, subtype) {
    // アクションリスト
    const actions = ['idle', 'walk', 'attack', 'hurt', 'death'];
    
    // 各アクションのアニメーションを作成
    actions.forEach(action => {
      this.animationFactory.setCharacterAnimation(character, type, subtype, action, false);
    });
    
    // キャラクターにアニメーションイベントを追加
    this.addCharacterAnimationEvents(character);
  }
  
  /**
   * 障害物のアニメーションセットアップ
   * @param {Obstacle} obstacle - 障害物
   * @param {string} type - 障害物タイプ
   */
  setupObstacleAnimations(obstacle, type) {
    // 破壊アニメーションがあれば追加
    const breakFrames = this.scene.anims.generateFrameNumbers(`obstacle_${type}_break`, { start: 0, end: 5 });
    
    if (breakFrames && breakFrames.length > 0) {
      this.scene.anims.create({
        key: `obstacle_${type}_break`,
        frames: breakFrames,
        frameRate: 10,
        repeat: 0
      });
    }
  }
  
  /**
   * キャラクターにアニメーションイベントを追加
   * @param {Phaser.GameObjects.Sprite} character - キャラクター
   */
  addCharacterAnimationEvents(character) {
    // アニメーション完了イベント
    character.on('animationcomplete', (anim) => {
      // 攻撃アニメーション完了後はアイドル状態に戻る
      if (anim.key.includes('_attack')) {
        const parts = anim.key.split('_');
        const type = parts[0];
        const subtype = parts[1];
        character.anims.play(`${type}_${subtype}_idle`, true);
      }
      
      // 被ダメージアニメーション完了後もアイドル状態に戻る
      if (anim.key.includes('_hurt')) {
        const parts = anim.key.split('_');
        const type = parts[0];
        const subtype = parts[1];
        character.anims.play(`${type}_${subtype}_idle`, true);
      }
    });
  }
  
  /**
   * アイテムに効果を追加
   * @param {Item} item - アイテム
   * @param {string} type - アイテムタイプ
   */
  addItemEffects(item, type) {
    // レア度に応じた輝きエフェクト
    if (item.rarity && item.rarity > 1) {
      // 輝きパーティクルの作成（利用可能な場合）
      if (this.scene.add.particles) {
        const particleColors = {
          1: 0xffffff, // 通常
          2: 0x0000ff, // レア
          3: 0xff00ff, // エピック
          4: 0xff9900  // レジェンダリー
        };
        
        const color = particleColors[item.rarity] || 0xffffff;
        
        const particles = this.scene.add.particles(item.x, item.y, 'particle', {
          tint: color,
          lifespan: 2000,
          speed: { min: 20, max: 30 },
          scale: { start: 0.3, end: 0 },
          quantity: 1,
          frequency: 500
        });
        
        // パーティクルをアイテムに追従させる
        item.particleEffect = particles;
        item.once('destroy', () => {
          if (particles) particles.destroy();
        });
      }
    }
    
    // アイテム浮遊アニメーション
    this.scene.tweens.add({
      targets: item,
      y: item.y - 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  /**
   * エフェクトの作成
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} effectType - エフェクトタイプ
   * @returns {Phaser.GameObjects.Sprite} - エフェクトスプライト
   */
  createEffect(x, y, effectType) {
    return this.animationFactory.playEffect(x, y, effectType);
  }
  
  /**
   * オブジェクトをワールド座標に配置
   * @param {Phaser.GameObjects.GameObject} object - 配置するオブジェクト
   * @param {Phaser.Tilemaps.Tilemap} tilemap - タイルマップ
   * @param {number} tileX - タイルX座標
   * @param {number} tileY - タイルY座標
   */
  placeObjectAtTile(object, tilemap, tileX, tileY) {
    const worldPos = tilemap.tileToWorldXY(tileX, tileY);
    object.setPosition(worldPos.x, worldPos.y);
  }
}