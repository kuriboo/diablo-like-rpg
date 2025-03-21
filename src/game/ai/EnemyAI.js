import { getDistance } from '../../utils/mathUtils';

/**
 * ActionSystemを用いた敵AI制御クラス
 * 従来のAIController依存を排除し、Actionベースで動作します
 */
export default class EnemyAI {
  /**
   * 新しい敵AI制御を作成
   * @param {Enemy} enemy - AIが制御する敵キャラクター
   * @param {object} options - 設定オプション
   * @param {ActionSystem} actionSystem - アクションシステム
   */
  constructor(enemy, options = {}, actionSystem) {
    // 敵キャラクターの参照
    this.enemy = enemy;

    // シーン参照
    this.scene = enemy.scene;
    
    // アクションシステム
    this.actionSystem = actionSystem || (this.scene ? this.scene.actionSystem : null);
    
    if (!this.actionSystem) {
      console.error('EnemyAI: ActionSystemが提供されていません。正しく動作しない可能性があります。');
    }
    
    // AI設定
    this.options = {
      aggressiveness: 0.7, // 攻撃性（0.0～1.0）
      intelligence: 0.5, // 知性（0.0～1.0）
      perceptionRadius: 300, // 知覚半径
      attackRange: 50, // 攻撃範囲
      chaseRange: 400, // 追跡範囲
      fleeHealthThreshold: 0.2, // 逃走する体力閾値
      returnHomeRange: 600, // ホームに戻る範囲
      patrolRadius: 200, // 巡回半径
      useSkills: true, // スキルを使用するかどうか
      updateInterval: 1000, // AI更新間隔（ミリ秒）
      ...options
    };
    
    // 現在のターゲット
    this.target = null;
    
    // 共有データ（旧ブラックボード相当）
    this.data = new Map();
    
    // 元の位置を記録（復帰用）
    this.originalPosition = { x: enemy.x, y: enemy.y };
    this.data.set('originalPosition', this.originalPosition);
    
    // 最後の体力
    this.lastHealth = enemy.life;
    
    // 最後の更新時間
    this.lastUpdateTime = 0;
    
    // 有効フラグ
    this.enabled = true;
    
    // 更新のための間隔タイマーを設定
    this.setupUpdateTimer();
  }

