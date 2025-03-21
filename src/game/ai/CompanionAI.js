import { getDistance } from '../../utils/mathUtils';

/**
 * ActionSystemを用いた仲間AI制御クラス
 * 従来のAIController依存を排除し、Actionベースで動作します
 */
export default class CompanionAI {
  /**
   * 新しい仲間AI制御を作成
   * @param {Companion} companion - AIが制御する仲間キャラクター
   * @param {object} options - 設定オプション
   * @param {ActionSystem} actionSystem - アクションシステム
   */
  constructor(companion, options = {}, actionSystem) {
    // 仲間キャラクターの参照
    this.companion = companion;

    // シーン参照
    this.scene = companion.scene;
    
    // アクションシステム
    this.actionSystem = actionSystem || (this.scene ? this.scene.actionSystem : null);
    
    if (!this.actionSystem) {
      console.error('CompanionAI: ActionSystemが提供されていません。正しく動作しない可能性があります。');
    }
    
    // AI設定
    this.options = {
      followDistance: 150, // プレイヤーからの最大距離
      minFollowDistance: 30, // プレイヤーからの最小距離
      perceptionRadius: 350, // 知覚半径
      attackRange: 60, // 攻撃範囲
      chaseRange: 450, // 追跡範囲
      fleeHealthThreshold: 0.15, // 逃走する体力閾値
      protectPlayerThreshold: 0.4, // プレイヤー保護モードの閾値
      useSkills: true, // スキルを使用するかどうか
      preferHealingSkills: true, // 回復スキルを優先するかどうか
      supportMode: false, // サポートモードかどうか
      updateInterval: 800, // AI更新間隔（ミリ秒）
      ...options
    };
    
    // プレイヤー参照
    this.player = null;
    
    // 現在のターゲット
    this.target = null;
    
    // 共有データ（旧ブラックボード相当）
    this.data = new Map();
    
    // 最後の体力
    this.lastHealth = companion.life;
    
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
    // 無効化されているか、仲間が存在しない/死亡している場合は更新しない
    if (!this.enabled || !this.companion || this.companion.isDead) return;
    
    // 知覚システムの更新
    this.updatePerception();
    
    // 行動決定と実行
    this.decideAndAct();
  }

  /**
   * プレイヤーを設定
   * @param {Player} player - プレイヤーキャラクター
   */
  setPlayer(player) {
    this.player = player;
    this.data.set('player', player);
    
    // コンパニオンの元の位置をプレイヤー位置のオフセットとして設定
    if (player && this.companion) {
      const offsetX = 50;
      const offsetY = 50;
      this.originalPosition = {
        x: player.x + offsetX,
        y: player.y + offsetY
      };
      this.data.set('originalPosition', this.originalPosition);
    }
  }

  /**
   * 知覚システムの更新
   */
  updatePerception() {
    // プレイヤーが設定されていない場合、取得を試みる
    if (!this.player) {
      this.player = this.scene?.player || this.data.get('player');
    }
    
    // ダメージの検知
    if (this.companion.life < this.lastHealth) {
      const damage = this.lastHealth - this.companion.life;
      this.onDamageReceived(damage);
    }
    this.lastHealth = this.companion.life;
    
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
    if (!this.target && (!this.options.supportMode || 
        (this.player && this.player.life / this.player.maxLife > this.options.protectPlayerThreshold))) {
      this.target = this.findNewTarget();
    }
    
    // プレイヤーが攻撃されている敵を優先
    if (this.player) {
      const nearbyEnemies = this.getNearbyEnemies();
      
      // プレイヤーを攻撃している敵を探す
      const enemyAttackingPlayer = nearbyEnemies.find(enemy => 
        enemy.target && enemy.target === this.player
      );
      
      if (enemyAttackingPlayer && (!this.target || this.target.life <= 0)) {
        this.target = enemyAttackingPlayer;
      }
    }
  }

