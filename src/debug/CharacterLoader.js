/**
 * CharacterLoader.js - PlaceholderAssetsとの連携を強化したキャラクターローダー
 * 
 * キャラクターごとのタイプ（warrior, rogue, sorcerer, etc.）、動作（idle, walk, attack, etc.）
 * 方向（up, down, left, right）に応じたプレースホルダーアニメーションを生成する機能を提供します。
 */

import PlaceholderAssets from './PlaceholderAssets';

class CharacterLoader {
  constructor() {
    // シングルトンの実装のため、インスタンスは一度だけ生成
    if (CharacterLoader.instance) {
      return CharacterLoader.instance;
    }
    
    // インスタンスをstaticプロパティに格納
    CharacterLoader.instance = this;
    
    this.scene = null;
    this.initialized = false;
    
    // キャラクタータイプと色のマッピング
    this.characterColors = {
      player: {
        warrior: 0x8B0000,  // 暗い赤
        rogue: 0x006400,    // 暗い緑
        sorcerer: 0x00008B, // 暗い青
        ranger: 0x8B008B,   // 暗い紫
        paladin: 0xFFD700   // 金
      },
      companion: {
        warrior: 0xCD5C5C,  // インディアンレッド（プレイヤーより明るい）
        rogue: 0x32CD32,    // ライムグリーン（プレイヤーより明るい）
        sorcerer: 0x4169E1, // ロイヤルブルー（プレイヤーより明るい）
        ranger: 0xDA70D6,   // オーキッド（プレイヤーより明るい）
        paladin: 0xFFE4B5   // モカシン（プレイヤーより明るい）
      },
      enemy: {
        skeleton: 0xBDBDBD,  // 薄い灰色
        zombie: 0x556B2F,    // オリーブ
        ghost: 0xE6E6FA,     // 薄い紫
        spider: 0x800080,    // 紫
        slime: 0x00FF7F,     // 春の緑
        wolf: 0x8B4513,      // サドルブラウン
        boss: 0xFF0000       // 赤
      },
      npc: {
        villager: 0xFFD700,   // 金色
        guard: 0x4682B4,      // スティールブルー
        blacksmith: 0xB22222, // 煉瓦色
        merchant: 0x9370DB,   // ミディアムパープル
        alchemist: 0x32CD32   // ライムグリーン
      }
    };
    
    // 動作タイプとアニメーションフレーム数のマッピング
    this.actionFrames = {
      idle: 4,
      walk: 4,
      attack: 3,
      hurt: 2,
      death: 5,
      cast: 4
    };
    
    // 方向タイプのマッピング
    this.directions = ['down', 'left', 'right', 'up'];
    
    // 生成されたアニメーションのトラッキング用
    this.generatedAnimations = new Map();
  }
  
  /**
   * シングルトンインスタンスを取得
   * @returns {CharacterLoader} インスタンス
   */
  static getInstance() {
    if (!CharacterLoader.instance) {
      CharacterLoader.instance = new CharacterLoader();
    }
    return CharacterLoader.instance;
  }
  
  /**
   * 初期化処理
   * @param {Phaser.Scene} scene - Phaserシーン
   * @returns {boolean} 初期化が成功したかどうか
   */
  initialize(scene) {
    if (!scene || !scene.textures || !scene.anims) {
      console.error('CharacterLoader: 有効なPhaserシーンが必要です');
      return false;
    }
    
    this.scene = scene;
    console.log('🧍 CharacterLoader: 初期化開始...');
    
    // PlaceholderAssetsが初期化されていることを確認
    if (!PlaceholderAssets.initialized) {
      PlaceholderAssets.initialize(scene);
    }
    
    this.initialized = true;
    console.log('✅ CharacterLoader: 初期化完了');
    return true;
  }
  
