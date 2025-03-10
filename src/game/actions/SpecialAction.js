import Action from './Action';
import BasicAction from './BasicAction';
import { ActionType } from '../../constants/actionTypes';
import Effect from '../objects/Effect';

export default class SpecialAction extends Action {
  constructor(config = {}) {
    super(config);
    
    // 特殊アクション特有のプロパティ
    this.skill = config.skill || null;
    this.actionList = new Map(); // 基本アクションのリスト
    
    // スキルのクールダウン
    this.cooldown = config.cooldown || 
                  (this.skill ? this.skill.cooldown : 10000);
    
    // コスト
    this.manaCost = config.manaCost || 
                  (this.skill ? this.skill.manaCost : 0);
    
    // スキル関連のパラメータをスキルオブジェクトから取得
    if (this.skill) {
      // スキル名・説明
      this.name = this.skill.name || this.name;
      this.description = this.skill.description || this.description;
      
      // スキルアイコン
      this.icon = this.skill.icon || null;
      
      // エフェクト関連
      this.effects = this.skill.effects || {};
      this.statusEffects = this.skill.statusEffects || [];
      
      // 特殊属性
      this.element = this.skill.element || 'physical';
      this.areaOfEffect = this.skill.areaOfEffect || false;
      this.areaRadius = this.skill.areaRadius || 0;
      
      // 特殊なプロパティ
      this.properties = this.skill.properties || {};
    }
    
    // スキルの成功フラグ
    this.success = false;
    
    // スキルに基づいて基本アクションを設定
    this.setupBasicActions();
  }
  
  // スキルに基づいて基本アクションを設定
  setupBasicActions() {
    if (!this.skill) return;
    
    // スキルタイプに応じた基本アクションの設定
    switch (this.type) {
      // 攻撃系スキル
      case ActionType.SKILL_ATTACK:
        this.setupAttackSkill();
        break;
      
      // 範囲攻撃スキル
      case ActionType.SKILL_AREA_ATTACK:
        this.setupAreaAttackSkill();
        break;
      
      // バフスキル
      case ActionType.SKILL_BUFF:
        this.setupBuffSkill();
        break;
      
      // デバフスキル
      case ActionType.SKILL_DEBUFF:
        this.setupDebuffSkill();
        break;
      
      // 回復スキル
      case ActionType.SKILL_HEAL:
        this.setupHealSkill();
        break;
      
      // 召喚スキル
      case ActionType.SKILL_SUMMON:
        this.setupSummonSkill();
        break;
      
      // 移動/位置操作系スキル
      case ActionType.SKILL_MOVEMENT:
        this.setupMovementSkill();
        break;
      
      // 複合スキル
      case ActionType.SKILL_COMBO:
        this.setupComboSkill();
        break;
      
      default:
        // デフォルトの動作
        console.log(`Unhandled skill type: ${this.type}`);
        break;
    }
  }
  
  // 攻撃系スキルの設定
  setupAttackSkill() {
    // 単体攻撃のスキル
    const attackAction = new BasicAction({
      name: `${this.name} - Attack`,
      type: ActionType.ATTACK,
      owner: this.owner,
      target: this.target,
      scene: this.scene,
      value: this.skill.damage || 20,
      element: this.element,
      range: this.skill.range || 1,
      duration: this.skill.castTime || 500,
      soundKey: `skill_${this.type.toLowerCase()}_sound`,
      effectKey: `skill_${this.type.toLowerCase()}_effect`,
      statusEffect: this.getStatusEffect()
    });
    
    this.actionList.set('attack', attackAction);
  }
  
  // 範囲攻撃スキルの設定
  setupAreaAttackSkill() {
    // 範囲攻撃のスキル
    const areaAttackAction = new BasicAction({
      name: `${this.name} - Area Attack`,
      type: ActionType.CAST,
      owner: this.owner,
      target: this.target,
      position: this.position,
      scene: this.scene,
      value: this.skill.damage || 15,
      element: this.element,
      areaOfEffect: true,
      areaRadius: this.skill.radius || 150,
      duration: this.skill.castTime || 800,
      soundKey: `skill_${this.type.toLowerCase()}_sound`,
      effectKey: `skill_${this.type.toLowerCase()}_effect`,
      statusEffect: this.getStatusEffect()
    });
    
    this.actionList.set('areaAttack', areaAttackAction);
  }
  
