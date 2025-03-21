import { NodeState } from '../core/BehaviorTree';
import { getDistance } from '../../utils/mathUtils';

/**
 * ChaseBehavior - キャラクターがターゲットを追跡/追求するようにします
 */
class ChaseBehavior {
  /**
   * 新しい追跡行動を作成します
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      updatePathInterval: 500, // 経路再計算の間隔（ミリ秒）
      maxChaseDistance: 500, // 最大追跡距離
      minDistance: 30, // ターゲットから維持する最小距離
      chaseSpeed: 1.5, // 追跡中の速度倍率
      pathfindingEnabled: true, // 経路探索を使用するかどうか
      ...options
    };
    
    this.lastPathUpdateTime = 0;
    this.currentPath = [];
    this.currentPathIndex = 0;
    this.state = NodeState.FAILURE;
  }

  /**
   * 追跡行動を実行します
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
    if (target.life <= 0) {
      controller.setTarget(null);
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // ターゲットまでの距離を計算
    const distance = getDistance(owner.x, owner.y, target.x, target.y);
    
    // ターゲットから遠すぎる場合は追跡を停止
    if (distance > this.options.maxChaseDistance) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // ターゲットに十分近い場合は成功
    if (distance <= this.options.minDistance) {
      this.state = NodeState.SUCCESS;
      return this.state;
    }
    
    // 必要に応じてターゲットへの経路を更新
    const currentTime = Date.now();
    if (this.options.pathfindingEnabled && 
        (currentTime - this.lastPathUpdateTime > this.options.updatePathInterval || 
         this.currentPath.length === 0)) {
      this.updatePath(controller);
      this.lastPathUpdateTime = currentTime;
    }
    
    // 経路に従うか、直接ターゲットに向かって移動
    if (this.options.pathfindingEnabled && this.currentPath.length > 0) {
      this.followPath(owner, delta);
    } else {
      this.moveDirectlyTowardsTarget(owner, target, delta);
    }
    
    // ターゲットの方向を向く
    this.faceTarget(owner, target);
    
    this.state = NodeState.RUNNING;
    return this.state;
  }

  /**
   * ターゲットへの経路を更新します
   * @param {AIController} controller - AIコントローラー
   */
  updatePath(controller) {
    const owner = controller.owner;
    const target = controller.target;
    
    // コントローラーに経路探索機能がある場合、それを使用
    const pathfinder = controller.getBlackboardValue('pathfinder');
    if (pathfinder) {
      const startPos = { x: owner.x, y: owner.y };
      const targetPos = { x: target.x, y: target.y };
      this.currentPath = pathfinder.findPath(startPos, targetPos);
      this.currentPathIndex = 0;
    } else {
      // 経路探索機能が利用できない場合、経路をクリア
      this.currentPath = [];
    }
  }

  /**
   * 計算された経路に従います
   * @param {Character} character - キャラクター
   * @param {number} delta - 前回の更新からの経過時間
   */
  followPath(character, delta) {
    if (this.currentPath.length === 0 || this.currentPathIndex >= this.currentPath.length) {
      return;
    }
    
    // 現在の経路ポイントを取得
    const waypoint = this.currentPath[this.currentPathIndex];
    
    // 経路ポイントまでの距離を計算
    const distance = getDistance(character.x, character.y, waypoint.x, waypoint.y);
    
    // 経路ポイントに十分近い場合、次のポイントに移動
    if (distance <= 5) {
      this.currentPathIndex++;
      
      // 経路の終点に到達した場合、停止
      if (this.currentPathIndex >= this.currentPath.length) {
        return;
      }
    }
    
    // 現在の経路ポイントに向かって移動
    this.moveTowards(character, waypoint, delta);
  }

  /**
   * 経路探索なしで直接ターゲットに向かって移動します
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   * @param {number} delta - 前回の更新からの経過時間
   */
  moveDirectlyTowardsTarget(character, target, delta) {
    const targetPos = { x: target.x, y: target.y };
    this.moveTowards(character, targetPos, delta);
  }

  /**
   * キャラクターを位置に向かって移動させます
   * @param {Character} character - キャラクター
   * @param {object} position - 目標位置
   * @param {number} delta - 前回の更新からの経過時間
   */
  moveTowards(character, position, delta) {
    // 方向ベクトルを計算
    const dx = position.x - character.x;
    const dy = position.y - character.y;
    
    // 方向を正規化
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // 移動距離を計算
    const speed = character.moveSpeed * this.options.chaseSpeed;
    const moveDistance = speed * delta / 1000; // 秒単位に変換
    
    // 新しい位置を計算
    const newX = character.x + dirX * moveDistance;
    const newY = character.y + dirY * moveDistance;
    
    // キャラクターの位置を更新
    if (character.move) {
      character.move(newX, newY);
    } else {
      character.x = newX;
      character.y = newY;
    }
  }

  /**
   * キャラクターがターゲットの方向を向くようにします
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   */
  faceTarget(character, target) {
    if (!character || !target) return;
    
    // ターゲットへの方向を計算
    const dx = target.x - character.x;
    const dy = target.y - character.y;
    
    // 角度に基づいてキャラクターの方向を設定
    const angle = Math.atan2(dy, dx);
    
    // 実装はキャラクター構造に依存します
    if (character.setDirection) {
      character.setDirection(angle);
    }
  }

  /**
   * 行動の状態をリセットします
   */
  reset() {
    this.state = NodeState.FAILURE;
    this.currentPath = [];
    this.currentPathIndex = 0;
  }
}

export default ChaseBehavior;