import { NodeState } from '../core/BehaviorTree';
import { getDistance } from '../../utils/mathUtils';

/**
 * AttackBehavior - キャラクターのターゲットに対する攻撃行動を処理します
 */
class AttackBehavior {
  /**
   * 新しい攻撃行動を作成します
   * @param {object} options - 設定オプション
   */
  constructor(options = {}) {
    this.options = {
      attackRange: 50, // デフォルトの攻撃範囲
      attackCooldown: 1000, // デフォルトのクールダウン（ミリ秒）
      preferredSkills: [], // 使用する優先スキルIDのリスト
      useBasicAttackWhenSkillsUnavailable: true,
      ...options
    };
    
    this.lastAttackTime = 0;
    this.state = NodeState.FAILURE;
  }

  /**
   * 攻撃行動を実行します
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
    
    // ターゲットが射程内にいるかチェック
    if (distance > this.options.attackRange) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // 攻撃クールダウンをチェック
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime < this.options.attackCooldown) {
      this.state = NodeState.RUNNING;
      return this.state;
    }
    
    // 優先スキルがあれば最初にスキルを使用しようとする
    let attackPerformed = false;
    
    if (this.options.preferredSkills.length > 0) {
      for (const skillId of this.options.preferredSkills) {
        // スキルがスキルツリーで利用可能か確認
        const skill = this.findSkillInSkillTree(owner.skillTree, skillId);
        
        if (skill && this.canUseSkill(owner, skill)) {
          this.useSkill(owner, target, skill);
          attackPerformed = true;
          break;
        }
      }
    }
    
    // スキルが使用されず、基本攻撃の使用が許可されている場合
    if (!attackPerformed && this.options.useBasicAttackWhenSkillsUnavailable) {
      this.performBasicAttack(owner, target);
      attackPerformed = true;
    }
    
    // 攻撃が実行された場合は攻撃時間を更新
    if (attackPerformed) {
      this.lastAttackTime = currentTime;
      this.state = NodeState.SUCCESS;
    } else {
      this.state = NodeState.FAILURE;
    }
    
    return this.state;
  }

  /**
   * ターゲットに対して基本攻撃を実行します
   * @param {Character} attacker - 攻撃するキャラクター
   * @param {Character} target - ターゲットキャラクター
   */
  performBasicAttack(attacker, target) {
    // キャラクターから基本攻撃アクションを取得
    const basicAttackAction = this.getBasicAttackAction(attacker);
    
    if (basicAttackAction) {
      // アクションのターゲットを設定
      basicAttackAction.target = target;
      
      // アクションを実行
      basicAttackAction.play();
      
      // ターゲットの方向を向く
      this.faceTarget(attacker, target);
    }
  }

  /**
   * ターゲットに対してスキルを使用します
   * @param {Character} user - スキル使用者
   * @param {Character} target - ターゲット
   * @param {object} skill - 使用するスキル
   */
  useSkill(user, target, skill) {
    // スキルがアクションかどうかをチェック
    if (skill.action) {
      // アクションのターゲットを設定
      skill.action.target = target;
      
      // アクションを実行
      skill.action.play();
      
      // 必要なマナを消費
      if (skill.manaCost && user.mana >= skill.manaCost) {
        user.mana -= skill.manaCost;
      }
      
      // ターゲットの方向を向く
      this.faceTarget(user, target);
    }
  }

  /**
   * スキルが使用可能かどうかをチェックします
   * @param {Character} character - キャラクター
   * @param {object} skill - チェックするスキル
   * @returns {boolean} スキルが使用可能な場合はtrue
   */
  canUseSkill(character, skill) {
    // クールダウンをチェック
    if (skill.lastUsedTime && Date.now() - skill.lastUsedTime < skill.cooldown) {
      return false;
    }
    
    // マナコストをチェック
    if (skill.manaCost && character.mana < skill.manaCost) {
      return false;
    }
    
    return true;
  }

  /**
   * キャラクターのスキルツリーからスキルを検索します
   * @param {object} skillTree - キャラクターのスキルツリー
   * @param {string} skillId - 検索するスキルのID
   * @returns {object|null} スキルオブジェクトまたは見つからない場合はnull
   */
  findSkillInSkillTree(skillTree, skillId) {
    if (!skillTree) return null;
    
    // 実装はスキルツリーの構造に依存します
    // これは簡略化した例です
    if (skillTree.skills) {
      return skillTree.skills.find(skill => skill.id === skillId);
    }
    
    return null;
  }

  /**
   * キャラクターの基本攻撃アクションを取得します
   * @param {Character} character - キャラクター
   * @returns {Action|null} 基本攻撃アクションまたはnull
   */
  getBasicAttackAction(character) {
    // 実装はキャラクター構造に依存します
    // これは簡略化した例です
    if (character.actions) {
      return character.actions.find(action => action.type === 'basicAttack');
    }
    
    return null;
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
    // これは簡略化した例です
    if (character.setDirection) {
      character.setDirection(angle);
    }
  }

  /**
   * 行動の状態をリセットします
   */
  reset() {
    this.state = NodeState.FAILURE;
  }
}

export default AttackBehavior;