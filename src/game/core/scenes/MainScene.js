import Phaser from 'phaser';
import Player from '../characters/Player';
import IsometricMap from '../map/IsometricMap';
import MapGenerator from '../map/MapGenerator';
import CharacterFactory from '../factories/CharacterFactory';
import ItemFactory from '../factories/ItemFactory';
import ActionFactory from '../factories/ActionFactory';
import SkillTreeManager from '../skills/core/SkillTreeManager';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    
    // プロパティの初期化
    this.player = null;
    this.companions = [];
    this.enemies = [];
    this.npcs = [];
    this.items = [];
    this.isometricMap = null;
    this.mapGenerator = null;
    
    // ファクトリーのインスタンス
    this.characterFactory = null;
    this.itemFactory = null;
    this.actionFactory = null;
    
    // ゲームデータ
    this.gameData = {
      currentLevel: 1,
      difficulty: 'normal' // 'normal', 'nightmare', 'hell'
    };
    
    // スキルツリーマネージャー
    this.skillTreeManager = null;
    
    // 現在のマップタイプ
    this.currentMapType = 'dungeon';
  }
  
  init(data) {
    // 前のシーンからのデータ受け取り
    this.gameData = data.gameData || this.gameData;
    
    // ファクトリーの初期化
    this.characterFactory = new CharacterFactory(this);
    this.itemFactory = new ItemFactory(this);
    this.actionFactory = new ActionFactory(this);
    
    // スキルツリーマネージャーの初期化
    this.skillTreeManager = new SkillTreeManager();
  }
  
  preload() {
    // 必要なアセットの読み込み
    // (既にLoadingSceneで読み込まれているはず)
  }
  
  async create() {
    console.log('MainScene: create');
    
    // マップジェネレーターの作成
    this.mapGenerator = new MapGenerator({
      width: 50,
      height: 50,
      seed: Date.now(),
      difficultyLevel: this.gameData.difficulty
    });
    
    // アイソメトリックマップの作成
    this.isometricMap = new IsometricMap({
      scene: this,
      tileSize: { width: 64, height: 32 }
    });
    
    // マップの生成
    await this.generateMap();
    
    // プレイヤーの作成
    this.createPlayer();
    
    // コンパニオンの作成（オプション）
    if (this.gameData.hasCompanion) {
      this.createCompanion();
    }
    
    // カメラの設定
    this.setupCamera();
    
    // UIシーンの開始
    this.scene.launch('UIScene', { mainScene: this });
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // スキルツリーシステムの初期化
    this.initializeSkillTreeSystem();
    
    // ゲーム開始イベント
    this.events.emit('game-started', this.gameData);
    
    // FPSカウンターの表示（デバッグ用）
    if (this.game.config.physics.arcade?.debug) {
      this.fpsText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#00ff00' });
      this.fpsText.setScrollFactor(0);
      this.fpsText.setDepth(999);
    }
  }
  
  update(time, delta) {
    // FPS表示の更新（デバッグ用）
    if (this.fpsText) {
      this.fpsText.setText(`FPS: ${Math.round(1000 / delta)}`);
    }
    
    // マップの更新
    if (this.isometricMap) {
      this.isometricMap.update();
    }
    
    // プレイヤーの更新
    if (this.player) {
      this.player.update(time, delta);
    }
    
    // コンパニオンの更新
    for (const companion of this.companions) {
      companion.update(time, delta);
    }
    
    // 敵の更新
    for (const enemy of this.enemies) {
      if (enemy && enemy.update) {
        enemy.update(time, delta);
      }
    }
    
    // カメラのアップデート
    this.updateCamera();
  }
  
  /**
   * マップ生成処理
   */
  async generateMap() {
    try {
      // 進行度に応じてマップタイプを決定
      this.selectMapType();
      
      // マップを生成
      const mapData = await this.mapGenerator.generateMap(this.currentMapType);
      
      // 生成したマップをIsometricMapに設定
      this.isometricMap.setMapData(mapData);
      
      // オブジェクトを配置
      this.isometricMap.placeObjects();
      
      console.log(`Map generated: ${this.currentMapType}`);
      
      return true;
    } catch (error) {
      console.error('Map generation failed:', error);
      return false;
    }
  }
  
  /**
   * 進行度に応じてマップタイプを選択
   */
  selectMapType() {
    // 進行度（1-100）に応じてマップタイプを決定
    const progress = this.calculateProgressPercentage();
    
    // まれにアリーナ（ボスマップ）を生成（10%ごとに1回）
    if (progress % 10 === 0 && progress > 0) {
      this.currentMapType = 'arena';
      return;
    }
    
    // 進行度10%ごとに町マップを生成（ただし、アリーナの次は生成しない）
    if ((progress + 5) % 10 === 0 && progress > 0) {
      this.currentMapType = 'town';
      return;
    }
    
    // その他の場合は50%の確率でダンジョンかフィールド
    this.currentMapType = Math.random() < 0.5 ? 'dungeon' : 'field';
  }
  
  /**
   * 現在の進行度パーセンテージ（0-100）を計算
   */
  calculateProgressPercentage() {
    const maxLevel = {
      normal: 30,
      nightmare: 60,
      hell: 100
    }[this.gameData.difficulty];
    
    return Math.floor((this.gameData.currentLevel / maxLevel) * 100);
  }
  
  /**
   * プレイヤーの作成
   */
  createPlayer() {
    // プレイヤーのスタート位置を移動可能な場所から取得
    const startPosition = this.isometricMap.getRandomWalkablePosition();
    const worldPos = this.isometricMap.tileToWorldXY(startPosition.x, startPosition.y);
    
    // プレイヤーキャラクターの作成
    this.player = this.characterFactory.createPlayer({
      scene: this,
      x: worldPos.x,
      y: worldPos.y,
      level: this.gameData.playerLevel || 1,
      classType: this.gameData.playerClass || 'warrior'
    });
    
    // プレイヤーをシーンに追加
    this.add.existing(this.player);
    
    // デプスソート用配列に追加
    if (this.isometricMap) {
      this.isometricMap.addToDepthSortedObjects(this.player);
    }
    
    // プレイヤー作成イベント
    this.events.emit('player-created', this.player);
  }
  
  /**
   * コンパニオンの作成
   */
  createCompanion() {
    // プレイヤーの周辺で移動可能な場所を探す
    const playerPos = this.isometricMap.worldToTileXY(this.player.x, this.player.y);
    let companionPos = null;
    
    // プレイヤーの近くで移動可能な位置を探す
    const directions = [
      { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, 
      { dx: -1, dy: 0 }, { dx: 0, dy: -1 }
    ];
    
    for (const dir of directions) {
      const x = playerPos.x + dir.dx;
      const y = playerPos.y + dir.dy;
      
      if (this.isometricMap.isWalkableAt(x, y) && !this.isometricMap.hasEntityAt(x, y)) {
        companionPos = { x, y };
        break;
      }
    }
    
    // 適切な位置が見つからなければランダムな位置を使用
    if (!companionPos) {
      companionPos = this.isometricMap.getRandomWalkablePosition();
    }
    
    // ワールド座標に変換
    const worldPos = this.isometricMap.tileToWorldXY(companionPos.x, companionPos.y);
    
    // コンパニオンの作成
    const companion = this.characterFactory.createCompanion({
      scene: this,
      x: worldPos.x,
      y: worldPos.y,
      level: this.gameData.playerLevel || 1,
      type: this.gameData.companionType || 'rogue'
    });
    
    // コンパニオンをシーンに追加
    this.add.existing(companion);
    
    // コンパニオンリストに追加
    this.companions.push(companion);
    
    // デプスソート用配列に追加
    if (this.isometricMap) {
      this.isometricMap.addToDepthSortedObjects(companion);
    }
    
    // コンパニオンにプレイヤーを認識させる
    if (companion.ai) {
      companion.ai.setPlayer(this.player);
    }
  }
  
  /**
   * カメラの設定
   */
  setupCamera() {
    // カメラの設定
    if (this.player) {
      this.cameras.main.startFollow(this.player);
      this.cameras.main.setZoom(1);
      this.cameras.main.setFollowOffset(-this.player.width / 2, -this.player.height / 2);
    }
  }
  
  /**
   * カメラの更新
   */
  updateCamera() {
    // 必要に応じてカメラの位置やズームを調整
  }
  
  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // ESCキー：メニュー表示
    this.input.keyboard.on('keydown-ESC', () => {
      // メニューを表示
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        uiScene.toggleMenu();
      }
    });
    
    // マウスクリック：移動/攻撃
    this.input.on('pointerdown', (pointer) => {
      if (this.player && !this.player.isDead) {
        // 右クリックの場合は移動
        if (pointer.rightButtonDown()) {
          this.handlePlayerMovement(pointer);
        }
        // 左クリックの場合は攻撃/インタラクション
        else if (pointer.leftButtonDown()) {
          this.handlePlayerAction(pointer);
        }
      }
    });
    
    // スペースキー：基本攻撃
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.player && !this.player.isDead) {
        this.performBasicAttack();
      }
    });
    
    // 1-5キー：スキル使用
    for (let i = 1; i <= 5; i++) {
      this.input.keyboard.on(`keydown-${i}`, () => {
        if (this.player && !this.player.isDead) {
          this.usePlayerSkill(i - 1);
        }
      });
    }
    
    // QWERキー：ポーション使用など
    this.input.keyboard.on('keydown-Q', () => {
      if (this.player && !this.player.isDead) {
        this.useHealthPotion();
      }
    });
    
    this.input.keyboard.on('keydown-E', () => {
      if (this.player && !this.player.isDead) {
        this.useManaPotion();
      }
    });
    
    // ミニマップ表示トグル
    this.input.keyboard.on('keydown-M', () => {
      const uiScene = this.scene.get('UIScene');
      if (uiScene && uiScene.toggleMinimap) {
        uiScene.toggleMinimap();
      }
    });
    
    // スキルツリー表示
    this.input.keyboard.on('keydown-T', () => {
      this.showSkillTree();
    });
    
    // マップ生成用テストキー（デバッグ用）
    if (this.game.config.physics.arcade?.debug) {
      this.input.keyboard.on('keydown-R', async () => {
        await this.generateMap();
        
        // プレイヤーの位置をリセット
        const startPosition = this.isometricMap.getRandomWalkablePosition();
        const worldPos = this.isometricMap.tileToWorldXY(startPosition.x, startPosition.y);
        this.player.setPosition(worldPos.x, worldPos.y);
        
        console.log('Map regenerated');
      });
    }
  }
  
  /**
   * プレイヤー移動処理
   */
  handlePlayerMovement(pointer) {
    // クリック位置を取得
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // アイソメトリック座標に変換
    const tileXY = this.isometricMap.worldToTileXY(worldPoint.x, worldPoint.y);
    
    // 移動可能かチェック
    if (this.isometricMap.isWalkableAt(tileXY.x, tileXY.y)) {
      // プレイヤーの現在位置をタイル座標で取得
      const playerTileXY = this.isometricMap.worldToTileXY(this.player.x, this.player.y);
      
      // 経路を探索
      const path = this.isometricMap.findPath(
        playerTileXY.x, playerTileXY.y,
        tileXY.x, tileXY.y
      );
      
      // 経路が見つかった場合、移動アクションを実行
      if (path && path.length > 0) {
        this.movePlayerAlongPath(path);
      }
    }
  }
  
  /**
   * プレイヤーが経路に沿って移動
   */
  movePlayerAlongPath(path) {
    // 移動アクションを作成
    const moveAction = this.actionFactory.createBasicAction('move', {
      owner: this.player,
      path: path,
      isometricMap: this.isometricMap
    });
    
    // 移動アクション実行
    if (moveAction) {
      moveAction.play();
    }
  }
  
  /**
   * プレイヤーアクション処理（攻撃/インタラクション）
   */
  handlePlayerAction(pointer) {
    // クリック位置を取得
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // アイソメトリック座標に変換
    const tileXY = this.isometricMap.worldToTileXY(worldPoint.x, worldPoint.y);
    
    // クリック位置にエンティティがあるかチェック
    const entity = this.isometricMap.getEntityAt(tileXY.x, tileXY.y);
    
    if (entity) {
      // 敵の場合は攻撃
      if (entity.type === 'enemy' || entity.ClassType?.name === 'Enemy') {
        this.attackTarget(entity);
      }
      // NPCの場合は会話
      else if (entity.type === 'npc' || entity.ClassType?.name === 'NPC') {
        this.interactWithNPC(entity);
      }
      // アイテム/宝箱の場合は取得
      else if (entity.type === 'item' || entity.type === 'chest') {
        this.collectItem(entity);
      }
    } else {
      // 何もないところをクリックした場合は基本攻撃
      this.performBasicAttack();
    }
  }
  
  /**
   * ターゲットを攻撃
   */
  attackTarget(target) {
    if (!this.player || !target) return;
    
    // 攻撃アクションを作成
    const attackAction = this.actionFactory.createBasicAction('attack', {
      owner: this.player,
      target: target
    });
    
    // 攻撃アクション実行
    if (attackAction) {
      attackAction.play();
    }
  }
  
  /**
   * 基本攻撃の実行
   */
  performBasicAttack() {
    if (!this.player) return;
    
    // 最も近い敵を探す
    const nearestEnemy = this.findNearestEnemy();
    
    // 敵が見つかった場合は攻撃
    if (nearestEnemy) {
      this.attackTarget(nearestEnemy);
    } else {
      // 敵がいない場合は空振り
      const attackAction = this.actionFactory.createBasicAction('attack', {
        owner: this.player
      });
      
      if (attackAction) {
        attackAction.play();
      }
    }
  }
  
  /**
   * 最も近い敵を探す
   */
  findNearestEnemy() {
    if (!this.player || !this.enemies || this.enemies.length === 0) return null;
    
    let nearestEnemy = null;
    let minDistance = Infinity;
    
    for (const enemy of this.enemies) {
      if (enemy && !enemy.isDead) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        );
        
        if (dist < minDistance) {
          minDistance = dist;
          nearestEnemy = enemy;
        }
      }
    }
    
    // 一定距離内の敵だけを対象にする
    const attackRange = this.player.attackRange || 150;
    return minDistance <= attackRange ? nearestEnemy : null;
  }
  
  /**
   * NPCとのインタラクション
   */
  interactWithNPC(npc) {
    if (!this.player || !npc) return;
    
    // NPCとの会話を開始
    const uiScene = this.scene.get('UIScene');
    
    if (uiScene && uiScene.showDialogue) {
      uiScene.showDialogue(npc);
    }
  }
  
  /**
   * アイテム/宝箱の収集
   */
  collectItem(item) {
    if (!this.player || !item) return;
    
    // アイテムの所有者をプレイヤーに設定
    item.collect(this.player);
    
    // アイテムリストから削除
    const index = this.items.indexOf(item);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
    
    // デプスソート用配列から削除
    if (this.isometricMap) {
      this.isometricMap.removeFromDepthSortedObjects(item);
    }
    
    // アイテム取得イベント
    this.events.emit('item-collected', item);
  }
  
  /**
   * プレイヤースキルの使用
   */
  usePlayerSkill(skillIndex) {
    // プレイヤーのスキルリストからスキルを取得
    if (!this.player || !this.player.specialActions) return;
    
    const skillKeys = Array.from(this.player.specialActions.keys());
    if (skillIndex >= skillKeys.length) return;
    
    const skillKey = skillKeys[skillIndex];
    const skillAction = this.player.specialActions.get(skillKey);
    
    if (skillAction) {
      // スキルのターゲットを設定（必要に応じて）
      const nearestEnemy = this.findNearestEnemy();
      if (nearestEnemy) {
        skillAction.target = nearestEnemy;
      }
      
      // スキル使用
      skillAction.play();
      
      // スキル使用イベント
      this.events.emit('skill-used', { skillKey, skillAction });
    }
  }
  
  /**
   * ヘルスポーションの使用
   */
  useHealthPotion() {
    if (!this.player) return;
    
    // プレイヤーのポーション使用メソッドを呼び出し
    const success = this.player.useHealthPotion();
    
    if (success) {
      // ポーション使用イベント
      this.events.emit('potion-used', 'health');
    }
  }
  
  /**
   * マナポーションの使用
   */
  useManaPotion() {
    if (!this.player) return;
    
    // プレイヤーのポーション使用メソッドを呼び出し
    const success = this.player.useManaPotion();
    
    if (success) {
      // ポーション使用イベント
      this.events.emit('potion-used', 'mana');
    }
  }
  
  /**
   * スキルツリーシステムの初期化
   */
  async initializeSkillTreeSystem() {
    try {
      if (!this.player) return;
      
      // スキルツリーマネージャーの初期化
      await this.skillTreeManager.initialize(this.player);
      
      // 解放済みスキルの設定（ゲームデータから）
      if (this.gameData.unlockedSkills) {
        for (const skillId of this.gameData.unlockedSkills) {
          this.skillTreeManager.allocateSkillPoint(skillId, this.player);
        }
      }
      
      // プレイヤーのスキルリスト更新
      this.updatePlayerSkills();
      
      console.log('Skill tree system initialized');
    } catch (error) {
      console.error('Failed to initialize skill tree system:', error);
    }
  }
  
  /**
   * プレイヤースキルの更新
   */
  updatePlayerSkills() {
    if (!this.player || !this.skillTreeManager) return;
    
    // 既存のスキルをクリア
    if (!this.player.specialActions) {
      this.player.specialActions = new Map();
    }
    
    // 解放済みスキルの取得
    const unlockedSkills = this.skillTreeManager.getUnlockedSkills(this.player);
    
    // スキルアクションの作成と設定
    for (const skill of unlockedSkills) {
      if (skill.type === 'skill') {
        const skillAction = this.actionFactory.createSpecialAction(skill.id, {
          owner: this.player,
          scene: this
        });
        
        if (skillAction) {
          this.player.specialActions.set(skill.id, skillAction);
        }
      }
    }
    
    // スキル更新イベント
    this.events.emit('skills-updated', this.player.specialActions);
  }
  
  /**
   * スキルツリーUI表示
   */
  showSkillTree() {
    // UIシーンにスキルツリー表示を要求
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.showSkillTree) {
      uiScene.showSkillTree(this.player);
    }
  }
  
  /**
   * レベルアップ時の処理
   */
  playerLevelUp() {
    if (!this.player) return;
    
    // レベルアップ処理
    this.player.levelUp();
    
    // スキルポイント追加
    if (this.skillTreeManager) {
      this.skillTreeManager.addSkillPoints(this.player, 1);
    }
    
    // レベルアップ通知
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.showLevelUpNotification) {
      uiScene.showLevelUpNotification();
    }
    
    // レベルアップイベント
    this.events.emit('player-level-up', this.player.level);
    
    // ゲームデータ更新
    this.gameData.playerLevel = this.player.level;
  }
  
  /**
   * 次のフロアへの進行
   */
  async goToNextFloor() {
    // 現在のフロアレベルを更新
    this.gameData.currentLevel++;
    
    // 新しいマップを生成
    await this.generateMap();
    
    // プレイヤーの位置をリセット
    const startPosition = this.isometricMap.getRandomWalkablePosition();
    const worldPos = this.isometricMap.tileToWorldXY(startPosition.x, startPosition.y);
    this.player.setPosition(worldPos.x, worldPos.y);
    
    // コンパニオンの位置も更新
    if (this.companions.length > 0) {
      for (const companion of this.companions) {
        // プレイヤーの近くに配置
        const companionPos = this.isometricMap.getRandomWalkablePosition();
        const companionWorldPos = this.isometricMap.tileToWorldXY(companionPos.x, companionPos.y);
        companion.setPosition(companionWorldPos.x, companionWorldPos.y);
      }
    }
    
    // フロア移動イベント
    this.events.emit('floor-changed', this.gameData.currentLevel);
    
    // UIの更新
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.updateFloorInfo) {
      uiScene.updateFloorInfo(this.gameData.currentLevel);
    }
  }
  
  /**
   * ゲームオーバー処理
   */
  gameOver() {
    // ゲームオーバー時の処理
    this.events.emit('game-over');
    
    // ゲームオーバー画面表示
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.showGameOver) {
      uiScene.showGameOver();
    }
  }
}