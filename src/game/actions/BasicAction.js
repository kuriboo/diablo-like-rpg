import Action from './Action';
import { ActionType } from '../../constants/actionTypes';
import Effect from '../objects/Effect';

export default class BasicAction extends Action {
  constructor(config = {}) {
    super(config);
    
    // 基本アクション特有のプロパティ
    this.animationKey = config.animationKey || null;
    this.soundKey = config.soundKey || null;
    this.effectKey = config.effectKey || null;
    
    // アクションの成功フラグ
    this.success = false;
    
    // アクションのコスト
    this.manaCost = config.manaCost || 0;
    this.staminaCost = config.staminaCost || 0;
    
    // アクションの効果値（ダメージや回復量など）
    this.value = config.value || 0;
    
    // アクションの属性
    this.element = config.element || 'physical'; // physical, fire, ice, lightning, poison
    
    // アクションの射程
    this.range = config.range || 1;
    
    // アクションの影響範囲
    this.areaOfEffect = config.areaOfEffect || false;
    this.areaRadius = config.areaRadius || 0;
    
    // アクションの移動関連パラメータ
    this.moveDistance = config.moveDistance || 0;
    this.moveSpeed = config.moveSpeed || 0;
  }
  
  // アクション実行時の処理をオーバーライド
  execute() {
    // アクションの成功フラグ初期化
    this.success = false;
    
    // オーナーがいない場合は失敗
    if (!this.owner) return;
    
    // マナコストを支払う
    if (this.manaCost > 0) {
      if (this.owner.mana < this.manaCost) return; // マナ不足
      this.owner.mana -= this.manaCost;
      
      // プレイヤーの場合はUIを更新
      if (this.owner === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.updateManaBar) {
          uiScene.updateManaBar();
        }
      }
    }
    
    // スタミナコストを支払う
    if (this.staminaCost > 0 && this.owner.stamina !== undefined) {
      if (this.owner.stamina < this.staminaCost) return; // スタミナ不足
      this.owner.stamina -= this.staminaCost;
    }
    
