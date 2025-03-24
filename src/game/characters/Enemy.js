import Character from './Character';
import { getRandomInt, getDistance } from '../../utils/mathUtils';
import EnemyAI from '../ai/EnemyAI';

export default class Enemy extends Character {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);

    // ActionSystemを取得
    this.actionSystem = scene.actionSystem;
    if (!this.actionSystem) {
      console.error('Enemy created without ActionSystem - AI functionality will be limited');
    }
    
    // AIコントローラの初期化 - ActionSystemを渡す
    this.aiController = new EnemyAI(this, {
      aggressiveness: config.aggressiveness || 0.7,
      intelligence: config.intelligence || 0.5,
      perceptionRadius: config.aggroRange || 200,
      attackRange: config.attackRange || (this.attackRange * 32) || 50,
      chaseRange: config.leashRange || 400,
      fleeHealthThreshold: config.fleeHealthThreshold || 0.2,
      returnHomeRange: config.returnHomeRange || 600
    }, this.actionSystem);
    
    // ダメージ時のAIコールバック設定
    this.on('damage', this.onDamage.bind(this));
    
    // 敵固有のプロパティ
    this.aggroRange = config.aggroRange || 200; 
    this.leashRange = config.leashRange || 400;
    this.attackCooldown = config.attackCooldown || 1000;
    this.lastAttackTime = 0;
    
    // 元の位置を記録（帰還用）
    this.homePosition = { x, y };
    
    // ドロップアイテム
    this.dropItemList = config.dropItemList || [];
    
    // 経験値
    this.expValue = this.calculateExpValue();
    
    // ゴールドドロップ
    this.goldValue = this.calculateGoldValue();
    
    // 敵の種類
    this.enemyType = config.enemyType || 'normal'; // normal, elite, boss
    
    // エリート敵や特殊敵の場合の強化
    this.applyEnemyTypeBuffs();
    
    // 難易度に応じた強化
    this.applyDifficultyBuffs(config.difficulty || 'normal');
  }
  
  // 経験値の計算
  calculateExpValue() {
    // 基本経験値
    let baseExp = this.level * 5;
    
    // エリート敵やボスの場合は経験値増加
    switch (this.enemyType) {
      case 'elite':
        baseExp *= 2;
        break;
      case 'boss':
        baseExp *= 5;
        break;
    }
    
    return baseExp;
  }
  
  // ゴールド値の計算
  calculateGoldValue() {
    // 基本ゴールド
    let baseGold = this.level * 2;
    
    // エリート敵やボスの場合はゴールド増加
    switch (this.enemyType) {
      case 'elite':
        baseGold *= 2;
        break;
      case 'boss':
        baseGold *= 5;
        break;
    }
    
    // ランダム要素を追加
    return baseGold + getRandomInt(0, this.level);
  }
  
  // 敵タイプによる強化の適用
  applyEnemyTypeBuffs() {
    switch (this.enemyType) {
      case 'elite':
        // エリート敵の強化
        this.maxLife *= 2;
        this.life = this.maxLife;
        this.basicAttack *= 1.5;
        
        // 見た目の変更
        this.setTint(0xffff00);
        break;
        
      case 'boss':
        // ボス敵の強化
        this.maxLife *= 5;
        this.life = this.maxLife;
        this.basicAttack *= 2;
        this.size = 1.5; // ボスは大きめに
        this.setScale(1.5);
        
        // 見た目の変更
        this.setTint(0xff0000);
        break;
    }
  }
  
  // 難易度に応じた強化の適用
  applyDifficultyBuffs(difficulty) {
    // 難易度による敵の強化
    switch (difficulty) {
      case 'nightmare':
        this.maxLife *= 1.5;
        this.life = this.maxLife;
        this.basicAttack *= 1.3;
        this.expValue *= 1.5;
        this.goldValue *= 1.3;
        break;
        
      case 'hell':
        this.maxLife *= 2;
        this.life = this.maxLife;
        this.basicAttack *= 1.5;
        this.expValue *= 2;
        this.goldValue *= 1.5;
        break;
    }
  }
  
  // ドロップアイテムの設定
  setDropItems(dropItems) {
    this.dropItemList = dropItems;
  }
  
  // アイテムのドロップ
  dropItems() {
    if (!this.scene || !this.dropItemList || this.dropItemList.length === 0) return;
    
    // ドロップ判定
    const rand = Math.random();
    let cumulativeProbability = 0;
    
    // アイテムファクトリーの取得
    const itemFactory = this.scene.itemFactory;
    if (!itemFactory) return;
    
    // ドロップ率に基づいてアイテムを選択
    for (const dropItem of this.dropItemList) {
      cumulativeProbability += dropItem.dropRate;
      
      // 累積確率を超えた最初のアイテムをドロップ
      if (rand <= cumulativeProbability) {
        // アイテムの生成と配置
        const item = itemFactory.createItem({
          type: dropItem.itemType,
          level: this.level,
          rarity: this.getRarityForDrop(),
          x: this.x,
          y: this.y
        });
        
        if (item) {
          this.scene.add.existing(item);
          this.scene.items.push(item);
        }
        
        break;
      }
    }
    
    // ゴールドのドロップ
    if (this.goldValue > 0) {
      const goldItem = itemFactory.createGold({
        amount: this.goldValue,
        x: this.x + getRandomInt(-10, 10),
        y: this.y + getRandomInt(-10, 10)
      });
      
      if (goldItem) {
        this.scene.add.existing(goldItem);
        this.scene.items.push(goldItem);
      }
    }
  }
  
  // ドロップする装備のレア度決定
  getRarityForDrop() {
    // 敵の種類とレベルに基づいてレア度を決定
    const rand = Math.random() * 100;
    
    // ボス敵
    if (this.enemyType === 'boss') {
      if (rand < 10) return 'legendary';
      if (rand < 30) return 'epic';
      if (rand < 60) return 'rare';
      if (rand < 90) return 'uncommon';
      return 'common';
    }
    
    // エリート敵
    if (this.enemyType === 'elite') {
      if (rand < 2) return 'legendary';
      if (rand < 15) return 'epic';
      if (rand < 40) return 'rare';
      if (rand < 75) return 'uncommon';
      return 'common';
    }
    
    // 通常敵
    if (rand < 0.5) return 'legendary';
    if (rand < 5) return 'epic';
    if (rand < 15) return 'rare';
    if (rand < 40) return 'uncommon';
    return 'common';
  }
  
  // 死亡処理のオーバーライド
  die(killer = null) {
    super.die(killer);
    
    // AIコントローラを無効化
    if (this.aiController && this.aiController.setEnabled) {
      this.aiController.setEnabled(false);
    }
    
    // アイテムのドロップ
    this.dropItems();
    
    // 倒したのがプレイヤーまたはコンパニオンの場合、経験値を付与
    if (killer && (killer.constructor.name === 'Player' || killer.constructor.name === 'Companion')) {
      // プレイヤーオブジェクトの取得
      const player = killer.constructor.name === 'Player' ? killer : this.scene.player;
      
      if (player && player.gainExperience) {
        player.gainExperience(this.expValue);
      }
    }
  }
  
  // 更新処理のオーバーライド - ActionSystemに制御を委譲
  update(time, delta) {
    // 親クラスの更新処理を呼び出し
    super.update(time, delta);
    
    // AIコントローラはEnemyAI内で定期実行されるので
    // ここでの手動更新は必要なし
  }
  
  // ダメージ処理のオーバーライド
  takeDamage(amount, damageType = 'physical', isCritical = false, source = null) {
    // 基本クラスの処理を呼び出し
    const finalDamage = super.takeDamage(amount, damageType, isCritical, source);
    
    // ダメージイベントを発火（AIコントローラがリスンしている）
    this.emit('damage', finalDamage, damageType, isCritical, source);
    
    return finalDamage;
  }
  
  // スタン状態の設定
  setStunned(duration) {
    if (this.isDead) return false;
    
    this.isStunned = true;
    
    // アニメーション
    this.animationState = 'stunned';
    this.playAnimation();
    
    // スタン効果の表示
    this.showStunEffect();
    
    // ActionSystemの動作をキャンセル
    if (this.actionSystem) {
      this.actionSystem.cancelEntityActions(this);
    }
    
    // スタン解除タイマー
    this.scene.time.delayedCall(duration, () => {
      this.isStunned = false;
      
      // アニメーション更新
      this.animationState = 'idle';
      this.playAnimation();
    });
    
    return true;
  }
  
  // スタン効果の表示
  showStunEffect() {
    if (!this.scene) return;
    
    // スタン星エフェクト
    const starsEffect = this.scene.add.sprite(
      this.x,
      this.y - 40,
      'stun_effect'
    ).setScale(0.8);
    
    if (starsEffect.play) {
      starsEffect.play('stun_anim');
    }
    
    // エフェクトが敵に追従
    this.scene.events.on('update', () => {
      if (starsEffect.active) {
        starsEffect.x = this.x;
        starsEffect.y = this.y - 40;
      }
    });
    
    // スタンが解除されたらエフェクトも削除
    this.scene.time.delayedCall(2000, () => {
      if (starsEffect.active) {
        starsEffect.destroy();
      }
    });
  }
  
  // ツールチップデータのオーバーライド
  getTooltipData() {
    const data = super.getTooltipData();
    
    // 敵固有の情報を追加
    return {
      ...data,
      type: this.enemyType,
      experience: this.expValue
    };
  }

  // ダメージ時のコールバック
  onDamage(amount, damageType, isCritical, source) {
    // AIコントローラに通知
    if (this.aiController && this.aiController.onOwnerDamaged) {
      this.aiController.onOwnerDamaged(amount, source);
    }
  }
}