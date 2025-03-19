import Character from './Character';
import { getDistance } from '../../utils/mathUtils';

export default class Companion extends Character {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);
    
    // コンパニオン固有のプロパティ
    this.followDistance = config.followDistance || 80; // プレイヤーとの距離
    this.attackRange = config.attackRange || 2; // 攻撃範囲
    this.attackCooldown = config.attackCooldown || 1000; // 攻撃クールダウン
    this.lastAttackTime = 0;
    
    // AI関連
    this.state = 'follow'; // follow, attack, idle, return
    this.idleTimeout = 0;
    
    // 戦術モード
    this.tacticsMode = config.tacticsMode || 'balanced'; // aggressive, balanced, defensive, passive
    
    // 自動回復
    this.autoHealThreshold = config.autoHealThreshold || 0.3; // 自動回復を行う体力の閾値（30%）
    this.autoHealCooldown = config.autoHealCooldown || 30000; // 自動回復のクールダウン
    this.lastAutoHealTime = 0;
    
    // スキルの使用確率
    this.skillUseProbability = config.skillUseProbability || 0.3; // スキル使用確率（30%）
    
    // プレイヤーの経験値に対する割合で成長
    this.expShareRatio = config.expShareRatio || 0.75; // プレイヤーの獲得経験値の75%を獲得
    
    // プレイヤーへの参照
    this.player = scene.player;
  }
  
  // 戦術モードの設定
  setTacticsMode(mode) {
    if (['aggressive', 'balanced', 'defensive', 'passive'].includes(mode)) {
      this.tacticsMode = mode;
      
      // モードに応じたパラメータ調整
      switch (mode) {
        case 'aggressive':
          this.attackRange = 3;
          this.followDistance = 60;
          this.autoHealThreshold = 0.2;
          this.skillUseProbability = 0.4;
          break;
        case 'balanced':
          this.attackRange = 2;
          this.followDistance = 80;
          this.autoHealThreshold = 0.3;
          this.skillUseProbability = 0.3;
          break;
        case 'defensive':
          this.attackRange = 2;
          this.followDistance = 100;
          this.autoHealThreshold = 0.4;
          this.skillUseProbability = 0.2;
          break;
        case 'passive':
          this.attackRange = 1;
          this.followDistance = 120;
          this.autoHealThreshold = 0.5;
          this.skillUseProbability = 0.1;
          break;
      }
      
      return true;
    }
    
    return false;
  }
  
  // 更新処理のオーバーライド
  update(time, delta) {
    super.update(time, delta);
    
    // 死亡時は処理しない
    if (this.isDead) return;
    
    // プレイヤーが存在しない場合は処理しない
    if (!this.player || this.player.isDead) {
      this.state = 'idle';
      return;
    }
    
    // パッシブモードの場合は常に追従のみ
    if (this.tacticsMode === 'passive') {
      this.state = 'follow';
    } 
    // その他のモードは状況に応じて行動
    else {
      // 自動回復の判定
      this.checkAutoHeal(time);
      
      // 状態に応じた行動
      switch (this.state) {
        case 'follow':
          this.updateFollowState(time, delta);
          break;
        case 'attack':
          this.updateAttackState(time, delta);
          break;
        case 'idle':
          this.updateIdleState(time, delta);
          break;
        case 'return':
          this.updateReturnState(time, delta);
          break;
      }
    }
  }
  
  // 自動回復の判定
  checkAutoHeal(time) {
    // 回復が必要かつクールダウンが終わっている場合
    if (this.life < this.maxLife * this.autoHealThreshold && 
        time - this.lastAutoHealTime > this.autoHealCooldown) {
      
      // 回復スキルがあれば使用
      const healSkillIndex = this.findHealSkill();
      if (healSkillIndex !== -1 && this.useSkill(healSkillIndex)) {
        this.lastAutoHealTime = time;
        return true;
      }
    }
    
    return false;
  }
  
  // 回復スキルの検索
  findHealSkill() {
    if (!this.skills) return -1;
    
    // スキルリストから回復スキルを検索
    for (let i = 0; i < this.skills.length; i++) {
      const skill = this.skills[i];
      if (skill && (skill.type === 'heal' || skill.type === 'regen')) {
        return i;
      }
    }
    
    return -1;
  }
  
  // 追従状態の更新
  updateFollowState(time, delta) {
    // プレイヤーとの距離
    const distanceToPlayer = getDistance(
      this.x, this.y, this.player.x, this.player.y
    );
    
    // 敵の探索
    const target = this.findNearestEnemy();
    
    // アグレッシブモードか、バランスモードで近くに敵がいる場合は攻撃
    if (target && (this.tacticsMode === 'aggressive' || 
        (this.tacticsMode === 'balanced' && distanceToPlayer <= this.followDistance * 1.5))) {
      this.target = target;
      this.state = 'attack';
      return;
    }
    
    // プレイヤーから離れすぎている場合は近づく
    if (distanceToPlayer > this.followDistance) {
      // プレイヤーの位置の少し後ろにポジションを取る
      const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
      const targetX = this.player.x - Math.cos(angle) * (this.followDistance * 0.7);
      const targetY = this.player.y - Math.sin(angle) * (this.followDistance * 0.7);
      
      this.setMoveTarget(targetX, targetY);
    } 
    // 十分近い場合は停止
    else {
      this.stopMoving();
      
      // プレイヤーの方向を向く
      this.faceTarget(this.player);
      
      // 待機アニメーション
      this.animationState = 'idle';
      this.playAnimation();
    }
  }
  
  // 攻撃状態の更新
  updateAttackState(time, delta) {
    // ターゲットがいない/死亡している場合は追従に戻る
    if (!this.target || this.target.isDead) {
      this.state = 'follow';
      this.target = null;
      return;
    }
    
    // プレイヤーとの距離
    const distanceToPlayer = getDistance(
      this.x, this.y, this.player.x, this.player.y
    );
    
    // プレイヤーから離れすぎた場合は戻る
    if (distanceToPlayer > this.followDistance * 2) {
      this.state = 'return';
      return;
    }
    
    // ターゲットとの距離
    const distanceToTarget = getDistance(
      this.x, this.y, this.target.x, this.target.y
    );
    
    // 攻撃範囲内なら攻撃
    if (distanceToTarget <= this.attackRange * 32) {
      // ターゲットの方向を向く
      this.faceTarget(this.target);
      
      // スキル使用判定
      const useSkill = Math.random() < this.skillUseProbability;
      
      if (useSkill && this.skills && this.skills.length > 0) {
        // ランダムなスキルを選択
        const skillIndex = Math.floor(Math.random() * this.skills.length);
        this.useSkill(skillIndex);
      } 
      // 通常攻撃
      else if (time - this.lastAttackTime >= this.attackCooldown) {
        this.attack(this.target);
        this.lastAttackTime = time;
      }
    } 
    // 範囲外ならターゲットに近づく
    else {
      this.setMoveTarget(this.target.x, this.target.y);
    }
  }
  
  // アイドル状態の更新
  updateIdleState(time, delta) {
    // アイドルタイムアウトの更新
    this.idleTimeout -= delta;
    
    // タイムアウトが終了したら追従に戻る
    if (this.idleTimeout <= 0) {
      this.state = 'follow';
    }
  }
  
  // 戻り状態の更新
  updateReturnState(time, delta) {
    // プレイヤーとの距離
    const distanceToPlayer = getDistance(
      this.x, this.y, this.player.x, this.player.y
    );
    
    // プレイヤーに十分近づいたら追従に戻る
    if (distanceToPlayer <= this.followDistance) {
      this.state = 'follow';
      return;
    }
    
    // プレイヤーの位置へ移動
    this.setMoveTarget(this.player.x, this.player.y);
  }
  
  // 最も近い敵を探す
  findNearestEnemy() {
    if (!this.scene || !this.scene.enemies) return null;
    
    let nearestEnemy = null;
    let shortestDistance = Number.MAX_VALUE;
    
    // アグレッシブモードなら広範囲、それ以外は近距離のみ検索
    const searchRange = this.tacticsMode === 'aggressive' ? 250 : 150;
    
    for (const enemy of this.scene.enemies) {
      // 死亡している敵はスキップ
      if (enemy.isDead) continue;
      
      // 敵との距離
      const distanceToEnemy = getDistance(
        this.x, this.y, enemy.x, enemy.y
      );
      
      // 検索範囲内で最も近い敵を記録
      if (distanceToEnemy <= searchRange && distanceToEnemy < shortestDistance) {
        nearestEnemy = enemy;
        shortestDistance = distanceToEnemy;
      }
    }
    
    return nearestEnemy;
  }
  
  // 経験値の獲得（プレイヤーの獲得経験値から割合で取得）
  gainExperienceFromPlayer(playerExpGain) {
    // 獲得経験値を計算
    const expGain = Math.floor(playerExpGain * this.expShareRatio);
    
    if (expGain <= 0) return;
    
    // 次のレベルの経験値が設定されていない場合は初期化
    if (!this.nextLevelExperience) {
      this.nextLevelExperience = this.calculateNextLevelExperience();
    }
    
    // 経験値を加算
    this.experience = (this.experience || 0) + expGain;
    
    // レベルアップ判定
    while (this.experience >= this.nextLevelExperience) {
      // 余剰経験値を計算
      this.experience -= this.nextLevelExperience;
      
      // レベルアップ
      this.levelUp();
      
      // 次のレベルの必要経験値を計算
      this.nextLevelExperience = this.calculateNextLevelExperience();
    }
    
    // 経験値獲得エフェクトは表示しない（プレイヤーのみ表示）
  }
  
  // 次のレベルアップに必要な経験値の計算
  calculateNextLevelExperience() {
    // レベルに応じて必要経験値を増加（プレイヤーよりやや少なめ）
    return 80 * Math.pow(1.5, this.level - 1);
  }
  
  // レベルアップ時の処理をオーバーライド
  levelUp() {
    super.levelUp();
    
    // コンパニオン固有のレベルアップ処理
    // 自動的にステータスをアップグレード
    const statToUpgrade = this.getStatToUpgrade();
    this[statToUpgrade] += 2; // 通常より多めに上昇
    
    // スキルの自動取得/アップグレード
    this.autoUpgradeSkills();
    
    // 通知
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.showMessage) {
      uiScene.showMessage(`${this.name}がレベル${this.level}になりました！`);
    }
  }
  
  // 上昇させるステータスの選択
  getStatToUpgrade() {
    // クラスタイプに基づいて優先ステータスを決定
    switch (this.classType.name.toLowerCase()) {
      case 'warrior':
        return Math.random() < 0.7 ? 'strength' : (Math.random() < 0.5 ? 'vitality' : 'dexterity');
      case 'rogue':
        return Math.random() < 0.7 ? 'dexterity' : (Math.random() < 0.5 ? 'strength' : 'energy');
      case 'mage':
        return Math.random() < 0.7 ? 'energy' : (Math.random() < 0.5 ? 'vitality' : 'dexterity');
      default:
        // バランス型
        const stats = ['strength', 'dexterity', 'vitality', 'energy'];
        return stats[Math.floor(Math.random() * stats.length)];
    }
  }
  
  // スキルの自動アップグレード
  autoUpgradeSkills() {
    // スキルがなければ何もしない
    if (!this.skills || this.skills.length === 0) return;
    
    // 既存のスキルをアップグレードする確率
    if (this.skills.length > 0 && Math.random() < 0.7) {
      // ランダムなスキルを選択
      const skillIndex = Math.floor(Math.random() * this.skills.length);
      const skill = this.skills[skillIndex];
      
      // レベルアップ
      if (skill.level === undefined) {
        skill.level = 1;
      }
      
      skill.level += 1;
      
      // レベルに応じた強化
      if (skill.damage) {
        skill.damage = Math.floor(skill.damage * 1.2); // 20%ダメージ増加
      }
      if (skill.cooldown) {
        skill.cooldown = Math.max(1000, Math.floor(skill.cooldown * 0.9)); // 10%クールダウン減少（最低1秒）
      }
      if (skill.manaCost) {
        skill.manaCost = Math.max(1, Math.floor(skill.manaCost * 0.9)); // 10%マナコスト減少（最低1）
      }
      
      // 通知
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showMessage) {
        uiScene.showMessage(`${this.name}の${skill.name}がレベルアップしました！`);
      }
    }
    // 新しいスキルを習得する確率
    else if (this.level % 5 === 0) { // 5レベルごとに新スキル習得
      this.learnNewSkill();
    }
  }
  
  // 新しいスキルの習得
  learnNewSkill() {
    // クラスに応じた新スキルリスト
    const newSkills = {
      warrior: [
        {
          name: 'ウォークライ',
          description: '周囲の敵を威嚇し、一時的に攻撃力が上昇する',
          type: 'warcry',
          manaCost: 15,
          cooldown: 20000,
          duration: 10000,
          effects: {
            bonusAttack: 30,
            bonusDefence: 20
          },
          areaOfEffect: true,
          radius: 150,
          castTime: 1000,
          icon: 'skill_warcry'
        },
        {
          name: 'チャージ',
          description: '敵に向かって突進し、範囲ダメージを与える',
          type: 'charge',
          manaCost: 20,
          cooldown: 15000,
          damage: 40,
          damageType: 'physical',
          areaOfEffect: true,
          radius: 100,
          castTime: 500,
          icon: 'skill_charge'
        }
      ],
      rogue: [
        {
          name: 'ブレードフューリー',
          description: '素早く複数の攻撃を繰り出す',
          type: 'blade_fury',
          manaCost: 15,
          cooldown: 12000,
          damage: 35,
          hitCount: 3,
          damageType: 'physical',
          areaOfEffect: false,
          castTime: 500,
          icon: 'skill_blade_fury'
        },
        {
          name: 'ポイズンブレード',
          description: '毒を塗った刃で攻撃し、持続ダメージを与える',
          type: 'poison_blade',
          manaCost: 18,
          cooldown: 15000,
          damage: 20,
          dotDamage: 5,
          dotDuration: 5000,
          damageType: 'poison',
          areaOfEffect: false,
          castTime: 300,
          icon: 'skill_poison_blade'
        }
      ],
      mage: [
        {
          name: 'フロストノヴァ',
          description: '周囲に氷の爆発を起こし、敵を凍結させる',
          type: 'frost_nova',
          manaCost: 25,
          cooldown: 18000,
          damage: 30,
          damageType: 'cold',
          areaOfEffect: true,
          radius: 150,
          freezeDuration: 3000,
          castTime: 800,
          icon: 'skill_frost_nova'
        },
        {
          name: 'エナジーシールド',
          description: 'マナを消費してダメージを軽減するシールドを展開',
          type: 'energy_shield',
          manaCost: 30,
          cooldown: 25000,
          duration: 15000,
          effects: {
            damageReduction: 0.3,
            manaShield: true
          },
          areaOfEffect: false,
          castTime: 1200,
          icon: 'skill_energy_shield'
        }
      ]
    };
    
    // クラスに応じたスキルリストを取得
    const classSkills = newSkills[this.classType.name.toLowerCase()];
    if (!classSkills || classSkills.length === 0) return;
    
    // 既に習得していないスキルをフィルタリング
    const availableSkills = classSkills.filter(newSkill => 
      !this.skills.some(skill => skill.name === newSkill.name)
    );
    
    if (availableSkills.length === 0) return;
    
    // ランダムにスキルを選択
    const selectedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    
    // スキルの追加
    this.skills.push({
      ...selectedSkill,
      level: 1,
      lastUsed: 0
    });
    
    // 通知
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.showMessage) {
      uiScene.showMessage(`${this.name}が新しいスキル「${selectedSkill.name}」を習得しました！`);
    }
  }
  
  // ツールチップデータのオーバーライド
  getTooltipData() {
    const data = super.getTooltipData();
    
    // コンパニオン固有の情報を追加
    return {
      ...data,
      tactics: this.tacticsMode,
      experience: this.experience !== undefined ? `${Math.floor(this.experience)}/${Math.floor(this.nextLevelExperience)}` : 'N/A'
    };
  }
}