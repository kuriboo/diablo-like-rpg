import { NodeState } from '../core/BehaviorTree';
import { getDistance } from '../../utils/mathUtils';

/**
 * ThreatenDecision - 脅威レベルに基づく判断を行う
 */
class ThreatenDecision {
  /**
   * 新しい脅威判断を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      lowThreatenThreshold: 0.3, // 低脅威と判断する閾値
      highThreatenThreshold: 0.7, // 高脅威と判断する閾値
      condition: 'highThreat', // 条件：'lowThreat', 'mediumThreat', 'highThreat'
      considerDamageReceived: true, // 受けたダメージを考慮するかどうか
      considerNumberOfEnemies: true, // 敵の数を考慮するかどうか
      considerTargetStrength: true, // ターゲットの強さを考慮するかどうか
      ...options
    };
    
    this.damageReceived = 0;
    this.lastDamageResetTime = Date.now();
    this.lastThreatenLevel = 0;
    this.state = NodeState.FAILURE;
  }

  /**
   * 脅威判断を実行
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
    
    // 脅威レベルを計算
    const threatLevel = this.calculateThreatLevel(controller);
    
    // 脅威レベルを記録
    this.lastThreatenLevel = threatLevel;
    
    // 条件に基づいて判断
    let result = false;
    
    switch (this.options.condition) {
      case 'lowThreat':
        // 低脅威かどうか
        result = threatLevel <= this.options.lowThreatenThreshold;
        break;
        
      case 'mediumThreat':
        // 中脅威かどうか
        result = threatLevel > this.options.lowThreatenThreshold && 
                 threatLevel < this.options.highThreatenThreshold;
        break;
        
      case 'highThreat':
        // 高脅威かどうか
        result = threatLevel >= this.options.highThreatenThreshold;
        break;
        
      default:
        result = false;
    }
    
    // ブラックボードに脅威レベルを保存
    controller.setBlackboardValue('threatLevel', threatLevel);
    
    // 結果に基づいて状態を設定
    this.state = result ? NodeState.SUCCESS : NodeState.FAILURE;
    return this.state;
  }

  /**
   * 脅威レベルを計算
   * @param {AIController} controller - AIコントローラー
   * @returns {number} 脅威レベル（0.0～1.0）
   */
  calculateThreatLevel(controller) {
    const owner = controller.owner;
    const target = controller.target;
    
    let threatLevel = 0;
    
    // 健康状態から脅威レベルを計算（体力が低いほど脅威が高い）
    const healthRatio = owner.life / owner.maxLife;
    threatLevel += (1 - healthRatio) * 0.5;
    
    // 受けたダメージから脅威レベルを計算
    if (this.options.considerDamageReceived) {
      // 一定時間ごとにダメージリセット
      const currentTime = Date.now();
      if (currentTime - this.lastDamageResetTime > 5000) {
        this.damageReceived = 0;
        this.lastDamageResetTime = currentTime;
      }
      
      // ダメージ率（最大体力に対する受けたダメージの割合）
      const damageRatio = Math.min(this.damageReceived / owner.maxLife, 1.0);
      threatLevel += damageRatio * 0.3;
    }
    
    // 敵の数から脅威レベルを計算
    if (this.options.considerNumberOfEnemies) {
      const nearbyEnemies = this.getNearbyEnemies(controller, 300);
      const enemyCountFactor = Math.min(nearbyEnemies.length / 5, 1.0);
      threatLevel += enemyCountFactor * 0.2;
    }
    
    // ターゲットの強さから脅威レベルを計算
    if (this.options.considerTargetStrength && target) {
      // レベル差
      const levelDifference = target.level - owner.level;
      const levelFactor = Math.max(0, levelDifference / 10);
      
      // ターゲットの攻撃力
      const attackDifference = target.basicAttack - owner.basicDefence;
      const attackFactor = Math.max(0, attackDifference / 100);
      
      threatLevel += (levelFactor + attackFactor) * 0.2;
    }
    
    // 脅威レベルを0.0～1.0の範囲に制限
    return Math.max(0, Math.min(1, threatLevel));
  }

  /**
   * 近くの敵を取得
   * @param {AIController} controller - AIコントローラー
   * @param {number} radius - 検索半径
   * @returns {Array} 半径内の敵の配列
   */
  getNearbyEnemies(controller, radius) {
    const owner = controller.owner;
    
    // エンティティマネージャーを取得
    const entityManager = controller.getBlackboardValue('entityManager');
    if (!entityManager) {
      return [];
    }
    
    // すべてのキャラクターを取得（実装に依存）
    const allCharacters = entityManager.getCharacters ? 
                          entityManager.getCharacters() : 
                          [];
    
    // 敵かどうかを判断する関数
    const isEnemy = (character) => {
      if (!character || character === owner || character.life <= 0) {
        return false;
      }
      
      // 敵の判断（実装に依存）
      if (owner.classType.name === 'Player' || owner.classType.name === 'Companion') {
        return character.classType.name === 'Enemy';
      } else if (owner.classType.name === 'Enemy') {
        return character.classType.name === 'Player' || character.classType.name === 'Companion';
      }
      
      return false;
    };
    
    // 半径内の敵をフィルタリング
    return allCharacters.filter(character => {
      if (!isEnemy(character)) {
        return false;
      }
      
      const distance = getDistance(owner.x, owner.y, character.x, character.y);
      return distance <= radius;
    });
  }

  /**
   * 受けたダメージを記録
   * @param {number} damage - 受けたダメージ量
   */
  recordDamageReceived(damage) {
    this.damageReceived += damage;
  }

  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
  }
}

export default ThreatenDecision;