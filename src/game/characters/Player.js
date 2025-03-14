import Character from './Character';
import Inventory from '../core/Inventory';
import { PlayerStats } from '../data/PlayerStats';

export default class Player extends Character {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);
    
    // PlayerStatsシングルトンの取得
    this.playerStats = PlayerStats.getInstance();
    
    // プレイヤー固有のプロパティ
    this.maxPotion = config.maxPotion || 10;
    this.potionCount = config.potionCount || 5;
    this.potionRegenerationValue = config.potionRegenerationValue || 30;
    
    // インベントリ
    this.inventory = new Inventory(this, {
      width: 10,
      height: 4,
      maxSize: 40
    });
    
    // PlayerStatsからデータをロード（もしあれば）
    this.loadFromPlayerStats();
    
    // スキルポイント
    this.skillPoints = this.playerStats.skillPoints || config.skillPoints || 0;
    
    // アクティブキーバインド（1-9キーに割り当てられたスキル）
    this.activeSkills = Array(9).fill(null);
    
    // 初期スキルのセットアップ
    this.setupInitialSkills();
    
    // キーボードイベントリスナー
    this.setupKeyboardListeners();
    
    // カメラフォロー
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.startFollow(this);
    }
    
    // プレイタイム計測用
    this.startPlayTime = Date.now();
  }
  
  /**
   * PlayerStatsからデータをロード
   */
  loadFromPlayerStats() {
    // 基本情報の取得
    if (this.playerStats.name) this.name = this.playerStats.name;
    if (this.playerStats.level > 1) this.level = this.playerStats.level;
    
    // 経験値関連
    this.experience = this.playerStats.experience || 0;
    this.nextLevelExperience = this.calculateNextLevelExperience();
    
    // ステータス
    if (this.playerStats.strength) this.strength = this.playerStats.strength;
    if (this.playerStats.dexterity) this.dexterity = this.playerStats.dexterity;
    if (this.playerStats.intelligence) this.intelligence = this.playerStats.intelligence;
    if (this.playerStats.vitality) this.vitality = this.playerStats.vitality;
    
    // 体力とマナ
    this.recalculateStats();
    if (this.playerStats.health) this.life = this.playerStats.health;
    if (this.playerStats.mana) this.mana = this.playerStats.mana;
    
    // ポーション
    if (this.playerStats.potionCount !== undefined) this.potionCount = this.playerStats.potionCount;
    if (this.playerStats.maxPotion) this.maxPotion = this.playerStats.maxPotion;
    
    // ゴールド
    this.gold = this.playerStats.inventory?.gold || 0;
    
    // スキル
    this.skills = this.playerStats.skills?.length > 0 ? [...this.playerStats.skills] : [];
    
    // その他のデータ
    console.log('Loaded player data from PlayerStats');
  }
  
  /**
   * PlayerStatsにデータを保存
   */
  saveToPlayerStats() {
    // 基本情報の保存
    this.playerStats.name = this.name;
    this.playerStats.level = this.level;
    
    // 経験値関連
    this.playerStats.experience = this.experience;
    this.playerStats.experienceToNextLevel = this.nextLevelExperience;
    
    // ステータス
    this.playerStats.strength = this.strength;
    this.playerStats.dexterity = this.dexterity;
    this.playerStats.intelligence = this.intelligence || this.energy; // 互換性のため
    this.playerStats.vitality = this.vitality;
    
    // 体力とマナ
    this.playerStats.health = this.life;
    this.playerStats.maxHealth = this.maxLife;
    this.playerStats.mana = this.mana;
    this.playerStats.maxMana = this.maxMana;
    
    // ポーション
    this.playerStats.potionCount = this.potionCount;
    this.playerStats.maxPotion = this.maxPotion;
    
    // スキルポイント
    this.playerStats.skillPoints = this.skillPoints;
    
    // 統計情報
    this.playerStats.playTime += Date.now() - this.startPlayTime;
    this.startPlayTime = Date.now(); // リセット
    
    // インベントリ情報
    if (!this.playerStats.inventory) this.playerStats.inventory = {};
    this.playerStats.inventory.gold = this.gold;
    
    // スキル
    this.playerStats.skills = [...this.skills];
    
    console.log('Saved player data to PlayerStats');
  }
  
  // 次のレベルアップに必要な経験値の計算
  calculateNextLevelExperience() {
    // レベルに応じて必要経験値を増加
    return 100 * Math.pow(1.5, this.level - 1);
  }
  
  // 初期スキルの設定
  setupInitialSkills() {
    // すでにスキルがある場合はスキップ
    if (this.skills && this.skills.length > 0) {
      // アクティブスキルにセット
      for (let i = 0; i < this.skills.length && i < 9; i++) {
        this.activeSkills[i] = this.skills[i];
      }
      return;
    }
    
    // クラスごとの初期スキル
    const initialSkills = {
      warrior: [
        {
          name: 'バッシュ',
          description: '敵に強力な一撃を与える',
          type: 'bash',
          manaCost: 5,
          cooldown: 3000,
          damage: 15,
          damageType: 'physical',
          areaOfEffect: false,
          castTime: 500,
          icon: 'skill_bash'
        },
        {
          name: '戦闘の叫び',
          description: '周囲の敵を威嚇し、攻撃力が一時的に上昇する',
          type: 'battle_cry',
          manaCost: 10,
          cooldown: 15000,
          duration: 10000,
          effects: {
            bonusAttack: 20
          },
          areaOfEffect: true,
          radius: 100,
          castTime: 1000,
          icon: 'skill_battle_cry'
        }
      ],
      rogue: [
        {
          name: '急所突き',
          description: '敵の急所を突き、クリティカル率が上昇する',
          type: 'vital_strike',
          manaCost: 5,
          cooldown: 3000,
          damage: 10,
          damageType: 'physical',
          critBonus: 30,
          areaOfEffect: false,
          castTime: 300,
          icon: 'skill_vital_strike'
        },
        {
          name: '影隠れ',
          description: '短時間、透明になり敵から見えなくなる',
          type: 'shadow_hide',
          manaCost: 15,
          cooldown: 20000,
          duration: 5000,
          effects: {
            invisible: true
          },
          areaOfEffect: false,
          castTime: 500,
          icon: 'skill_shadow_hide'
        }
      ],
      mage: [
        {
          name: 'ファイアボール',
          description: '炎の球を放ち、敵にダメージを与える',
          type: 'fireball',
          manaCost: 10,
          cooldown: 3000,
          damage: 20,
          damageType: 'fire',
          areaOfEffect: true,
          radius: 50,
          castTime: 800,
          icon: 'skill_fireball'
        },
        {
          name: 'アイスアーマー',
          description: '氷の鎧で身を包み、防御力が上昇する',
          type: 'ice_armor',
          manaCost: 15,
          cooldown: 15000,
          duration: 10000,
          effects: {
            bonusDefence: 20,
            coldResistance: 20
          },
          areaOfEffect: false,
          castTime: 1000,
          icon: 'skill_ice_armor'
        }
      ]
    };
    
    // クラスに応じた初期スキルを設定
    const classSkills = initialSkills[this.classType.name.toLowerCase()] || initialSkills.warrior;
    
    this.skills = classSkills.map(skill => ({
      ...skill,
      lastUsed: 0
    }));
    
    // アクティブスキルにセット
    for (let i = 0; i < this.skills.length && i < 9; i++) {
      this.activeSkills[i] = this.skills[i];
    }
    
    // PlayerStatsにも保存
    this.playerStats.skills = [...this.skills];
  }
  
  // キーボードイベントリスナーのセットアップ
  setupKeyboardListeners() {
    if (!this.scene || !this.scene.input || !this.scene.input.keyboard) return;
    
    // ポーション使用（Qキー）
    const qKey = this.scene.input.keyboard.addKey('Q');
    qKey.on('down', () => {
      this.usePotion();
    });
    
    // インベントリオープン（Iキー）
    const iKey = this.scene.input.keyboard.addKey('I');
    iKey.on('down', () => {
      this.toggleInventory();
    });
    
    // スキルツリーオープン（Tキー）
    const tKey = this.scene.input.keyboard.addKey('T');
    tKey.on('down', () => {
      this.toggleSkillTree();
    });
    
    // キャラクターステータスオープン（Cキー）
    const cKey = this.scene.input.keyboard.addKey('C');
    cKey.on('down', () => {
      this.toggleCharacterStatus();
    });
    
    // スキル使用（1-9キー）
    for (let i = 1; i <= 9; i++) {
      const key = this.scene.input.keyboard.addKey(String(i));
      key.on('down', () => {
        this.useSkill(i - 1);
      });
    }
  }
  
  // ポーションの使用
  usePotion() {
    if (this.isDead || this.isStunned || this.isPerformingAction) return false;
    
    // ポーションを持っているか確認
    if (this.potionCount <= 0) {
      // ポーションがない場合はメッセージ表示
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showMessage) {
        uiScene.showMessage('ポーションがありません');
      }
      return false;
    }
    
    // 体力が最大値未満の場合のみ使用可能
    if (this.life >= this.maxLife) {
      // 体力が最大の場合はメッセージ表示
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showMessage) {
        uiScene.showMessage('体力が最大です');
      }
      return false;
    }
    
    // ポーションを使用
    this.potionCount--;
    
    // PlayerStatsの更新
    this.playerStats.potionCount = this.potionCount;
    
    // 回復量の計算（レベルによってボーナス）
    const healAmount = Math.floor(this.potionRegenerationValue * (1 + this.level * 0.05));
    
    // 体力回復
    this.heal(healAmount);
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('potion_use');
    }
    
    // ポーション使用エフェクト
    this.showPotionEffect();
    
    // UIの更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene) {
      uiScene.updatePotionCounter();
    }
    
    return true;
  }
  
  // ポーション使用エフェクト
  showPotionEffect() {
    if (!this.scene) return;
    
    // 赤いオーラエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(this.x, this.y, 'particle', {
        tint: 0xff0000,
        lifespan: 1000,
        speed: { min: 20, max: 50 },
        scale: { start: 0.6, end: 0 },
        quantity: 20,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(1000, () => {
        particles.destroy();
      });
    }
  }
  
  // インベントリの表示切替
  toggleInventory() {
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.toggleInventory) {
      uiScene.toggleInventory();
    }
  }
  
  // スキルツリーの表示切替
  toggleSkillTree() {
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.toggleSkillTree) {
      uiScene.toggleSkillTree();
    }
  }
  
  // キャラクターステータスの表示切替
  toggleCharacterStatus() {
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.toggleCharacterStatus) {
      uiScene.toggleCharacterStatus();
    }
  }
  
  // 経験値の獲得
  gainExperience(amount) {
    // 経験値を加算
    this.experience += amount;
    
    // PlayerStatsの更新
    this.playerStats.experience = this.experience;
    
    // レベルアップ判定
    while (this.experience >= this.nextLevelExperience) {
      // 余剰経験値を計算
      this.experience -= this.nextLevelExperience;
      
      // レベルアップ
      this.levelUp();
      
      // 次のレベルの必要経験値を計算
      this.nextLevelExperience = this.calculateNextLevelExperience();
      
      // PlayerStatsの更新
      this.playerStats.experience = this.experience;
      this.playerStats.experienceToNextLevel = this.nextLevelExperience;
    }
    
    // 経験値獲得表示
    this.showExperienceGainEffect(amount);
    
    // UI更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.updateExperienceBar) {
      uiScene.updateExperienceBar();
    }
  }
  
  // 経験値獲得エフェクト
  showExperienceGainEffect(amount) {
    if (!this.scene) return;
    
    // 経験値テキスト
    const expText = this.scene.add.text(
      this.x,
      this.y - 40,
      `+${amount} EXP`,
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: expText,
      y: expText.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        expText.destroy();
      }
    });
  }
  
  // レベルアップ時の処理をオーバーライド
  levelUp() {
    super.levelUp();
    
    // スキルポイントの獲得
    this.skillPoints += 1;
    
    // PlayerStatsの更新
    this.playerStats.level = this.level;
    this.playerStats.skillPoints = this.skillPoints;
    this.playerStats.strength = this.strength;
    this.playerStats.dexterity = this.dexterity;
    this.playerStats.intelligence = this.intelligence || this.energy;
    this.playerStats.vitality = this.vitality;
    this.playerStats.maxHealth = this.maxLife;
    this.playerStats.maxMana = this.maxMana;
    
    // UIの更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.updateSkillPoints) {
      uiScene.updateSkillPoints();
    }
  }
  
  // スキルの習得
  learnSkill(skill) {
    if (!skill || this.skillPoints <= 0) return false;
    
    // 既に習得しているか確認
    const existingIndex = this.skills.findIndex(s => s.name === skill.name);
    if (existingIndex !== -1) {
      return false;
    }
    
    // スキルの追加
    this.skills.push({
      ...skill,
      lastUsed: 0
    });
    
    // スキルポイントを消費
    this.skillPoints -= 1;
    
    // PlayerStatsの更新
    this.playerStats.skills = [...this.skills];
    this.playerStats.skillPoints = this.skillPoints;
    
    // 空いているスロットにセット
    const emptySlot = this.activeSkills.findIndex(s => s === null);
    if (emptySlot !== -1) {
      this.activeSkills[emptySlot] = this.skills[this.skills.length - 1];
    }
    
    // UI更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene) {
      if (uiScene.updateSkillPoints) {
        uiScene.updateSkillPoints();
      }
      if (uiScene.updateSkillBar) {
        uiScene.updateSkillBar();
      }
    }
    
    return true;
  }
  
  // スキルのアップグレード
  upgradeSkill(skillName) {
    if (!skillName || this.skillPoints <= 0) return false;
    
    // スキルの存在確認
    const skillIndex = this.skills.findIndex(s => s.name === skillName);
    if (skillIndex === -1) {
      return false;
    }
    
    const skill = this.skills[skillIndex];
    
    // スキルのレベルアップ（例：ダメージ増加、クールダウン減少など）
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
    
    // スキルポイントを消費
    this.skillPoints -= 1;
    
    // PlayerStatsの更新
    this.playerStats.skills = [...this.skills];
    this.playerStats.skillPoints = this.skillPoints;
    
    // UI更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene) {
      if (uiScene.updateSkillPoints) {
        uiScene.updateSkillPoints();
      }
      if (uiScene.updateSkillBar) {
        uiScene.updateSkillBar();
      }
    }
    
    return true;
  }
  
  // スキルスロットの設定
  setSkillToSlot(skillIndex, slotIndex) {
    if (skillIndex < 0 || skillIndex >= this.skills.length || 
        slotIndex < 0 || slotIndex >= this.activeSkills.length) {
      return false;
    }
    
    // スロットにスキルをセット
    this.activeSkills[slotIndex] = this.skills[skillIndex];
    
    // UI更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.updateSkillBar) {
      uiScene.updateSkillBar();
    }
    
    return true;
  }
  
  // アイテムの取得
  collectItem(item) {
    if (!item) return false;
    
    const result = item.onCollect(this);
    
    // 成功した場合、PlayerStatsを更新
    if (result) {
      this.saveToPlayerStats();
    }
    
    return result;
  }
  
  // アイテムの装備
  equipItem(item) {
    if (!item) return false;
    
    if (item.constructor.name === 'Equipment') {
      const result = item.equip(this);
      
      // 成功した場合、PlayerStatsを更新
      if (result) {
        this.saveToPlayerStats();
      }
      
      return result;
    }
    
    return false;
  }
  
  // 装備の解除
  unequipItem(slot) {
    if (!this.characterEquipments[slot]) return false;
    
    const item = this.characterEquipments[slot];
    
    // インベントリにアイテムを戻す
    const added = this.inventory.addItem(item);
    
    // インベントリに追加できた場合のみ装備を外す
    if (added) {
      this.characterEquipments[slot] = null;
      this.recalculateStats();
      
      // PlayerStatsの更新
      this.saveToPlayerStats();
      
      return true;
    }
    
    return false;
  }
  
  // ゴールドの取得
  gainGold(amount) {
    if (!this.gold) this.gold = 0;
    
    this.gold += amount;
    
    // PlayerStatsの更新
    if (!this.playerStats.inventory) this.playerStats.inventory = {};
    this.playerStats.inventory.gold = this.gold;
    this.playerStats.goldCollected += amount;
    
    // ゴールド取得エフェクト
    this.showGoldGainEffect(amount);
    
    // UI更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.updateGold) {
      uiScene.updateGold();
    }
    
    return true;
  }
  
  // ゴールド取得エフェクト
  showGoldGainEffect(amount) {
    if (!this.scene) return;
    
    // ゴールドテキスト
    const goldText = this.scene.add.text(
      this.x,
      this.y - 20,
      `+${amount} GOLD`,
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: goldText,
      y: goldText.y - 30,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        goldText.destroy();
      }
    });
    
    // キラキラエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(this.x, this.y, 'particle', {
        tint: 0xffff00,
        lifespan: 800,
        speed: { min: 20, max: 50 },
        scale: { start: 0.4, end: 0 },
        quantity: 10,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(800, () => {
        particles.destroy();
      });
    }
    
    // 効果音
    if (this.scene.sound) {
      this.scene.sound.play('coin_sound');
    }
  }
  
  // ツールチップデータのオーバーライド
  getTooltipData() {
    const data = super.getTooltipData();
    
    // プレイヤー固有の情報を追加
    return {
      ...data,
      experience: `${Math.floor(this.experience)}/${Math.floor(this.nextLevelExperience)}`,
      gold: this.gold || 0,
      potions: `${this.potionCount}/${this.maxPotion}`,
      skillPoints: this.skillPoints
    };
  }
  
  // 更新処理のオーバーライド
  update(time, delta) {
    super.update(time, delta);
    
    // プレイヤー特有の更新処理
    // 定期的にPlayerStatsを更新
    if (time % 60000 < delta) { // 約1分ごとに更新
      this.saveToPlayerStats();
    }
  }
  
  // 死亡処理のオーバーライド
  die(killer = null) {
    if (this.isDead) return;
    
    super.die(killer);
    
    // 死亡統計の更新
    this.playerStats.deaths += 1;
    this.playerStats.playTime += Date.now() - this.startPlayTime;
    
    // 死亡理由の取得
    let deathReason = 'モンスターの攻撃による';
    if (killer) {
      if (killer.name) {
        deathReason = `${killer.name}の攻撃による`;
      }
      if (killer.type === 'trap') {
        deathReason = 'トラップによる';
      }
      if (killer.type === 'poison') {
        deathReason = '毒による';
      }
    }
    
    // プレイヤー死亡時の特殊処理
    // ゲームオーバー画面表示など
    this.scene.time.delayedCall(3000, () => {
      const gameOverData = {
        deathReason: deathReason,
        playTime: this.playerStats.playTime,
        level: this.level,
        gold: this.gold,
        kills: this.playerStats.kills
      };
      
      // UISceneに渡す
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showGameOver) {
        uiScene.showGameOver(gameOverData);
      } else {
        // または直接GameOverSceneに遷移
        const game = this.scene.scene.game;
        if (game && game.scene) {
          game.scene.start('GameOverScene', gameOverData);
        }
      }
    });
  }
  
  // ポーション数の増加
  addPotion(count = 1) {
    // 最大値を超えないように調整
    this.potionCount = Math.min(this.maxPotion, this.potionCount + count);
    
    // PlayerStatsの更新
    this.playerStats.potionCount = this.potionCount;
    
    // UI更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.updatePotionCounter) {
      uiScene.updatePotionCounter();
    }
    
    return true;
  }
  
  // ポーション最大数の増加
  increaseMaxPotion(count = 1) {
    this.maxPotion += count;
    
    // PlayerStatsの更新
    this.playerStats.maxPotion = this.maxPotion;
    
    // UI更新
    const uiScene = this.scene.scene.get('UIScene');
    if (uiScene && uiScene.updatePotionCounter) {
      uiScene.updatePotionCounter();
    }
    
    return true;
  }
  
  // ゲーム保存時に呼ばれるメソッド
  onGameSave() {
    // 最新のデータをPlayerStatsに保存
    this.saveToPlayerStats();
    return this.playerStats.toJSON();
  }
}