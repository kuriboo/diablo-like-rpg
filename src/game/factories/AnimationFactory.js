// src/game/core/AnimationFactory.js

/**
 * アニメーションファクトリー
 * Phaserのアニメーションを作成・管理する
 */
export default class AnimationFactory {
    constructor(scene) {
      this.scene = scene;
      this.animations = new Map();
      
      // アニメーション設定情報
      this.animationConfigs = {
        // プレイヤーアニメーション
        player: {
          idle: {
            frameRate: 10,
            frames: 4,
            repeat: -1
          },
          walk: {
            frameRate: 12,
            frames: 8,
            repeat: -1
          },
          attack: {
            frameRate: 15,
            frames: 5,
            repeat: 0
          },
          hurt: {
            frameRate: 8,
            frames: 2,
            repeat: 0
          },
          death: {
            frameRate: 8,
            frames: 6,
            repeat: 0
          }
        },
        
        // 敵アニメーション
        enemy: {
          idle: {
            frameRate: 8,
            frames: 4,
            repeat: -1
          },
          walk: {
            frameRate: 10,
            frames: 8,
            repeat: -1
          },
          attack: {
            frameRate: 15,
            frames: 5,
            repeat: 0
          },
          hurt: {
            frameRate: 10,
            frames: 2,
            repeat: 0
          },
          death: {
            frameRate: 8,
            frames: 6,
            repeat: 0
          }
        },
        
        // エフェクトアニメーション
        effect: {
          attack: {
            frameRate: 20,
            frames: 5,
            repeat: 0
          },
          heal: {
            frameRate: 15,
            frames: 5,
            repeat: 0
          },
          magic: {
            frameRate: 18,
            frames: 7,
            repeat: 0
          }
        }
      };
    }
    
    /**
     * アニメーションを作成する
     * @param {string} type - アニメーションタイプ (player, enemy, effect)
     * @param {string} subtype - サブタイプ (warrior, skeleton など)
     * @param {string} action - アクション (idle, walk, attack など)
     * @param {string} [spritesheet] - 使用するスプライトシートキー (デフォルトは type + '_sheet')
     * @returns {string} - 作成したアニメーションのキー
     */
    createAnimation(type, subtype, action, spritesheet = null) {
      // アニメーションキーの作成
      const key = `${type}_${subtype}_${action}`;
      
      // 既に存在するかチェック
      if (this.scene.anims.exists(key)) {
        return key;
      }
      
      // 設定情報の取得
      const typeConfig = this.animationConfigs[type];
      if (!typeConfig) {
        console.warn(`AnimationFactory: No config for type '${type}'`);
        return null;
      }
      
      const actionConfig = typeConfig[action];
      if (!actionConfig) {
        console.warn(`AnimationFactory: No config for action '${action}' in type '${type}'`);
        return null;
      }
      
      // スプライトシートの決定
      const sheet = spritesheet || `${type}_sheet`;
      
      // スプライトシートの存在チェック
      if (!this.scene.textures.exists(sheet)) {
        console.warn(`AnimationFactory: Spritesheet '${sheet}' not found`);
        return null;
      }
      
      // フレームオフセットの計算（サブタイプとアクションに基づく）
      const subtypeIndex = this.getSubtypeIndex(type, subtype);
      const actionIndex = this.getActionIndex(type, action);
      
      if (subtypeIndex === -1 || actionIndex === -1) {
        console.warn(`AnimationFactory: Invalid subtype or action index for ${key}`);
        return null;
      }
      
      // フレーム開始位置の計算
      // 例：スプライトシートが [subtype][action][frame] の構造の場合
      const frameStart = (subtypeIndex * this.getTotalActionsForType(type) + actionIndex) * actionConfig.frames;
      
      // アニメーション作成
      this.scene.anims.create({
        key: key,
        frames: this.scene.anims.generateFrameNumbers(sheet, {
          start: frameStart,
          end: frameStart + actionConfig.frames - 1
        }),
        frameRate: actionConfig.frameRate,
        repeat: actionConfig.repeat
      });
      
      // マップに追加
      this.animations.set(key, true);
      
      return key;
    }
    