  /**
   * 近くの敵を取得
   * @returns {Array} 範囲内の敵の配列
   */
  getNearbyEnemies() {
    if (!this.companion || !this.scene) return [];
    
    // シーンの敵リスト
    const enemies = this.scene.enemies || [];
    
    // 知覚範囲内の敵をフィルタリング
    return enemies.filter(enemy => {
      if (!enemy || enemy.isDead || enemy.life <= 0) return false;
      
      const distance = getDistance(this.companion.x, this.companion.y, enemy.x, enemy.y);
      return distance <= this.options.perceptionRadius;
    });
  }

  /**
   * 新しいターゲットを探す
   * @returns {Character|null} 見つかったターゲットまたはnull
   */
  findNewTarget() {
    // 近くの敵を取得
    const nearbyEnemies = this.getNearbyEnemies();
    
    // 敵がいない場合
    if (nearbyEnemies.length === 0) return null;
    
    // プレイヤーに最も近い敵を優先
    if (this.player) {
      // 敵をプレイヤーとの距離でソート
      nearbyEnemies.sort((a, b) => {
        const distA = getDistance(this.player.x, this.player.y, a.x, a.y);
        const distB = getDistance(this.player.x, this.player.y, b.x, b.y);
        return distA - distB;
      });
      
      return nearbyEnemies[0];
    }
    
    // プレイヤーがいない場合は自分に最も近い敵
    else {
      // 敵をコンパニオンとの距離でソート
      nearbyEnemies.sort((a, b) => {
        const distA = getDistance(this.companion.x, this.companion.y, a.x, a.y);
        const distB = getDistance(this.companion.x, this.companion.y, b.x, b.y);
        return distA - distB;
      });
      
      return nearbyEnemies[0];
    }
  }

  /**
   * 対象が知覚範囲内にいるか確認
   * @param {Character} target - 確認する対象
   * @returns {boolean} 範囲内にいればtrue
   */
  isInPerceptionRange(target) {
    const distance = getDistance(this.companion.x, this.companion.y, target.x, target.y);
    return distance <= this.options.perceptionRadius;
  }

  /**
   * 敵の行動を決定して実行
   */
  decideAndAct() {
    // すでに行動中なら何もしない
    if (this.isPerformingAction()) return;
    
    // サポートモードの場合の特別処理
    if (this.options.supportMode) {
      if (this.decideAndActSupportMode()) {
        return;
      }
    }
    
    // 体力率に基づく状況判断
    const healthRatio = this.companion.life / this.companion.maxLife;
    
    // 体力が閾値以下なら逃走
    if (healthRatio <= this.options.fleeHealthThreshold) {
      this.performFleeAction();
      return;
    }
    
    // ターゲットがいる場合の行動
    if (this.target) {
      const distanceToTarget = getDistance(
        this.companion.x, this.companion.y,
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
        this.checkAndFollowPlayer();
      }
    }
    // ターゲットがいない場合はプレイヤーについていく
    else {
      this.checkAndFollowPlayer();
    }
  }

  /**
   * サポートモード時の行動決定と実行
   * @returns {boolean} 行動を実行した場合はtrue
   */
  decideAndActSupportMode() {
    // プレイヤーがいない場合は通常行動
    if (!this.player) return false;
    
    // プレイヤーの体力率
    const playerHealthRatio = this.player.life / this.player.maxLife;
    
    // プレイヤーの体力が低い場合は回復スキル使用
    if (playerHealthRatio < this.options.protectPlayerThreshold) {
      if (this.performHealingAction()) {
        return true;
      }
    }
    
    // プレイヤーを攻撃している敵を優先攻撃
    const enemyAttackingPlayer = this.getNearbyEnemies().find(enemy => 
      enemy.target && enemy.target === this.player
    );
    
    if (enemyAttackingPlayer) {
      this.target = enemyAttackingPlayer;
      
      const distanceToEnemy = getDistance(
        this.companion.x, this.companion.y,
        enemyAttackingPlayer.x, enemyAttackingPlayer.y
      );
      
      // 攻撃範囲内ならば攻撃
      if (distanceToEnemy <= this.options.attackRange) {
        this.performAttackAction();
        return true;
      }
      // 範囲外ならば追跡
      else {
        this.performChaseAction();
        return true;
      }
    }
    
    // プレイヤーとの距離をチェック
    this.checkAndFollowPlayer();
    return true;
  }