  // バフスキルの設定
  setupBuffSkill() {
    // バフスキル
    const buffAction = new BasicAction({
      name: `${this.name} - Buff`,
      type: ActionType.CAST,
      owner: this.owner,
      target: this.skill.targetSelf ? this.owner : this.target,
      scene: this.scene,
      duration: this.skill.castTime || 500,
      soundKey: `skill_${this.type.toLowerCase()}_sound`,
      effectKey: `skill_${this.type.toLowerCase()}_effect`
    });
    
    this.actionList.set('buff', buffAction);
  }
  
  // デバフスキルの設定
  setupDebuffSkill() {
    // デバフスキル
    const debuffAction = new BasicAction({
      name: `${this.name} - Debuff`,
      type: ActionType.CAST,
      owner: this.owner,
      target: this.target,
      scene: this.scene,
      element: this.element,
      areaOfEffect: this.areaOfEffect,
      areaRadius: this.areaRadius,
      duration: this.skill.castTime || 500,
      soundKey: `skill_${this.type.toLowerCase()}_sound`,
      effectKey: `skill_${this.type.toLowerCase()}_effect`
    });
    
    this.actionList.set('debuff', debuffAction);
  }
  
  // 回復スキルの設定
  setupHealSkill() {
    // 回復スキル
    const healAction = new BasicAction({
      name: `${this.name} - Heal`,
      type: ActionType.HEAL,
      owner: this.owner,
      target: this.skill.targetSelf ? this.owner : this.target,
      scene: this.scene,
      value: this.skill.healAmount || 30,
      areaOfEffect: this.areaOfEffect,
      areaRadius: this.areaRadius,
      duration: this.skill.castTime || 500,
      soundKey: `skill_${this.type.toLowerCase()}_sound`,
      effectKey: `skill_${this.type.toLowerCase()}_effect`
    });
    
    this.actionList.set('heal', healAction);
  }
  
  // 召喚スキルの設定
  setupSummonSkill() {
    // 召喚スキル
    const summonAction = new BasicAction({
      name: `${this.name} - Summon`,
      type: ActionType.CAST,
      owner: this.owner,
      position: this.position || {
        x: this.owner.x + 50,
        y: this.owner.y + 50
      },
      scene: this.scene,
      duration: this.skill.castTime || 1000,
      soundKey: `skill_${this.type.toLowerCase()}_sound`,
      effectKey: `skill_${this.type.toLowerCase()}_effect`
    });
    
    this.actionList.set('summon', summonAction);
  }
  
  // 移動/位置操作系スキルの設定
  setupMovementSkill() {
    // 移動系スキル（ダッシュ、テレポートなど）
    const movementAction = new BasicAction({
      name: `${this.name} - Movement`,
      type: ActionType.MOVE,
      owner: this.owner,
      position: this.position,
      scene: this.scene,
      duration: this.skill.castTime || 300,
      moveDistance: this.skill.moveDistance || 200,
      moveSpeed: this.skill.moveSpeed || 5,
      soundKey: `skill_${this.type.toLowerCase()}_sound`,
      effectKey: `skill_${this.type.toLowerCase()}_effect`
    });
    
    this.actionList.set('movement', movementAction);
  }
  
