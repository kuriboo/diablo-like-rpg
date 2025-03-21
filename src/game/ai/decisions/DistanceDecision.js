import { NodeState } from '../core/BehaviorTree';

/**
 * DistanceDecision - 距離に基づく判断を行う
 */
class DistanceDecision {
  /**
   * 新しい距離判断を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      minDistance: 0, // 最小距離
      maxDistance: 100, // 最大距離
      compareMode: 'target', // 比較モード：'target', 'home', 'position'
      comparePosition: null, // 比較位置（compareMode が 'position' の場合）
      condition: 'inRange', // 条件：'inRange', 'tooClose', 'tooFar'
      ...options
    };
    
    this.state = NodeState.FAILURE;
  }

  /**
   * 距離判断を実行
   * @param {AIController} controller - AIコントローラー
   * @returns {string} 実行結果の状態
   */
  execute(controller) {
    const owner = controller.owner;
    
    // 所有者の検証
    if (!owner) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 比較する位置を決定
    let comparePosition = null;
    
    switch (this.options.compareMode) {
      case 'target':
        // ターゲットとの距離を比較
        const target = controller.target;
        if (!target || target.Life <= 0) {
          this.state = NodeState.FAILURE;
          return this.state;
        }
        comparePosition = target.position;
        break;
        
      case 'home':
        // ホームポイントとの距離を比較
        const homePoint = controller.getBlackboardValue('homePoint');
        if (!homePoint) {
          const originalPosition = controller.getBlackboardValue('originalPosition');
          if (!originalPosition) {
            this.state = NodeState.FAILURE;
            return this.state;
          }
          comparePosition = originalPosition;
        } else {
          comparePosition = homePoint;
        }
        break;
        
      case 'position':
        // 指定された位置との距離を比較
        if (!this.options.comparePosition) {
          this.state = NodeState.FAILURE;
          return this.state;
        }
        comparePosition = this.options.comparePosition;
        break;
        
      default:
        this.state = NodeState.FAILURE;
        return this.state;
    }
    
    // 距離を計算
    const distance = this.calculateDistance(owner.position, comparePosition);
    
    // 条件に基づいて判断
    let result = false;
    
    switch (this.options.condition) {
      case 'inRange':
        // 範囲内にいるかどうか
        result = distance >= this.options.minDistance && distance <= this.options.maxDistance;
        break;
        
      case 'tooClose':
        // 近すぎるかどうか
        result = distance < this.options.minDistance;
        break;
        
      case 'tooFar':
        // 遠すぎるかどうか
        result = distance > this.options.maxDistance;
        break;
        
      default:
        result = false;
    }
    
    // 結果に基づいて状態を設定
    this.state = result ? NodeState.SUCCESS : NodeState.FAILURE;
    return this.state;
  }

  /**
   * 2つの位置間の距離を計算
   * @param {object} pos1 - 最初の位置
   * @param {object} pos2 - 2番目の位置
   * @returns {number} 位置間の距離
   */
  calculateDistance(pos1, pos2) {
    // 位置が存在するかチェック
    if (!pos1 || !pos2 || pos1.x === undefined || pos1.y === undefined || pos2.x === undefined || pos2.y === undefined) {
      console.warn('DistanceDecision: Invalid positions for distance calculation', { pos1, pos2 });
      return Infinity; // 無効な場合は無限大を返す
    }
    
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 比較位置を設定
   * @param {object} position - 新しい比較位置
   */
  setComparePosition(position) {
    this.options.comparePosition = position;
    this.options.compareMode = 'position';
  }

  /**
   * 距離範囲を設定
   * @param {number} min - 最小距離
   * @param {number} max - 最大距離
   */
  setDistanceRange(min, max) {
    this.options.minDistance = min;
    this.options.maxDistance = max;
  }

  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
  }
}

export default DistanceDecision;