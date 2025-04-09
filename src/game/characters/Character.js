// Phaserの静的インポートを動的インポートに変更
import { v4 as uuidv4 } from 'uuid';
import { CharacterClassType } from '../../constants/characterTypes';
import { getDistance } from '../../utils/mathUtils';
import AssetManager from '../core/AssetManager';

// Phaserを動的にロードするための変数とヘルパー関数
let Phaser = null;
async function loadPhaser() {
  if (typeof window === 'undefined') return null;
  if (Phaser) return Phaser;
  
  try {
    const module = await import('phaser');
    Phaser = module.default;
    return Phaser;
  } catch (error) {
    console.error('Failed to load Phaser:', error);
    return null;
  }
}

export default class Character {
  constructor(scene, x, y, texture, config = {}) {
    this.scene = scene;
    
    // スプライトをメンバーとして作成
    this.sprite = scene.add.sprite(x, y, texture);
    
    // 位置情報の保持
    this._x = x;
    this._y = y;
    
    // 基本情報
    this.uuid = uuidv4();
    this.name = config.name || 'Character';
    this.level = config.level || 1;
    
    // クラスタイプ
    this.classType = config.classType || CharacterClassType.warrior;
    
    // ステータス
    this.strength = config.strength || 10;
    this.dexterity = config.dexterity || 10;
    this.vitality = config.vitality || 10;
    this.energy = config.energy || 10;
    
    // 抵抗値
    this.poisonResistance = config.poisonResistance || 0;
    this.fireResistance = config.fireResistance || 0;
    this.coldResistance = config.coldResistance || 0;
    this.electricResistance = config.electricResistance || 0;
    this.physicalResistance = config.physicalResistance || 0;
    
    // 体力とマナ
    this.maxLife = this.calculateMaxLife();
    this.life = config.life || this.maxLife;
    this.maxMana = this.calculateMaxMana();
    this.mana = config.mana || this.maxMana;
    
    // 装備
    this.characterEquipments = {
      head: null,
      body: null,
      glove: null,
      belt: null,
      amulet: null,
      leftRing: null,
      rightRing: null,
      leftHand: null,
      rightHand: null
    };
    
    // スキルツリー
    this.skillTree = config.skillTree || null;
    this.skills = config.skills || [];
    
    // バフ・デバフ
    this.buffs = [];
    this.debuffs = [];
    
    // 移動関連
    this.moveSpeed = 10;
    this.isMoving = false;
    this.moveTarget = null;
    this.movePath = [];
    
    // アクション関連
    this.isPerformingAction = false;
    this.currentAction = null;
    this.actionCooldown = 0;
    
    // 戦闘関連
    this.attackRange = 1;
    this.attackSpeed = 1;
    this.lastAttackTime = 0;
    this.basicAR = this.calculateBasicAR();
    this.finalAR = this.basicAR;
    this.basicAttack = this.calculateBasicAttack();
    this.basicDefence = this.calculateBasicDefence();
    
    // 状態
    this.isDead = false;
    this.isStunned = false;
    this.isInvulnerable = false;
    
    // アニメーション関連
    this.direction = config.direction || 'down'; // down, up, left, right
    this.animationState = 'idle'; // idle, walk, attack, hurt, death
    
    // キャラクタータイプ情報（アニメーション用）
    this.characterType = 'character'; // デフォルト
    this.characterSubtype = 'default'; // デフォルト

    // AssetManagerの初期化確認
    if (!AssetManager.initialized && scene) {
      AssetManager.initialize(scene);
    }
    
    // スプライトの表示設定
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setInteractive();
    this.sprite.setScale(1);

    // 衝突領域の設定 - 修正版
    scene.physics.world.enable(this.sprite);
    this.body = this.sprite.body;
    this.body.setCollideWorldBounds(true);

    // スプライト画像のサイズを取得（通常は64x64などの値）
    const spriteWidth = this.sprite.width;
    const spriteHeight = this.sprite.height;

    // キャラクターの衝突領域を設定（足元中心にするために高さを調整）
    const bodyWidth = spriteWidth * 0.7;  // スプライト幅の70%を使用
    const bodyHeight = spriteHeight * 0.5; // スプライト高さの50%を使用（足元部分）

    // ボディサイズを設定
    this.body.setSize(bodyWidth, bodyHeight);

    // オフセットを計算（スプライトの中心と物理ボディの中心を一致させる）
    // 横方向は中央揃え、縦方向は足元部分に配置
    const offsetX = (spriteWidth - bodyWidth) / 2;
    const offsetY = spriteHeight - bodyHeight;

    // オフセットを設定
    this.body.setOffset(offsetX, offsetY);

    // ヘルスバー
    this.healthBar = this.createHealthBar();
    
    // イベントリスナー
    this.sprite.on('pointerdown', () => this.onClick());
    this.sprite.on('pointerover', () => this.onHover());
    this.sprite.on('pointerout', () => this.onHoverEnd());
    
    // 更新処理
    scene.events.on('update', this.update, this);

    // デバッグ用に現在の設定を出力
    console.log(`Character body setup: sprite(${spriteWidth}x${spriteHeight}), body(${bodyWidth}x${bodyHeight}), offset(${offsetX},${offsetY})`);
  }
  
