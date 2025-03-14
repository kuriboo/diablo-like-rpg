import { NodeState } from '../core/BehaviorTree';

/**
 * SkillUseBehavior - キャラクターのスキル使用行動を制御
 */
class SkillUseBehavior {
  /**
   * 新しいスキル使用行動を作成
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      skillId: null, // 使用するスキルのID（指定がある場合）
      minRange: 0, // スキル使用の最小範囲
      maxRange: 300, // スキル使用の最大範囲
      targetTypes: ['enemy'], // スキルのターゲットタイプ（enemy, ally, self）
      manaThreshold: 0.2, // スキル使用に必要な最小マナ割合
      healthThreshold: 0.3, // スキル使用に必要な最小体力割合（回復スキルの場合）
      cooldownPadding: 500, // クールダウン余裕時間（ミリ秒）
      preferredSkills: [], // 優先して使用するスキルIDのリスト
      useAnyAvailableSkill: true, // 利用可能な任意のスキルを使用するかどうか
      ...options
    };
    
    this.state = NodeState.FAILURE;
  }

  /**
   * スキル使用行動を実行
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
    
    // スキル使用のターゲットを決定
    let target = this.determineTarget(controller);
    
    // ターゲットがない場合は失敗
    if (!target) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // スキルツリーがない場合は失敗
    if (!owner.SkillTree) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 使用するスキルを選択
    const skill = this.selectSkill(owner, target);
    
    // 使用可能なスキルがない場合は失敗
    if (!skill) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // ターゲットとの距離を計算
    const distance = this.calculateDistance(owner.position, target.position);
    
    // スキルの範囲内にいるかチェック
    if (distance < this.options.minRange || distance > this.options.maxRange) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // スキルを使用
    const success = this.useSkill(owner, target, skill);
    
    if (success) {
      this.state = NodeState.SUCCESS;
    } else {
      this.state = NodeState.FAILURE;
    }
    
    return this.state;
  }

  /**
   * ターゲットを決定
   * @param {AIController} controller - AIコントローラー
   * @returns {Character|null} 決定されたターゲット
   */
  determineTarget(controller) {
    const owner = controller.owner;
    const currentTarget = controller.target;
    
    // ターゲットタイプに基づいてターゲットを決定
    if (this.options.targetTypes.includes('enemy') && currentTarget && currentTarget.Life > 0) {
      // 現在のターゲットが敵の場合
      return currentTarget;
    } else if (this.options.targetTypes.includes('ally')) {
      // 味方をターゲットにする場合
      return this.findAllyTarget(controller);
    } else if (this.options.targetTypes.includes('self')) {
      // 自分自身をターゲットにする場合
      return owner;
    }
    
    return null;
  }

  /**
   * 味方ターゲットを見つける
   * @param {AIController} controller - AIコントローラー
   * @returns {Character|null} 味方ターゲット
   */
  findAllyTarget(controller) {
    const owner = controller.owner;
    
    // 味方のリストを取得（実装に依存）
    const allies = controller.getBlackboardValue('allies') || [];
    
    // 体力の低い味方を優先
    let bestTarget = null;
    let lowestHealthPercent = 1.0;
    
    // 自分自身も考慮
    if (owner.Life / owner.MaxLife < lowestHealthPercent) {
      bestTarget = owner;
      lowestHealthPercent = owner.Life / owner.MaxLife;
    }
    
    // 他の味方をチェック
    for (const ally of allies) {
      if (ally && ally !== owner && ally.Life > 0) {
        const healthPercent = ally.Life / ally.MaxLife;
        if (healthPercent < lowestHealthPercent) {
          bestTarget = ally;
          lowestHealthPercent = healthPercent;
        }
      }
    }
    
    return bestTarget;
  }

  /**
   * 使用するスキルを選択
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   * @returns {object|null} 選択されたスキル
   */
  selectSkill(character, target) {
    // スキルIDが指定されている場合
    if (this.options.skillId) {
      const skill = this.findSkillById(character.SkillTree, this.options.skillId);
      if (skill && this.canUseSkill(character, target, skill)) {
        return skill;
      }
    }
    
    // 優先スキルリストから選択
    if (this.options.preferredSkills.length > 0) {
      for (const skillId of this.options.preferredSkills) {
        const skill = this.findSkillById(character.SkillTree, skillId);
        if (skill && this.canUseSkill(character, target, skill)) {
          return skill;
        }
      }
    }
    
    // 任意の利用可能なスキルを使用
    if (this.options.useAnyAvailableSkill) {
      return this.findAnyUsableSkill(character, target);
    }
    
    return null;
  }