  // 複合スキルの設定
  setupComboSkill() {
    // 複合スキル（複数のアクションを連続して実行）
    const comboActions = this.skill.actions || [];
    
    // 各アクションを追加
    comboActions.forEach((action, index) => {
      let basicAction;
      
      switch (action.type) {
        case 'attack':
          basicAction = new BasicAction({
            name: `${this.name} - Combo Attack ${index + 1}`,
            type: ActionType.ATTACK,
            owner: this.owner,
            target: this.target,
            scene: this.scene,
            value: action.damage || 10,
            element: action.element || this.element,
            duration: action.duration || 300,
            soundKey: action.soundKey || `skill_attack_sound`,
            effectKey: action.effectKey || `skill_attack_effect`,
            statusEffect: this.getStatusEffect(action.statusEffect)
          });
          break;
        
        case 'move':
          basicAction = new BasicAction({
            name: `${this.name} - Combo Move ${index + 1}`,
            type: ActionType.MOVE,
            owner: this.owner,
            position: {
              x: this.owner.x + (action.dx || 0),
              y: this.owner.y + (action.dy || 0)
            },
            scene: this.scene,
            duration: action.duration || 200,
            soundKey: action.soundKey || `skill_movement_sound`,
            effectKey: action.effectKey || `skill_movement_effect`
          });
          break;
        
        case 'cast':
          basicAction = new BasicAction({
            name: `${this.name} - Combo Cast ${index + 1}`,
            type: ActionType.CAST,
            owner: this.owner,
            target: this.target,
            scene: this.scene,
            value: action.damage || 0,
            element: action.element || this.element,
            areaOfEffect: action.areaOfEffect || false,
            areaRadius: action.radius || 0,
            duration: action.duration || 500,
            soundKey: action.soundKey || `skill_cast_sound`,
            effectKey: action.effectKey || `skill_cast_effect`
          });
          break;
      }
      
      if (basicAction) {
        this.actionList.set(`combo_${index}`, basicAction);
      }
    });
  }
  
  // 状態異常効果の取得
  getStatusEffect(customEffect = null) {
    // カスタム効果があれば優先
    if (customEffect) return customEffect;
    
    // スキルの状態異常効果を取得
    const statusEffect = this.statusEffects && this.statusEffects.length > 0 ? 
                        this.statusEffects[0] : null;
    
    if (!statusEffect) return null;
    
    // 状態異常の効果を構築
    return {
      name: statusEffect.name || `${this.name} Effect`,
      description: statusEffect.description || `Effect of ${this.name}`,
      duration: statusEffect.duration || 5000,
      type: statusEffect.type || this.element,
      effects: statusEffect.effects || {}
    };
  }
  
