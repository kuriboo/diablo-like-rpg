// Phaserの静的インポートを動的インポートに変更
// import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import { CharacterClassType } from '../../constants/characterTypes';
import { getDistance } from '../../utils/mathUtils';

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


export default class Character extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);
    
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
    this.moveSpeed = 2;
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
    this.direction = 'down'; // down, up, left, right
    this.animationState = 'idle'; // idle, walk, attack, hurt, death
    
    // 表示設定
    this.setOrigin(0.5, 0.5);
    this.setInteractive();
    this.setScale(1);
    
    // 衝突領域の設定
    scene.physics.world.enable(this);
    this.body.setCollideWorldBounds(true);
    this.body.setSize(32, 32);
    this.body.setOffset(16, 32);
    
    // ヘルスバー
    this.healthBar = this.createHealthBar();
    
    // イベントリスナー
    this.on('pointerdown', this.onClick);
    this.on('pointerover', this.onHover);
    this.on('pointerout', this.onHoverEnd);
    
    // 更新処理
    scene.events.on('update', this.update, this);
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
  
  // 装備ボーナスの適用
  applyEquipmentBonuses() {
    // 装備による追加ステータスをリセット
    this.resetEquipmentBonuses();
    
    // 各装備のオプション効果を適用
    Object.values(this.characterEquipments).forEach(equipment => {
      if (!equipment) return;
      
      // 基本性能の適用
      if (equipment.basicPerformance) {
        this.applyPerformanceValue(equipment.basicPerformance);
      }
      
      // オプション性能の適用
      if (equipment.optionPerformance) {
        equipment.optionPerformance.forEach(option => {
          this.applyPerformanceValue(option);
        });
      }
    });
    
    // 最終値の計算
    this.calculateFinalStats();
  }
  
  // 装備ボーナスのリセット
  resetEquipmentBonuses() {
    // 装備による追加ステータスをリセット
    this.bonusAttack = 0;
    this.bonusDefence = 0;
    this.bonusAR = 0;
    this.criticalRate = 5;  // ベース値
    this.criticalDamage = 1.5;  // ベース値
    this.attackSpeedBonus = 0;
    this.poisonDamage = 0;
    this.fireDamage = 0;
    this.coldDamage = 0;
    this.electricDamage = 0;
    this.lifeLeech = 0;
    this.manaLeech = 0;
    this.lifeBonusFlat = 0;
    this.manaBonusFlat = 0;
    this.moveSpeedBonus = 0;
    this.blockRate = 0;
    this.lifeRegeneration = 0.01;  // ベース値
    this.manaRegeneration = 0.01;  // ベース値
  }
  
  // 性能値の適用
  applyPerformanceValue(performance) {
    if (!performance) return;
    
    switch (performance.type) {
      case 'Attack':
        this.bonusAttack += performance.value;
        break;
      case 'AttackBasic':
        // 既に基本計算に含まれているので無視
        break;
      case 'AR':
        this.bonusAR += performance.value;
        break;
      case 'CriticalRate':
        this.criticalRate += performance.value;
        break;
      case 'CriticalDamage':
        this.criticalDamage += performance.value;
        break;
      case 'AttackSpeed':
        this.attackSpeedBonus += performance.value;
        break;
      case 'PoisonDamage':
        this.poisonDamage += performance.value;
        break;
      case 'FireDamage':
        this.fireDamage += performance.value;
        break;
      case 'ColdDamage':
        this.coldDamage += performance.value;
        break;
      case 'ElectricDamage':
        this.electricDamage += performance.value;
        break;
      case 'lifeLeech':
        this.lifeLeech += performance.value;
        break;
      case 'manaLeech':
        this.manaLeech += performance.value;
        break;
      case 'Defence':
        this.bonusDefence += performance.value;
        break;
      case 'DefenceBasic':
        // 既に基本計算に含まれているので無視
        break;
      case 'PoisonResistance':
        this.poisonResistance += performance.value;
        break;
      case 'FireResistance':
        this.fireResistance += performance.value;
        break;
      case 'ColdResistance':
        this.coldResistance += performance.value;
        break;
      case 'ElectricResistance':
        this.electricResistance += performance.value;
        break;
      case 'AllElementResistance':
        this.poisonResistance += performance.value;
        this.fireResistance += performance.value;
        this.coldResistance += performance.value;
        this.electricResistance += performance.value;
        break;
      case 'PhysicalResistance':
        this.physicalResistance += performance.value;
        break;
      case 'MaxLife':
        this.lifeBonusFlat += performance.value;
        break;
      case 'MaxMana':
        this.manaBonusFlat += performance.value;
        break;
      case 'MoveSpeed':
        this.moveSpeedBonus += performance.value;
        break;
      case 'BlockRate':
        this.blockRate += performance.value;
        break;
      case 'lifeRegeneration':
        this.lifeRegeneration += performance.value;
        break;
      case 'manaRegeneration':
        this.manaRegeneration += performance.value;
        break;
    }
  }
  
  // バフとデバフの効果を適用
  applyBuffsAndDebuffs() {
    // バフの効果を適用
    this.buffs.forEach(buff => {
      if (buff.effects) {
        Object.entries(buff.effects).forEach(([stat, value]) => {
          if (this[stat] !== undefined) {
            // 加算か乗算かを判定
            if (buff.isMultiplicative) {
              this[stat] *= value;
            } else {
              this[stat] += value;
            }
          }
        });
      }
    });
    
    // デバフの効果を適用
    this.debuffs.forEach(debuff => {
      if (debuff.effects) {
        Object.entries(debuff.effects).forEach(([stat, value]) => {
          if (this[stat] !== undefined) {
            // 加算か乗算かを判定
            if (debuff.isMultiplicative) {
              this[stat] *= value;
            } else {
              this[stat] += value;
            }
          }
        });
      }
    });
    
    // 最大値の制限（抵抗値など）
    this.poisonResistance = Math.min(this.poisonResistance, 75);
    this.fireResistance = Math.min(this.fireResistance, 75);
    this.coldResistance = Math.min(this.coldResistance, 75);
    this.electricResistance = Math.min(this.electricResistance, 75);
    this.physicalResistance = Math.min(this.physicalResistance, 75);
  }
  
  // 最終ステータスの計算
  calculateFinalStats() {
    // 最大HPとMP
    this.maxLife += this.lifeBonusFlat;
    this.maxMana += this.manaBonusFlat;
    
    // 最終AR
    this.finalAR = this.basicAR + this.bonusAR;
    
    // 攻撃速度
    this.attackSpeed = 1 + (this.attackSpeedBonus / 100);
    
    // 移動速度
    this.moveSpeed = 2 * (1 + (this.moveSpeedBonus / 100));
  }
  
  // ヘルスバーの作成
  createHealthBar() {
    const barWidth = 40;
    const barHeight = 4;
    const barPadding = 2;
    
    const healthBar = this.scene.add.graphics()
      .setPosition(this.x, this.y - 40)
      .setDepth(50);
    
    // 背景
    healthBar.fillStyle(0x000000, 0.5);
    healthBar.fillRect(-barWidth/2, 0, barWidth, barHeight);
    
    // 体力ゲージ
    healthBar.fillStyle(0xff0000, 1);
    const healthWidth = Math.max(0, Math.floor(barWidth * (this.life / this.maxLife)));
    healthBar.fillRect(-barWidth/2, 0, healthWidth, barHeight);
    
    return healthBar;
  }
  
  // ヘルスバーの更新
  updateHealthBar() {
    if (!this.healthBar) return;
    
    this.healthBar.clear();
    
    const barWidth = 40;
    const barHeight = 4;
    
    // 位置更新
    this.healthBar.x = this.x;
    this.healthBar.y = this.y - 40;
    
    // 背景
    this.healthBar.fillStyle(0x000000, 0.5);
    this.healthBar.fillRect(-barWidth/2, 0, barWidth, barHeight);
    
    // 体力ゲージ
    this.healthBar.fillStyle(0xff0000, 1);
    const healthWidth = Math.max(0, Math.floor(barWidth * (this.life / this.maxLife)));
    this.healthBar.fillRect(-barWidth/2, 0, healthWidth, barHeight);
  }
  
  // キャラクターをクリックした時のイベント
  onClick() {
    if (this.isDead) return;
    
    // プレイヤーがクリックした場合の処理
    const player = this.scene.player;
    if (player && player !== this) {
      // 敵をクリックした場合は攻撃
      if (this.constructor.name === 'Enemy') {
        player.setTarget(this);
      }
      // NPCをクリックした場合は会話
      else if (this.constructor.name === 'NPC') {
        this.interact(player);
      }
    }
  }
  
  // マウスオーバー時の処理
  onHover() {
    if (this.isDead) return;
    
    // ホバー効果
    this.setTint(0xaaaaaa);
    
    // ツールチップ表示
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.showTooltip) {
      uiScene.showTooltip(this);
    }
  }
  
  // マウスアウト時の処理
  onHoverEnd() {
    // ホバー効果解除
    this.clearTint();
    
    // ツールチップ非表示
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.hideTooltip) {
      uiScene.hideTooltip();
    }
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
  }
  
  // アニメーションの再生
  playAnimation() {
    // 状態と方向に基づいたアニメーション名を生成
    const animName = `${this.constructor.name.toLowerCase()}_${this.animationState}_${this.direction}`;
    
    // アニメーションが存在する場合のみ再生
    if (this.anims.exists(animName)) {
      this.anims.play(animName, true);
    }
  }
  
  // ターゲットの設定
  setTarget(target) {
    this.target = target;
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
  
  // ターゲットの方向を向く
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
  }
  
  // ダメージ計算
  calculateDamage() {
    let baseDamage = this.basicAttack;
    
    // 武器による追加ダメージ
    if (this.characterEquipments.rightHand) {
      baseDamage *= (1 + this.bonusAttack);
    }
    
    // レベルによるボーナス
    baseDamage *= (1 + this.level * 0.05);
    
    // 筋力によるボーナス（近接武器）
    if (this.isUsingMeleeWeapon()) {
      baseDamage *= (1 + this.strength * 0.01);
    }
    // 器用さによるボーナス（射程武器）
    else if (this.isUsingRangedWeapon()) {
      baseDamage *= (1 + this.dexterity * 0.01);
    }
    
    return Math.floor(baseDamage);
  }
  
  // 近接武器を使用しているか
  isUsingMeleeWeapon() {
    if (!this.characterEquipments.rightHand) return false;
    
    return [
      'oneHandMeleeWeapon',
      'twoHandMeleeWeapon'
    ].includes(this.characterEquipments.rightHand.type);
  }
  
  // 射程武器を使用しているか
  isUsingRangedWeapon() {
    if (!this.characterEquipments.rightHand) return false;
    
    return [
      'oneHandLongRangeWeapon',
      'twoHandLongRangeWeapon'
    ].includes(this.characterEquipments.rightHand.type);
  }
  
  // クリティカルヒット判定
  checkCriticalHit() {
    return Math.random() * 100 < this.criticalRate;
  }
  
  // HIT判定
  checkHit(target) {
    // 必中の場合
    if (this.finalAR >= 95) return true;
    
    // 絶対回避の場合
    if (target.finalAR >= 95) return false;
    
    // 命中率計算
    const hitChance = Math.min(95, Math.max(5, this.finalAR - target.basicDefence));
    
    // 命中判定
    return Math.random() * 100 < hitChance;
  }
  
  // 攻撃エフェクトの表示
  showAttackEffect(target) {
    if (!this.scene || !target) return;
    
    // 近接攻撃の場合
    if (this.isUsingMeleeWeapon()) {
      // 斬撃エフェクト
      const slashEffect = this.scene.add.sprite(
        target.x,
        target.y,
        'slash_effect'
      ).setScale(0.5);
      
      slashEffect.play('slash_anim');
      slashEffect.once('animationcomplete', () => {
        slashEffect.destroy();
      });
      
      // 効果音
      if (this.scene.sound) {
        this.scene.sound.play('slash_sound');
      }
    }
    // 射程攻撃の場合
    else if (this.isUsingRangedWeapon()) {
      // 弾丸エフェクト
      const bulletEffect = this.scene.add.sprite(
        this.x,
        this.y,
        'bullet_effect'
      ).setScale(0.5);
      
      // ターゲットに向かって移動
      this.scene.tweens.add({
        targets: bulletEffect,
        x: target.x,
        y: target.y,
        duration: 200,
        onComplete: () => {
          // 着弾エフェクト
          const impactEffect = this.scene.add.sprite(
            target.x,
            target.y,
            'impact_effect'
          ).setScale(0.5);
          
          impactEffect.play('impact_anim');
          impactEffect.once('animationcomplete', () => {
            impactEffect.destroy();
          });
          
          bulletEffect.destroy();
        }
      });
      
      // 効果音
      if (this.scene.sound) {
        this.scene.sound.play('shot_sound');
      }
    }
    // 素手の場合
    else {
      // パンチエフェクト
      const punchEffect = this.scene.add.sprite(
        target.x,
        target.y,
        'punch_effect'
      ).setScale(0.5);
      
      punchEffect.play('punch_anim');
      punchEffect.once('animationcomplete', () => {
        punchEffect.destroy();
      });
      
      // 効果音
      if (this.scene.sound) {
        this.scene.sound.play('punch_sound');
      }
    }
  }
  
  // ミスエフェクトの表示
  showMissEffect(target) {
    if (!this.scene || !target) return;
    
    // ミステキスト
    const missText = this.scene.add.text(
      target.x,
      target.y - 20,
      'MISS',
      { fontFamily: 'Arial', fontSize: 16, color: '#ffffff' }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: missText,
      y: missText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        missText.destroy();
      }
    });
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('miss_sound');
    }
  }
  
  // ダメージを受ける
  takeDamage(amount, damageType = 'physical', isCritical = false, source = null) {
    if (this.isDead || this.isInvulnerable) return 0;
    
    // ブロック判定
    if (this.checkBlock()) {
      // ブロック成功
      this.showBlockEffect();
      return 0;
    }
    
    // 抵抗値に基づくダメージ軽減
    let finalDamage = amount;
    
    switch (damageType) {
      case 'physical':
        finalDamage *= (1 - Math.min(this.physicalResistance / 100, 0.75));
        break;
      case 'poison':
        finalDamage *= (1 - Math.min(this.poisonResistance / 100, 0.75));
        break;
      case 'fire':
        finalDamage *= (1 - Math.min(this.fireResistance / 100, 0.75));
        break;
      case 'cold':
        finalDamage *= (1 - Math.min(this.coldResistance / 100, 0.75));
        break;
      case 'electric':
        finalDamage *= (1 - Math.min(this.electricResistance / 100, 0.75));
        break;
    }
    
    // 最終ダメージ（最低1）
    finalDamage = Math.max(1, Math.floor(finalDamage));
    
    // 体力減少
    this.life = Math.max(0, this.life - finalDamage);
    
    // ヘルスバー更新
    this.updateHealthBar();
    
    // UIの更新（プレイヤーの場合）
    if (this === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.updateHealthBar) {
        uiScene.updateHealthBar();
      }
    }
    
    // ダメージエフェクト
    this.showDamageEffect(finalDamage, damageType, isCritical);
    
    // 死亡判定
    if (this.life <= 0) {
      this.die(source);
    }
    // 生存している場合はダメージリアクション
    else {
      this.damageReaction();
    }
    
    return finalDamage;
  }
  
  // ブロック判定
  checkBlock() {
    if (!this.characterEquipments.leftHand) return false;
    
    // 盾を装備している場合のみブロック判定
    if (this.characterEquipments.leftHand.type === 'shield') {
      // ブロック率判定
      return Math.random() * 100 < this.blockRate;
    }
    
    return false;
  }
  
  // ブロックエフェクトの表示
  showBlockEffect() {
    if (!this.scene) return;
    
    // ブロックテキスト
    const blockText = this.scene.add.text(
      this.x,
      this.y - 20,
      'BLOCK',
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: '#aaffff',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: blockText,
      y: blockText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        blockText.destroy();
      }
    });
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('block_sound');
    }
    
    // 盾のキラキラエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(this.x, this.y, 'particle', {
        tint: 0xaaffff,
        lifespan: 600,
        speed: { min: 20, max: 50 },
        scale: { start: 0.6, end: 0 },
        quantity: 10,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(600, () => {
        particles.destroy();
      });
    }
  }
  
  // ダメージエフェクトの表示
  showDamageEffect(amount, damageType, isCritical) {
    if (!this.scene) return;
    
    // ダメージタイプに応じた色
    const colors = {
      physical: '#ffffff',
      poison: '#00ff00',
      fire: '#ff0000',
      cold: '#00ffff',
      electric: '#ffff00'
    };
    
    const color = colors[damageType] || '#ffffff';
    
    // テキスト表示
    const damageText = this.scene.add.text(
      this.x,
      this.y - 20,
      amount.toString(),
      { 
        fontFamily: 'Arial', 
        fontSize: isCritical ? 24 : 16, 
        color: color,
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5, 0.5);
    
    // クリティカルヒットの場合は効果を追加
    if (isCritical) {
      damageText.setText(`${amount} CRITICAL!`);
      
      // 追加エフェクト
      this.scene.tweens.add({
        targets: damageText,
        scale: { from: 1.5, to: 1 },
        duration: 300
      });
    }
    
    // アニメーション
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        damageText.destroy();
      }
    });
    
    // 被ダメージ時の点滅エフェクト
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
    
    // 効果音
    if (this.scene.sound) {
      const soundKey = `${damageType}_damage_sound` || 'hit_sound';
      this.scene.sound.play(soundKey);
    }
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
        targets: [this, this.healthBar],
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          // リソースの解放
          this.destroy();
        }
      });
    });
  }
  
  // 体力回復
  heal(amount) {
    if (this.isDead) return 0;
    
    const prevLife = this.life;
    this.life = Math.min(this.maxLife, this.life + amount);
    
    // 実際に回復した量
    const healedAmount = this.life - prevLife;
    
    // ヘルスバー更新
    this.updateHealthBar();
    
    // UIの更新（プレイヤーの場合）
    if (this === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.updateHealthBar) {
        uiScene.updateHealthBar();
      }
    }
    
    // 回復エフェクト
    this.showHealEffect(healedAmount);
    
    return healedAmount;
  }
  
  // マナ回復
  restoreMana(amount) {
    if (this.isDead) return 0;
    
    const prevMana = this.mana;
    this.mana = Math.min(this.maxMana, this.mana + amount);
    
    // 実際に回復した量
    const restoredAmount = this.mana - prevMana;
    
    // UIの更新（プレイヤーの場合）
    if (this === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.updateManaBar) {
        uiScene.updateManaBar();
      }
    }
    
    // 回復エフェクト
    this.showManaEffect(restoredAmount);
    
    return restoredAmount;
  }
  
  // 体力回復エフェクトの表示
  showHealEffect(amount) {
    if (!this.scene || amount <= 0) return;
    
    // 回復テキスト
    const healText = this.scene.add.text(
      this.x,
      this.y - 20,
      `+${amount}`,
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        healText.destroy();
      }
    });
    
    // 回復エフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(this.x, this.y, 'particle', {
        tint: 0x00ff00,
        lifespan: 800,
        speed: { min: 20, max: 50 },
        scale: { start: 0.6, end: 0 },
        quantity: 10,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(800, () => {
        particles.destroy();
      });
    }
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('heal_sound');
    }
  }
  
  // マナ回復エフェクトの表示
  showManaEffect(amount) {
    if (!this.scene || amount <= 0) return;
    
    // 回復テキスト
    const manaText = this.scene.add.text(
      this.x,
      this.y - 20,
      `+${amount}`,
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: '#0000ff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: manaText,
      y: manaText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        manaText.destroy();
      }
    });
    
    // 回復エフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(this.x, this.y, 'particle', {
        tint: 0x0000ff,
        lifespan: 800,
        speed: { min: 20, max: 50 },
        scale: { start: 0.6, end: 0 },
        quantity: 10,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(800, () => {
        particles.destroy();
      });
    }
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('mana_sound');
    }
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
    
    // スキルアニメーション
    this.animationState = 'skill';
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
  
  // アイテムを使用
  useItem(item) {
    if (this.isDead || this.isStunned) return false;
    
    if (!item) return false;
    
    return item.use(this);
  }
  
  // 相互作用
  interact(character) {
    // 派生クラスでオーバーライド
  }
  
  // 移動速度の取得
  getMoveSpeed() {
    return this.moveSpeed;
  }
  
  // スキルが使用可能か
  canUseSkill() {
    return !this.isDead && !this.isStunned && !this.isPerformingAction;
  }
  
  // スキルの取得
  getSkill(index) {
    if (!this.skills || index < 0 || index >= this.skills.length) {
      return null;
    }
    
    return this.skills[index];
  }
  
  // ツールチップデータの取得
  getTooltipData() {
    return {
      name: this.name,
      level: this.level,
      life: `${this.life}/${this.maxLife}`,
      class: this.classType.name
    };
  }
  
  // HP回復処理
  regenerateLife(delta) {
    if (this.isDead) return;
    
    // 1秒あたりの回復量をデルタ時間で調整
    const regenAmount = this.lifeRegeneration * (delta / 1000);
    
    // 体力が最大未満の場合のみ回復
    if (this.life < this.maxLife) {
      this.life = Math.min(this.maxLife, this.life + regenAmount);
      this.updateHealthBar();
      
      // UIの更新（プレイヤーの場合）
      if (this === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.updateHealthBar) {
          uiScene.updateHealthBar();
        }
      }
    }
  }
  
  // マナ回復処理
  regenerateMana(delta) {
    if (this.isDead) return;
    
    // 1秒あたりの回復量をデルタ時間で調整
    const regenAmount = this.manaRegeneration * (delta / 1000);
    
    // マナが最大未満の場合のみ回復
    if (this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + regenAmount);
      
      // UIの更新（プレイヤーの場合）
      if (this === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.updateManaBar) {
          uiScene.updateManaBar();
        }
      }
    }
  }
  
  // バフとデバフの更新
  updateBuffsAndDebuffs(time) {
    // バフの更新
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      const buff = this.buffs[i];
      
      // 持続時間のチェック
      if (buff.duration > 0 && time - buff.startTime >= buff.duration) {
        // 期限切れのバフを削除
        this.buffs.splice(i, 1);
        
        // UIのバフアイコンを削除（プレイヤーの場合）
        if (this === this.scene.player) {
          const uiScene = this.scene.scene.get('UIScene');
          if (uiScene && uiScene.removeBuffIcon) {
            uiScene.removeBuffIcon(buff.uuid);
          }
        }
        
        // ステータス再計算
        this.recalculateStats();
      }
    }
    
    // デバフの更新
    for (let i = this.debuffs.length - 1; i >= 0; i--) {
      const debuff = this.debuffs[i];
      
      // 持続時間のチェック
      if (debuff.duration > 0 && time - debuff.startTime >= debuff.duration) {
        // 期限切れのデバフを削除
        this.debuffs.splice(i, 1);
        
        // UIのデバフアイコンを削除（プレイヤーの場合）
        if (this === this.scene.player) {
          const uiScene = this.scene.scene.get('UIScene');
          if (uiScene && uiScene.removeBuffIcon) {
            uiScene.removeBuffIcon(debuff.uuid);
          }
        }
        
        // ステータス再計算
        this.recalculateStats();
      }
      
      // DoTダメージ効果の適用
      if (debuff.effects && debuff.effects.dotDamage && debuff.effects.dotType) {
        // 最後のダメージ時間をチェック
        if (!debuff.lastDotTime || time - debuff.lastDotTime >= 1000) {
          // DoTダメージを適用
          this.takeDamage(debuff.effects.dotDamage, debuff.effects.dotType);
          
          // 最後のダメージ時間を更新
          debuff.lastDotTime = time;
        }
      }
    }
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
  
  // バフ効果の追加
  addBuff(buff) {
    if (!buff || this.isDead) return false;
    
    // 既存の同名バフがあれば上書き
    const existingIndex = this.buffs.findIndex(b => b.name === buff.name);
    if (existingIndex !== -1) {
      this.buffs.splice(existingIndex, 1);
    }
    
    // バフの追加
    this.buffs.push({
      ...buff,
      startTime: Date.now()
    });
    
    // UIにバフアイコンを追加（プレイヤーの場合）
    if (this === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.addBuffIcon) {
        uiScene.addBuffIcon(buff);
      }
    }
    
    // ステータス再計算
    this.recalculateStats();
    
    return true;
  }
  
  // デバフ効果の追加
  addDebuff(debuff) {
    if (!debuff || this.isDead || this.isInvulnerable) return false;
    
    // 抵抗判定
    if (debuff.effects && debuff.effects.type) {
      const resistKey = `${debuff.effects.type}Resistance`;
      if (this[resistKey] && Math.random() * 100 < this[resistKey]) {
        // 抵抗成功
        this.showResistEffect(debuff.effects.type);
        return false;
      }
    }
    
    // 既存の同名デバフがあれば上書き
    const existingIndex = this.debuffs.findIndex(d => d.name === debuff.name);
    if (existingIndex !== -1) {
      this.debuffs.splice(existingIndex, 1);
    }
    
    // デバフの追加
    this.debuffs.push({
      ...debuff,
      startTime: Date.now()
    });
    
    // UIにデバフアイコンを追加（プレイヤーの場合）
    if (this === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.addBuffIcon) {
        uiScene.addBuffIcon({
          ...debuff,
          isDebuff: true
        });
      }
    }
    
    // ステータス再計算
    this.recalculateStats();
    
    return true;
  }
  
  // 抵抗エフェクトの表示
  showResistEffect(type) {
    if (!this.scene) return;
    
    // 抵抗テキスト
    const resistText = this.scene.add.text(
      this.x,
      this.y - 20,
      `RESIST ${type.toUpperCase()}`,
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: resistText,
      y: resistText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        resistText.destroy();
      }
    });
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('resist_sound');
    }
  }
  
  // レベルアップ
  levelUp() {
    this.level += 1;
    
    // 各ステータスの上昇
    this.strength += 1;
    this.dexterity += 1;
    this.vitality += 1;
    this.energy += 1;
    
    // ステータス再計算
    this.recalculateStats();
    
    // 体力とマナを全回復
    this.life = this.maxLife;
    this.mana = this.maxMana;
    
    // レベルアップエフェクト
    this.showLevelUpEffect();
    
    // UIの更新（プレイヤーの場合）
    if (this === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene) {
        uiScene.updateHealthBar();
        uiScene.updateManaBar();
        uiScene.updateLevelText();
        
        // レベルアップメッセージ
        if (uiScene.showMessage) {
          uiScene.showMessage('レベルアップ！');
        }
      }
    }
    
    // イベント発火
    this.emit('levelUp', this);
  }
  
  // レベルアップエフェクト
  showLevelUpEffect() {
    if (!this.scene) return;
    
    // レベルアップテキスト
    const levelUpText = this.scene.add.text(
      this.x,
      this.y - 30,
      'LEVEL UP!',
      { 
        fontFamily: 'Arial', 
        fontSize: 24, 
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: levelUpText,
      y: levelUpText.y - 50,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        levelUpText.destroy();
      }
    });
    
    // キラキラエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(this.x, this.y, 'particle', {
        tint: 0xffff00,
        lifespan: 2000,
        speed: { min: 30, max: 80 },
        scale: { start: 0.8, end: 0 },
        quantity: 30,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(2000, () => {
        particles.destroy();
      });
    }
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('level_up_sound');
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
  
  // リソースの解放
  destroy() {
    // イベントリスナーの解除
    if (this.scene) {
      this.scene.events.off('update', this.update, this);
    }
    
    // ヘルスバーの削除
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    
    super.destroy();
  }
}