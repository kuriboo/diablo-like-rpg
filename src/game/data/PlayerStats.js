// src/game/data/PlayerStats.js

/**
 * プレイヤーの統計情報を管理するシングルトンクラス
 */
export class PlayerStats {
    static instance = null;
  
    /**
     * シングルトンインスタンスを取得
     * @returns {PlayerStats} PlayerStatsのインスタンス
     */
    static getInstance() {
      if (!PlayerStats.instance) {
        PlayerStats.instance = new PlayerStats();
      }
      return PlayerStats.instance;
    }
  
    constructor() {
      // 既に存在する場合は既存のインスタンスを返す
      if (PlayerStats.instance) {
        return PlayerStats.instance;
      }
  
      // プレイヤー統計情報の初期化
      this.reset();
      
      // シングルトンインスタンスを設定
      PlayerStats.instance = this;
    }
  
    /**
     * 統計情報をリセット
     */
    reset() {
      this.name = 'プレイヤー';
      this.level = 1;
      this.experience = 0;
      this.experienceToNextLevel = 100;
      this.health = 100;
      this.maxHealth = 100;
      this.mana = 50;
      this.maxMana = 50;
      this.strength = 10;
      this.dexterity = 10;
      this.intelligence = 10;
      this.vitality = 10;
      
      // ゲームプレイの統計
      this.kills = 0;
      this.deaths = 0;
      this.itemsCollected = 0;
      this.goldCollected = 0;
      this.questsCompleted = 0;
      this.playTime = 0;
      this.damageDealt = 0;
      this.damageReceived = 0;
      this.healingReceived = 0;
      
      // インベントリ（簡易版）
      this.inventory = {
        gold: 0,
        items: []
      };
      
      // 装備中のアイテム
      this.equipment = {
        weapon: null,
        helmet: null,
        armor: null,
        gloves: null,
        boots: null,
        amulet: null,
        ring1: null,
        ring2: null
      };
      
      // スキル
      this.skills = [];
      this.assignedSkills = {
        skill1: null,
        skill2: null,
        skill3: null,
        skill4: null
      };
    }
  
    /**
     * プレイヤーの情報をロード
     * @param {Object} data - 保存されたプレイヤーデータ
     */
    loadFromData(data) {
      if (!data) return;
      
      Object.keys(data).forEach(key => {
        if (this.hasOwnProperty(key)) {
          this[key] = data[key];
        }
      });
    }
  
    /**
     * 経験値を追加し、必要に応じてレベルアップ
     * @param {number} exp - 追加する経験値
     * @returns {boolean} レベルアップしたかどうか
     */
    addExperience(exp) {
      this.experience += exp;
      
      let leveledUp = false;
      
      while (this.experience >= this.experienceToNextLevel) {
        this.levelUp();
        leveledUp = true;
      }
      
      return leveledUp;
    }
  
    /**
     * レベルアップ処理
     */
    levelUp() {
      this.level++;
      this.experience -= this.experienceToNextLevel;
      this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
      
      // ステータス上昇
      this.maxHealth += 10;
      this.health = this.maxHealth;
      this.maxMana += 5;
      this.mana = this.maxMana;
      
      // ランダムなステータス上昇（クラスによって異なる）
      this.strength += Math.floor(Math.random() * 2) + 1;
      this.dexterity += Math.floor(Math.random() * 2) + 1;
      this.intelligence += Math.floor(Math.random() * 2) + 1;
      this.vitality += Math.floor(Math.random() * 2) + 1;
    }
  
    /**
     * プレイヤーのデータをJSON形式で取得
     * @returns {Object} プレイヤーデータのJSONオブジェクト
     */
    toJSON() {
      return {
        name: this.name,
        level: this.level,
        experience: this.experience,
        experienceToNextLevel: this.experienceToNextLevel,
        health: this.health,
        maxHealth: this.maxHealth,
        mana: this.mana,
        maxMana: this.maxMana,
        strength: this.strength,
        dexterity: this.dexterity,
        intelligence: this.intelligence,
        vitality: this.vitality,
        kills: this.kills,
        deaths: this.deaths,
        itemsCollected: this.itemsCollected,
        goldCollected: this.goldCollected,
        questsCompleted: this.questsCompleted,
        playTime: this.playTime,
        inventory: this.inventory,
        equipment: this.equipment,
        skills: this.skills,
        assignedSkills: this.assignedSkills
      };
    }
}