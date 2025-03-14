import AIController from './core/AIController';
import BehaviorTree, { 
  SelectorNode, 
  SequenceNode, 
  InverterNode, 
  ConditionNode, 
  ActionNode,
  NodeState 
} from './core/BehaviorTree';
import Blackboard from './core/Blackboard';

// 行動
import AttackBehavior from './behaviors/AttackBehavior';
import ChaseBehavior from './behaviors/ChaseBehavior';
import FleeingBehavior from './behaviors/FleeingBehavior';
import IdleBehavior from './behaviors/IdleBehavior';
import PatrolBehavior from './behaviors/PatrolBehavior';
import ReturnBehavior from './behaviors/ReturnBehavior';
import SkillUseBehavior from './behaviors/SkillUseBehavior';

// 判断
import HealthDecision from './decisions/HealthDecision';
import DistanceDecision from './decisions/DistanceDecision';
import TargetDecision from './decisions/TargetDecision';
import ThreatenDecision from './decisions/ThreatenDecision';

/**
 * EnemyAI - 敵キャラクターのAIを制御するクラス
 */
class EnemyAI extends AIController {
  /**
   * 新しい敵AIを作成
   * @param {Enemy} owner - このAIが制御する敵キャラクター
   * @param {object} options - 設定オプション
   */
  constructor(owner, options = {}) {
    super(owner, options);
    
    // デフォルトのAI設定
    this.options = {
      aggressiveness: 0.7, // 攻撃性（0.0～1.0）
      intelligence: 0.5, // 知性（0.0～1.0）
      perceptionRadius: 300, // 知覚半径
      attackRange: 50, // 攻撃範囲
      chaseRange: 400, // 追跡範囲
      fleeHealthThreshold: 0.2, // 逃走する体力閾値
      returnHomeRange: 600, // ホームに戻る範囲
      patrolRadius: 200, // 巡回半径
      useSkills: true, // スキルを使用するかどうか
      ...options,
      ...super.options
    };
    
    // 行動オブジェクト
    this.attackBehavior = new AttackBehavior({
      attackRange: this.options.attackRange,
      attackCooldown: 1000
    });
    
    this.chaseBehavior = new ChaseBehavior({
      maxChaseDistance: this.options.chaseRange,
      minDistance: this.options.attackRange * 0.8
    });
    
    this.fleeingBehavior = new FleeingBehavior({
      fleeDistance: this.options.perceptionRadius
    });
    
    this.idleBehavior = new IdleBehavior({
      randomMovement: true,
      movementRadius: 50
    });
    
    this.patrolBehavior = new PatrolBehavior({
      generateRandomPoints: true,
      randomPointRadius: this.options.patrolRadius,
      randomPointCount: 5
    });
    
    this.returnBehavior = new ReturnBehavior({
      returnSpeed: 1.2
    });
    
    this.skillUseBehavior = new SkillUseBehavior({
      maxRange: this.options.attackRange * 1.5,
      useAnyAvailableSkill: true
    });
    
    // 判断オブジェクト
    this.lowHealthDecision = new HealthDecision({
      condition: 'low',
      lowHealthThreshold: this.options.fleeHealthThreshold
    });
    
    this.targetLowHealthDecision = new HealthDecision({
      condition: 'targetLow',
      targetLowHealthThreshold: 0.3
    });
    
    this.inAttackRangeDecision = new DistanceDecision({
      maxDistance: this.options.attackRange,
      compareMode: 'target',
      condition: 'inRange'
    });
    
    this.inChaseRangeDecision = new DistanceDecision({
      maxDistance: this.options.chaseRange,
      compareMode: 'target',
      condition: 'inRange'
    });
    
    this.tooFarFromHomeDecision = new DistanceDecision({
      maxDistance: this.options.returnHomeRange,
      compareMode: 'home',
      condition: 'tooFar'
    });
    
    this.hasTargetDecision = new TargetDecision({
      condition: 'hasTarget'
    });
    
    this.selectTargetDecision = new TargetDecision({
      condition: 'noTarget',
      selectMode: 'nearest',
      targetType: 'player',
      searchRadius: this.options.perceptionRadius
    });
    
    this.highThreatDecision = new ThreatenDecision({
      condition: 'highThreat',
      highThreatenThreshold: 0.7
    });
    
    // 行動ツリーを初期化
    this.initializeBehaviorTree();
    
    // 前回の位置を記録（巡回用）
    this.originalPosition = { ...owner.position };
    this.blackboard.set('originalPosition', this.originalPosition);
  }

