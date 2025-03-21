import Action from './Action';
import { ActionType } from '../../constants/actionTypes';
import { getDistance } from '../../utils/mathUtils';

/**
 * 特殊なアクションクラス
 * スキル、呪文、特殊能力など、より複雑な効果を持つアクションを扱います
 */
export default class SpecialAction extends Action {
  /**
   * 特殊アクションを作成
   * @param {string} type - アクションタイプ
   * @param {object} config - 設定オブジェクト
   */
  constructor(type, config = {}) {
    // Action親クラスのコンストラクタを呼び出し
    super({
      ...config,
      type: type || ActionType.SPECIAL
    });
    
    // アクション特有のプロパティ
    this.actionType = type; // 'skill', 'spell', 'ability'
    
    // スキル関連のプロパティ
    this.skillId = config.skillId || '';
    this.skillLevel = config.skillLevel || 1;
    this.manaCost = config.manaCost || 10;
    this.cooldown = config.cooldown || 3000;
    this.lastUsedTime = 0;
    this.castTime = config.castTime || 500;
    
    // 効果関連のプロパティ
    this.range = config.range || 100;
    this.areaOfEffect = config.areaOfEffect || 0;
    this.effectDuration = config.effectDuration || 0;
    this.effectType = config.effectType || '';
    this.effectValue = config.effectValue || 0;
    this.effectChance = config.effectChance || 1.0;
    
    // ダメージ関連のプロパティ
    this.baseDamage = config.baseDamage || 0;
    this.damageType = config.damageType || 'physical';
    this.damageScaling = config.damageScaling || {};
    
    // ヒール関連のプロパティ
    this.baseHeal = config.baseHeal || 0;
    this.healScaling = config.healScaling || {};
    
    // ターゲット関連のプロパティ
    this.targetType = config.targetType || 'enemy'; // 'enemy', 'ally', 'self', 'ground'
    this.maxTargets = config.maxTargets || 1;
    
    // スキル特有のプロパティ
    this.projectileSpeed = config.projectileSpeed || 0;
    this.knockback = config.knockback || 0;
    this.isChanneled = config.isChanneled || false;
    this.channelDuration = config.channelDuration || 0;
    
    // 表示関連のプロパティ
    this.icon = config.icon || '';
    this.particleEffect = config.particleEffect || '';
    this.soundEffect = config.soundEffect || '';
    
    // スキル特有の設定
    this.setupSkill();
    
    // 条件を設定
    this.setupConditions();
  }

  /**
   * スキルタイプに応じた初期設定
   */
  setupSkill() {
    switch (this.actionType) {
      case 'skill':
        // スキル特有の初期化
        this.duration = this.castTime + (this.effectDuration > 0 ? this.effectDuration : 500);
        break;
        
      case 'spell':
        // 呪文特有の初期化
        this.duration = this.castTime + (this.effectDuration > 0 ? this.effectDuration : 800);
        
        // 呪文は通常マナコストが高い
        if (!this.manaCost) {
          this.manaCost = 20;
        }
        break;
        
      case 'ability':
        // 能力特有の初期化
        this.duration = this.castTime + (this.effectDuration > 0 ? this.effectDuration : 300);
        
        // 能力は通常クールダウンが短い
        if (!this.cooldown) {
          this.cooldown = 1500;
        }
        break;
    }
  }

  /**
   * スキルに必要な条件を設定
   */
  setupConditions() {
    // 条件リストをクリア
    this.conditions = [];
    
    // マナコスト条件
    if (this.manaCost > 0) {
      this.conditions.push({
        type: 'manaCost',
        value: this.manaCost
      });
    }
    
    // クールダウン条件
    if (this.cooldown > 0) {
      this.conditions.push({
        type: 'cooldown',
        value: this.cooldown,
        lastUsed: this.lastUsedTime
      });
    }
    
    // 範囲条件（ターゲットがある場合）
    if (this.target && this.range > 0) {
      this.conditions.push({
        type: 'range',
        value: this.range / 32 // タイル単位に変換
      });
    }
  }