    // アクションのタイプに応じた処理
    switch (this.type) {
      case ActionType.MOVE:
        this.executeMove();
        break;
      case ActionType.ATTACK:
        this.executeAttack();
        break;
      case ActionType.CAST:
        this.executeCast();
        break;
      case ActionType.HEAL:
        this.executeHeal();
        break;
      case ActionType.USE_ITEM:
        this.executeUseItem();
        break;
      case ActionType.INTERACT:
        this.executeInteract();
        break;
      default:
        // デフォルトの処理
        console.log(`Executing basic action: ${this.name}`);
        this.success = true;
        break;
    }
  }
  
  // 移動アクションの実行
  executeMove() {
    if (!this.owner || !this.position) return;
    
    // 移動不可状態のチェック
    if (this.owner.isStunned || this.owner.isRooted) {
      return;
    }
    
    // 移動アニメーション
    this.owner.animationState = 'walk';
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
    
    // 移動先が歩行可能かチェック - TopDownMap対応
    let isWalkable = false;
    
    // TopDownMapを使用する場合
    if (this.scene.topDownMap) {
      const tilePos = this.scene.topDownMap.worldToTileXY(this.position.x, this.position.y);
      isWalkable = this.scene.topDownMap.isWalkableAt(tilePos.x, tilePos.y);
    } 
    // 従来のisWalkableAt関数がある場合
    else if (this.scene.isWalkableAt) {
      isWalkable = this.scene.isWalkableAt(this.position.x, this.position.y);
    }
    // どちらもない場合は移動可能と見なす
    else {
      isWalkable = true;
    }
    
    if (!isWalkable) {
      // 移動失敗
      this.owner.animationState = 'idle';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
      return;
    }
    
    // 移動速度の計算 - トップダウン向けに調整
    const moveSpeed = this.owner.getMoveSpeed ? 
                     this.owner.getMoveSpeed() : (this.moveSpeed || 150);
    
    // 移動方向を向く
    this.facePosition();
    
    // Tweenで移動
    this.scene.tweens.add({
      targets: this.owner,
      x: this.position.x,
      y: this.position.y,
      duration: this.duration || 
               (Phaser.Math.Distance.Between(this.owner.x, this.owner.y, 
                                             this.position.x, this.position.y) / moveSpeed * 1000),
      ease: 'Linear',
      onComplete: () => {
        // 移動完了
        this.owner.animationState = 'idle';
        if (this.owner.playAnimation) {
          this.owner.playAnimation();
        }
        this.success = true;
        
        // アクション完了
        this.complete();
      }
    });
    
    // 移動音を再生
    if (this.soundKey && this.scene.sound) {
      this.scene.sound.play(this.soundKey);
    }
  }

  // トップダウン向けの方向更新メソッドを追加
  updateDirectionForTopDown() {
    if (!this.moveTarget && !this.position) return;
    
    const targetX = this.position ? this.position.x : this.moveTarget.x;
    const targetY = this.position ? this.position.y : this.moveTarget.y;
    
    const dx = targetX - this.owner.x;
    const dy = targetY - this.owner.y;
    
    // トップダウン向けの4方向または8方向
    if (Math.abs(dx) > Math.abs(dy)) {
      this.owner.direction = dx > 0 ? 'right' : 'left';
    } else {
      this.owner.direction = dy > 0 ? 'down' : 'up';
    }
  }
  
  // 攻撃アクションの実行
  executeAttack() {
    if (!this.owner) return;
    
    // 攻撃対象の設定
    if (!this.target) {
      // 対象が設定されていない場合、近くの敵を自動選択
      this.target = this.findNearestEnemy();
      
      if (!this.target) {
        // 対象がいない場合は失敗
        return;
      }
    }
    
    // 攻撃範囲のチェック
    const distance = Phaser.Math.Distance.Between(
      this.owner.x, this.owner.y,
      this.target.x, this.target.y
    );

    const tileSize = this.scene.topDownMap ? this.scene.topDownMap.tileSize : 32;
    const attackRange = this.range * tileSize;
    
    if (distance > attackRange) {
      // 範囲外なら失敗
      return;
    }
    
    // 攻撃方向を向く
    this.faceTarget();
    
    // 攻撃アニメーション
    this.owner.animationState = 'attack';
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
    
    // 攻撃音を再生
    if (this.soundKey && this.scene.sound) {
      this.scene.sound.play(this.soundKey);
    }
    
    // 攻撃エフェクトの表示
    if (this.effectKey && this.scene.effectFactory) {
      const effect = this.scene.effectFactory.createEffect({
        type: 'visual',
        name: this.effectKey,
        x: this.target.x,
        y: this.target.y,
        scene: this.scene
      });
      
      if (effect) {
        this.addEffect(effect);
      }
    }
    
    // 攻撃判定（タイミングをずらす）
    this.scene.time.delayedCall(300, () => {
      // オーナーまたはターゲットが既に死亡している場合は攻撃中止
      if (this.owner.isDead || this.target.isDead) {
        this.complete();
        return;
      }
      
      // 範囲攻撃の場合
      if (this.areaOfEffect) {
        // 範囲内の全ターゲットにダメージ
        const targets = this.findTargetsInArea(this.target.x, this.target.y, this.areaRadius);
        
        for (const target of targets) {
          this.applyAttackDamage(target);
        }
      } 
      // 単体攻撃
      else {
        this.applyAttackDamage(this.target);
      }
      
      // 攻撃成功
      this.success = true;
    });
    
    // アクション終了タイマー
    this.scene.time.delayedCall(this.duration || 500, () => {
      // アニメーションを戻す
      this.owner.animationState = 'idle';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
      
      // アクション完了
      this.complete();
    });
  }
  
  // 魔法詠唱アクションの実行
  executeCast() {
    if (!this.owner) return;
    
    // 詠唱対象の設定
    if (this.target === null && this.position === null) {
      // 対象が設定されていない場合、近くの敵を自動選択
      this.target = this.findNearestEnemy();
      
      if (!this.target) {
        // 対象がいない場合は失敗
        return;
      }
    }
    
    // 対象方向を向く
    if (this.target) {
      this.faceTarget();
    } else if (this.position) {
      this.facePosition();
    }
    
    // 詠唱アニメーション
    this.owner.animationState = 'cast';
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
    
    // 詠唱エフェクト
    if (this.effectKey && this.scene.effectFactory) {
      const effect = this.scene.effectFactory.createEffect({
        type: 'visual',
        name: 'cast_effect',
        x: this.owner.x,
        y: this.owner.y,
        scene: this.scene
      });
      
      if (effect) {
        this.addEffect(effect);
      }
    }
    
    // 詠唱音を再生
    if (this.soundKey && this.scene.sound) {
      this.scene.sound.play(this.soundKey);
    }
    
    // 詠唱完了時の処理
    this.scene.time.delayedCall(this.duration || 800, () => {
      // 詠唱エフェクトの終了
      this.cleanupEffects();
      
      // 対象にエフェクト適用
      if (this.target && !this.target.isDead) {
        // 範囲攻撃の場合
        if (this.areaOfEffect) {
          // 範囲内の全ターゲットにダメージ
          const targets = this.findTargetsInArea(this.target.x, this.target.y, this.areaRadius);
          
          for (const target of targets) {
            this.applySpellEffect(target);
          }
        } 
        // 単体攻撃
        else {
          this.applySpellEffect(this.target);
        }
      } 
      // 位置指定の場合
      else if (this.position) {
        // 範囲内の全ターゲットにダメージ
        const targets = this.findTargetsInArea(this.position.x, this.position.y, this.areaRadius);
        
        for (const target of targets) {
          this.applySpellEffect(target);
        }
      }
      
      // アニメーションを戻す
      this.owner.animationState = 'idle';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
      
      // 詠唱成功
      this.success = true;
      
      // アクション完了
      this.complete();
    });
  }
  
  // 回復アクションの実行
  executeHeal() {
    if (!this.owner) return;
    
    // 回復対象の設定
    if (!this.target) {
      // デフォルトは自分自身
      this.target = this.owner;
    }
    
    // 回復アニメーション
    this.owner.animationState = 'cast';
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
    
    // 回復エフェクト
    if (this.effectKey && this.scene.effectFactory) {
      const effect = this.scene.effectFactory.createEffect({
        type: 'visual',
        name: 'heal_effect',
        x: this.target.x,
        y: this.target.y,
        scene: this.scene
      });
      
      if (effect) {
        this.addEffect(effect);
      }
    }
    
    // 回復音を再生
    if (this.soundKey && this.scene.sound) {
      this.scene.sound.play(this.soundKey);
    }
    
    // 回復値の計算
    let healAmount = this.value;
    
    // レベルによる補正
    if (this.owner.level) {
      healAmount += Math.floor(healAmount * (this.owner.level * 0.1));
    }
    
    // 回復実行
    this.scene.time.delayedCall(300, () => {
      // 範囲回復の場合
      if (this.areaOfEffect) {
        // 範囲内の全味方に回復
        const targets = this.findFriendliesInArea(this.target.x, this.target.y, this.areaRadius);
        
        for (const target of targets) {
          this.applyHeal(target, healAmount);
        }
      } 
      // 単体回復
      else {
        this.applyHeal(this.target, healAmount);
      }
      
      // 回復成功
      this.success = true;
    });
    
    // アクション終了タイマー
    this.scene.time.delayedCall(this.duration || 500, () => {
      // アニメーションを戻す
      this.owner.animationState = 'idle';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
      
      // アクション完了
      this.complete();
    });
  }
  
  // アイテム使用アクションの実行
  executeUseItem() {
    if (!this.owner) return;
    
    // アイテムの設定
    if (!this.target) {
      // targetがアイテムオブジェクト
      return;
    }
    
    // アイテム使用アニメーション
    this.owner.animationState = 'use';
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
    
    // アイテム使用音を再生
    if (this.soundKey && this.scene.sound) {
      this.scene.sound.play(this.soundKey);
    }
    
    // アイテム使用エフェクト
    if (this.effectKey && this.scene.effectFactory) {
      const effect = this.scene.effectFactory.createEffect({
        type: 'visual',
        name: this.effectKey,
        x: this.owner.x,
        y: this.owner.y,
        scene: this.scene
      });
      
      if (effect) {
        this.addEffect(effect);
      }
    }
    
    // アイテム使用
    this.scene.time.delayedCall(300, () => {
      // アイテム使用処理
      if (this.target.use && this.target.use(this.owner)) {
        // 使用成功
        this.success = true;
      }
    });
    
    // アクション終了タイマー
    this.scene.time.delayedCall(this.duration || 500, () => {
      // アニメーションを戻す
      this.owner.animationState = 'idle';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
      
      // アクション完了
      this.complete();
    });
  }
  
  // インタラクションアクションの実行
  executeInteract() {
    if (!this.owner) return;
    
    // インタラクション対象の設定
    if (!this.target) {
      // 対象が設定されていない場合、近くのインタラクティブなオブジェクトを自動選択
      this.target = this.findNearestInteractive();
      
      if (!this.target) {
        // 対象がいない場合は失敗
        return;
      }
    }
    
    // 対象方向を向く
    this.faceTarget();
    
    // インタラクションアニメーション
    this.owner.animationState = 'interact';
    if (this.owner.playAnimation) {
      this.owner.playAnimation();
    }
    
    // インタラクション音を再生
    if (this.soundKey && this.scene.sound) {
      this.scene.sound.play(this.soundKey);
    }
    
    // インタラクション処理
    this.scene.time.delayedCall(300, () => {
      // インタラクション対象の処理呼び出し
      if (this.target.interact && this.target.interact(this.owner)) {
        // インタラクション成功
        this.success = true;
      }
    });
    
    // アクション終了タイマー
    this.scene.time.delayedCall(this.duration || 500, () => {
      // アニメーションを戻す
      this.owner.animationState = 'idle';
      if (this.owner.playAnimation) {
        this.owner.playAnimation();
      }
      
      // アクション完了
      this.complete();
    });
  }
  
  // アクション完了時の処理
  handleActionCompletion() {
    // アクションタイプに応じた完了処理
    switch (this.type) {
      case ActionType.ATTACK:
        // 攻撃クールダウンの設定
        if (this.owner) {
          this.owner.lastAttackTime = Date.now();
        }
        break;
      
      case ActionType.CAST:
        // 詠唱クールダウンの設定
        if (this.owner && this.owner.setSkillCooldown) {
          this.owner.setSkillCooldown(this.name, this.cooldown || 1000);
        }
        break;
      
      default:
        break;
    }
  }
  
  // 攻撃ダメージの適用
  applyAttackDamage(target) {
    if (!target || target.isDead) return;
    
    // ダメージ計算
    let damage = this.calculateDamage();
    
    // クリティカル判定
    const isCritical = this.checkCriticalHit();
    if (isCritical) {
      damage = Math.floor(damage * this.owner.criticalDamage);
    }
    
    // HIT判定
    const isHit = this.checkHit(target);
    if (!isHit) {
      // ミス表示
      this.showMissEffect(target);
      return;
    }
    
    // ダメージタイプ
    const damageType = this.element || 'physical';
    
    // ダメージを与える
    target.takeDamage(damage, damageType, isCritical, this.owner);
    
    // ライフスティール効果
    if (this.owner.lifeLeech > 0) {
      const leechAmount = Math.floor(damage * (this.owner.lifeLeech / 100));
      if (leechAmount > 0) {
        this.owner.heal(leechAmount);
      }
    }
    
    // マナスティール効果
    if (this.owner.manaLeech > 0) {
      const leechAmount = Math.floor(damage * (this.owner.manaLeech / 100));
      if (leechAmount > 0) {
        this.owner.restoreMana(leechAmount);
      }
    }
  }
  
  // 魔法効果の適用
  applySpellEffect(target) {
    if (!target || target.isDead) return;
    
    // 魔法ダメージ計算
    let damage = this.calculateSpellDamage();
    
    // クリティカル判定
    const isCritical = this.checkCriticalHit();
    if (isCritical) {
      damage = Math.floor(damage * this.owner.criticalDamage);
    }
    
    // 魔法命中率は通常100%（抵抗判定はダメージメソッド内で行う）
    
    // ダメージタイプ
    const damageType = this.element || 'physical';
    
    // ダメージを与える
    target.takeDamage(damage, damageType, isCritical, this.owner);
    
    // 追加効果（状態異常など）
    if (this.statusEffect) {
      this.applyStatusEffect(target);
    }
  }
  
  // 状態異常効果の適用
  applyStatusEffect(target) {
    if (!target || target.isDead || !this.statusEffect) return;
    
    // 状態異常の効果生成
    const effect = new Effect({
      name: this.statusEffect.name,
      type: 'debuff',
      description: this.statusEffect.description,
      duration: this.statusEffect.duration,
      scene: this.scene,
      source: this.owner,
      target: target,
      value: {
        effectType: this.statusEffect.type,
        effects: this.statusEffect.effects
      }
    });
    
    // 対象に状態異常を適用
    if (target.addDebuff) {
      target.addDebuff(effect);
    }
  }
  
  // 回復効果の適用
  applyHeal(target, amount) {
    if (!target || target.isDead) return;
    
    // 回復処理
    if (target.heal) {
      target.heal(amount);
    }
  }
  
  // ダメージ計算
  calculateDamage() {
    if (!this.owner) return this.value;
    
    // 基本ダメージ
    let baseDamage = this.value || this.owner.basicAttack || 1;
    
    // 武器による追加ダメージ
    if (this.owner.bonusAttack) {
      baseDamage *= (1 + this.owner.bonusAttack);
    }
    
    // レベルによるボーナス
    if (this.owner.level) {
      baseDamage *= (1 + this.owner.level * 0.05);
    }
    
    // 筋力によるボーナス（近接攻撃）
    if (this.element === 'physical' && this.owner.strength) {
      baseDamage *= (1 + this.owner.strength * 0.01);
    }
    
    // 器用さによるボーナス（遠距離攻撃）
    if (this.range > 1 && this.owner.dexterity) {
      baseDamage *= (1 + this.owner.dexterity * 0.01);
    }
    
    // 属性ダメージの追加
    if (this.element === 'fire' && this.owner.fireDamage) {
      baseDamage += this.owner.fireDamage;
    } else if (this.element === 'cold' && this.owner.coldDamage) {
      baseDamage += this.owner.coldDamage;
    } else if (this.element === 'poison' && this.owner.poisonDamage) {
      baseDamage += this.owner.poisonDamage;
    } else if (this.element === 'electric' && this.owner.electricDamage) {
      baseDamage += this.owner.electricDamage;
    }
    
    return Math.floor(baseDamage);
  }
  
  // 魔法ダメージ計算
  calculateSpellDamage() {
    if (!this.owner) return this.value;
    
    // 基本ダメージ
    let baseDamage = this.value || 1;
    
    // レベルによるボーナス
    if (this.owner.level) {
      baseDamage *= (1 + this.owner.level * 0.05);
    }
    
    // エネルギーによるボーナス（魔法攻撃）
    if (this.owner.energy) {
      baseDamage *= (1 + this.owner.energy * 0.02);
    }
    
    // 魔法ダメージボーナス
    if (this.owner.spellDamageBonus) {
      baseDamage *= (1 + this.owner.spellDamageBonus / 100);
    }
    
    return Math.floor(baseDamage);
  }
  
  // クリティカルヒット判定
  checkCriticalHit() {
    if (!this.owner) return false;
    
    // クリティカル率の取得
    const critRate = this.owner.criticalRate || 5; // デフォルト5%
    
    // 判定
    return Math.random() * 100 < critRate;
  }
  
  // HIT判定
  checkHit(target) {
    if (!this.owner || !target) return true;
    
    // AR（命中率）と回避値の取得
    const ar = this.owner.finalAR || 70; // デフォルト70%
    const evade = target.evade || target.basicDefence || 0;
    
    // 必中の場合
    if (ar >= 95) return true;
    
    // 絶対回避の場合
    if (evade >= 95) return false;
    
    // 命中率計算
    const hitChance = Math.min(95, Math.max(5, ar - evade));
    
    // 判定
    return Math.random() * 100 < hitChance;
  }
  
  // ミス表示エフェクト
  showMissEffect(target) {
    if (!this.scene || !target) return;
    
    // ミステキスト
    const missText = this.scene.add.text(
      target.x,
      target.y - 20,
      'MISS',
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }
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
  }
  
  // 最も近い敵を探す
  findNearestEnemy() {
    if (!this.owner || !this.scene) return null;
    
    const enemies = this.scene.enemies || [];
    let nearestEnemy = null;
    let nearestDistance = Number.MAX_VALUE;
    
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      
      const distance = Phaser.Math.Distance.Between(
        this.owner.x, this.owner.y,
        enemy.x, enemy.y
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    return nearestEnemy;
  }
  
  // 最も近いインタラクティブオブジェクトを探す
  findNearestInteractive() {
    if (!this.owner || !this.scene) return null;
    
    const interactiveObjects = [
      ...(this.scene.npcs || []),
      ...(this.scene.items || []).filter(item => item.canInteract)
    ];
    
    let nearestObject = null;
    let nearestDistance = Number.MAX_VALUE;
    
    for (const obj of interactiveObjects) {
      if (obj.isDead || !obj.canInteract) continue;
      
      const distance = Phaser.Math.Distance.Between(
        this.owner.x, this.owner.y,
        obj.x, obj.y
      );
      
      if (distance < nearestDistance && distance <= 100) { // 100pxの範囲内のみ
        nearestDistance = distance;
        nearestObject = obj;
      }
    }
    
    return nearestObject;
  }
  
  // 範囲内の対象を探す
  findTargetsInArea(x, y, radius) {
    if (!this.scene) return [];
  
    const targets = [];
    
    // タイルサイズを考慮した半径の調整
    const tileSize = this.scene.topDownMap ? this.scene.topDownMap.tileSize : 32;
    const adjustedRadius = radius * tileSize;
    
    // 敵の場合はプレイヤーとコンパニオンが対象
    if (this.owner.constructor.name === 'Enemy') {
      if (this.scene.player && !this.scene.player.isDead) {
        const distance = Phaser.Math.Distance.Between(
          x, y, 
          this.scene.player.x, this.scene.player.y
        );
        
        if (distance <= adjustedRadius) {
          targets.push(this.scene.player);
        }
      }
      
      for (const companion of (this.scene.companions || [])) {
        if (companion.isDead) continue;
        
        const distance = Phaser.Math.Distance.Between(
          x, y,
          companion.x, companion.y
        );
        
        if (distance <= radius) {
          targets.push(companion);
        }
      }
    }
    // プレイヤーやコンパニオンの場合は敵が対象
    else {
      for (const enemy of (this.scene.enemies || [])) {
        if (enemy.isDead) continue;
        
        const distance = Phaser.Math.Distance.Between(
          x, y,
          enemy.x, enemy.y
        );
        
        if (distance <= radius) {
          targets.push(enemy);
        }
      }
    }
    
    return targets;
  }
  
  // 範囲内の味方を探す
  findFriendliesInArea(x, y, radius) {
    if (!this.scene) return [];
    
    const targets = [];
    
    // 敵の場合は他の敵が対象
    if (this.owner.constructor.name === 'Enemy') {
      for (const enemy of (this.scene.enemies || [])) {
        if (enemy.isDead || enemy === this.owner) continue;
        
        const distance = Phaser.Math.Distance.Between(
          x, y,
          enemy.x, enemy.y
        );
        
        if (distance <= radius) {
          targets.push(enemy);
        }
      }
    }
    // プレイヤーやコンパニオンの場合はプレイヤーとコンパニオンが対象
    else {
      if (this.scene.player && !this.scene.player.isDead) {
        const distance = Phaser.Math.Distance.Between(
          x, y,
          this.scene.player.x, this.scene.player.y
        );
        
        if (distance <= radius) {
          targets.push(this.scene.player);
        }
      }
      
      for (const companion of (this.scene.companions || [])) {
        if (companion.isDead || companion === this.owner) continue;
        
        const distance = Phaser.Math.Distance.Between(
          x, y,
          companion.x, companion.y
        );
        
        if (distance <= radius) {
          targets.push(companion);
        }
      }
    }
    
    return targets;
  }
}