import { NodeState } from '../core/BehaviorTree';
import { getDistance } from '../../utils/mathUtils';

/**
 * TargetDecision - ターゲット選択に関する判断を行う
 */
class TargetDecision {
  /**
   * 新しいターゲット判断を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      condition: 'hasTarget', // 条件：'hasTarget', 'noTarget', 'targetIsDead', 'targetIsAlive'
      targetType: 'any', // ターゲットタイプ：'any', 'enemy', 'ally', 'player'
      selectMode: 'none', // ターゲット選択モード：'none', 'nearest', 'weakest', 'strongest', 'random'
      searchRadius: 300, // ターゲット検索半径
      ...options
    };
    
    this.state = NodeState.FAILURE;
  }

  /**
   * ターゲット判断を実行
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
    
    // 現在のターゲット
    const currentTarget = controller.target;
    
    // 条件に基づいて判断
    let result = false;
    
    switch (this.options.condition) {
      case 'hasTarget':
        // ターゲットを持っているかどうか
        result = currentTarget !== null;
        break;
        
      case 'noTarget':
        // ターゲットを持っていないかどうか
        result = currentTarget === null;
        break;
        
      case 'targetIsDead':
        // ターゲットが死んでいるかどうか
        result = currentTarget !== null && currentTarget.life <= 0;
        break;
        
      case 'targetIsAlive':
        // ターゲットが生きているかどうか
        result = currentTarget !== null && currentTarget.life > 0;
        break;
        
      default:
        result = false;
    }
    
    // ターゲット選択モードが 'none' でない場合は新しいターゲットを選択
    if (this.options.selectMode !== 'none') {
      const newTarget = this.selectTarget(controller);
      
      if (newTarget) {
        controller.setTarget(newTarget);
        result = true;
      }
    }
    
    // 結果に基づいて状態を設定
    this.state = result ? NodeState.SUCCESS : NodeState.FAILURE;
    return this.state;
  }

  /**
   * 新しいターゲットを選択
   * @param {AIController} controller - AIコントローラー
   * @returns {Character|null} 選択されたターゲット
   */
  selectTarget(controller) {
    const owner = controller.owner;
    
    // 検索半径内のキャラクターを取得
    const characters = this.getCharactersInRadius(controller, this.options.searchRadius);
    
    // ターゲットタイプでフィルタリング
    const validTargets = this.filterTargetsByType(characters, owner);
    
    if (validTargets.length === 0) {
      return null;
    }
    
    // 選択モードに基づいてターゲットを選択
    switch (this.options.selectMode) {
      case 'nearest':
        return this.selectNearestTarget(owner, validTargets);
        
      case 'weakest':
        return this.selectWeakestTarget(validTargets);
        
      case 'strongest':
        return this.selectStrongestTarget(validTargets);
        
      case 'random':
        return this.selectRandomTarget(validTargets);
        
      default:
        return null;
    }
  }

  /**
   * 検索半径内のキャラクターを取得
   * @param {AIController} controller - AIコントローラー
   * @param {number} radius - 検索半径
   * @returns {Array} 半径内のキャラクターの配列
   */
  getCharactersInRadius(controller, radius) {
    const owner = controller.owner;
    
    // AIマネージャーを取得
    const aiManager = controller.getBlackboardValue('aiManager');
    if (!aiManager) {
      return [];
    }
    
    // エンティティマネージャーを取得
    const entityManager = controller.getBlackboardValue('entityManager');
    if (!entityManager) {
      return [];
    }
    
    // すべてのキャラクターを取得（実装に依存）
    const allCharacters = entityManager.getCharacters ? 
                          entityManager.getCharacters() : 
                          [];
    
    // 半径内のキャラクターをフィルタリング
    return allCharacters.filter(character => {
      if (!character || character === owner || character.life <= 0) {
        return false;
      }
      
      const distance = getDistance(owner.x, owner.y, character.x, character.y);
      return distance <= radius;
    });
  }

  /**
   * ターゲットタイプでフィルタリング
   * @param {Array} characters - キャラクターの配列
   * @param {Character} owner - 所有者
   * @returns {Array} フィルタリングされたキャラクターの配列
   */
  filterTargetsByType(characters, owner) {
    return characters.filter(character => {
      switch (this.options.targetType) {
        case 'any':
          return true;
          
        case 'enemy':
          // 敵をフィルタリング（実装に依存）
          return character.classType && 
                (character.classType.name === 'Enemy' || 
                 (character.classType.name === 'Player' && owner.classType.name === 'Enemy'));
          
        case 'ally':
          // 味方をフィルタリング（実装に依存）
          return character.classType && 
                ((character.classType.name === 'Player' || character.classType.name === 'Companion') && 
                 (owner.classType.name === 'Player' || owner.classType.name === 'Companion'));
          
        case 'player':
          // プレイヤーをフィルタリング
          return character.classType && character.classType.name === 'Player';
          
        default:
          return false;
      }
    });
  }

  /**
   * 最も近いターゲットを選択
   * @param {Character} owner - 所有者
   * @param {Array} targets - ターゲットの配列
   * @returns {Character|null} 最も近いターゲット
   */
  selectNearestTarget(owner, targets) {
    if (targets.length === 0) return null;
    
    let nearestTarget = targets[0];
    let shortestDistance = getDistance(owner.x, owner.y, targets[0].x, targets[0].y);
    
    for (let i = 1; i < targets.length; i++) {
      const distance = getDistance(owner.x, owner.y, targets[i].x, targets[i].y);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestTarget = targets[i];
      }
    }
    
    return nearestTarget;
  }

  /**
   * 最も弱いターゲットを選択
   * @param {Array} targets - ターゲットの配列
   * @returns {Character|null} 最も弱いターゲット
   */
  selectWeakestTarget(targets) {
    if (targets.length === 0) return null;
    
    let weakestTarget = targets[0];
    let lowestHealth = targets[0].life;
    
    for (let i = 1; i < targets.length; i++) {
      if (targets[i].life < lowestHealth) {
        lowestHealth = targets[i].life;
        weakestTarget = targets[i];
      }
    }
    
    return weakestTarget;
  }

  /**
   * 最も強いターゲットを選択
   * @param {Array} targets - ターゲットの配列
   * @returns {Character|null} 最も強いターゲット
   */
  selectStrongestTarget(targets) {
    if (targets.length === 0) return null;
    
    let strongestTarget = targets[0];
    let highestHealth = targets[0].life;
    
    for (let i = 1; i < targets.length; i++) {
      if (targets[i].life > highestHealth) {
        highestHealth = targets[i].life;
        strongestTarget = targets[i];
      }
    }
    
    return strongestTarget;
  }

  /**
   * ランダムなターゲットを選択
   * @param {Array} targets - ターゲットの配列
   * @returns {Character|null} ランダムなターゲット
   */
  selectRandomTarget(targets) {
    if (targets.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * targets.length);
    return targets[randomIndex];
  }

  /**
   * 行動の状態をリセット
   */
  reset() {
    this.state = NodeState.FAILURE;
  }
}

export default TargetDecision;