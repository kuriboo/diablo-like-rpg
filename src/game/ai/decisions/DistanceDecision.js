import { NodeState } from '../core/BehaviorTree';
import { getDistance } from '../../utils/mathUtils';

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
    let compareX = null;
    let compareY = null;
    
    switch (this.options.compareMode) {
      case 'target':
        // ターゲットとの距離を比較
        const target = controller.target;
        if (!target || target.life <= 0) {
          this.state = NodeState.FAILURE;
          return this.state;
        }
        compareX = target.x;
        compareY = target.y;
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
          compareX = originalPosition.x;
          compareY = originalPosition.y;
        } else {
          compareX = homePoint.x;
          compareY = homePoint.y;
        }
        break;
        
      case 'position':
        // 指定された位置との距離を比較
        if (!this.options.comparePosition) {
          this.state = NodeState.FAILURE;
          return this.state;
        }
        compareX = this.options.comparePosition.x;
        compareY = this.options.comparePosition.y;
        break;
        
      default:
        this.state = NodeState.FAILURE;
        return this.state;
    }
    
    // 座標値の検証
    if (compareX === undefined || compareY === undefined) {
      console.warn('DistanceDecision: 距離計算のための有効な座標がありません', { compareX, compareY });
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 距離を計算
    const distance = getDistance(owner.x, owner.y, compareX, compareY);
    
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