  // 位置プロパティのゲッターとセッター
  get x() {
    return this._x;
  }
  
  set x(value) {
    this._x = value;
    if (this.sprite) this.sprite.x = value;
  }
  
  get y() {
    return this._y;
  }
  
  set y(value) {
    this._y = value;
    if (this.sprite) this.sprite.y = value;
  }
  
  // アルファ値のゲッターとセッター
  get alpha() {
    return this.sprite ? this.sprite.alpha : 1;
  }
  
  set alpha(value) {
    if (this.sprite) this.sprite.alpha = value;
  }

  // スプライトデプスの設定メソッド
  setDepth(value) {
    if (this.sprite) this.sprite.setDepth(value);
    return this;
  }
  
  // スプライト関連のメソッドの委譲
  setOrigin(x, y) {
    if (this.sprite) this.sprite.setOrigin(x, y);
    return this;
  }
  
  setInteractive(options) {
    if (this.sprite) this.sprite.setInteractive(options);
    return this;
  }
  
  disableInteractive() {
    if (this.sprite) this.sprite.disableInteractive();
    return this;
  }
  
  setScale(value) {
    if (this.sprite) this.sprite.setScale(value);
    return this;
  }
  
  setTint(tint) {
    if (this.sprite) this.sprite.setTint(tint);
    return this;
  }
  
  clearTint() {
    if (this.sprite) this.sprite.clearTint();
    return this;
  }
  
  // イベント発火の委譲
  emit(event, ...args) {
    if (this.sprite) {
      this.sprite.emit(event, ...args);
    }
  }
  
  on(event, callback, context) {
    if (this.sprite) {
      this.sprite.on(event, callback, context);
    }
    return this;
  }
  
  once(event, callback, context) {
    if (this.sprite) {
      this.sprite.once(event, callback, context);
    }
    return this;
  }
  
  off(event, callback, context) {
    if (this.sprite) {
      this.sprite.off(event, callback, context);
    }
    return this;
  }

  /**
   * キャラクタータイプの設定
   * @param {string} type - キャラクタータイプ
   * @param {string} subtype - サブタイプ
   * @returns {Character} このインスタンス
   */
  setCharacterType(type, subtype) {
    this.characterType = type;
    this.characterSubtype = subtype;
    return this;
  }
  
  /**
   * アニメーション状態の設定
   * @param {string} state - アニメーション状態
   * @param {string} direction - キャラクターの向き
   * @returns {Character} このインスタンス
   */
  setAnimationState(state, direction) {
    if (state) this.animationState = state;
    if (direction) this.direction = direction;
    this.playAnimation();
    return this;
  }
  
  /**
   * アニメーションの再生
   */
  playAnimation() {
    if (!this.sprite || !this.scene) return;
    
    // AssetManagerを介してアニメーションを設定
    if (AssetManager && AssetManager.setCharacterAnimation) {
      AssetManager.setCharacterAnimation(
        this.sprite, 
        this.characterType, 
        this.characterSubtype, 
        this.animationState, 
        this.direction
      );
    } else {
      // フォールバック: 従来の方法（アニメーションキーを直接指定）
      const animKey = `${this.characterType}_${this.characterSubtype}_${this.animationState}_${this.direction}`;
      if (this.scene.anims && this.scene.anims.exists(animKey)) {
        this.sprite.play(animKey);
      } else {
        console.warn(`アニメーション ${animKey} が存在しません`);
      }
    }
  }
  
  // 最大ライフの計算
  calculateMaxLife() {
    return this.classType.basicHP + this.level + (this.vitality * 3);
  }
  
  // 最大マナの計算
  calculateMaxMana() {
    return this.classType.basicMana + this.level + (this.energy * 3);
  }
  
  // 基本AR（命中率）の計算
  calculateBasicAR() {
    return (this.dexterity * 5) - 35 + this.classType.ar;
  }
  