  /**
   * プレイヤーについていくかチェック
   */
  checkAndFollowPlayer() {
    // プレイヤーがいない場合はアイドル状態
    if (!this.player) {
      this.performIdleAction();
      return;
    }
    
    // プレイヤーとの距離を計算
    const distanceToPlayer = getDistance(
      this.companion.x, this.companion.y,
      this.player.x, this.player.y
    );
    
    // プレイヤーから遠すぎる場合はフォロー
    if (distanceToPlayer > this.options.followDistance) {
      this.performFollowAction();
    }
    // プレイヤーに近すぎる場合は離れる
    else if (distanceToPlayer < this.options.minFollowDistance) {
      this.performMoveAwayAction();
    }
    // 適切な距離の場合はアイドル
    else {
      this.performIdleAction();
    }
  }

  /**
   * 現在行動中かどうか
   * @returns {boolean} 行動中ならtrue
   */
  isPerformingAction() {
    if (!this.actionSystem) return false;
    
    // ActionSystemに問い合わせ
    return this.actionSystem.isEntityActing(this.companion);
  }

  /**
   * 攻撃行動の実行
   */
  performAttackAction() {
    if (!this.actionSystem || !this.target) return;
    
    // スキルを使用するかどうか
    if (this.options.useSkills) {
      // スキル使用を試みる
      const skillUsed = this.tryUseSkill();
      if (skillUsed) return;
    }
    
    // 通常攻撃アクションを作成
    const attackAction = this.actionSystem.createAction('attack', {
      owner: this.companion,
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
    if (!this.actionSystem || !this.target || !this.companion.specialActions) return false;
    
    // 使用可能なスキルを探す
    const availableSkills = Array.from(this.companion.specialActions.entries());
    if (availableSkills.length === 0) return false;
    
    // スキルをフィルタリング（攻撃スキル）
    const attackSkills = availableSkills.filter(([_, skill]) => 
      skill.targetType === 'enemy' || skill.damageType
    );
    
    if (attackSkills.length === 0) return false;
    
    // ランダムにスキルを選択
    const randomIndex = Math.floor(Math.random() * attackSkills.length);
    const [skillId, skillData] = attackSkills[randomIndex];
    
    // スキルアクションを作成
    const skillAction = this.actionSystem.createAction('skill', {
      owner: this.companion,
      target: this.target,
      skillId: skillId,
      ...skillData
    });
    
    // キューに追加
    return this.actionSystem.queueAction(skillAction, true);
  }

  /**
   * 回復行動の実行
   * @returns {boolean} 回復行動を実行できた場合はtrue
   */
  performHealingAction() {
    if (!this.actionSystem || !this.player || !this.companion.specialActions) return false;
    
    // 使用可能なスキルを探す
    const availableSkills = Array.from(this.companion.specialActions.entries());
    if (availableSkills.length === 0) return false;
    
    // スキルをフィルタリング（回復スキル）
    const healingSkills = availableSkills.filter(([_, skill]) => 
      skill.targetType === 'ally' || skill.baseHeal > 0
    );
    
    if (healingSkills.length === 0) return false;
    
    // 回復量が最も多いスキルを選択
    healingSkills.sort((a, b) => 
      (b[1].baseHeal || 0) - (a[1].baseHeal || 0)
    );
    
    const [skillId, skillData] = healingSkills[0];
    
    // スキルアクションを作成
    const skillAction = this.actionSystem.createAction('skill', {
      owner: this.companion,
      target: this.player,
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
      owner: this.companion,
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
    
    // 逃走先はターゲットの反対方向
    const fleeTarget = this.target || this.getNearbyEnemies()[0];
    
    if (!fleeTarget) {
      this.checkAndFollowPlayer();
      return;
    }
    
    // 逃走アクションを作成
    const fleeAction = this.actionSystem.createAction('flee', {
      owner: this.companion,
      target: fleeTarget,
      fleeDistance: this.options.perceptionRadius,
      fleeSpeed: 1.7
    });
    
    this.actionSystem.queueAction(fleeAction, true);
  }

  /**
   * プレイヤー追従行動の実行
   */
  performFollowAction() {
    if (!this.actionSystem || !this.player) return;
    
    // 追従アクションを作成
    const followAction = this.actionSystem.createAction('chase', {
      owner: this.companion,
      target: this.player,
      maxChaseDistance: 1000,
      minDistance: this.options.minFollowDistance,
      chaseSpeed: 1.2,
      topDownMap: this.scene.topDownMap
    });
    
    this.actionSystem.queueAction(followAction, true);
  }

  /**
   * プレイヤーから離れる行動の実行
   */
  performMoveAwayAction() {
    if (!this.actionSystem || !this.player) return;
    
    // 移動先を計算
    const dx = this.companion.x - this.player.x;
    const dy = this.companion.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      this.performIdleAction();
      return;
    }
    
    // 方向を正規化して最適な距離へ
    const dirX = dx / distance;
    const dirY = dy / distance;
    const targetDistance = this.options.minFollowDistance * 1.5;
    
    const targetPos = {
      x: this.player.x + dirX * targetDistance,
      y: this.player.y + dirY * targetDistance
    };
    
    // 移動アクションを作成
    if (this.scene.topDownMap) {
      const playerTileXY = this.scene.topDownMap.worldToTileXY(this.companion.x, this.companion.y);
      const targetTileXY = this.scene.topDownMap.worldToTileXY(targetPos.x, targetPos.y);
      
      // 経路を探索
      const path = this.scene.topDownMap.findPath(
        playerTileXY.x, playerTileXY.y,
        targetTileXY.x, targetTileXY.y
      );
      
      if (path && path.length > 0) {
        // パスをワールド座標に変換
        const worldPath = path.map(p => {
          const worldPos = this.scene.topDownMap.tileToWorldXY(p.x, p.y);
          return { x: worldPos.x, y: worldPos.y };
        });
        
        // 移動アクションを作成
        const moveAction = this.actionSystem.createAction('move', {
          owner: this.companion,
          path: worldPath,
          topDownMap: this.scene.topDownMap
        });
        
        this.actionSystem.queueAction(moveAction, true);
        return;
      }
    }
    
    // 経路探索に失敗した場合は直接フリーアクション
    const fleeAction = this.actionSystem.createAction('flee', {
      owner: this.companion,
      target: this.player,
      fleeDistance: this.options.minFollowDistance * 2,
      safeDistance: this.options.minFollowDistance * 1.5,
      fleeSpeed: 1.0
    });
    
    this.actionSystem.queueAction(fleeAction, true);
  }

  /**
   * 待機行動の実行
   */
  performIdleAction() {
    if (!this.actionSystem) return;
    
    // 待機アクションを作成
    const idleAction = this.actionSystem.createAction('idle', {
      owner: this.companion,
      randomMovement: false,
      duration: 2000 + Math.random() * 2000
    });
    
    this.actionSystem.queueAction(idleAction, true);
  }

  /**
   * 現在の行動をキャンセル
   */
  cancelCurrentAction() {
    if (this.actionSystem) {
      this.actionSystem.cancelEntityActions(this.companion);
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
      
      // 現在の行動をキャンセル
      this.cancelCurrentAction();
      
      // ダメージが大きい場合はサポートモードに切り替え
      if (damage / this.companion.maxLife > 0.2) {
        this.options.supportMode = true;
      }
      
      // 適切な行動を選択
      this.decideAndAct();
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
   * AIの設定を更新
   * @param {object} newOptions - 新しい設定
   */
  updateOptions(newOptions) {
    const previousMode = this.options.supportMode;
    
    this.options = { ...this.options, ...newOptions };
    
    // モードが変更された場合、現在の行動をキャンセルして再決定
    if (previousMode !== this.options.supportMode) {
      this.cancelCurrentAction();
      this.decideAndAct();
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
    this.companion = null;
    this.scene = null;
    this.actionSystem = null;
    this.player = null;
    this.target = null;
    this.data.clear();
  }
}