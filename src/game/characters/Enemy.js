import Character from './Character';
import { getRandomInt, getDistance } from '../../utils/mathUtils';
import EnemyAI from '../ai/EnemyAI';

export default class Enemy extends Character {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);

    // AIコントローラの初期化
    this.aiController = new EnemyAI(this);
    
    // ダメージ時のAIコールバック設定
    this.on('damage', this.onDamage.bind(this));
    
    // 敵固有のプロパティ
    this.aggroRange = config.aggroRange || 200; // アグロ範囲
    this.leashRange = config.leashRange || 400; // リーシュ範囲（初期位置からこれ以上離れると戻る）
    this.attackCooldown = config.attackCooldown || 1000; // 攻撃クールダウン
    this.lastAttackTime = 0;
    
    // AI関連
    this.state = 'idle'; // idle, patrol, chase, attack, retreat, stunned
    this.patrolPoints = config.patrolPoints || this.generatePatrolPoints();
    this.currentPatrolIndex = 0;
    this.patrolWaitTime = 0;
    this.homePosition = { x, y }; // 初期位置
    
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
  
  // パトロールポイントの生成
  generatePatrolPoints() {
    const points = [];
    const range = 100;
    
    // 初期位置を中心に4つのポイントを生成
    for (let i = 0; i < 4; i++) {
      points.push({
        x: this.x + getRandomInt(-range, range),
        y: this.y + getRandomInt(-range, range),
        waitTime: getRandomInt(1000, 3000)
      });
    }
    
    return points;
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
  
  // 更新処理のオーバーライド
  update(time, delta) {
    super.update(time, delta);

    // AIコントローラの更新
    if (this.aiController) {
      this.aiController.update(time, delta);
    }
    
    // 死亡時は処理しない
    if (this.isDead) return;
    
    // 状態に応じた行動
    switch (this.state) {
      case 'idle':
        this.updateIdleState(time, delta);
        break;
      case 'patrol':
        this.updatePatrolState(time, delta);
        break;
      case 'chase':
        this.updateChaseState(time, delta);
        break;
      case 'attack':
        this.updateAttackState(time, delta);
        break;
      case 'retreat':
        this.updateRetreatState(time, delta);
        break;
      case 'stunned':
        this.updateStunnedState(time, delta);
        break;
    }
  }
  
  // アイドル状態の更新
  updateIdleState(time, delta) {
    // プレイヤーの検出
    const player = this.scene.player;
    
    if (player && !player.isDead) {
      const distanceToPlayer = getDistance(
        this.x, this.y, player.x, player.y
      );
      
      // アグロ範囲内ならプレイヤーを追跡
      if (distanceToPlayer <= this.aggroRange) {
        this.target = player;
        this.state = 'chase';
        return;
      }
    }
    
    // パトロールに移行（一定確率）
    if (Math.random() < 0.01) {
      this.state = 'patrol';
      this.currentPatrolIndex = 0;
    }
  }
  
  // パトロール状態の更新
  updatePatrolState(time, delta) {
    // プレイヤーの検出
    const player = this.scene.player;
    
    if (player && !player.isDead) {
      const distanceToPlayer = getDistance(
        this.x, this.y, player.x, player.y
      );
      
      // アグロ範囲内ならプレイヤーを追跡
      if (distanceToPlayer <= this.aggroRange) {
        this.target = player;
        this.state = 'chase';
        return;
      }
    }
    
    // パトロールポイントがない場合はアイドルに戻る
    if (!this.patrolPoints || this.patrolPoints.length === 0) {
      this.state = 'idle';
      return;
    }
    
    // 現在のパトロールポイント
    const currentPoint = this.patrolPoints[this.currentPatrolIndex];
    
    // 待機時間が設定されている場合
    if (this.patrolWaitTime > 0) {
      this.patrolWaitTime -= delta;
      
      // 待機完了
      if (this.patrolWaitTime <= 0) {
        // 次のポイントへ
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      }
      
      return;
    }
    
    // ポイントへの移動
    const distanceToPoint = getDistance(
      this.x, this.y, currentPoint.x, currentPoint.y
    );
    
    // ポイントに到着した場合
    if (distanceToPoint < 10) {
      // 待機時間を設定
      this.patrolWaitTime = currentPoint.waitTime || 1000;
      return;
    }
    
    // ポイントへ移動
    this.setMoveTarget(currentPoint.x, currentPoint.y);
  }
  
  // 追跡状態の更新
  updateChaseState(time, delta) {
    if (!this.target || this.target.isDead) {
      // ターゲットがいない/死亡している場合はアイドルに戻る
      this.state = 'idle';
      this.target = null;
      return;
    }
    
    // ターゲットとの距離
    const distanceToTarget = getDistance(
      this.x, this.y, this.target.x, this.target.y
    );
    
    // 初期位置との距離
    const distanceToHome = getDistance(
      this.x, this.y, this.homePosition.x, this.homePosition.y
    );
    
    // リーシュ範囲外ならリトリート
    if (distanceToHome > this.leashRange) {
      this.state = 'retreat';
      return;
    }
    
    // 攻撃範囲内なら攻撃
    if (distanceToTarget <= this.attackRange * 32) {
      this.state = 'attack';
      return;
    }
    
    // ターゲットへ移動
    this.setMoveTarget(this.target.x, this.target.y);
  }
  
  // 攻撃状態の更新
  updateAttackState(time, delta) {
    if (!this.target || this.target.isDead) {
      // ターゲットがいない/死亡している場合はアイドルに戻る
      this.state = 'idle';
      this.target = null;
      return;
    }
    
    // ターゲットとの距離
    const distanceToTarget = getDistance(
      this.x, this.y, this.target.x, this.target.y
    );
    
    // 攻撃範囲外ならチェイスに戻る
    if (distanceToTarget > this.attackRange * 32) {
      this.state = 'chase';
      return;
    }
    
    // 攻撃クールダウンのチェック
    if (time - this.lastAttackTime >= this.attackCooldown) {
      // 攻撃実行
      this.attack(this.target);
      this.lastAttackTime = time;
    }
  }
  
  // 撤退状態の更新
  updateRetreatState(time, delta) {
    // 初期位置との距離
    const distanceToHome = getDistance(
      this.x, this.y, this.homePosition.x, this.homePosition.y
    );
    
    // 初期位置に近づいたらアイドルに戻る
    if (distanceToHome < 10) {
      this.state = 'idle';
      this.target = null;
      
      // 体力を回復
      this.life = this.maxLife;
      this.updateHealthBar();
      
      return;
    }
    
    // 初期位置へ移動
    this.setMoveTarget(this.homePosition.x, this.homePosition.y);
  }
  
  // スタン状態の更新
  updateStunnedState(time, delta) {
    // スタン状態からの回復は別途処理される（Effect.jsなど）
  }
  
  // アグロの取得（他の敵を呼ぶ）
  alertNearbyEnemies() {
    if (!this.scene || !this.scene.enemies || !this.target) return;
    
    // 近くの敵を探す
    const alertRange = 150;
    
    for (const enemy of this.scene.enemies) {
      // 自分自身や既にターゲットを持っている敵はスキップ
      if (enemy === this || enemy.target || enemy.isDead) continue;
      
      // 距離チェック
      const distance = getDistance(
        this.x, this.y, enemy.x, enemy.y
      );
      
      if (distance <= alertRange) {
        // 近くの敵にターゲットを共有
        enemy.target = this.target;
        enemy.state = 'chase';
      }
    }
  }
  
  // 攻撃のオーバーライド
  attack(target) {
    // 基本クラスの処理を呼び出し
    const result = super.attack(target);
    
    if (result) {
      // 攻撃成功時、ランダムで近くの敵に警報
      if (Math.random() < 0.3) {
        this.alertNearbyEnemies();
      }
    }
    
    return result;
  }
  
  // ダメージ処理のオーバーライド
  takeDamage(amount, damageType = 'physical', isCritical = false, source = null) {
    // 基本クラスの処理を呼び出し
    const finalDamage = super.takeDamage(amount, damageType, isCritical, source);
    
    // ダメージを受けた場合、攻撃者をターゲットに設定
    if (finalDamage > 0 && source) {
      this.target = source;
      
      // アイドルかパトロール中ならチェイスに切り替え
      if (this.state === 'idle' || this.state === 'patrol') {
        this.state = 'chase';
      }
      
      // ランダムで近くの敵に警報
      if (Math.random() < 0.3) {
        this.alertNearbyEnemies();
      }
    }
    
    return finalDamage;
  }
  
  // スタン状態の設定
  setStunned(duration) {
    if (this.isDead) return false;
    
    this.isStunned = true;
    this.state = 'stunned';
    
    // アニメーション
    this.animationState = 'stunned';
    this.playAnimation();
    
    // スタン効果の表示
    this.showStunEffect();
    
    // スタン解除タイマー
    this.scene.time.delayedCall(duration, () => {
      this.isStunned = false;
      
      // 状態の更新
      if (this.target && !this.target.isDead) {
        const distanceToTarget = getDistance(
          this.x, this.y, this.target.x, this.target.y
        );
        
        if (distanceToTarget <= this.attackRange * 32) {
          this.state = 'attack';
        } else {
          this.state = 'chase';
        }
      } else {
        this.state = 'idle';
      }
      
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
    
    starsEffect.play('stun_anim');
    
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
    if (this.aiController) {
      this.aiController.onOwnerDamaged(amount, source);
    }
  }
  
}