  /**
   * キャラクターのアニメーションを生成
   * @param {Object} config - 設定オブジェクト
   * @param {string} config.type - キャラクタータイプ ('player', 'enemy', 'npc', 'companion')
   * @param {string} config.subtype - サブタイプ ('warrior', 'skeleton', 'villager', etc.)
   * @param {string[]} config.actions - 生成する動作の配列 (['idle', 'walk', etc.])
   * @param {string[]} config.directions - 生成する方向の配列 (['down', 'up', 'left', 'right'])
   * @param {number} config.frameWidth - フレーム幅
   * @param {number} config.frameHeight - フレーム高さ
   * @param {number} config.frameRate - アニメーションのフレームレート
   * @returns {Object} 生成されたアニメーションの情報
   */
  createCharacterAnimations(config) {
    if (!this.initialized) {
      this.initialize(this.scene);
    }
    
    if (!config || !config.type || !config.subtype) {
      console.error('CharacterLoader: 有効な設定が必要です');
      return null;
    }
    
    // デフォルト設定
    const settings = {
      actions: ['idle', 'walk'],
      directions: ['down', 'left', 'right', 'up'],
      frameWidth: 32,
      frameHeight: 32,
      frameRate: 8,
      ...config
    };
    
    const { type, subtype, actions, directions, frameWidth, frameHeight, frameRate } = settings;
    
    console.log(`🧍 キャラクターアニメーション生成: ${type}_${subtype}`);
    
    // キャラクターの色を取得
    const color = this.getCharacterColor(type, subtype);
    
    // 動作と方向ごとにスプライトシートとアニメーションを生成
    const result = {
      spritesheets: {},
      animations: {}
    };
    
    for (const action of actions) {
      for (const direction of directions) {
        // スプライトシートのキー生成
        const spriteKey = `${type}_${subtype}_${action}_${direction}_sheet`;
        
        // フレーム数を取得
        const frameCount = this.actionFrames[action] || 4;
        
        // スプライトシートが存在しなければ生成
        if (!this.scene.textures.exists(spriteKey)) {
          this.createCharacterSpritesheet(
            spriteKey,
            color,
            action,
            direction,
            frameCount,
            frameWidth,
            frameHeight
          );
        }
        
        result.spritesheets[`${action}_${direction}`] = spriteKey;
        
        // アニメーションのキー生成
        const animKey = `${type}_${subtype}_${action}_${direction}`;
        
        // アニメーションが存在しなければ生成
        if (!this.scene.anims.exists(animKey)) {
          this.createAnimation(
            animKey,
            spriteKey,
            frameCount,
            frameRate,
            action === 'idle' // idleアニメーションのみループさせる
          );
        }
        
        result.animations[`${action}_${direction}`] = animKey;
      }
    }
    
    // マッピング用のショートカットキーを生成
    // 例: player_warrior_idle（方向指定なし）=> player_warrior_idle_down
    for (const action of actions) {
      // デフォルトのアニメーションキー
      const defaultAnimKey = `${type}_${subtype}_${action}`;
      
      // マッピングするアニメーションキー（通常は下向き）
      const targetDirection = directions.includes('down') ? 'down' : directions[0];
      const targetAnimKey = `${type}_${subtype}_${action}_${targetDirection}`;
      
      // デフォルトのアニメーションをマッピング
      if (!this.scene.anims.exists(defaultAnimKey) && this.scene.anims.exists(targetAnimKey)) {
        // 完全なコピーではなく、既存のアニメーションを参照するエイリアスを作成
        const targetAnim = this.scene.anims.get(targetAnimKey);
        this.scene.anims.create({
          key: defaultAnimKey,
          frames: targetAnim.frames,
          frameRate: targetAnim.frameRate,
          repeat: targetAnim.repeat
        });
        
        result.animations[action] = defaultAnimKey;
      }
    }
    
    // 生成されたアニメーションを記録
    this.generatedAnimations.set(`${type}_${subtype}`, result);
    
    console.log(`✅ キャラクターアニメーション生成完了: ${type}_${subtype}`);
    return result;
  }
  