  /**
   * 定期更新のためのタイマーを設定
   */
  setupUpdateTimer() {
    if (!this.scene || !this.scene.time) return;
    
    // 定期的に意思決定を行うイベントを設定
    this.updateEvent = this.scene.time.addEvent({
      delay: this.options.updateInterval,
      callback: this.update,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * AIの更新処理
   */
  update() {
    // 無効化されているか、敵が存在しない/死亡している場合は更新しない
    if (!this.enabled || !this.enemy || this.enemy.isDead) return;
    
    // 知覚システムの更新
    this.updatePerception();
    
    // 行動決定と実行
    this.decideAndAct();
  }

  /**
   * 知覚システムの更新
   */
  updatePerception() {
    // ダメージの検知
    if (this.enemy.life < this.lastHealth) {
      const damage = this.lastHealth - this.enemy.life;
      this.onDamageReceived(damage);
    }
    this.lastHealth = this.enemy.life;
    
    // ターゲットの検知
    this.updateTarget();
  }

  /**
   * ターゲットの更新
   */
  updateTarget() {
    // 現在のターゲットが無効（死亡など）ならリセット
    if (this.target && (this.target.isDead || this.target.life <= 0)) {
      this.target = null;
    }
    
    // ターゲットがなければ新しいターゲットを探す
    if (!this.target) {
      this.target = this.findNewTarget();
    }
  }

  /**
   * 新しいターゲットを探す
   * @returns {Character|null} 見つかったターゲットまたはnull
   */
  findNewTarget() {
    // プレイヤーを最優先
    const player = this.scene?.player;
    if (player && !player.isDead && this.isInPerceptionRange(player)) {
      return player;
    }
    
    // コンパニオンも対象
    const companions = this.scene?.companions || [];
    for (const companion of companions) {
      if (!companion.isDead && this.isInPerceptionRange(companion)) {
        return companion;
      }
    }
    
    return null;
  }

  /**
   * 対象が知覚範囲内にいるか確認
   * @param {Character} target - 確認する対象
   * @returns {boolean} 範囲内にいればtrue
   */
  isInPerceptionRange(target) {
    const distance = getDistance(this.enemy.x, this.enemy.y, target.x, target.y);
    return distance <= this.options.perceptionRadius;
  }

  /**
   * 敵の行動を決定して実行
   */
  decideAndAct() {
    // すでに行動中なら何もしない
    if (this.isPerformingAction()) return;
    
    // 体力率に基づく状況判断
    const healthRatio = this.enemy.life / this.enemy.maxLife;
    
    // 体力が閾値以下なら逃走
    if (healthRatio <= this.options.fleeHealthThreshold) {
      this.performFleeAction();
      return;
    }
    
    // 元の位置から遠すぎる場合は帰還
    if (this.isTooFarFromHome()) {
      this.performReturnAction();
      return;
    }
    
    // ターゲットがいる場合の行動
    if (this.target) {
      const distanceToTarget = getDistance(
        this.enemy.x, this.enemy.y,
        this.target.x, this.target.y
      );
      
      // 攻撃範囲内ならば攻撃
      if (distanceToTarget <= this.options.attackRange) {
        this.performAttackAction();
      }
      // 追跡範囲内ならば追跡
      else if (distanceToTarget <= this.options.chaseRange) {
        this.performChaseAction();
      }
      // 範囲外ならターゲット解除
      else {
        this.target = null;
        this.performIdleOrPatrolAction();
      }
    }
    // ターゲットがいない場合は待機または巡回
    else {
      this.performIdleOrPatrolAction();
    }
  }

  /**
   * 現在行動中かどうか
   * @returns {boolean} 行動中ならtrue
   */
  isPerformingAction() {
    if (!this.actionSystem) return false;
    
    // ActionSystemに問い合わせ
    return this.actionSystem.isEntityActing(this.enemy);
  }

  /**
   * ホームから遠すぎるかどうか
   * @returns {boolean} 遠すぎる場合はtrue
   */
  isTooFarFromHome() {
    const distance = getDistance(
      this.enemy.x, this.enemy.y,
      this.originalPosition.x, this.originalPosition.y
    );
    
    return distance > this.options.returnHomeRange;
  }

  /**
   * 攻撃行動の実行
   */
  performAttackAction() {
    if (!this.actionSystem || !this.target) return;
    
    // スキルを使用するかどうか
    if (this.options.useSkills && Math.random() < this.options.intelligence) {
      // スキル使用を試みる
      const skillUsed = this.tryUseSkill();
      if (skillUsed) return;
    }
    
    // 通常攻撃アクションを作成
    const attackAction = this.actionSystem.createAction('attack', {
      owner: this.enemy,
      target: this.target,
      attackRange: this.options.attackRange
    });
    
    this.actionSystem.queueAction(attackAction, true);
  }

  /**
   * スキル使用を試みる
   * @returns {boolean} スキルを使用できた場合はtrue
   */
  tryUseSkill() {
    if (!this.actionSystem || !this.target || !this.enemy.specialActions) return false;
    
    // 使用可能なスキルを探す
    const availableSkills = Array.from(this.enemy.specialActions.entries());
    if (availableSkills.length === 0) return false;
    
    // ランダムにスキルを選択
    const randomIndex = Math.floor(Math.random() * availableSkills.length);
    const [skillId, skillData] = availableSkills[randomIndex];
    
    // スキルアクションを作成
    const skillAction = this.actionSystem.createAction('skill', {
      owner: this.enemy,
      target: this.target,
      skillId: skillId,
      ...skillData
    });
    
    // キューに追加
    return this.actionSystem.queueAction(skillAction, true);
  }

  /**
   * 追跡行動の実行
   */
  performChaseAction() {
    if (!this.actionSystem || !this.target) return;
    
    // 追跡アクションを作成
    const chaseAction = this.actionSystem.createAction('chase', {
      owner: this.enemy,
      target: this.target,
      maxChaseDistance: this.options.chaseRange,
      minDistance: this.options.attackRange * 0.8,
      chaseSpeed: 1.5,
      topDownMap: this.scene.topDownMap
    });
    
    this.actionSystem.queueAction(chaseAction, true);
  }

  /**
   * 逃走行動の実行
   */
  performFleeAction() {
    if (!this.actionSystem) return;
    
    // 逃走先はターゲットの反対方向（いなければホーム方向）
    const fleeTarget = this.target || this.scene?.player;
    
    // 逃走アクションを作成
    const fleeAction = this.actionSystem.createAction('flee', {
      owner: this.enemy,
      target: fleeTarget,
      fleeDistance: this.options.perceptionRadius,
      fleeSpeed: 1.7
    });
    
    this.actionSystem.queueAction(fleeAction, true);
  }

  /**
   * 帰還行動の実行
   */
  performReturnAction() {
    if (!this.actionSystem) return;
    
    // 帰還アクションを作成
    const returnAction = this.actionSystem.createAction('return', {
      owner: this.enemy,
      homePoint: this.originalPosition,
      returnSpeed: 1.2,
      topDownMap: this.scene.topDownMap
    });
    
    this.actionSystem.queueAction(returnAction, true);
  }

  /**
   * 待機または巡回行動の実行
   */
  performIdleOrPatrolAction() {
    if (!this.actionSystem) return;
    
    // 攻撃性に基づいて巡回か待機かを決定
    if (Math.random() < this.options.aggressiveness) {
      // 巡回アクションを作成
      const patrolAction = this.actionSystem.createAction('patrol', {
        owner: this.enemy,
        patrolRadius: this.options.patrolRadius,
        generateRandomPoints: true,
        randomPointCount: 3,
        waitTimeAtPoints: 1500,
        topDownMap: this.scene.topDownMap
      });
      
      this.actionSystem.queueAction(patrolAction, true);
    } else {
      // 待機アクションを作成
      const idleAction = this.actionSystem.createAction('idle', {
        owner: this.enemy,
        randomMovement: true,
        movementRadius: 50,
        duration: 3000 + Math.random() * 4000
      });
      
      this.actionSystem.queueAction(idleAction, true);
    }
  }

  /**
   * ダメージを受けた時の処理
   * @param {number} damage - 受けたダメージ量
   * @param {Character} attacker - 攻撃者（存在する場合）
   */
  onDamageReceived(damage, attacker = null) {
    // 攻撃者をターゲットに設定
    if (attacker && attacker.life > 0 && !attacker.isDead) {
      this.target = attacker;
      
      // 攻撃者に対して適切な行動を選択
      this.cancelCurrentAction();
      this.decideAndAct();
    }
    
    // ダメージが大きい場合は逃走を検討
    const damageRatio = damage / this.enemy.maxLife;
    if (damageRatio > 0.15 && this.enemy.life / this.enemy.maxLife < 0.4) {
      this.cancelCurrentAction();
      this.performFleeAction();
    }
  }

  /**
   * 現在の行動をキャンセル
   */
  cancelCurrentAction() {
    if (this.actionSystem) {
      this.actionSystem.cancelEntityActions(this.enemy);
    }
  }

  /**
   * AIの有効/無効を切り替え
   * @param {boolean} enabled - 有効にするかどうか
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    // 無効化時は現在の行動をキャンセル
    if (!enabled) {
      this.cancelCurrentAction();
    }
  }

  /**
   * 値を設定
   * @param {string} key - キー
   * @param {any} value - 値
   */
  setData(key, value) {
    this.data.set(key, value);
  }

  /**
   * 値を取得
   * @param {string} key - キー
   * @param {any} defaultValue - デフォルト値
   * @returns {any} 保存された値またはデフォルト値
   */
  getData(key, defaultValue = null) {
    return this.data.has(key) ? this.data.get(key) : defaultValue;
  }

  /**
   * リソースの解放
   */
  destroy() {
    // 更新タイマーを削除
    if (this.updateEvent && this.updateEvent.remove) {
      this.updateEvent.remove();
    }
    
    // 実行中のアクションをキャンセル
    this.cancelCurrentAction();
    
    // 参照をクリア
    this.enemy = null;
    this.scene = null;
    this.actionSystem = null;
    this.target = null;
    this.data.clear();
  }
}