    /**
     * サブタイプのインデックスを取得
     * @param {string} type - アニメーションタイプ
     * @param {string} subtype - サブタイプ
     * @returns {number} - インデックス、見つからない場合は-1
     */
    getSubtypeIndex(type, subtype) {
      const subtypes = {
        player: ['warrior', 'rogue', 'sorcerer'],
        enemy: ['skeleton', 'zombie', 'ghost', 'spider', 'slime', 'wolf', 'boss'],
        effect: ['attack', 'heal', 'magic']
      };
      
      const list = subtypes[type];
      if (!list) return -1;
      
      return list.indexOf(subtype);
    }
    
    /**
     * アクションのインデックスを取得
     * @param {string} type - アニメーションタイプ
     * @param {string} action - アクション
     * @returns {number} - インデックス、見つからない場合は-1
     */
    getActionIndex(type, action) {
      const actions = {
        player: ['idle', 'walk', 'attack', 'hurt', 'death'],
        enemy: ['idle', 'walk', 'attack', 'hurt', 'death'],
        effect: ['attack', 'heal', 'magic']
      };
      
      const list = actions[type];
      if (!list) return -1;
      
      return list.indexOf(action);
    }
    
    /**
     * タイプごとの総アクション数を取得
     * @param {string} type - アニメーションタイプ
     * @returns {number} - アクション数
     */
    getTotalActionsForType(type) {
      const counts = {
        player: 5, // idle, walk, attack, hurt, death
        enemy: 5,  // idle, walk, attack, hurt, death
        effect: 3  // attack, heal, magic
      };
      
      return counts[type] || 0;
    }
    
    /**
     * 特定のタイプの全アニメーションを作成
     * @param {string} type - アニメーションタイプ
     * @param {Array<string>} subtypes - サブタイプの配列
     * @param {string} [spritesheet] - 使用するスプライトシートキー
     */
    createAnimationsForType(type, subtypes, spritesheet = null) {
      if (!this.animationConfigs[type]) {
        console.warn(`AnimationFactory: Type '${type}' not supported`);
        return;
      }
      
      const actions = Object.keys(this.animationConfigs[type]);
      
      subtypes.forEach(subtype => {
        actions.forEach(action => {
          this.createAnimation(type, subtype, action, spritesheet);
        });
      });
    }
    
    /**
     * キャラクターにアニメーションを設定
     * @param {Phaser.GameObjects.Sprite} sprite - スプライト
     * @param {string} type - タイプ
     * @param {string} subtype - サブタイプ
     * @param {string} action - アクション
     * @param {boolean} [playImmediately=true] - すぐに再生するかどうか
     * @returns {boolean} - 成功したかどうか
     */
    setCharacterAnimation(sprite, type, subtype, action, playImmediately = true) {
      const key = `${type}_${subtype}_${action}`;
      
      // アニメーションが存在しない場合は作成
      if (!this.scene.anims.exists(key)) {
        const created = this.createAnimation(type, subtype, action);
        if (!created) return false;
      }
      
      // アニメーション再生
      if (playImmediately) {
        sprite.play(key);
      }
      
      return true;
    }
    
    /**
     * エフェクトアニメーションの作成と再生
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} effectType - エフェクトタイプ
     * @returns {Phaser.GameObjects.Sprite} - エフェクトスプライト
     */
    playEffect(x, y, effectType) {
      // エフェクトスプライトの作成
      const effectSprite = this.scene.add.sprite(x, y, 'effects_sheet');
      
      // アニメーションキー
      const key = `effect_${effectType}`;
      
      // アニメーションが存在しない場合は作成
      if (!this.scene.anims.exists(key)) {
        this.createAnimation('effect', effectType, effectType, 'effects_sheet');
      }
      
      // アニメーション再生
      effectSprite.play(key);
      
      // アニメーション完了時に削除
      effectSprite.once('animationcomplete', () => {
        effectSprite.destroy();
      });
      
      return effectSprite;
    }
    
    /**
     * 全アニメーションリセット
     */
    resetAnimations() {
      this.animations.clear();
      this.scene.anims.removeAll();
    }
}