  // 基本攻撃力の計算
  calculateBasicAttack() {
    let attack = this.classType.basicAttack;
    
    // 装備の攻撃力を加算
    Object.values(this.characterEquipments).forEach(equipment => {
      if (equipment && equipment.basicPerformance && 
          equipment.basicPerformance.type === 'AttackBasic') {
        attack += equipment.basicPerformance.value;
      }
    });
    
    return attack;
  }
  
  // 基本防御力の計算
  calculateBasicDefence() {
    let defence = this.classType.basicDefence;
    
    // 装備の防御力を加算
    Object.values(this.characterEquipments).forEach(equipment => {
      if (equipment && equipment.basicPerformance && 
          equipment.basicPerformance.type === 'DefenceBasic') {
        defence += equipment.basicPerformance.value;
      }
    });
    
    return defence;
  }
  
  // 全ステータスの再計算
  recalculateStats() {
    // 基本ステータスの更新
    this.maxLife = this.calculateMaxLife();
    this.maxMana = this.calculateMaxMana();
    this.basicAR = this.calculateBasicAR();
    this.basicAttack = this.calculateBasicAttack();
    this.basicDefence = this.calculateBasicDefence();
    
    // 装備による補正を適用
    this.applyEquipmentBonuses();
    
    // バフ・デバフの効果を適用
    this.applyBuffsAndDebuffs();
    
    // 現在のHPとマナが最大値を超えないように調整
    this.life = Math.min(this.life, this.maxLife);
    this.mana = Math.min(this.mana, this.maxMana);
  }

  // 移動先の設定
  setMoveTarget(x, y) {
    if (this.isDead || this.isStunned) return false;
    
    this.moveTarget = { x, y };
    this.isMoving = true;
    
    // 方向の更新
    this.updateDirection();
    
    // アニメーションの更新
    this.animationState = 'walk';
    this.playAnimation();
    
    return true;
  }
  
  // 移動の停止
  stopMoving() {
    this.isMoving = false;
    this.moveTarget = null;
    
    // アニメーションの更新
    this.animationState = 'idle';
    this.playAnimation();
  }
  
  // 方向の更新
  updateDirection() {
    if (!this.moveTarget) return;
    
    const dx = this.moveTarget.x - this.x;
    const dy = this.moveTarget.y - this.y;
    
    // 横方向の移動が大きい場合
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left';
    } 
    // 縦方向の移動が大きい場合
    else {
      this.direction = dy > 0 ? 'down' : 'up';
    }
    