  /**
   * IDからスキルを見つける
   * @param {object} skillTree - スキルツリー
   * @param {string} skillId - スキルID
   * @returns {object|null} 見つかったスキル
   */
  findSkillById(skillTree, skillId) {
    // 実装はスキルツリー構造に依存
    // これは簡略化された例
    if (skillTree.skills) {
      return skillTree.skills.find(skill => skill.id === skillId);
    }
    
    return null;
  }

  /**
   * 使用可能な任意のスキルを見つける
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   * @returns {object|null} 見つかったスキル
   */
  findAnyUsableSkill(character, target) {
    // 実装はスキルツリー構造に依存
    // これは簡略化された例
    if (character.SkillTree && character.SkillTree.skills) {
      // 使用可能なスキルをフィルタリング
      const usableSkills = character.SkillTree.skills.filter(skill => 
        this.canUseSkill(character, target, skill)
      );
      
      // スキルを優先度でソート（実装に依存）
      if (usableSkills.length > 0) {
        return this.sortSkillsByPriority(usableSkills)[0];
      }
    }
    
    return null;
  }

  /**
   * スキルが使用可能か確認
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   * @param {object} skill - スキル
   * @returns {boolean} スキルが使用可能か
   */
  canUseSkill(character, target, skill) {
    // クールダウンをチェック
    if (skill.lastUsedTime && Date.now() - skill.lastUsedTime < skill.cooldown + this.options.cooldownPadding) {
      return false;
    }
    
    // マナコストをチェック
    if (skill.manaCost && character.Mana < skill.manaCost) {
      return false;
    }
    
    // マナ閾値をチェック
    if (character.Mana / character.MaxMana < this.options.manaThreshold) {
      return false;
    }
    
    // 回復スキルの場合、体力閾値をチェック
    if (skill.type === 'healing' && target.Life / target.MaxLife > this.options.healthThreshold) {
      return false;
    }
    
    // ターゲットタイプをチェック
    if (skill.targetTypes && !this.isValidTarget(target, skill.targetTypes)) {
      return false;
    }
    
    return true;
  }

  /**
   * ターゲットが有効かチェック
   * @param {Character} target - ターゲット
   * @param {Array} validTypes - 有効なターゲットタイプのリスト
   * @returns {boolean} ターゲットが有効か
   */
  isValidTarget(target, validTypes) {
    // ターゲットタイプをチェック（実装に依存）
    if (validTypes.includes('any')) {
      return true;
    }
    
    if (validTypes.includes('enemy') && target.ClassType && target.ClassType.name === 'Enemy') {
      return true;
    }
    
    if (validTypes.includes('ally') && target.ClassType && 
        (target.ClassType.name === 'Player' || target.ClassType.name === 'Companion')) {
      return true;
    }
    
    if (validTypes.includes('self') && target.ClassType && target.ClassType.name === 'Player') {
      return true;
    }
    
    return false;
  }

  /**
   * スキルを優先度でソート
   * @param {Array} skills - スキルの配列
   * @returns {Array} ソートされたスキルの配列
   */
  sortSkillsByPriority(skills) {
    // 実装に依存
    // この例では単純にクールダウンの短いものを優先
    return [...skills].sort((a, b) => (a.cooldown || 0) - (b.cooldown || 0));
  }

  /**
   * スキルを使用
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   * @param {object} skill - スキル
   * @returns {boolean} スキル使用が成功したか
   */
  useSkill(character, target, skill) {
    // スキルがアクションを持っているかチェック
    if (skill.action) {
      // アクションのターゲットを設定
      skill.action.target = target;
      
      // アクションを実行
      skill.action.play();
      
      // マナを消費
      if (skill.manaCost && character.Mana >= skill.manaCost) {
        character.Mana -= skill.manaCost;
      }
      
      // 最終使用時間を更新
      skill.lastUsedTime = Date.now();
      
      // ターゲットの方を向く
      this.faceTarget(character, target);
      
      return true;
    }
    
    return false;
  }

  /**
   * ターゲットの方を向く
   * @param {Character} character - キャラクター
   * @param {Character} target - ターゲット
   */
  faceTarget(character, target) {
    if (!character || !target) return;
    
    // ターゲットへの方向を計算
    const dx = target.position.x - character.position.x;
    const dy = target.position.y - character.position.y;
    
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
  }
}

export default SkillUseBehavior;