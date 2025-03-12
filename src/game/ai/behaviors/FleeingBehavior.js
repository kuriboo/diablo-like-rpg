import { NodeState } from '../core/BehaviorTree';

/**
 * FleeingBehavior - キャラクターが特定のターゲットから逃げるための行動
 */
class FleeingBehavior {
  /**
   * 新しい逃走行動を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      fleeDistance: 300, // 逃げる最低距離
      safeDistance: 400, // この距離まで離れたら安全と見なす
      fleeSpeed: 1.7, // 逃走中の速度倍率
      maxFleeTime: 5000, // 最大逃走時間（ミリ秒）
      useSafePoints: true, // 安全ポイントを使用するかどうか
      ...options
    };
    
    this.fleeStartTime = 0;
    this.isFleeing = false;
    this.safePoint = null;
    this.state = NodeState.FAILURE;
  }

  /**
   * 逃走行動を実行
   * @param {AIController} controller - AIコントローラー
   * @param {number} delta - 前回の更新からの経過時間
   * @returns {string} 実行結果の状態
   */
  execute(controller, delta) {
    const owner = controller.owner;
    const target = controller.target;
    
    // 所有者とターゲットの検証
    if (!owner || !target) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // ターゲットが生きているかチェック
    if (target.Life <= 0) {
      controller.setTarget(null);
      this.state = NodeState.SUCCESS;
      return this.state;
    }
    
    // ターゲットとの距離を計算
    const distance = this.calculateDistance(owner.position, target.position);
    
    // 安全な距離まで逃げた場合、成功
    if (distance >= this.options.safeDistance) {
      this.stopFleeing();
      this.state = NodeState.SUCCESS;
      return this.state;
    }
    
    // 逃走開始
    if (!this.isFleeing) {
      this.startFleeing();
    }
    
    // 最大逃走時間をチェック
    const currentTime = Date.now();
    if (currentTime - this.fleeStartTime > this.options.maxFleeTime) {
      this.stopFleeing();
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 安全ポイントを見つける/更新
    if (this.options.useSafePoints && (!this.safePoint || currentTime - this.fleeStartTime > 1000)) {
      this.findSafePoint(controller);
    }
    
    // 逃走方向に移動
    if (this.safePoint && this.options.useSafePoints) {
      this.moveTowards(owner, this.safePoint, delta);
    } else {
      this.fleeFromTarget(owner, target, delta);
    }
    
    // ターゲットの方を向く（逃げる際は後ろ向きになる）
    this.faceAwayFromTarget(owner, target);
    
    this.state = NodeState.RUNNING;
    return this.state;
  }

  /**
   * 逃走を開始
   */
  startFleeing() {
    this.fleeStartTime = Date.now();
    this.isFleeing = true;
    this.safePoint = null;
  }

  /**
   * 逃走を停止
   */
  stopFleeing() {
    this.isFleeing = false;
    this.safePoint = null;
  }

  /**
   * 安全なポイントを見つける
   * @param {AIController} controller - AIコントローラー
   */
  findSafePoint(controller) {
    const owner = controller.owner;
    const target = controller.target;
    
    // ターゲットから逃げる方向ベクトルを計算
    const dx = owner.position.x - target.position.x;
    const dy = owner.position.y - target.position.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 逃走距離で安全ポイントを計算
    const safeX = owner.position.x + dirX * this.options.fleeDistance;
    const safeY = owner.position.y + dirY * this.options.fleeDistance;
    
    // ナビゲーションメッシュに安全ポイントを投影（実装があれば）
    const navMesh = controller.getBlackboardValue('navMesh');
    if (navMesh) {
      const projectedPoint = navMesh.projectPoint({ x: safeX, y: safeY });
      if (projectedPoint) {
        this.safePoint = projectedPoint;
        return;
      }
    }
    
    // ナビゲーションメッシュがない場合は単純に安全ポイントを設定
    this.safePoint = { x: safeX, y: safeY };
  }

  /**
   * ターゲットから逃げる
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   * @param {number} delta - 前回の更新からの経過時間
   */
  fleeFromTarget(character, target, delta) {
    // 逃走方向を計算
    const dx = character.position.x - target.position.x;
    const dy = character.position.y - target.position.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 移動距離を計算
    const speed = character.MoveSpeed * this.options.fleeSpeed;
    const moveDistance = speed * delta / 1000; // 秒単位に変換
    
    // 新しい位置を計算
    const newX = character.position.x + dirX * moveDistance;
    const newY = character.position.y + dirY * moveDistance;
    
    // キャラクターの位置を更新
    if (character.move) {
      character.move(newX, newY);
    } else {
      character.position.x = newX;
      character.position.y = newY;
    }
  }

  /**
   * 指定された位置に向かって移動
   * @param {Character} character - キャラクター
   * @param {object} position - 目標位置
   * @param {number} delta - 前回の更新からの経過時間
   */
  moveTowards(character, position, delta) {
    // 方向ベクトルを計算
    const dx = position.x - character.position.x;
    const dy = position.y - character.position.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 移動距離を計算
    const speed = character.MoveSpeed * this.options.fleeSpeed;
    const moveDistance = speed * delta / 1000; // 秒単位に変換
    
    // 新しい位置を計算
    const newX = character.position.x + dirX * moveDistance;
    const newY = character.position.y + dirY * moveDistance;
    
    // キャラクターの位置を更新
    if (character.move) {
      character.move(newX, newY);
    } else {
      character.position.x = newX;
      character.position.y = newY;
    }
  }

  /**
   * ターゲットから背を向ける
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   */
  faceAwayFromTarget(character, target) {
    if (!character || !target) return;
    
    // ターゲットへの方向を計算
    const dx = character.position.x - target.position.x;
    const dy = character.position.y - target.position.y;
    
    // 角度を基にキャラクターの方向を設定
    const angle = Math.atan2(dy, dx);
    
    // 実装はキャラクター構造に依存
    if (character.setDirection) {
      character.setDirection(angle);
    }
  }

  /**
   * 2つの位置間の距離を計算
   * @param {object} pos1 - 最初の位置
   * @param {object} pos2 - 2番目の位置
   * @returns {number} 位置間の距離
   */
  calculateDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
    this.isFleeing = false;
    this.safePoint = null;
  }
}

export default FleeingBehavior;