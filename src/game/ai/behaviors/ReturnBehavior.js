import { NodeState } from '../core/BehaviorTree';
import { getDistance } from '../../utils/mathUtils';

/**
 * ReturnBehavior - キャラクターが元の位置やホームポイントに戻る行動
 */
class ReturnBehavior {
  /**
   * 新しい帰還行動を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      returnSpeed: 1.2, // 帰還時の速度倍率
      homePointRadius: 20, // ホームポイントに到達したとみなす半径
      pathfindingEnabled: true, // 経路探索を使用するかどうか
      updatePathInterval: 1000, // 経路更新間隔（ミリ秒）
      ...options
    };
    
    this.homePoint = null;
    this.originalPosition = null;
    this.currentPath = [];
    this.currentPathIndex = 0;
    this.lastPathUpdateTime = 0;
    this.state = NodeState.FAILURE;
  }

  /**
   * 帰還行動を実行
   * @param {AIController} controller - AIコントローラー
   * @param {number} delta - 前回の更新からの経過時間
   * @returns {string} 実行結果の状態
   */
  execute(controller, delta) {
    const owner = controller.owner;
    
    // 所有者の検証
    if (!owner) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // ターゲットがある場合は帰還を中断
    const target = controller.target;
    if (target && target.life > 0) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // ホームポイントが設定されていない場合
    if (!this.homePoint && !this.originalPosition) {
      // ブラックボードからホームポイントを取得
      this.homePoint = controller.getBlackboardValue('homePoint');
      
      // ホームポイントがない場合は元の位置を使用
      if (!this.homePoint) {
        this.originalPosition = controller.getBlackboardValue('originalPosition');
        
        // 元の位置もない場合は現在の位置を使用
        if (!this.originalPosition) {
          this.originalPosition = { x: owner.x, y: owner.y };
          controller.setBlackboardValue('originalPosition', this.originalPosition);
        }
      }
    }
    
    // 帰還先の位置を決定
    const destination = this.homePoint || this.originalPosition;
    
    // 帰還先の位置がない場合は失敗
    if (!destination) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 帰還先との距離を計算
    const distance = getDistance(owner.x, owner.y, destination.x, destination.y);
    
    // 帰還先に到達した場合
    if (distance <= this.options.homePointRadius) {
      this.state = NodeState.SUCCESS;
      return this.state;
    }
    
    // 経路を更新
    const currentTime = Date.now();
    if (this.options.pathfindingEnabled && 
        (currentTime - this.lastPathUpdateTime > this.options.updatePathInterval || 
         this.currentPath.length === 0)) {
      this.updatePath(controller, destination);
      this.lastPathUpdateTime = currentTime;
    }
    
    // 経路に従って移動または直接移動
    if (this.options.pathfindingEnabled && this.currentPath.length > 0) {
      this.followPath(owner, delta);
    } else {
      this.moveDirectlyTowards(owner, destination, delta);
    }
    
    this.state = NodeState.RUNNING;
    return this.state;
  }

  /**
   * 経路を更新
   * @param {AIController} controller - AIコントローラー
   * @param {object} destination - 目的地
   */
  updatePath(controller, destination) {
    const owner = controller.owner;
    
    // コントローラーに経路探索機能がある場合は使用
    const pathfinder = controller.getBlackboardValue('pathfinder');
    if (pathfinder) {
      const startPos = { x: owner.x, y: owner.y };
      this.currentPath = pathfinder.findPath(startPos, destination);
      this.currentPathIndex = 0;
    } else {
      // 経路探索機能がない場合は経路をクリア
      this.currentPath = [];
    }
  }

  /**
   * 計算された経路に従う
   * @param {Character} character - キャラクター
   * @param {number} delta - 前回の更新からの経過時間
   */
  followPath(character, delta) {
    if (this.currentPath.length === 0 || this.currentPathIndex >= this.currentPath.length) {
      return;
    }
    
    // 現在のウェイポイントを取得
    const waypoint = this.currentPath[this.currentPathIndex];
    
    // ウェイポイントまでの距離を計算
    const distance = getDistance(character.x, character.y, waypoint.x, waypoint.y);
    
    // ウェイポイントに十分近づいたら次へ
    if (distance <= 5) {
      this.currentPathIndex++;
      
      // 経路の終点に達した場合
      if (this.currentPathIndex >= this.currentPath.length) {
        return;
      }
    }
    
    // 現在のウェイポイントに向かって移動
    this.moveTowards(character, waypoint, delta);
  }

  /**
   * 経路探索なしで直接目的地に向かう
   * @param {Character} character - キャラクター
   * @param {object} destination - 目的地
   * @param {number} delta - 前回の更新からの経過時間
   */
  moveDirectlyTowards(character, destination, delta) {
    this.moveTowards(character, destination, delta);
  }

  /**
   * 指定された位置に向かって移動
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
    const speed = character.moveSpeed * this.options.returnSpeed;
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
    
    // 移動方向を向く
    if (character.setDirection) {
      const angle = Math.atan2(dy, dx);
      character.setDirection(angle);
    }
  }

  /**
   * ホームポイントを設定
   * @param {object} point - 新しいホームポイント
   */
  setHomePoint(point) {
    this.homePoint = point;
    this.originalPosition = null; // ホームポイントが優先
  }

  /**
   * 元の位置を設定
   * @param {object} position - 新しい元の位置
   */
  setOriginalPosition(position) {
    if (!this.homePoint) {
      this.originalPosition = position;
    }
  }

  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
    this.currentPath = [];
    this.currentPathIndex = 0;
  }
}

export default ReturnBehavior;