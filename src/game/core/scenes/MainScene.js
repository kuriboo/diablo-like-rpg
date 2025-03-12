import Phaser from 'phaser';
import Player from '../characters/Player';
import IsometricMap from '../map/IsometricMap';
import MapGenerator from '../map/MapGenerator';
import CharacterFactory from '../factories/CharacterFactory';
import ItemFactory from '../factories/ItemFactory';
import ActionFactory from '../factories/ActionFactory';
import skillTreeManager from '../skills/core/SkillTreeManager';

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
  }
  
  init(data) {
    // 前のシーンからのデータ受け取り
    this.gameData = data.gameData || {};
    
    // ファクトリーの初期化
    this.characterFactory = CharacterFactory;
    this.itemFactory = ItemFactory;
    this.actionFactory = ActionFactory;
  }
  
  preload() {
    // 必要なアセットの読み込み
    // (既にLoadingSceneで読み込まれているはず)
  }
  
  async create() {
    // マップジェネレーターの作成
    this.mapGenerator = new MapGenerator({
      scene: this,
      width: 50,
      height: 50
    });
    
    // アイソメトリックマップの作成
    this.isometricMap = new IsometricMap({
      scene: this,
      mapData: await this.mapGenerator.generateMap('normal', 1)
    });
    
    // プレイヤーの作成
    this.createPlayer();
    
    // NPCの作成
    this.createNPCs();
    
    // 敵の作成
    this.createEnemies();
    
    // アイテムの作成
    this.createItems();
    
    // カメラの設定
    this.setupCamera();
    
    // UIシーンの開始
    this.scene.launch('UIScene', { mainScene: this });
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // スキルツリーシステムの初期化
    this.initializeSkillTreeSystem();
  }
  
  update(time, delta) {
    // 深度ソート
    if (this.isometricMap) {
      this.isometricMap.updateDepthSorting();
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
      enemy.update(time, delta);
    }
    
    // カメラのアップデート
    this.updateCamera();
  }
  
  createPlayer() {
    // プレイヤーキャラクターの作成
    this.player = this.characterFactory.createPlayer({
      scene: this,
      x: 400,
      y: 300,
      // プレイヤーの初期設定
      level: this.gameData.playerLevel || 1,
      classType: this.gameData.playerClass || 'warrior'
    });
    
    // プレイヤーをシーンに追加
    this.add.existing(this.player);
    
    // デプスソート用配列に追加
    if (this.isometricMap) {
      this.isometricMap.addToDepthSortedObjects(this.player);
    }
  }
  
  createNPCs() {
    // NPCの作成ロジック
    const npcPositions = this.mapGenerator.getNPCPositions();
    
    for (const position of npcPositions) {
      const npc = this.characterFactory.createNPC({
        scene: this,
        x: position.x,
        y: position.y,
        type: position.type || 'villager'
      });
      
      // NPCをシーンに追加
      this.add.existing(npc);
      
      // NPCをリストに追加
      this.npcs.push(npc);
      
      // デプスソート用配列に追加
      if (this.isometricMap) {
        this.isometricMap.addToDepthSortedObjects(npc);
      }
    }
  }
  
  createEnemies() {
    // 敵の作成ロジック
    const enemyPositions = this.mapGenerator.getEnemyPositions();
    
    for (const position of enemyPositions) {
      const enemy = this.characterFactory.createEnemy({
        scene: this,
        x: position.x,
        y: position.y,
        level: position.level || this.gameData.currentLevel || 1,
        type: position.type || 'skeleton'
      });
      
      // 敵をシーンに追加
      this.add.existing(enemy);
      
      // 敵をリストに追加
      this.enemies.push(enemy);
      
      // デプスソート用配列に追加
      if (this.isometricMap) {
        this.isometricMap.addToDepthSortedObjects(enemy);
      }
    }
  }
  
  createItems() {
    // アイテムの作成ロジック
    const itemPositions = this.mapGenerator.getItemPositions();
    
    for (const position of itemPositions) {
      const item = this.itemFactory.createItem({
        scene: this,
        x: position.x,
        y: position.y,
        type: position.type || 'potion'
      });
      
      // アイテムをシーンに追加
      this.add.existing(item);
      
      // アイテムをリストに追加
      this.items.push(item);
      
      // デプスソート用配列に追加（アイテムが表示オブジェクトの場合）
      if (this.isometricMap && item.displaySprite) {
        this.isometricMap.addToDepthSortedObjects(item.displaySprite);
      }
    }
  }
  
  setupCamera() {
    // カメラの設定
    if (this.player) {
      this.cameras.main.startFollow(this.player);
      this.cameras.main.setZoom(1);
    }
  }
  
  updateCamera() {
    // カメラの更新（必要に応じて）
  }
  
  setupEventListeners() {
    // 各種イベントリスナーの設定
    this.input.keyboard.on('keydown-ESC', () => {
      // メニューを表示
      const uiScene = this.scene.get('UIScene');
      if (uiScene) {
        uiScene.toggleMenu();
      }
    });
    
    // プレイヤー移動イベント
    this.input.on('pointerdown', (pointer) => {
      if (this.player && !this.player.isDead) {
        // クリック位置を取得
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // アイソメトリック座標に変換
        const isoPoint = this.isometricMap.worldToIso(worldPoint.x, worldPoint.y);
        
        // 移動可能かチェック
        if (this.isometricMap.isWalkableAt(isoPoint.x, isoPoint.y)) {
          // 移動アクションを作成
          const moveAction = this.actionFactory.createBasicAction('move', {
            owner: this.player,
            position: isoPoint,
            scene: this
          });
          
          // 移動アクション実行
          moveAction.play();
        }
      }
    });
    
    // 攻撃イベント
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.player && !this.player.isDead) {
        // 攻撃アクションを作成
        const attackAction = this.actionFactory.createBasicAction('attack', {
          owner: this.player,
          scene: this
        });
        
        // 攻撃アクション実行
        attackAction.play();
      }
    });
    
    // スキル使用イベント（1〜5キー）
    for (let i = 1; i <= 5; i++) {
      this.input.keyboard.on(`keydown-${i}`, () => {
        if (this.player && !this.player.isDead) {
          this.usePlayerSkill(i - 1);
        }
      });
    }
  }
  
  usePlayerSkill(skillIndex) {
    // プレイヤーのスキルリストからスキルを取得
    if (!this.player.specialActions) return;
    
    const skillKeys = Array.from(this.player.specialActions.keys());
    if (skillIndex >= skillKeys.length) return;
    
    const skillKey = skillKeys[skillIndex];
    const skillAction = this.player.specialActions.get(skillKey);
    
    if (skillAction) {
      // スキル使用
      skillAction.play();
    }
  }
  
  async initializeSkillTreeSystem() {
    try {
      // スキルツリーマネージャーの初期化
      if (this.player) {
        await skillTreeManager.initialize(this.player);
        
        // 初期スキルの設定（存在する場合）
        if (this.gameData.unlockedSkills) {
          for (const skillId of this.gameData.unlockedSkills) {
            skillTreeManager.allocateSkillPoint(skillId, this.player);
          }
        }
        
        // プレイヤーのスキルリスト更新（ActionFactoryを使用）
        this.updatePlayerSkills();
        
        console.log('Skill tree system initialized');
      }
    } catch (error) {
      console.error('Failed to initialize skill tree system:', error);
    }
  }
  
  updatePlayerSkills() {
    // プレイヤーに解放済みスキルを設定
    if (!this.player) return;
    
    // 既存のスキルをクリア
    if (!this.player.specialActions) {
      this.player.specialActions = new Map();
    }
    
    // 解放済みスキルの取得
    const unlockedSkills = skillTreeManager.playerSkillState.getUnlockedSkills();
    
    // スキルアクションの作成と設定
    for (const skill of unlockedSkills) {
      if (skill.type === 'skill') {
        const skillAction = this.actionFactory.createActionFromSkillId(skill.id, this.player);
        if (skillAction) {
          this.player.specialActions.set(skill.id, skillAction);
        }
      }
    }
  }
  
  // スキルツリーUI表示
  showSkillTree() {
    // UIシーンにスキルツリー表示を要求
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.showSkillTree) {
      uiScene.showSkillTree(this.player);
    }
  }
  
  // レベルアップ時の処理
  playerLevelUp() {
    if (!this.player) return;
    
    // レベルアップ処理
    this.player.levelUp();
    
    // スキルポイント追加
    skillTreeManager.addSkillPoints(this.player);
    
    // レベルアップ通知
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.showLevelUpNotification) {
      uiScene.showLevelUpNotification();
    }
  }
}