  // アクション実行時の処理をオーバーライド
  execute() {
    // オーナーがいない場合は失敗
    if (!this.owner) return;
    
    // マナコストを支払う
    if (this.manaCost > 0) {
      if (this.owner.mana < this.manaCost) {
        // マナ不足メッセージ
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.showMessage) {
          uiScene.showMessage('マナが足りません');
        }
        return; // マナ不足で失敗
      }
      
      this.owner.mana -= this.manaCost;
      
      // プレイヤーの場合はUIを更新
      if (this.owner === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.updateManaBar) {
          uiScene.updateManaBar();
        }
      }
    }
    
    // スキルのクールダウン記録
    if (this.skill) {
      this.skill.lastUsed = Date.now();
    }
    
    // アクションの実行
    this.executeActions();
  }
  
  // アクションリストの実行
  executeActions() {
    // アクションがない場合
    if (this.actionList.size === 0) {
      console.log(`No actions defined for skill: ${this.name}`);
      this.complete();
      return;
    }
    
    // スキルタイプに応じた実行方法
    switch (this.type) {
      // 複合スキル（シーケンシャル実行）
      case ActionType.SKILL_COMBO:
        this.executeComboActions();
        break;
      
      // バフスキル
      case ActionType.SKILL_BUFF:
        this.executeBuffAction();
        break;
      
      // デバフスキル
      case ActionType.SKILL_DEBUFF:
        this.executeDebuffAction();
        break;
      
      // 召喚スキル
      case ActionType.SKILL_SUMMON:
        this.executeSummonAction();
        break;
      
      // その他のスキル（並列実行）
      default:
        this.executeParallelActions();
        break;
    }
  }
  
  // 複合アクションのシーケンシャル実行
  executeComboActions() {
    // コンボアクションの順番に実行
    const actions = Array.from(this.actionList.values());
    this.executeActionSequence(actions, 0);
  }
  
  // アクションの連続実行（再帰）
  executeActionSequence(actions, index) {
    if (index >= actions.length) {
      // すべてのアクションが完了
      this.success = true;
      this.complete();
      return;
    }
    
    // 現在のアクションを実行
    const currentAction = actions[index];
    
    // 次のアクションに進むコールバックを設定
    currentAction.onComplete = () => {
      // 次のアクションへ
      this.scene.time.delayedCall(100, () => {
        this.executeActionSequence(actions, index + 1);
      });
    };
    
    // アクションを実行
    currentAction.play();
  }
  
  // バフアクションの実行
  executeBuffAction() {
    // バフアクションを実行
    const buffAction = this.actionList.get('buff');
    if (buffAction) {
      buffAction.play();
    }
    
    // バフ効果を適用
    this.scene.time.delayedCall(300, () => {
      // ターゲット（通常は自分自身または味方）
      const target = this.skill.targetSelf ? this.owner : this.target;
      
      if (!target || target.isDead) {
        this.complete();
        return;
      }
      
      // 範囲バフの場合
      if (this.areaOfEffect) {
        // 範囲内の全味方にバフ適用
        const targets = this.findFriendliesInArea(
          target.x, target.y, 
          this.areaRadius || 150
        );
        
        for (const t of targets) {
          this.applyBuffEffect(t);
        }
      } 
      // 単体バフ
      else {
        this.applyBuffEffect(target);
      }
      
      this.success = true;
    });
    
    // アクション完了
    this.scene.time.delayedCall(buffAction ? buffAction.duration : 500, () => {
      this.complete();
    });
  }
  
  // デバフアクションの実行
  executeDebuffAction() {
    // デバフアクションを実行
    const debuffAction = this.actionList.get('debuff');
    if (debuffAction) {
      debuffAction.play();
    }
    
    // デバフ効果を適用
    this.scene.time.delayedCall(300, () => {
      if (!this.target || this.target.isDead) {
        this.complete();
        return;
      }
      
      // 範囲デバフの場合
      if (this.areaOfEffect) {
        // 範囲内の全敵にデバフ適用
        const targets = this.findTargetsInArea(
          this.target.x, this.target.y, 
          this.areaRadius || 150
        );
        
        for (const target of targets) {
          this.applyDebuffEffect(target);
        }
      } 
      // 単体デバフ
      else {
        this.applyDebuffEffect(this.target);
      }
      
      this.success = true;
    });
    
    // アクション完了
    this.scene.time.delayedCall(debuffAction ? debuffAction.duration : 500, () => {
      this.complete();
    });
  }
  
  // 召喚アクションの実行
  executeSummonAction() {
    // 召喚アクションを実行
    const summonAction = this.actionList.get('summon');
    if (summonAction) {
      summonAction.play();
    }
    
    // 召喚処理
    this.scene.time.delayedCall(500, () => {
      // 召喚位置の決定
      const position = this.position || {
        x: this.owner.x + (Math.random() * 100 - 50),
        y: this.owner.y + (Math.random() * 100 - 50)
      };
      
      // 召喚エフェクト
      if (this.scene.effectFactory) {
        const effect = this.scene.effectFactory.createEffect({
          type: 'visual',
          name: 'summon_appear',
          x: position.x,
          y: position.y,
          scene: this.scene
        });
        
        if (effect) {
          this.addEffect(effect);
        }
      }
      
      // 召喚物の生成
      if (this.scene.characterFactory && this.skill.summonType) {
        const companion = this.scene.characterFactory.createCompanion({
          x: position.x,
          y: position.y,
          level: this.owner.level,
          type: this.skill.summonType,
          duration: this.skill.summonDuration || 30000 // デフォルト30秒
        });
        
        if (companion) {
          this.scene.add.existing(companion);
          
          // コンパニオンリストに追加
          if (!this.scene.companions) this.scene.companions = [];
          this.scene.companions.push(companion);
          
          // デプスソート用配列に追加
          if (this.scene.isometricMap) {
            this.scene.isometricMap.addToDepthSortedObjects(companion);
          }
          
          // 一定時間後に消滅
          if (this.skill.summonDuration) {
            this.scene.time.delayedCall(this.skill.summonDuration, () => {
              // 消滅エフェクト
              if (this.scene.effectFactory) {
                this.scene.effectFactory.createEffect({
                  type: 'visual',
                  name: 'summon_disappear',
                  x: companion.x,
                  y: companion.y,
                  scene: this.scene
                });
              }
              
              // コンパニオン削除
              companion.destroy();
              
              // リストから除外
              const index = this.scene.companions.indexOf(companion);
              if (index !== -1) {
                this.scene.companions.splice(index, 1);
              }
              
              // デプスソート配列から除外
              if (this.scene.isometricMap) {
                this.scene.isometricMap.removeFromDepthSortedObjects(companion);
              }
            });
          }
          
          this.success = true;
        }
      }
    });
    
    // アクション完了
    this.scene.time.delayedCall(summonAction ? summonAction.duration : 1000, () => {
      this.complete();
    });
  }
  
  // 並列アクション実行
  executeParallelActions() {
    // すべてのアクションを同時に実行
    let actionCount = 0;
    let completedCount = 0;
    
    // アクション実行中フラグ
    this.actionsRunning = true;
    
    for (const action of this.actionList.values()) {
      actionCount++;
      
      // 完了コールバックを設定
      action.onComplete = () => {
        completedCount++;
        
        // すべてのアクションが完了したらスキル全体を完了
        if (completedCount >= actionCount) {
          this.actionsRunning = false;
          this.success = true;
          this.complete();
        }
      };
      
      // アクションを実行
      action.play();
    }
    
    // アクションがない場合は即完了
    if (actionCount === 0) {
      this.success = false;
      this.complete();
    }
  }
  
  // アクション更新処理のオーバーライド
  updateAction(time, delta) {
    // アクションリストの更新
    if (this.actionsRunning) {
      // 必要な更新処理
    }
  }
  
  // アクション完了時の処理
  handleActionCompletion() {
    // アクションタイプに応じた完了処理
    
    // プレイヤーの場合は通知
    if (this.owner === this.scene.player) {
      // スキル使用状況をUI更新
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.updateSkillCooldown) {
        uiScene.updateSkillCooldown(this.skill);
      }
    }
  }
  
  // バフ効果の適用
  applyBuffEffect(target) {
    if (!target || target.isDead || !this.skill.effects) return;
    
    // バフ効果のパラメータ
    const buffParams = {
      name: this.name,
      description: this.description,
      duration: this.skill.duration || 10000,
      effects: this.skill.effects,
      icon: this.icon
    };
    
    // バフ効果の生成
    const buffEffect = new Effect({
      name: buffParams.name,
      type: 'buff',
      description: buffParams.description,
      duration: buffParams.duration,
      scene: this.scene,
      source: this.owner,
      target: target,
      value: {
        effects: buffParams.effects,
        icon: buffParams.icon
      }
    });
    
    // 対象にバフを適用
    if (target.addBuff) {
      target.addBuff(buffEffect);
    }
  }
  
  // デバフ効果の適用
  applyDebuffEffect(target) {
    if (!target || target.isDead || !this.skill.effects) return;
    
    // デバフ効果のパラメータ
    const debuffParams = {
      name: this.name,
      description: this.description,
      duration: this.skill.duration || 5000,
      effects: this.skill.effects,
      icon: this.icon,
      type: this.element
    };
    
    // 追加のDoT効果
    if (this.element && this.skill.damage) {
      debuffParams.effects.dotDamage = this.skill.damage / 5; // ダメージの1/5
      debuffParams.effects.dotType = this.element;
    }
    
    // デバフ効果の生成
    const debuffEffect = new Effect({
      name: debuffParams.name,
      type: 'debuff',
      description: debuffParams.description,
      duration: debuffParams.duration,
      scene: this.scene,
      source: this.owner,
      target: target,
      value: {
        effects: debuffParams.effects,
        icon: debuffParams.icon,
        type: debuffParams.type
      }
    });
    
    // 対象にデバフを適用
    if (target.addDebuff) {
      target.addDebuff(debuffEffect);
    }
  }
  
  // 範囲内の対象を探す
  findTargetsInArea(x, y, radius) {
    if (!this.scene) return [];
    
    const targets = [];
    
    // 敵の場合はプレイヤーとコンパニオンが対象
    if (this.owner.constructor.name === 'Enemy') {
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