  /**
   * スキル実行の前処理
   */
  execute() {
    if (!this.owner) {
      this.complete();
      return;
    }
    
    // マナコストを消費
    if (this.manaCost > 0 && this.owner.mana !== undefined) {
      this.owner.mana = Math.max(0, this.owner.mana - this.manaCost);
    }
    
    // クールダウンを設定
    this.lastUsedTime = Date.now();
    
    // ターゲットがないかつ自身がターゲット対象の場合
    if (!this.target && (this.targetType === 'self' || this.targetType === 'ally')) {
      this.target = this.owner;
    }
    
    // ターゲットの方向を向く
    if (this.target && this.target !== this.owner) {
      this.faceTarget();
    }
    
    // スキルアニメーション開始
    if (this.owner.setAnimation) {
      this.owner.setAnimation('skill');
    } else if (this.owner.animationState) {
      this.owner.animationState = 'skill';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
    }
    
    // キャストタイムがある場合は詠唱エフェクト
    if (this.castTime > 0) {
      this.showCastingEffect();
    } else {
      // 即時発動の場合はすぐに効果を適用
      this.applySkillEffect();
    }
    
    // 効果音再生
    if (this.scene && this.scene.sound && this.soundEffect) {
      this.scene.sound.play(this.soundEffect);
    }
  }

  /**
   * スキルの更新処理
   * @param {number} time - 現在時間
   * @param {number} delta - 前回更新からの経過時間
   */
  updateAction(time, delta) {
    // キャスト中の処理
    if (this.progress * this.duration < this.castTime) {
      // キャスト中のアニメーション更新など
      this.updateCasting(delta);
    } 
    // キャスト完了後の処理
    else if (!this.effectApplied) {
      // スキル効果を適用
      this.applySkillEffect();
      this.effectApplied = true;
      
      // チャネリングスキルでない場合は効果適用後のエフェクト表示
      if (!this.isChanneled) {
        this.showSkillEffect();
      }
    }
    // チャネリングスキルの場合は継続的に効果を適用
    else if (this.isChanneled) {
      this.updateChanneling(delta);
    }
    // 投射物がある場合は移動させる
    else if (this.projectiles && this.projectiles.length > 0) {
      this.updateProjectiles(delta);
    }
  }

  /**
   * キャスト中の更新処理
   * @param {number} delta - 前回更新からの経過時間
   */
  updateCasting(delta) {
    if (!this.owner) return;
    
    // キャスト中のエフェクト更新
    if (this.castingEffect) {
      // エフェクトの位置を更新
      this.castingEffect.x = this.owner.x;
      this.castingEffect.y = this.owner.y;
      
      // エフェクトのスケールやアルファ値などを更新
      const t = this.progress * this.duration / this.castTime;
      this.castingEffect.alpha = Math.min(1, t * 2);
      this.castingEffect.scale = 0.5 + t * 0.5;
    }
  }

  /**
   * チャネリング中の更新処理
   * @param {number} delta - 前回更新からの経過時間
   */
  updateChanneling(delta) {
    if (!this.owner) return;
    
    // 一定間隔で効果を適用
    const elapsedSinceEffect = Date.now() - (this.lastEffectTime || this.startTime);
    const tickInterval = 500; // 0.5秒ごとに効果適用
    
    if (elapsedSinceEffect >= tickInterval) {
      // 効果の再適用
      this.applyChannelingEffect();
      this.lastEffectTime = Date.now();
    }
    
    // チャネリングエフェクトの更新
    if (this.channelingEffect) {
      // エフェクトの位置を更新
      this.channelingEffect.x = this.owner.x;
      this.channelingEffect.y = this.owner.y;
    }
  }