    // アニメーションを更新
    this.playAnimation();
  }
  
  // ターゲットの方向を向くメソッドの修正
  faceTarget(target) {
    if (!target) return;
    
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    
    // 横方向の距離が大きい場合
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left';
    } 
    // 縦方向の距離が大きい場合
    else {
      this.direction = dy > 0 ? 'down' : 'up';
    }
    
    // アニメーションを更新
    this.playAnimation();
  }
  
  // 攻撃
  attack(target) {
    if (this.isDead || this.isStunned || this.isPerformingAction) return false;
    
    target = target || this.target;
    if (!target || target.isDead) return false;
    
    // 攻撃クールダウンチェック
    const now = Date.now();
    if (now - this.lastAttackTime < 1000 / this.attackSpeed) {
      return false;
    }
    
    // 攻撃範囲チェック
    const distance = getDistance(
      this.x, this.y, target.x, target.y
    );
    
    const attackRangePixels = this.attackRange * 32; // 1タイルを32pxとして計算
    if (distance > attackRangePixels) {
      // 攻撃範囲外の場合は近づく
      this.setMoveTarget(target.x, target.y);
      return false;
    }
    
    // 攻撃実行
    this.isPerformingAction = true;
    this.lastAttackTime = now;
    
    // ターゲットの方向を向く
    this.faceTarget(target);
    
    // 攻撃アニメーション
    this.animationState = 'attack';
    this.playAnimation();
    
    // ダメージ計算
    let damage = this.calculateDamage();
    
    // クリティカルヒット判定
    const isCritical = this.checkCriticalHit();
    if (isCritical) {
      damage = Math.floor(damage * this.criticalDamage);
    }
    
    // HIT判定
    const isHit = this.checkHit(target);
    if (!isHit) {
      // ミス表示
      this.showMissEffect(target);
      
      // 攻撃完了
      this.scene.time.delayedCall(500, () => {
        this.isPerformingAction = false;
        this.animationState = 'idle';
        this.playAnimation();
      });
      
      return false;
    }
    
    // 攻撃エフェクト
    this.showAttackEffect(target);
    
    // ダメージ適用
    target.takeDamage(damage, 'physical', isCritical, this);
    
    // 攻撃完了
    this.scene.time.delayedCall(500, () => {
      this.isPerformingAction = false;
      this.animationState = 'idle';
      this.playAnimation();
    });
    
    return true;
  }
  
  // ダメージリアクション
  damageReaction() {
    if (this.isDead) return;
    
    // 一時的に行動を中断
    this.isPerformingAction = true;
    
    // 被ダメージアニメーション
    this.animationState = 'hurt';
    this.playAnimation();
    
    // 少し後に通常状態に戻る
    this.scene.time.delayedCall(300, () => {
      this.isPerformingAction = false;
      this.animationState = 'idle';
      this.playAnimation();
    });
  }
  
  // 死亡処理
  die(killer = null) {
    if (this.isDead) return;
    
    this.isDead = true;
    this.life = 0;
    this.isMoving = false;
    this.moveTarget = null;
    this.isPerformingAction = true;
    
    // 死亡アニメーション
    this.animationState = 'death';
    this.playAnimation();
    
    // インタラクションを無効化
    this.disableInteractive();
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('death_sound');
    }
    
    // 死亡イベントの発火
    this.emit('death', this, killer);
    
    // 一定時間後にフェードアウト
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: [this.sprite, this.healthBar],
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          // リソースの解放
          this.destroy();
        }
      });
    });
  }
  
  // スキルの使用
  useSkill(skillIndex) {
    if (this.isDead || this.isStunned || this.isPerformingAction) return false;
    
    // スキルの存在確認
    if (!this.skills || !this.skills[skillIndex]) {
      return false;
    }
    
    const skill = this.skills[skillIndex];
    
    // マナコスト確認
    if (this.mana < skill.manaCost) {
      // マナ不足メッセージ
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showMessage) {
        uiScene.showMessage('マナが足りません');
      }
      return false;
    }
    
    // クールダウン確認
    if (skill.lastUsed && Date.now() - skill.lastUsed < skill.cooldown) {
      // クールダウン中メッセージ
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showMessage) {
        uiScene.showMessage('クールダウン中です');
      }
      return false;
    }
    
    // スキル使用開始
    this.isPerformingAction = true;
    
    // マナ消費
    this.mana -= skill.manaCost;
    
    // UIの更新（プレイヤーの場合）
    if (this === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.updateManaBar) {
        uiScene.updateManaBar();
      }
    }
    
    // スキルアニメーション（castに変更）
    this.animationState = 'cast';
    this.playAnimation();
    
    // スキル使用時間を記録
    skill.lastUsed = Date.now();
    
    // スキル効果を適用
    const actionFactory = this.scene.actionFactory;
    if (actionFactory) {
      const action = actionFactory.createSpecialAction({
        type: skill.type,
        owner: this,
        skill: skill
      });
      
      if (action) {
        action.play();
      }
    }
    
    // スキル使用完了
    this.scene.time.delayedCall(skill.castTime || 500, () => {
      this.isPerformingAction = false;
      this.animationState = 'idle';
      this.playAnimation();
    });
    
    return true;
  }
  
  // 移動および衝突処理
  updateMovement(delta) {
    if (this.isDead || this.isStunned || this.isPerformingAction) return;
    
    // 移動先がある場合
    if (this.isMoving && this.moveTarget) {
      // 現在位置との差分
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;
      
      // 目的地までの距離
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 目的地に到着した場合
      if (distance < 5) {
        this.x = this.moveTarget.x;
        this.y = this.moveTarget.y;
        this.stopMoving();
        return;
      }
      
      // 移動方向の正規化
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // 移動速度に基づく移動量
      const moveAmount = this.moveSpeed * (delta / 16); // 60FPSを想定
      
      // 新しい位置
      const newX = this.x + normalizedDx * moveAmount;
      const newY = this.y + normalizedDy * moveAmount;
      
      // マップの衝突判定
      if (this.scene.canMoveToPosition(newX, newY)) {
        // 移動可能な場合
        this.x = newX;
        this.y = newY;
        
        // 方向の更新
        this.updateDirection();
        
        // アニメーションの更新
        if (this.animationState !== 'walk') {
          this.animationState = 'walk';
          this.playAnimation();
        }
      } else {
        // 衝突した場合は移動停止
        this.stopMoving();
      }
    }
  }
  
  // 更新処理
  update(time, delta) {
    if (this.isDead) return;
    
    // 移動処理
    this.updateMovement(delta);
    
    // ヘルスバーの位置更新
    this.updateHealthBar();
    
    // バフとデバフの更新
    this.updateBuffsAndDebuffs(time);
    
    // 自然回復
    this.regenerateLife(delta);
    this.regenerateMana(delta);
    
    // ターゲット追跡とAI処理は派生クラスで実装
  }
}