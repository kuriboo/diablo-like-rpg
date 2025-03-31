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
    
    // 移動速度を調整 (値を大きくして移動を速く)
    //this.moveSpeed = config.moveSpeed || 2000; // 元の値より大きく設定
    this.moveSpeed = 2000; // 元の値より大きく設定

    // アクション関連
    this.basicActions = {}; // 基本アクション
    this.specialActions = new Map(); // 特殊アクション
    
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
    
    // ActionSystem関連の初期化
    this.setupActions();
    
    // 入力コントロールの設定 
    this.setupControls();
    
    // カメラフォロー
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.startFollow(this);
    }
    
    // プレイタイム計測用
    this.startPlayTime = Date.now();
  }
  
  /**
   * アクションのセットアップ
   */
  setupActions() {
    // ActionSystemの取得
    this.actionSystem = this.scene.actionSystem;
    if (!this.actionSystem) {
      console.warn('ActionSystem is not available in scene. Player actions will have limited functionality.');
      return;
    }
    
    // 基本アクションの作成
    this.basicActions = {
      move: this.actionSystem.createAction('move', {
        owner: this,
        topDownMap: this.scene.topDownMap,
        moveSpeed: this.moveSpeed
      }),
      
      attack: this.actionSystem.createAction('attack', {
        owner: this,
        attackRange: this.attackRange || 60,
        attackCooldown: 800
      }),
      
      idle: this.actionSystem.createAction('idle', {
        owner: this,
        duration: 1000
      })
    };
    
    // スキルに基づいた特殊アクションの作成
    this.updateSpecialActions();
  }
  
  /**
   * 特殊アクション（スキル）の更新
   */
  updateSpecialActions() {
    if (!this.actionSystem) return;
    
    // 特殊アクションをクリア
    this.specialActions.clear();
    
    // スキルに基づいてアクションを作成
    if (this.skills) {
      for (const skill of this.skills) {
        // スキルデータを作成
        const skillAction = {
          skillId: skill.name,
          name: skill.name,
          description: skill.description,
          manaCost: skill.manaCost || 10,
          cooldown: skill.cooldown || 3000,
          damage: skill.damage,
          damageType: skill.damageType || 'physical',
          range: skill.range || 100,
          areaOfEffect: skill.areaOfEffect || false,
          radius: skill.radius || 0,
          effects: skill.effects,
          duration: skill.duration || 0,
          lastUsed: skill.lastUsed || 0
        };
        
        // スキルをマップに追加
        this.specialActions.set(skill.name, skillAction);
      }
    }
  }
  
  /**
   * 入力コントロールのセットアップ
   */
  setupControls() {
    if (!this.scene || !this.scene.input) return;
    
    // WASD/矢印キーの移動コントロール
    this.setupMovementControls();
    
    // アクションキーのセットアップ
    this.setupKeyboardListeners();
    
    // マウス入力の設定
    this.setupMouseControls();
  }
  
  /**
   * 移動コントロールのセットアップ
   */
  setupMovementControls() {
    if (!this.scene.input.keyboard) return;
    
    // カーソルキーのセットアップ
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // WASDキーのセットアップ
    this.keys = {
      up: this.scene.input.keyboard.addKey('W'),
      down: this.scene.input.keyboard.addKey('S'),
      left: this.scene.input.keyboard.addKey('A'),
      right: this.scene.input.keyboard.addKey('D')
    };
  }
  
  /**
   * マウスコントロールのセットアップ
   */
  setupMouseControls() {
    if (!this.scene.input) return;
    
    // 左クリックの設定 (攻撃)
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleLeftClick(pointer);
      } 
      // 右クリックの設定 (移動)
      else if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      }
    });
  }
  
  /**
   * 左クリック処理 (攻撃/インタラクション)
   */
  handleLeftClick(pointer) {
    if (this.isDead || this.isStunned) return;
    
    // クリック位置を取得
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // トップダウンマップがあれば座標変換
    if (this.scene.topDownMap) {
      const tileXY = this.scene.topDownMap.worldToTileXY(worldPoint.x, worldPoint.y);
      
      // クリック位置にエンティティがあるかチェック
      const entity = this.scene.topDownMap.getEntityAt(tileXY.x, tileXY.y);
      
      if (entity) {
        // 敵の場合は攻撃
        if (entity.constructor.name === 'Enemy') {
          this.attackTarget(entity);
        }
        // NPCの場合は会話
        else if (entity.constructor.name === 'NPC') {
          this.interactWithNPC(entity);
        }
        // アイテム/宝箱の場合は取得
        else if (entity.type === 'item' || entity.type === 'chest') {
          this.collectItem(entity);
        }
        return;
      }
    }
    
    // 何もない場所をクリックした場合は、ActionSystemがあれば基本攻撃
    if (this.actionSystem) {
      this.performBasicAttack();
    }
  }
  
  /**
   * 右クリック処理 (移動)
   */
  handleRightClick(pointer) {
    if (this.isDead || this.isStunned) return;
    
    // クリック位置を取得
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // ActionSystemを使った移動（パス探索あり）
    if (this.actionSystem && this.scene.topDownMap) {
      // 現在のアクションをキャンセル
      this.actionSystem.cancelEntityActions(this);
      
      // クリック位置をタイル座標に変換
      const tileXY = this.scene.topDownMap.worldToTileXY(worldPoint.x, worldPoint.y);
      
      // 移動可能かチェック - 水や溶岩も考慮
      if (this.scene.topDownMap.isWalkableAt(tileXY.x, tileXY.y)) {
        // プレイヤーの現在位置をタイル座標で取得
        const playerTileXY = this.scene.topDownMap.worldToTileXY(this.x, this.y);
        
        // 経路を探索
        const path = this.scene.topDownMap.findPath(
          playerTileXY.x, playerTileXY.y,
          tileXY.x, tileXY.y
        );
        
        // 経路が見つかった場合
        if (path && path.length > 0) {
          // パスをワールド座標に変換
          const worldPath = path.map(p => {
            const worldPos = this.scene.topDownMap.tileToWorldXY(p.x, p.y);
            return { x: worldPos.x, y: worldPos.y };
          });
          
          // 移動アクションを作成して実行
          const moveAction = this.actionSystem.createAction('move', {
            owner: this,
            path: worldPath,
            topDownMap: this.scene.topDownMap,
            moveSpeed: this.moveSpeed
          });
          
          this.actionSystem.queueAction(moveAction, true);
          return; // 成功したので終了
        } else {
          console.log('経路が見つかりませんでした');
        }
      } else {
        console.log(`タイル(${tileXY.x}, ${tileXY.y})は移動不可です`);
      }
    }
    
    // ActionSystemでの移動に失敗した場合や、ActionSystemがない場合は直接移動
    this.setMoveTarget(worldPoint.x, worldPoint.y);
  }
  
  /**
   * ターゲットへの攻撃処理
   */
  attackTarget(target) {
    if (!target) return;
    
    // ActionSystemを使った攻撃
    if (this.actionSystem) {
      // 現在のアクションをキャンセル
      this.actionSystem.cancelEntityActions(this);
      
      // 攻撃アクションを作成して実行
      const attackAction = this.actionSystem.createAction('attack', {
        owner: this,
        target: target,
        attackRange: this.attackRange || 60
      });
      
      this.actionSystem.queueAction(attackAction, true);
    }
    // 従来の攻撃処理
    else {
      this.attack(target);
    }
  }
  
  /**
   * NPCとの会話処理
   */
  interactWithNPC(npc) {
    if (!npc) return;
    
    // NPCとの会話を開始
    const uiScene = this.scene.scene.get('UIScene');
    
    if (uiScene && uiScene.showDialogue) {
      uiScene.showDialogue(npc);
    }
  }
  
  /**
   * 基本攻撃の実行
   */
  performBasicAttack() {
    // 最も近い敵を探す
    const nearestEnemy = this.findNearestEnemy();
    
    // 敵が見つかった場合は攻撃
    if (nearestEnemy) {
      this.attackTarget(nearestEnemy);
    } else {
      // ActionSystemを使った空振り攻撃
      if (this.actionSystem) {
        // 現在のアクションをキャンセル
        this.actionSystem.cancelEntityActions(this);
        
        // 攻撃アクションを作成して実行（ターゲットなし）
        const attackAction = this.actionSystem.createAction('attack', {
          owner: this,
          attackRange: this.attackRange || 60
        });
        
        this.actionSystem.queueAction(attackAction, true);
      }
      // 従来の攻撃処理
      else {
        this.attack(null);
      }
    }
  }
  
  /**
   * 最も近い敵を探す
   */
  findNearestEnemy() {
    if (!this.scene || !this.scene.enemies || this.scene.enemies.length === 0) return null;
    
    let nearestEnemy = null;
    let minDistance = Infinity;
    
    for (const enemy of this.scene.enemies) {
      if (enemy && !enemy.isDead) {
        const dist = Math.sqrt(
          Math.pow(this.x - enemy.x, 2) + 
          Math.pow(this.y - enemy.y, 2)
        );
        
        if (dist < minDistance) {
          minDistance = dist;
          nearestEnemy = enemy;
        }
      }
    }
    
    // 一定距離内の敵だけを対象にする
    const attackRange = this.attackRange || 150;
    return minDistance <= attackRange ? nearestEnemy : null;
  }
  
  /**
   * スキルの使用
   * @param {number} index - スキルインデックス (0-8)
   */
  useSkill(index) {
    if (this.isDead || this.isStunned || this.isPerformingAction) return false;
    
    // スキルの取得
    const skill = this.activeSkills[index];
    if (!skill) return false;
    
    // クールダウンチェック
    const now = Date.now();
    if (skill.lastUsed && now - skill.lastUsed < skill.cooldown) {
      // クールダウン中
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showMessage) {
        const remainingCooldown = Math.ceil((skill.lastUsed + skill.cooldown - now) / 1000);
        uiScene.showMessage(`${skill.name}はクールダウン中です (残り${remainingCooldown}秒)`);
      }
      return false;
    }
    
    // マナコストチェック
    if (this.mana < skill.manaCost) {
      // マナ不足
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.showMessage) {
        uiScene.showMessage(`マナが足りません (必要: ${skill.manaCost})`);
      }
      return false;
    }
    
    // ActionSystemを使ったスキル使用
    if (this.actionSystem) {
      // 現在のアクションをキャンセル
      this.actionSystem.cancelEntityActions(this);
      
      // ターゲットを取得
      const nearestEnemy = this.findNearestEnemy();
      
      // スキルアクションを作成
      const skillAction = this.actionSystem.createAction('skill', {
        owner: this,
        target: nearestEnemy,
        skillId: skill.name,
        ...skill
      });
      
      // アクションを実行
      const success = this.actionSystem.queueAction(skillAction, true);
      
      if (success) {
        // マナ消費
        this.mana -= skill.manaCost;
        
        // 使用時間を記録
        skill.lastUsed = now;
        
        // UI更新
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene) {
          if (uiScene.updateManaBar) uiScene.updateManaBar();
          if (uiScene.updateSkillCooldowns) uiScene.updateSkillCooldowns();
        }
        
        return true;
      }
    }
    // ActionSystemなしの場合の処理
    else {
      // 従来のスキル使用処理を実装（必要に応じて）
      console.warn('ActionSystem is not available for skill usage');
    }
    
    return false;
  }
  
  /**
   * 移動量の更新処理
   * @param {number} time - 現在時間
   * @param {number} delta - 前回更新からの経過時間
   */
  handleMovement(time, delta) {
    // 行動不可状態なら何もしない
    if (this.isDead || this.isStunned || this.isPerformingAction) return;
    
    // ActionSystemで既に行動中なら何もしない
    if (this.actionSystem && this.actionSystem.isEntityActing(this)) return;
    
    // 移動フラグと速度
    let isMoving = false;
    let dx = 0;
    let dy = 0;
    
    // 重要な修正: 現在の移動速度を計算 - 元の式から修正
    // 1000で割ると秒単位になるので、moveSpeedが一定以上の値でないと動きが遅くなる
    // 例えば200の場合、delta=16.6msとすると、1フレームでの移動は約3.32ピクセル
    const scalingFactor = 10; // 調整可能な値
    const normalizedSpeed = this.moveSpeed * scalingFactor * (delta / 1000);
    
    // キー入力に基づいて方向を決定
    if (this.cursors.up.isDown || this.keys.up.isDown) {
      dy = -normalizedSpeed;
      this.direction = 'up';
      isMoving = true;
    } else if (this.cursors.down.isDown || this.keys.down.isDown) {
      dy = normalizedSpeed;
      this.direction = 'down';
      isMoving = true;
    }
    
    if (this.cursors.left.isDown || this.keys.left.isDown) {
      dx = -normalizedSpeed;
      this.direction = 'left';
      isMoving = true;
    } else if (this.cursors.right.isDown || this.keys.right.isDown) {
      dx = normalizedSpeed;
      this.direction = 'right';
      isMoving = true;
    }
    
    // 移動している場合
    if (isMoving) {
      // 移動アニメーション
      this.animationState = 'walk';
      if (this.playAnimation) this.playAnimation();
      
      // 移動先の座標
      const newX = this.x + dx;
      const newY = this.y + dy;
      
      // 移動先が歩行可能かチェック
      let canMove = true;
      
      if (this.scene.topDownMap) {
        const tilePos = this.scene.topDownMap.worldToTileXY(newX, newY);
        canMove = this.scene.topDownMap.isWalkableAt(tilePos.x, tilePos.y);
      }
      
      // 移動可能なら位置を更新
      if (canMove) {
        this.x = newX;
        this.y = newY;
      }
    } 
    // 移動していない場合
    else if (this.animationState === 'walk') {
      // アイドル状態に戻す
      this.animationState = 'idle';
      if (this.playAnimation) this.playAnimation();
    }
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
    
    // 基本攻撃（スペースキー）
    const spaceKey = this.scene.input.keyboard.addKey('SPACE');
    spaceKey.on('down', () => {
      this.performBasicAttack();
    });
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
    
    // クラスに応じた初期スキルを設定 - Add safety check for this.classType
    let defaultClass = 'warrior';
    let classType = defaultClass;
    
    if (this.classType && this.classType.name) {
      classType = this.classType.name.toLowerCase();
    }
    
    const classSkills = initialSkills[classType] || initialSkills[defaultClass];
    
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
  
  // 次のレベルアップに必要な経験値の計算
  calculateNextLevelExperience() {
    // レベルに応じて必要経験値を増加
    return 100 * Math.pow(1.5, this.level - 1);
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
    
    // 特殊アクションの更新
    this.updateSpecialActions();
    
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
    
    // 特殊アクションの更新
    this.updateSpecialActions();
    
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
    
    // キーボード入力による移動処理
    this.handleMovement(time, delta);
    
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
    
    // ActionSystemの行動をキャンセル
    if (this.actionSystem) {
      this.actionSystem.cancelEntityActions(this);
    }
    
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