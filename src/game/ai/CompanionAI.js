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
import ReturnBehavior from './behaviors/ReturnBehavior';
import SkillUseBehavior from './behaviors/SkillUseBehavior';

// 判断
import HealthDecision from './decisions/HealthDecision';
import DistanceDecision from './decisions/DistanceDecision';
import TargetDecision from './decisions/TargetDecision';
import ThreatenDecision from './decisions/ThreatenDecision';

/**
 * CompanionAI - 仲間キャラクターのAIを制御するクラス
 */
class CompanionAI extends AIController {
  /**
   * 新しい仲間AIを作成
   * @param {Companion} owner - このAIが制御する仲間キャラクター
   * @param {object} options - 設定オプション
   */
  constructor(owner, options = {}) {
    super(owner, options);
    
    // デフォルトのAI設定
    this.options = {
      followDistance: 150, // プレイヤーからの最大距離
      minFollowDistance: 30, // プレイヤーからの最小距離
      perceptionRadius: 350, // 知覚半径
      attackRange: 60, // 攻撃範囲
      chaseRange: 450, // 追跡範囲
      fleeHealthThreshold: 0.15, // 逃走する体力閾値
      protectPlayerThreshold: 0.4, // プレイヤー保護モードの閾値
      useSkills: true, // スキルを使用するかどうか
      preferHealingSkills: true, // 回復スキルを優先するかどうか
      supportMode: false, // サポートモードかどうか
      ...options,
      ...super.options
    };
    
    // プレイヤー参照
    this.player = null;
    
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
      randomMovement: false
    });
    
    this.returnBehavior = new ReturnBehavior({
      returnSpeed: 1.5
    });
    
    this.skillUseBehavior = new SkillUseBehavior({
      maxRange: this.options.attackRange * 1.5,
      useAnyAvailableSkill: true,
      targetTypes: ['enemy', 'ally']
    });
    
    // 判断オブジェクト
    this.lowHealthDecision = new HealthDecision({
      condition: 'low',
      lowHealthThreshold: this.options.fleeHealthThreshold
    });
    
    this.playerLowHealthDecision = new HealthDecision({
      condition: 'targetLow',
      targetLowHealthThreshold: this.options.protectPlayerThreshold,
      compareMode: 'target'
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
    
    this.tooFarFromPlayerDecision = new DistanceDecision({
      maxDistance: this.options.followDistance,
      condition: 'tooFar'
    });
    
    this.tooCloseToPlayerDecision = new DistanceDecision({
      minDistance: this.options.minFollowDistance,
      condition: 'tooClose'
    });
    
    this.hasTargetDecision = new TargetDecision({
      condition: 'hasTarget'
    });
    
    this.selectTargetDecision = new TargetDecision({
      condition: 'noTarget',
      selectMode: 'nearest',
      targetType: 'enemy',
      searchRadius: this.options.perceptionRadius
    });
    
    this.highThreatDecision = new ThreatenDecision({
      condition: 'highThreat',
      highThreatenThreshold: 0.7
    });
    
    // 行動ツリーを初期化
    this.initializeBehaviorTree();
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
        if (this.options.useSkills) {
          // プレイヤーの体力が低ければ回復スキルを優先
          if (this.options.preferHealingSkills && this.player) {
            const playerHealthRatio = this.player.Life / this.player.MaxLife;
            if (playerHealthRatio < this.options.protectPlayerThreshold) {
              // プレイヤーを回復するスキルを探す
              this.skillUseBehavior.options.targetTypes = ['ally'];
              const result = this.skillUseBehavior.execute(controller, delta);
              if (result === NodeState.SUCCESS) {
                return NodeState.SUCCESS;
              }
            }
          }
          
          // 通常スキル
          this.skillUseBehavior.options.targetTypes = ['enemy'];
          const result = this.skillUseBehavior.execute(controller, delta);
          if (result === NodeState.SUCCESS) {
            return NodeState.SUCCESS;
          }
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
      new ActionNode((controller, delta) => {
        return this.fleeingBehavior.execute(controller, delta);
      })
    ]);
    
    // プレイヤー追従サブツリー
    const followPlayerSequence = new SequenceNode([
      new ConditionNode(() => {
        if (!this.player) return false;
        
        // プレイヤーとの距離を確認するための設定
        this.tooFarFromPlayerDecision.options.comparePosition = this.player.position;
        return this.tooFarFromPlayerDecision.execute(this);
      }),
      new ActionNode((controller, delta) => {
        // プレイヤーに近づく
        const followBehavior = new ChaseBehavior({
          maxChaseDistance: 1000,
          minDistance: this.options.minFollowDistance,
          chaseSpeed: 1.2
        });
        controller.target = this.player;
        return followBehavior.execute(controller, delta);
      })
    ]);
    
    // プレイヤーから離れるサブツリー
    const moveAwayFromPlayerSequence = new SequenceNode([
      new ConditionNode(() => {
        if (!this.player) return false;
        
        // プレイヤーとの距離を確認するための設定
        this.tooCloseToPlayerDecision.options.comparePosition = this.player.position;
        return this.tooCloseToPlayerDecision.execute(this);
      }),
      new ActionNode((controller, delta) => {
        // プレイヤーから少し離れる
        const moveAwayBehavior = new FleeingBehavior({
          fleeDistance: this.options.minFollowDistance * 2,
          safeDistance: this.options.minFollowDistance * 1.5,
          fleeSpeed: 1.0
        });
        controller.target = this.player;
        return moveAwayBehavior.execute(controller, delta);
      })
    ]);
    
    // 探索サブツリー（ターゲット検索）
    const searchSequence = new SequenceNode([
      new InverterNode(
        new ConditionNode(() => this.hasTargetDecision.execute(this))
      ),
      new ConditionNode(() => this.selectTargetDecision.execute(this))
    ]);
    
    // 待機サブツリー
    const idleSequence = new ActionNode((controller, delta) => {
      return this.idleBehavior.execute(controller, delta);
    });
    
    // サポートモード行動ツリー（プレイヤーを中心に行動）
    const supportRootNode = new SelectorNode([
      fleeSequence,
      new SequenceNode([
        new ConditionNode(() => {
          if (!this.player) return false;
          this.playerLowHealthDecision.options.comparePosition = this.player.position;
          return this.playerLowHealthDecision.execute(this);
        }),
        new ActionNode((controller, delta) => {
          // プレイヤーの回復/サポート処理
          if (this.options.useSkills) {
            this.skillUseBehavior.options.targetTypes = ['ally'];
            return this.skillUseBehavior.execute(controller, delta);
          }
          return NodeState.FAILURE;
        })
      ]),
      followPlayerSequence,
      moveAwayFromPlayerSequence,
      attackSequence,
      chaseSequence,
      searchSequence,
      idleSequence
    ]);
    
    // 戦闘モード行動ツリー（より積極的に攻撃）
    const combatRootNode = new SelectorNode([
      fleeSequence,
      attackSequence,
      chaseSequence,
      searchSequence,
      followPlayerSequence,
      moveAwayFromPlayerSequence,
      idleSequence
    ]);
    
    // モードに応じたルートノードを選択
    const rootNode = this.options.supportMode ? supportRootNode : combatRootNode;
    
    // 行動ツリーを設定
    this.behaviorTree = new BehaviorTree(rootNode);
  }

  /**
   * プレイヤーを設定
   * @param {Player} player - プレイヤーキャラクター
   */
  setPlayer(player) {
    this.player = player;
    this.blackboard.set('player', player);
    
    // コンパニオンの元の位置をプレイヤー位置のオフセットとして設定
    if (player && this.owner) {
      const offsetX = 50;
      const offsetY = 50;
      this.originalPosition = {
        x: player.position.x + offsetX,
        y: player.position.y + offsetY
      };
      this.blackboard.set('originalPosition', this.originalPosition);
    }
  }

  /**
   * 知覚システムを更新
   */
  updatePerception() {
    const owner = this.owner;
    
    // プレイヤーが設定されていない場合、取得を試みる
    if (!this.player) {
      const player = this.blackboard.get('player');
      if (player) {
        this.setPlayer(player);
      }
    }
    
    // ターゲットがないまたはターゲットが死んでいる場合
    if (!this.target || this.target.Life <= 0) {
      this.setTarget(null);
      
      // 新しいターゲットを探す
      if (!this.options.supportMode || 
          (this.player && this.player.Life / this.player.MaxLife > this.options.protectPlayerThreshold)) {
        this.selectTargetDecision.execute(this);
      }
    }
    
    // プレイヤーの近くの敵を検知
    if (this.player) {
      const nearbyEnemies = this.getNearbyEnemies(this.options.perceptionRadius);
      
      // プレイヤーを攻撃している敵を優先
      const enemyAttackingPlayer = nearbyEnemies.find(enemy => 
        enemy.target && enemy.target === this.player
      );
      
      if (enemyAttackingPlayer && (!this.target || this.target.Life <= 0)) {
        this.setTarget(enemyAttackingPlayer);
      }
    }
    
    // ダメージの記録
    const lastHealth = this.blackboard.get('lastHealth', owner.Life);
    if (lastHealth > owner.Life) {
      const damage = lastHealth - owner.Life;
      this.highThreatDecision.recordDamageReceived(damage);
      
      // 受けたダメージが大きい場合、モードを切り替える
      if (damage / owner.MaxLife > 0.1) {
        this.options.supportMode = true;
        this.initializeBehaviorTree();
      }
    }
    this.blackboard.set('lastHealth', owner.Life);
  }

  /**
   * 近くの敵を取得
   * @param {number} radius - 検索半径
   * @returns {Array} 半径内の敵の配列
   */
  getNearbyEnemies(radius) {
    const owner = this.owner;
    
    // エンティティマネージャーを取得
    const entityManager = this.blackboard.get('entityManager');
    if (!entityManager) {
      return [];
    }
    
    // すべてのキャラクターを取得（実装に依存）
    const allCharacters = entityManager.getCharacters ? 
                          entityManager.getCharacters() : 
                          [];
    
    // 敵をフィルタリング
    return allCharacters.filter(character => {
      if (!character || character === owner || character.Life <= 0) {
        return false;
      }
      
      // 敵かどうかをチェック
      const isEnemy = character.ClassType && character.ClassType.name === 'Enemy';
      if (!isEnemy) return false;
      
      // 距離をチェック
      const distance = this.calculateDistance(owner.position, character.position);
      return distance <= radius;
    });
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
    const previousMode = this.options.supportMode;
    
    this.options = { ...this.options, ...newOptions };
    
    // モードが変更された場合、行動ツリーを再初期化
    if (previousMode !== this.options.supportMode) {
      this.initializeBehaviorTree();
    }
    
    // その他の設定更新
    this.attackBehavior.options.attackRange = this.options.attackRange;
    this.chaseBehavior.options.maxChaseDistance = this.options.chaseRange;
    this.lowHealthDecision.options.lowHealthThreshold = this.options.fleeHealthThreshold;
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
    
    // ダメージが大きい場合、サポートモードに切り替え
    if (damage / this.owner.MaxLife > 0.2) {
      this.options.supportMode = true;
      this.initializeBehaviorTree();
    }
  }
}

export default CompanionAI;