  /**
   * キャラクターのスプライトシートを生成
   * @param {string} key - スプライトシートのキー
   * @param {number} color - キャラクターの色
   * @param {string} action - 動作タイプ
   * @param {string} direction - 方向
   * @param {number} frameCount - フレーム数
   * @param {number} frameWidth - フレーム幅
   * @param {number} frameHeight - フレーム高さ
   */
  createCharacterSpritesheet(key, color, action, direction, frameCount, frameWidth, frameHeight) {
    // PlaceholderAssetsを使ってスプライトシートを生成
    PlaceholderAssets.createCharacterSpritesheet(
      this.scene,
      key,
      color,
      action,
      direction,
      frameCount,
      frameWidth,
      frameHeight
    );
    
    console.log(`🎨 スプライトシート生成: ${key}`);
  }
  
  /**
   * アニメーションを生成
   * @param {string} key - アニメーションのキー
   * @param {string} spriteKey - スプライトシートのキー
   * @param {number} frameCount - フレーム数
   * @param {number} frameRate - フレームレート
   * @param {boolean} loop - ループするかどうか
   */
  createAnimation(key, spriteKey, frameCount, frameRate, loop = false) {
    const frames = this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: frameCount - 1 });
    
    this.scene.anims.create({
      key: key,
      frames: frames,
      frameRate: frameRate,
      repeat: loop ? -1 : 0
    });
    
    console.log(`🎬 アニメーション生成: ${key}`);
  }
  
  /**
   * キャラクタータイプと動作から適切なアニメーションキーを取得
   * @param {string} type - キャラクタータイプ
   * @param {string} subtype - サブタイプ
   * @param {string} action - 動作
   * @param {string} direction - 方向（省略可）
   * @returns {string} アニメーションキー
   */
  getAnimationKey(type, subtype, action, direction) {
    // 方向が指定されている場合は方向付きのキーを返す
    if (direction) {
      return `${type}_${subtype}_${action}_${direction}`;
    }
    
    // 方向が指定されていない場合はデフォルトのキーを返す
    return `${type}_${subtype}_${action}`;
  }
  
  /**
   * PhaserのSpriteにアニメーションを設定
   * @param {Phaser.GameObjects.Sprite} sprite - アニメーションを設定するスプライト
   * @param {string} type - キャラクタータイプ
   * @param {string} subtype - サブタイプ
   * @param {string} action - 動作
   * @param {string} direction - 方向（省略可）
   * @returns {boolean} 設定に成功したかどうか
   */
  setAnimation(sprite, type, subtype, action, direction) {
    if (!sprite || !this.scene) return false;
    
    const animKey = this.getAnimationKey(type, subtype, action, direction);
    
    // アニメーションが存在するか確認
    if (!this.scene.anims.exists(animKey)) {
      // キャラクターのアニメーションセットが生成されているか確認
      if (!this.generatedAnimations.has(`${type}_${subtype}`)) {
        // アニメーションセットを生成
        this.createCharacterAnimations({
          type,
          subtype,
          actions: ['idle', 'walk', 'attack', 'hurt', 'death'],
          directions: ['down', 'left', 'right', 'up']
        });
      }
      
      // 生成後も存在しない場合はデフォルトアニメーションを試す
      if (!this.scene.anims.exists(animKey)) {
        const defaultAnimKey = `${type}_${subtype}_idle`;
        if (!this.scene.anims.exists(defaultAnimKey)) {
          console.warn(`CharacterLoader: アニメーション '${animKey}' と '${defaultAnimKey}' が見つかりません`);
          return false;
        }
        
        sprite.play(defaultAnimKey);
        return true;
      }
    }
    
    sprite.play(animKey);
    return true;
  }
  
  /**
   * キャラクタータイプとサブタイプから色を取得
   * @param {string} type - キャラクタータイプ
   * @param {string} subtype - サブタイプ
   * @returns {number} 色（16進数）
   */
  getCharacterColor(type, subtype) {
    const typeColors = this.characterColors[type];
    if (!typeColors) {
      console.warn(`CharacterLoader: 不明なキャラクタータイプ '${type}'`);
      return 0x00FF00; // デフォルト緑
    }
    
    const color = typeColors[subtype];
    if (!color) {
      console.warn(`CharacterLoader: 不明なサブタイプ '${subtype}' for type '${type}'`);
      return 0x00FF00; // デフォルト緑
    }
    
    return color;
  }
  
  /**
   * キャラクターのスプライトを作成
   * @param {Object} config - 設定オブジェクト
   * @param {number} config.x - X座標
   * @param {number} config.y - Y座標
   * @param {string} config.type - キャラクタータイプ
   * @param {string} config.subtype - サブタイプ
   * @param {string} config.initialAction - 初期動作（デフォルト: 'idle'）
   * @param {string} config.initialDirection - 初期方向（デフォルト: 'down'）
   * @returns {Phaser.GameObjects.Sprite} 作成されたスプライト
   */
  createCharacterSprite(config) {
    if (!this.initialized || !this.scene) {
      if (!this.initialize(this.scene)) {
        console.error('CharacterLoader: 初期化されていません');
        return null;
      }
    }
    
    const settings = {
      x: 0,
      y: 0,
      type: 'player',
      subtype: 'warrior',
      initialAction: 'idle',
      initialDirection: 'down',
      ...config
    };
    
    const { x, y, type, subtype, initialAction, initialDirection } = settings;
    
    // アニメーションが生成されているか確認し、なければ生成
    if (!this.generatedAnimations.has(`${type}_${subtype}`)) {
      this.createCharacterAnimations({
        type,
        subtype,
        actions: ['idle', 'walk', 'attack', 'hurt', 'death'],
        directions: ['down', 'left', 'right', 'up']
      });
    }
    
    // アニメーションキーを取得
    const animKey = this.getAnimationKey(type, subtype, initialAction, initialDirection);
    
    // キャラクタースプライトを作成
    let sprite;
    
    if (this.scene.anims.exists(animKey)) {
      // アニメーションがある場合はそれを使用
      sprite = this.scene.add.sprite(x, y, '', 0);
      sprite.play(animKey);
    } else {
      // アニメーションがない場合はプレースホルダーテクスチャを使用
      const placeholderKey = PlaceholderAssets.getFallbackTexture(this.scene, type);
      sprite = this.scene.add.sprite(x, y, placeholderKey);
    }
    
    // カスタムプロパティを設定（後で識別しやすくするため）
    sprite.characterType = type;
    sprite.characterSubtype = subtype;
    sprite.currentAction = initialAction;
    sprite.currentDirection = initialDirection;
    
    // 方向を変更するメソッドを追加
    sprite.setDirection = (direction) => {
      if (!this.directions.includes(direction)) {
        console.warn(`CharacterLoader: 不明な方向 '${direction}'`);
        return;
      }
      
      sprite.currentDirection = direction;
      this.setAnimation(sprite, type, subtype, sprite.currentAction, direction);
    };
    
    // 動作を変更するメソッドを追加
    sprite.setAction = (action) => {
      if (!this.actionFrames[action]) {
        console.warn(`CharacterLoader: 不明な動作 '${action}'`);
        return;
      }
      
      sprite.currentAction = action;
      this.setAnimation(sprite, type, subtype, action, sprite.currentDirection);
    };
    
    return sprite;
  }
  
  /**
   * 簡易的なキャラクターコントローラーを作成
   * @param {Phaser.GameObjects.Sprite} sprite - キャラクタースプライト
   * @param {Phaser.Input.Keyboard.KeyboardPlugin} keyboard - キーボード入力
   * @returns {Object} コントローラーオブジェクト
   */
  createSimpleController(sprite, keyboard) {
    if (!sprite || !keyboard || !this.scene) {
      console.error('CharacterLoader: 有効なスプライトとキーボード入力が必要です');
      return null;
    }
    
    // 必要なキーを定義
    const keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };
    
    // 更新関数
    const update = () => {
      let isMoving = false;
      const speed = 2;
      
      // 攻撃アクションのチェック
      if (Phaser.Input.Keyboard.JustDown(keys.attack)) {
        sprite.setAction('attack');
        
        // 攻撃アニメーションが終わったらidleに戻る
        if (!sprite.anims.isPlaying) {
          this.scene.time.delayedCall(500, () => {
            sprite.setAction('idle');
          });
        }
        return; // 攻撃中は移動しない
      }
      
      // 移動処理
      if (keys.up.isDown) {
        sprite.y -= speed;
        sprite.setDirection('up');
        isMoving = true;
      } else if (keys.down.isDown) {
        sprite.y += speed;
        sprite.setDirection('down');
        isMoving = true;
      }
      
      if (keys.left.isDown) {
        sprite.x -= speed;
        sprite.setDirection('left');
        isMoving = true;
      } else if (keys.right.isDown) {
        sprite.x += speed;
        sprite.setDirection('right');
        isMoving = true;
      }
      
      // 移動状態に基づいてアニメーションを設定
      if (isMoving) {
        if (sprite.currentAction !== 'walk') {
          sprite.setAction('walk');
        }
      } else {
        if (sprite.currentAction !== 'idle' && sprite.currentAction !== 'attack') {
          sprite.setAction('idle');
        }
      }
    };
    
    return { update, keys };
  }
  
  /**
   * 現在のシーンを更新
   * @param {Phaser.Scene} scene - 新しいシーン
   */
  updateScene(scene) {
    if (!scene) return;
    
    this.scene = scene;
    
    if (!this.initialized) {
      this.initialize(scene);
    }
  }
  
  /**
   * 全てのデータをクリア（シングルトンを初期化）
   */
  clearAll() {
    this.generatedAnimations.clear();
    this.initialized = false;
  }
  
  /**
   * 利用可能なキャラクタータイプとサブタイプの一覧を取得
   * @returns {Object} タイプとサブタイプのマッピング
   */
  getAvailableCharacterTypes() {
    return {
      types: Object.keys(this.characterColors),
      subtypes: this.characterColors
    };
  }
  
  /**
   * 特定のキャラクタータイプで利用可能なサブタイプの一覧を取得
   * @param {string} type - キャラクタータイプ
   * @returns {string[]} サブタイプの配列
   */
  getAvailableSubtypes(type) {
    const typeColors = this.characterColors[type];
    if (!typeColors) {
      console.warn(`CharacterLoader: 不明なキャラクタータイプ '${type}'`);
      return [];
    }
    
    return Object.keys(typeColors);
  }
  
  /**
   * 利用可能な動作の一覧を取得
   * @returns {string[]} 動作の配列
   */
  getAvailableActions() {
    return Object.keys(this.actionFrames);
  }
  
  /**
   * 利用可能な方向の一覧を取得
   * @returns {string[]} 方向の配列
   */
  getAvailableDirections() {
    return [...this.directions];
  }
}

// シングルトンインスタンスをエクスポート
export default CharacterLoader.getInstance();

// 個別の関数としてもエクスポート
export const initialize = (scene) => CharacterLoader.getInstance().initialize(scene);
export const createCharacterAnimations = (config) => CharacterLoader.getInstance().createCharacterAnimations(config);
export const createCharacterSprite = (config) => CharacterLoader.getInstance().createCharacterSprite(config);
export const setAnimation = (sprite, type, subtype, action, direction) => 
  CharacterLoader.getInstance().setAnimation(sprite, type, subtype, action, direction);