  /**
   * 投射物の更新処理
   * @param {number} delta - 前回更新からの経過時間
   */
  updateProjectiles(delta) {
    if (!this.projectiles || this.projectiles.length === 0) return;
    
    // 各投射物を更新
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // 投射物の移動
      const moveDistance = this.projectileSpeed * delta / 1000;
      projectile.x += projectile.dirX * moveDistance;
      projectile.y += projectile.dirY * moveDistance;
      
      // 当たり判定
      if (this.checkProjectileHit(projectile)) {
        // ヒットエフェクト表示
        this.showProjectileHitEffect(projectile);
        
        // 投射物を削除
        if (projectile.sprite) {
          projectile.sprite.destroy();
        }
        this.projectiles.splice(i, 1);
      }
      // 画面外に出た場合は削除
      else if (this.isOutOfBounds(projectile)) {
        if (projectile.sprite) {
          projectile.sprite.destroy();
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * 投射物の当たり判定
   * @param {object} projectile - 投射物オブジェクト
   * @returns {boolean} 当たったかどうか
   */
  checkProjectileHit(projectile) {
    if (!this.scene || !projectile.target) return false;
    
    // ターゲットとの距離を計算
    const distance = getDistance(
      projectile.x, projectile.y,
      projectile.target.x, projectile.target.y
    );
    
    // 当たり判定サイズ
    const hitSize = 20;
    
    // 当たった場合
    if (distance <= hitSize) {
      // ダメージ適用
      if (projectile.target.takeDamage) {
        const damage = this.calculateSkillDamage();
        projectile.target.takeDamage(damage, this.damageType, false, this.owner);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * 投射物が画面外かどうか
   * @param {object} projectile - 投射物オブジェクト
   * @returns {boolean} 画面外かどうか
   */
  isOutOfBounds(projectile) {
    if (!this.scene || !this.scene.cameras) return false;
    
    const camera = this.scene.cameras.main;
    const bounds = {
      x: camera.scrollX - 100,
      y: camera.scrollY - 100,
      width: camera.width + 200,
      height: camera.height + 200
    };
    
    return (
      projectile.x < bounds.x ||
      projectile.y < bounds.y ||
      projectile.x > bounds.x + bounds.width ||
      projectile.y > bounds.y + bounds.height
    );
  }

  /**
   * キャスティングエフェクトの表示
   */
  showCastingEffect() {
    if (!this.scene || !this.owner) return;
    
    // エフェクトのキー
    const effectKey = this.particleEffect || 'cast_effect';
    
    // エフェクト表示
    if (this.scene.add) {
      this.castingEffect = this.scene.add.sprite(
        this.owner.x, this.owner.y,
        effectKey
      );
      this.castingEffect.setScale(0.5);
      this.castingEffect.setAlpha(0.5);
      this.castingEffect.setDepth(this.owner.depth + 1);
      
      // アニメーション再生
      const animKey = `${effectKey}_anim`;
      if (this.castingEffect.play && this.scene.anims.exists(animKey)) {
        this.castingEffect.play(animKey, true);
      }
      
      // エフェクトをリストに追加
      this.addEffect(this.castingEffect);
    }
  }

  /**
   * スキル効果の適用
   */
  applySkillEffect() {
    switch (this.targetType) {
      case 'enemy':
        this.applyEnemyTargetEffect();
        break;
        
      case 'ally':
        this.applyAllyTargetEffect();
        break;
        
      case 'self':
        this.applySelfTargetEffect();
        break;
        
      case 'ground':
        this.applyGroundTargetEffect();
        break;
    }
    
    // チャネリングスキルの場合はチャネリングエフェクトを表示
    if (this.isChanneled) {
      this.showChannelingEffect();
    }
    // 投射物を使用するスキルの場合は投射物を作成
    else if (this.projectileSpeed > 0 && this.target) {
      this.createProjectiles();
    }
    // それ以外の場合はスキルエフェクトを表示
    else {
      this.showSkillEffect();
    }
  }

  /**
   * チャネリング効果の適用
   */
  applyChannelingEffect() {
    switch (this.targetType) {
      case 'enemy':
        this.applyEnemyTargetEffect();
        break;
        
      case 'ally':
        this.applyAllyTargetEffect();
        break;
        
      case 'self':
        this.applySelfTargetEffect();
        break;
        
      case 'ground':
        this.applyGroundTargetEffect();
        break;
    }
  }

  /**
   * 敵ターゲットへの効果適用
   */
  applyEnemyTargetEffect() {
    if (!this.target) return;
    
    // ダメージ量計算
    const damage = this.calculateSkillDamage();
    
    // 単一ターゲットの場合
    if (this.areaOfEffect <= 0) {
      // ダメージ適用
      if (this.target.takeDamage) {
        this.target.takeDamage(damage, this.damageType, false, this.owner);
      }
    }
    // 範囲攻撃の場合
    else {
      // 範囲内のターゲットを取得
      const targets = this.getTargetsInArea();
      
      // 各ターゲットにダメージ適用
      for (const target of targets) {
        if (target.takeDamage) {
          target.takeDamage(damage, this.damageType, false, this.owner);
        }
      }
    }
    
    // 効果のチャンス判定
    if (this.effectType && Math.random() < this.effectChance) {
      this.applyStatusEffect(this.target);
    }
  }

  /**
   * 味方ターゲットへの効果適用
   */
  applyAllyTargetEffect() {
    if (!this.target) return;
    
    // 回復量計算
    const healAmount = this.calculateHealAmount();
    
    // 単一ターゲットの場合
    if (this.areaOfEffect <= 0) {
      // 回復適用
      if (this.target.heal) {
        this.target.heal(healAmount);
      }
    }
    // 範囲回復の場合
    else {
      // 範囲内のターゲットを取得
      const targets = this.getTargetsInArea(true);
      
      // 各ターゲットに回復適用
      for (const target of targets) {
        if (target.heal) {
          target.heal(healAmount);
        }
      }
    }
    
    // バフ効果適用
    if (this.effectType && Math.random() < this.effectChance) {
      this.applyBuffEffect(this.target);
    }
  }

  /**
   * 自身へのターゲット効果適用
   */
  applySelfTargetEffect() {
    if (!this.owner) return;
    
    // 回復効果がある場合
    if (this.baseHeal > 0) {
      const healAmount = this.calculateHealAmount();
      if (this.owner.heal) {
        this.owner.heal(healAmount);
      }
    }
    
    // バフ効果適用
    if (this.effectType) {
      this.applyBuffEffect(this.owner);
    }
  }

  /**
   * 地面ターゲットへの効果適用
   */
  applyGroundTargetEffect() {
    if (!this.position) return;
    
    // 地面上の効果を作成
    this.createGroundEffect();
  }

  /**
   * スキルダメージの計算
   * @returns {number} 計算されたダメージ
   */
  calculateSkillDamage() {
    if (!this.owner) return this.baseDamage;
    
    let damage = this.baseDamage;
    
    // 各ステータスによるスケーリング
    if (this.damageScaling) {
      if (this.damageScaling.strength && this.owner.strength) {
        damage += this.owner.strength * this.damageScaling.strength;
      }
      if (this.damageScaling.dexterity && this.owner.dexterity) {
        damage += this.owner.dexterity * this.damageScaling.dexterity;
      }
      if (this.damageScaling.energy && this.owner.energy) {
        damage += this.owner.energy * this.damageScaling.energy;
      }
      if (this.damageScaling.level && this.owner.level) {
        damage += this.owner.level * this.damageScaling.level;
      }
    }
    
    // スキルレベルによるボーナス
    damage *= (1 + (this.skillLevel - 1) * 0.1);
    
    return Math.floor(damage);
  }

  /**
   * 回復量の計算
   * @returns {number} 計算された回復量
   */
  calculateHealAmount() {
    if (!this.owner) return this.baseHeal;
    
    let heal = this.baseHeal;
    
    // 各ステータスによるスケーリング
    if (this.healScaling) {
      if (this.healScaling.vitality && this.owner.vitality) {
        heal += this.owner.vitality * this.healScaling.vitality;
      }
      if (this.healScaling.energy && this.owner.energy) {
        heal += this.owner.energy * this.healScaling.energy;
      }
      if (this.healScaling.level && this.owner.level) {
        heal += this.owner.level * this.healScaling.level;
      }
    }
    
    // スキルレベルによるボーナス
    heal *= (1 + (this.skillLevel - 1) * 0.15);
    
    return Math.floor(heal);
  }

  /**
   * 範囲内のターゲットを取得
   * @param {boolean} allies - 味方を対象とするかどうか
   * @returns {Array} 範囲内のターゲットの配列
   */
  getTargetsInArea(allies = false) {
    if (!this.scene || !this.target) return [];
    
    const targets = [];
    const centerX = this.target.x;
    const centerY = this.target.y;
    
    // ターゲットのリストを取得
    let entities = [];
    if (allies) {
      // 味方リスト（プレイヤー、コンパニオン）
      entities = [
        ...(this.scene.player ? [this.scene.player] : []),
        ...(this.scene.companions || [])
      ];
    } else {
      // 敵リスト
      entities = this.scene.enemies || [];
    }
    
    // 範囲内のエンティティをフィルタリング
    for (const entity of entities) {
      if (!entity || entity.life <= 0) continue;
      
      const distance = getDistance(centerX, centerY, entity.x, entity.y);
      if (distance <= this.areaOfEffect) {
        targets.push(entity);
      }
      
      // 最大ターゲット数に達した場合
      if (targets.length >= this.maxTargets) {
        break;
      }
    }
    
    return targets;
  }

  /**
   * ステータス効果の適用
   * @param {Character} target - 効果の対象
   */
  applyStatusEffect(target) {
    if (!target) return;
    
    // 効果タイプに応じたデバフを適用
    switch (this.effectType) {
      case 'poison':
        target.addDebuff({
          name: 'poison',
          duration: this.effectDuration,
          effects: {
            dotDamage: this.effectValue,
            dotType: 'poison'
          }
        });
        break;
        
      case 'burn':
        target.addDebuff({
          name: 'burn',
          duration: this.effectDuration,
          effects: {
            dotDamage: this.effectValue,
            dotType: 'fire'
          }
        });
        break;
        
      case 'freeze':
        target.addDebuff({
          name: 'freeze',
          duration: this.effectDuration,
          effects: {
            moveSpeedBonus: -50
          }
        });
        break;
        
      case 'stun':
        target.addDebuff({
          name: 'stun',
          duration: this.effectDuration,
          effects: {
            isStunned: true
          }
        });
        break;
    }
  }

  /**
   * バフ効果の適用
   * @param {Character} target - 効果の対象
   */
  applyBuffEffect(target) {
    if (!target) return;
    
    // 効果タイプに応じたバフを適用
    switch (this.effectType) {
      case 'speed':
        target.addBuff({
          name: 'speed',
          duration: this.effectDuration,
          effects: {
            moveSpeedBonus: this.effectValue
          }
        });
        break;
        
      case 'strength':
        target.addBuff({
          name: 'strength',
          duration: this.effectDuration,
          effects: {
            bonusAttack: this.effectValue
          }
        });
        break;
        
      case 'defense':
        target.addBuff({
          name: 'defense',
          duration: this.effectDuration,
          effects: {
            bonusDefence: this.effectValue
          }
        });
        break;
        
      case 'regeneration':
        target.addBuff({
          name: 'regeneration',
          duration: this.effectDuration,
          effects: {
            lifeRegeneration: this.effectValue
          }
        });
        break;
    }
  }

  /**
   * スキルエフェクトの表示
   */
  showSkillEffect() {
    if (!this.scene) return;
    
    // エフェクト位置
    let effectX, effectY;
    
    if (this.target) {
      effectX = this.target.x;
      effectY = this.target.y;
    } else if (this.position) {
      effectX = this.position.x;
      effectY = this.position.y;
    } else if (this.owner) {
      effectX = this.owner.x;
      effectY = this.owner.y;
    } else {
      return;
    }
    
    // エフェクトのキー
    const effectKey = this.particleEffect || 'skill_effect';
    
    // エフェクト表示
    if (this.scene.add) {
      const effect = this.scene.add.sprite(effectX, effectY, effectKey);
      effect.setScale(this.areaOfEffect > 0 ? 1.5 : 1.0);
      effect.setDepth(50);
      
      // アニメーション再生
      const animKey = `${effectKey}_anim`;
      if (effect.play && this.scene.anims.exists(animKey)) {
        effect.play(animKey);
      }
      
      // アニメーション終了時に削除
      effect.once('animationcomplete', () => {
        effect.destroy();
      });
      
      // エフェクトをリストに追加
      this.addEffect(effect);
    }
  }

  /**
   * チャネリングエフェクトの表示
   */
  showChannelingEffect() {
    if (!this.scene || !this.owner) return;
    
    // エフェクトのキー
    const effectKey = this.particleEffect || 'channel_effect';
    
    // エフェクト表示
    if (this.scene.add) {
      this.channelingEffect = this.scene.add.sprite(
        this.owner.x, this.owner.y,
        effectKey
      );
      this.channelingEffect.setScale(1.0);
      this.channelingEffect.setDepth(this.owner.depth + 1);
      
      // アニメーション再生
      const animKey = `${effectKey}_anim`;
      if (this.channelingEffect.play && this.scene.anims.exists(animKey)) {
        this.channelingEffect.play(animKey, true);
      }
      
      // エフェクトをリストに追加
      this.addEffect(this.channelingEffect);
    }
  }

  /**
   * 地面効果の作成
   */
  createGroundEffect() {
    if (!this.scene || !this.position) return;
    
    // エフェクトのキー
    const effectKey = this.particleEffect || 'ground_effect';
    
    // エフェクト表示
    if (this.scene.add) {
      const effect = this.scene.add.sprite(
        this.position.x, this.position.y,
        effectKey
      );
      effect.setScale(this.areaOfEffect > 0 ? this.areaOfEffect / 50 : 1.0);
      effect.setDepth(5); // 地面エフェクトは低い深度
      
      // アニメーション再生
      const animKey = `${effectKey}_anim`;
      if (effect.play && this.scene.anims.exists(animKey)) {
        effect.play(animKey, true);
      }
      
      // 持続時間後に削除
      this.scene.time.delayedCall(this.effectDuration || 2000, () => {
        effect.destroy();
      });
      
      // エフェクトをリストに追加
      this.addEffect(effect);
      
      // 地面効果オブジェクト
      this.groundEffect = {
        x: this.position.x,
        y: this.position.y,
        radius: this.areaOfEffect,
        duration: this.effectDuration,
        startTime: Date.now(),
        effect: effect,
        damageInterval: 500,
        lastDamageTime: 0
      };
    }
  }

  /**
   * 投射物の作成
   */
  createProjectiles() {
    if (!this.scene || !this.owner || !this.target) return;
    
    // 投射物リストを初期化
    this.projectiles = [];
    
    // エフェクトのキー
    const effectKey = this.particleEffect || 'projectile_effect';
    
    // 投射物数
    const projectileCount = this.maxTargets || 1;
    
    // 各投射物を作成
    for (let i = 0; i < projectileCount; i++) {
      // ターゲットを選択
      let currentTarget = this.target;
      
      // 複数ターゲットの場合は範囲内からランダムに選択
      if (projectileCount > 1 && this.scene.enemies && this.scene.enemies.length > 0) {
        const possibleTargets = this.scene.enemies.filter(enemy => 
          enemy && enemy.life > 0 && 
          getDistance(this.owner.x, this.owner.y, enemy.x, enemy.y) <= this.range
        );
        
        if (possibleTargets.length > 0) {
          currentTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        }
      }
      
      // ターゲットがない場合はスキップ
      if (!currentTarget) continue;
      
      // 投射物のスタート位置
      const startX = this.owner.x;
      const startY = this.owner.y;
      
      // 投射物の方向を計算
      const dx = currentTarget.x - startX;
      const dy = currentTarget.y - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const dirX = dx / length;
      const dirY = dy / length;
      
      // 投射物を作成
      let projectileSprite = null;
      if (this.scene.add) {
        projectileSprite = this.scene.add.sprite(startX, startY, effectKey);
        projectileSprite.setScale(0.5);
        projectileSprite.setDepth(30);
        
        // アニメーション再生
        const animKey = `${effectKey}_anim`;
        if (projectileSprite.play && this.scene.anims.exists(animKey)) {
          projectileSprite.play(animKey, true);
        }
        
        // 回転角度を設定
        projectileSprite.rotation = Math.atan2(dy, dx);
      }
      
      // 投射物オブジェクト
      const projectile = {
        x: startX,
        y: startY,
        dirX: dirX,
        dirY: dirY,
        target: currentTarget,
        sprite: projectileSprite
      };
      
      // 投射物リストに追加
      this.projectiles.push(projectile);
    }
  }

  /**
   * 投射物のヒットエフェクト表示
   * @param {object} projectile - 投射物オブジェクト
   */
  showProjectileHitEffect(projectile) {
    if (!this.scene || !projectile) return;
    
    // エフェクトのキー
    const effectKey = 'impact_effect';
    
    // エフェクト表示
    if (this.scene.add) {
      const effect = this.scene.add.sprite(projectile.x, projectile.y, effectKey);
      effect.setScale(0.5);
      effect.setDepth(40);
      
      // アニメーション再生
      if (effect.play) {
        effect.play('impact_anim');
      }
      
      // アニメーション終了時に削除
      effect.once('animationcomplete', () => {
        effect.destroy();
      });
    }
  }

  /**
   * アクションタイプに応じた完了処理
   */
  handleActionCompletion() {
    // スキルアクション特有の完了処理
    if (this.owner) {
      // スキルアニメーション停止
      if (this.owner.setAnimation) {
        this.owner.setAnimation('idle');
      } else if (this.owner.animationState) {
        this.owner.animationState = 'idle';
        if (this.owner.playAnimation) {
          this.owner.playAnimation();
        }
      }
      
      // スキル完了イベント
      if (this.scene) {
        this.scene.events.emit(`${this.actionType}-completed`, {
          owner: this.owner,
          skillId: this.skillId,
          target: this.target
        });
      }
    }
    
    // キャスティングエフェクトとチャネリングエフェクトをクリーンアップ
    if (this.castingEffect) {
      this.castingEffect.destroy();
      this.castingEffect = null;
    }
    
    if (this.channelingEffect) {
      this.channelingEffect.destroy();
      this.channelingEffect = null;
    }
    
    // 投射物をクリーンアップ
    if (this.projectiles) {
      for (const projectile of this.projectiles) {
        if (projectile.sprite) {
          projectile.sprite.destroy();
        }
      }
      this.projectiles = [];
    }
    
    super.handleActionCompletion();
  }
}