import { NodeState } from '../core/BehaviorTree';

/**
 * HealthDecision - キャラクターの体力状態に基づく判断を行う
 */
class HealthDecision {
  /**
   * 新しい体力判断を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      lowHealthThreshold: 0.3, // 低体力と判断する閾値（最大体力に対する割合）
      criticalHealthThreshold: 0.15, // 危機的体力と判断する閾値
      highHealthThreshold: 0.7, // 高体力と判断する閾値
      targetLowHealthThreshold: 0.25, // ターゲットの低体力と判断する閾値
      compareMode: 'self', // 比較モード：'self', 'target', 'both'
      condition: 'low', // 条件：'low', 'critical', 'high', 'targetLow'
      ...options
    };
    
    this.state = NodeState.FAILURE;
  }

  /**
   * 体力判断を実行
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
    
    // 体力の割合を計算
    const healthRatio = owner.Life / owner.MaxLife;
    
    // ターゲットの体力割合（必要な場合）
    let targetHealthRatio = 1.0;
    if (this.options.compareMode === 'target' || this.options.compareMode === 'both') {
      const target = controller.target;
      if (target && target.Life > 0) {
        targetHealthRatio = target.Life / target.MaxLife;
      }
    }
    
    // 条件に基づいて判断
    let result = false;
    
    switch (this.options.condition) {
      case 'low':
        // 低体力かどうか
        result = healthRatio <= this.options.lowHealthThreshold;
        break;
        
      case 'critical':
        // 危機的な体力かどうか
        result = healthRatio <= this.options.criticalHealthThreshold;
        break;
        
      case 'high':
        // 高体力かどうか
        result = healthRatio >= this.options.highHealthThreshold;
        break;
        
      case 'targetLow':
        // ターゲットの体力が低いかどうか
        result = targetHealthRatio <= this.options.targetLowHealthThreshold;
        break;
        
      case 'selfLowerThanTarget':
        // 自分の体力がターゲットより低いかどうか
        result = healthRatio < targetHealthRatio;
        break;
        
      case 'selfHigherThanTarget':
        // 自分の体力がターゲットより高いかどうか
        result = healthRatio > targetHealthRatio;
        break;
        
      default:
        result = false;
    }
    
    // 結果に基づいて状態を設定
    this.state = result ? NodeState.SUCCESS : NodeState.FAILURE;
    return this.state;
  }
  
  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
  }
}

export default HealthDecision;