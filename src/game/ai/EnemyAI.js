// src/game/ai/EnemyAI.js
import AIController from './core/AIController';
import IdleBehavior from './behaviors/IdleBehavior';
import PatrolBehavior from './behaviors/PatrolBehavior';
import ChaseBehavior from './behaviors/ChaseBehavior';
import AttackBehavior from './behaviors/AttackBehavior';
import ReturnBehavior from './behaviors/ReturnBehavior';
import VisionSensor from './perception/VisionSensor';

/**
 * 敵キャラクター用AIクラス
 */
export default class EnemyAI extends AIController {
  constructor(owner) {
    super(owner);
    
    // 敵AI特有のプロパティ
    this.aggroRange = owner.aggroRange || 200;
    this.leashRange = owner.leashRange || 400;
    this.attackRange = owner.attackRange || 1;
    this.homePosition = { x: owner.x, y: owner.y };
    
    // 警戒レベル (0-100)
    this.alertness = 0;
    
    // 行動の初期化
    this.initialize();
  }
  
  /**
   * AI初期化
   */
  initialize() {
    // 知覚システムの設定
    this.perceptionSystem = new VisionSensor(this.owner, {
      range: this.aggroRange,
      fieldOfView: 120, // 視野角（度）
      detectionTags: ['player', 'companion']
    });
    
    // 行動の追加
    this.addBehavior(new IdleBehavior(this.owner));
    this.addBehavior(new PatrolBehavior(this.owner, this.generatePatrolPoints()));
    this.addBehavior(new ChaseBehavior(this.owner));
    this.addBehavior(new AttackBehavior(this.owner));
    this.addBehavior(new ReturnBehavior(this.owner, this.homePosition));
    
    // デフォルト行動
    this.changeBehavior(this.getBehaviorByName("idle"));
  }
  
  /**
   * 行動決定ロジック
   */
  decideBehavior() {
    if (!this.owner || this.owner.isDead || this.owner.isStunned) {
      this.changeBehavior(null);
      return;
    }
    
    // シーンからプレイヤーを取得
    const player = this.owner.scene.player;
    if (!player || player.isDead) {
      // プレイヤーがいない/死亡している場合はパトロールまたはアイドル
      const currentBehaviorName = this.currentBehavior ? this.currentBehavior.name : "";
      
      if (currentBehaviorName !== "patrol" && currentBehaviorName !== "idle") {
        // ランダムでパトロールかアイドルを選択
        if (Math.random() < 0.7) {
          this.changeBehavior(this.getBehaviorByName("patrol"));
        } else {
          this.changeBehavior(this.getBehaviorByName("idle"));
        }
      }
      return;
    }
    
    // 現在のターゲット
    const target = this.blackboard.target || player;
    
    // 初期位置からの距離
    const distanceToHome = Phaser.Math.Distance.Between(
      this.owner.x, this.owner.y, 
      this.homePosition.x, this.homePosition.y
    );
    
    // リーシュ範囲を超えた場合は帰還
    if (distanceToHome > this.leashRange) {
      this.changeBehavior(this.getBehaviorByName("return"));
      return;
    }
    
    // ターゲットとの距離
    const distanceToTarget = Phaser.Math.Distance.Between(
      this.owner.x, this.owner.y,
      target.x, target.y
    );
    
    // 行動決定ロジック
    if (distanceToTarget <= this.attackRange * 32) {
      // 攻撃範囲内
      this.changeBehavior(this.getBehaviorByName("attack"));
    } else if (distanceToTarget <= this.aggroRange) {
      // アグロ範囲内
      this.blackboard.target = target;
      this.changeBehavior(this.getBehaviorByName("chase"));
    } else {
      // 範囲外
      const currentBehaviorName = this.currentBehavior ? this.currentBehavior.name : "";
      
      // 追跡中でなければパトロールかアイドルを継続
      if (currentBehaviorName !== "chase" && currentBehaviorName !== "attack") {
        return;
      }
      
      // 追跡/攻撃中だったらパトロールに変更
      this.blackboard.target = null;
      this.changeBehavior(this.getBehaviorByName("patrol"));
    }
  }
  
  /**
   * 名前で行動を取得
   */
  getBehaviorByName(name) {
    return this.behaviors.find(behavior => behavior.name === name);
  }
  
  /**
   * パトロールポイントの生成
   */
  generatePatrolPoints() {
    const points = [];
    const range = 100;
    
    // 初期位置を中心に4つのポイントを生成
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI * 2 * (i / 4);
      const distance = 50 + Math.random() * 50;
      
      points.push({
        x: this.homePosition.x + Math.cos(angle) * distance,
        y: this.homePosition.y + Math.sin(angle) * distance,
        waitTime: 1000 + Math.random() * 2000
      });
    }
    
    return points;
  }
  
  /**
   * 他の敵にも警告
   */
  alertNearbyEnemies(target) {
    if (!this.owner || !this.owner.scene || !target) return;
    
    const alertRange = 150;
    const scene = this.owner.scene;
    
    // 他の敵を探して警告
    for (const enemy of (scene.enemies || [])) {
      if (enemy === this.owner || enemy.isDead) continue;
      
      // 距離チェック
      const distance = Phaser.Math.Distance.Between(
        this.owner.x, this.owner.y,
        enemy.x, enemy.y
      );
      
      if (distance <= alertRange) {
        // AIコントローラを取得して警告
        const enemyAI = enemy.aiController;
        if (enemyAI && enemyAI instanceof EnemyAI) {
          enemyAI.receiveAlert(target, this.owner);
        }
      }
    }
  }
  
  /**
   * 他の敵からの警告を受け取る
   */
  receiveAlert(target, alertSource) {
    if (!target || this.owner.isDead || this.owner.isStunned) return;
    
    // 確率で無視
    if (Math.random() < 0.3) return;
    
    // ターゲットを設定して追跡行動に切り替え
    this.blackboard.target = target;
    this.alertness = 70; // 警戒レベル上昇
    this.changeBehavior(this.getBehaviorByName("chase"));
  }
  
  /**
   * ダメージ反応
   */
  onOwnerDamaged(amount, source) {
    if (!this.owner || this.owner.isDead) return;
    
    // 警戒レベル上昇
    this.alertness = Math.min(100, this.alertness + 30);
    
    // 攻撃者をターゲットに設定
    if (source) {
      this.blackboard.target = source;
      
      // 状態に応じて追跡か攻撃に切り替え
      const distanceToSource = Phaser.Math.Distance.Between(
        this.owner.x, this.owner.y,
        source.x, source.y
      );
      
      if (distanceToSource <= this.attackRange * 32) {
        this.changeBehavior(this.getBehaviorByName("attack"));
      } else {
        this.changeBehavior(this.getBehaviorByName("chase"));
      }
      
      // 他の敵にも警告
      if (Math.random() < 0.5) {
        this.alertNearbyEnemies(source);
      }
    }
  }
}