  /**
   * 行動ツリーを初期化
   */
  initializeBehaviorTree() {
    // 攻撃サブツリー
    const attackSequence = new SequenceNode([
      new ConditionNode(() => this.hasTargetDecision.execute(this)),
      new ConditionNode(() => this.inAttackRangeDecision.execute(this)),
      new ActionNode((controller, delta) => {
        // スキルを使用するかどうか
        if (this.options.useSkills && Math.random() < this.options.intelligence) {
          return this.skillUseBehavior.execute(controller, delta);
        }
        
        // 通常攻撃
        return this.attackBehavior.execute(controller, delta);
      })
    ]);
    
    // 追跡サブツリー
    const chaseSequence = new SequenceNode([
      new ConditionNode(() => this.hasTargetDecision.execute(this)),
      new ConditionNode(() => this.inChaseRangeDecision.execute(this)),
      new ActionNode((controller, delta) => {
        return this.chaseBehavior.execute(controller, delta);
      })
    ]);
    
    // 逃走サブツリー
    const fleeSequence = new SequenceNode([
      new ConditionNode(() => this.lowHealthDecision.execute(this)),
      new ConditionNode(() => this.hasTargetDecision.execute(this)),
      new ActionNode((controller, delta) => {
        return this.fleeingBehavior.execute(controller, delta);
      })
    ]);
    
    // 帰還サブツリー
    const returnSequence = new SequenceNode([
      new ConditionNode(() => this.tooFarFromHomeDecision.execute(this)),
      new ActionNode((controller, delta) => {
        return this.returnBehavior.execute(controller, delta);
      })
    ]);
    
    // 探索サブツリー（ターゲット検索）
    const searchSequence = new SequenceNode([
      new InverterNode(
        new ConditionNode(() => this.hasTargetDecision.execute(this))
      ),
      new ConditionNode(() => this.selectTargetDecision.execute(this))
    ]);
    
    // 巡回サブツリー
    const patrolSequence = new SequenceNode([
      new InverterNode(
        new ConditionNode(() => this.hasTargetDecision.execute(this))
      ),
      new ActionNode((controller, delta) => {
        return this.patrolBehavior.execute(controller, delta);
      })
    ]);
    
    // 待機サブツリー
    const idleSequence = new ActionNode((controller, delta) => {
      return this.idleBehavior.execute(controller, delta);
    });
    
    // ルートセレクター
    const rootNode = new SelectorNode([
      fleeSequence,
      returnSequence,
      attackSequence,
      chaseSequence,
      searchSequence,
      patrolSequence,
      idleSequence
    ]);
    
    // 行動ツリーを設定
    this.behaviorTree = new BehaviorTree(rootNode);
  }

  /**
   * 知覚システムを更新
   */
  updatePerception() {
    const owner = this.owner;
    
    // ターゲットがないまたはターゲットが死んでいる場合
    if (!this.target || this.target.Life <= 0) {
      this.setTarget(null);
      
      // 新しいターゲットを探す
      this.selectTargetDecision.execute(this);
    }
    
    // ダメージの記録
    const lastHealth = this.blackboard.get('lastHealth', owner.Life);
    if (lastHealth > owner.Life) {
      const damage = lastHealth - owner.Life;
      this.highThreatDecision.recordDamageReceived(damage);
    }
    this.blackboard.set('lastHealth', owner.Life);
  }

  /**
   * AIの状態を更新
   * @param {number} time - 現在のゲーム時間
   * @param {number} delta - 前回の更新からの経過時間
   */
  update(time, delta) {
    if (!this.enabled || !this.owner) return;
    
    // 一定間隔でのみ更新（パフォーマンス向上のため）
    if (time - this.lastUpdateTime < this.options.updateInterval) return;
    this.lastUpdateTime = time;
    
    // 知覚システムを更新
    this.updatePerception();
    
    // 行動ツリーを実行
    if (this.behaviorTree) {
      this.behaviorTree.execute(this, delta);
    }
  }

  /**
   * AI設定を変更
   * @param {object} newOptions - 新しい設定
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // 変更された設定に基づいて行動を更新
    this.attackBehavior.options.attackRange = this.options.attackRange;
    this.chaseBehavior.options.maxChaseDistance = this.options.chaseRange;
    this.lowHealthDecision.options.lowHealthThreshold = this.options.fleeHealthThreshold;
    
    // その他の設定更新...
  }

  /**
   * ダメージを受けた時のハンドラー
   * @param {number} damage - 受けたダメージ量
   * @param {Character} attacker - 攻撃者
   */
  onDamageReceived(damage, attacker) {
    // 攻撃者を新しいターゲットとして設定
    if (attacker && attacker !== this.target && attacker.Life > 0) {
      this.setTarget(attacker);
    }
    
    // 脅威レベルに反映
    this.highThreatDecision.recordDamageReceived(damage);
  }
}

export default EnemyAI;