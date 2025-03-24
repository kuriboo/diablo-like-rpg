// src/game/scenes/LoadingScene.js

// Phaserを動的にロードするためのユーティリティ
let PhaserModule = null;

// 非同期でPhaserをロードする関数
async function getPhaserModule() {
  if (PhaserModule) return PhaserModule;
  
  try {
    PhaserModule = await import('phaser');
    return PhaserModule;
  } catch (error) {
    console.error('Failed to load Phaser:', error);
    throw error;
  }
}

// SceneクラスをPhaserから取得するユーティリティ関数
async function getSceneClass() {
  const phaser = await getPhaserModule();
  return phaser.Scene || phaser.default.Scene;
}

// 依存関係をインポート
import { SCENES } from '../constants';
import AssetManager from '../AssetManager';
import PlaceholderAssets from '../../../debug/PlaceholderAssets';
import SimplePlaceholderAssets from '../../../debug/SimplePlaceholderAssets';
import AudioPlaceholders from '../../../debug/AudioPlaceholders';
import { isDebugMode } from '../../../debug';

/**
 * LoadingScene - ゲームアセットの読み込みを担当するシーン
 */
export default class LoadingScene {
  // 静的なシーンインスタンスを保持
  static instance = null;
  
  // アセットリストの定義
  static loadingAssets = {
    images: [
      // キャラクター関連
      { key: 'player_warrior', path: 'assets/images/characters/player_warrior.png' },
      { key: 'player_rogue', path: 'assets/images/characters/player_rogue.png' },
      { key: 'player_sorcerer', path: 'assets/images/characters/player_sorcerer.png' },
      { key: 'companion_warrior', path: 'assets/images/characters/companion_warrior.png' },
      { key: 'companion_rogue', path: 'assets/images/characters/companion_rogue.png' },
      { key: 'companion_sorcerer', path: 'assets/images/characters/companion_sorcerer.png' },
      
      // 敵キャラクター
      { key: 'enemy_skeleton', path: 'assets/images/characters/enemy_skeleton.png' },
      { key: 'enemy_zombie', path: 'assets/images/characters/enemy_zombie.png' },
      { key: 'enemy_ghost', path: 'assets/images/characters/enemy_ghost.png' },
      { key: 'enemy_spider', path: 'assets/images/characters/enemy_spider.png' },
      { key: 'enemy_slime', path: 'assets/images/characters/enemy_slime.png' },
      { key: 'enemy_wolf', path: 'assets/images/characters/enemy_wolf.png' },
      { key: 'enemy_boss', path: 'assets/images/characters/enemy_boss.png' },
      
      // NPC
      { key: 'npc_villager', path: 'assets/images/characters/npc_villager.png' },
      { key: 'npc_guard', path: 'assets/images/characters/npc_guard.png' },
      { key: 'npc_blacksmith', path: 'assets/images/characters/npc_blacksmith.png' },
      { key: 'npc_merchant', path: 'assets/images/characters/npc_merchant.png' },
      { key: 'npc_alchemist', path: 'assets/images/characters/npc_alchemist.png' },
      
      // タイル関連
      { key: 'tile_grass', path: 'assets/images/tiles/tile_grass.png' },
      { key: 'tile_dirt', path: 'assets/images/tiles/tile_dirt.png' },
      { key: 'tile_stone', path: 'assets/images/tiles/tile_stone.png' },
      { key: 'tile_water', path: 'assets/images/tiles/tile_water.png' },
      { key: 'tile_snow', path: 'assets/images/tiles/tile_snow.png' },
      { key: 'tile_sand', path: 'assets/images/tiles/tile_sand.png' },
      { key: 'tile_lava', path: 'assets/images/tiles/tile_lava.png' },
      
      // 障害物
      { key: 'obstacle_tree', path: 'assets/images/tiles/obstacle_tree.png' },
      { key: 'obstacle_rock', path: 'assets/images/tiles/obstacle_rock.png' },
      { key: 'obstacle_bush', path: 'assets/images/tiles/obstacle_bush.png' },
      { key: 'obstacle_crate', path: 'assets/images/tiles/obstacle_crate.png' },
      
      // アイテム
      { key: 'item_potion_health', path: 'assets/images/items/item_potion_health.png' },
      { key: 'item_potion_mana', path: 'assets/images/items/item_potion_mana.png' },
      { key: 'item_chest', path: 'assets/images/items/item_chest.png' },
      { key: 'item_weapon_sword', path: 'assets/images/items/item_weapon_sword.png' },
      { key: 'item_weapon_axe', path: 'assets/images/items/item_weapon_axe.png' },
      { key: 'item_weapon_bow', path: 'assets/images/items/item_weapon_bow.png' },
      { key: 'item_armor', path: 'assets/images/items/item_armor.png' },
      
      // UI要素
      { key: 'ui_panel', path: 'assets/images/ui/ui_panel.png' },
      { key: 'ui_button', path: 'assets/images/ui/ui_button.png' },
      { key: 'ui_button_hover', path: 'assets/images/ui/ui_button_hover.png' },
      { key: 'ui_inventory', path: 'assets/images/ui/ui_inventory.png' },
      { key: 'ui_health_bar', path: 'assets/images/ui/ui_health_bar.png' },
      { key: 'ui_mana_bar', path: 'assets/images/ui/ui_mana_bar.png' },
      { key: 'ui_skill_icon', path: 'assets/images/ui/ui_skill_icon.png' },
      
      // エフェクト
      { key: 'effect_attack', path: 'assets/images/effects/effect_attack.png' },
      { key: 'effect_heal', path: 'assets/images/effects/effect_heal.png' },
      { key: 'effect_magic', path: 'assets/images/effects/effect_magic.png' },
      
      // ロゴと背景
      { key: 'logo', path: 'assets/images/ui/logo.png' },
      { key: 'background', path: 'assets/images/ui/background.png' },
      
      // メニュー要素（SimplePlaceholderAssets用）
      { key: 'menu-background', path: 'assets/images/ui/menu-background.png' },
      { key: 'game-logo', path: 'assets/images/ui/game-logo.png' },
      { key: 'button-normal', path: 'assets/images/ui/button-normal.png' },
      { key: 'button-hover', path: 'assets/images/ui/button-hover.png' },
      { key: 'options-background', path: 'assets/images/ui/options-background.png' },
      { key: 'slider-track', path: 'assets/images/ui/slider-track.png' },
      { key: 'slider-thumb', path: 'assets/images/ui/slider-thumb.png' },
      { key: 'checkbox-on', path: 'assets/images/ui/checkbox-on.png' },
      { key: 'checkbox-off', path: 'assets/images/ui/checkbox-off.png' }
    ],
    
    // スプライトシート
    spritesheets: [
      { 
        key: 'player_sheet', 
        path: 'assets/images/characters/player_sheet.png',
        frameConfig: { frameWidth: 64, frameHeight: 64 }
      },
      { 
        key: 'enemy_sheet', 
        path: 'assets/images/characters/enemy_sheet.png',
        frameConfig: { frameWidth: 64, frameHeight: 64 }
      },
      { 
        key: 'effects_sheet', 
        path: 'assets/images/effects/effects_sheet.png',
        frameConfig: { frameWidth: 64, frameHeight: 64 }
      },
      {
        key: 'particle',
        path: 'assets/images/effects/particle.png',
        frameConfig: { frameWidth: 8, frameHeight: 8 }
      }
    ],
    
    // オーディオ
    audio: [
      { key: 'bgm_main', path: 'assets/audio/bgm_main.mp3' },
      { key: 'bgm_battle', path: 'assets/audio/bgm_battle.mp3' },
      { key: 'bgm_town', path: 'assets/audio/bgm_town.mp3' },
      { key: 'sfx_attack', path: 'assets/audio/sfx_attack.mp3' },
      { key: 'sfx_spell', path: 'assets/audio/sfx_spell.mp3' },
      { key: 'sfx_item', path: 'assets/audio/sfx_item.mp3' },
      { key: 'click-sfx', path: 'assets/audio/click.mp3' },
      { key: 'hover-sfx', path: 'assets/audio/hover.mp3' },
      { key: 'game_over', path: 'assets/audio/game_over.mp3' }
    ],
    
    // その他
    others: []
  };
  
  /**
   * Phaserシーンのインスタンス化前に非同期で初期化する
   */
  static async initialize() {
    if (LoadingScene.instance) return LoadingScene.instance;
    
    const Scene = await getSceneClass();
    
    // Sceneを継承した実装クラス
    class LoadingSceneImpl extends Scene {
      constructor() {
        super({ key: SCENES.LOADING });
        
        this.loadingText = null;
        this.progressBar = null;
        this.progressBox = null;
        this.loadingAssets = LoadingScene.loadingAssets;
        
        // AssetManagerのインスタンスを取得
        this.assetManager = AssetManager;
      }
      
      preload() {
        // プログレスバーとテキストの初期設定
        this.setupProgressBar();
        
        // AssetManagerを初期化
        this.assetManager.initialize(this);
    
        // デバッグモードの場合、プレースホルダーライブラリを初期化
        if (isDebugMode) {
          console.log('デバッグモード: プレースホルダーアセットを初期化中...');
          
          // PlaceholderAssetsを手動で初期化しておく（AssetManagerの内部実装でも行われる）
          PlaceholderAssets.initialize(this);
          
          // SimplePlaceholderAssetsを初期化（UI関連のプレースホルダー）
          SimplePlaceholderAssets.setDebugMode(true);
          SimplePlaceholderAssets.initialize(this);
          
          // AudioPlaceholdersを初期化（サウンド関連のプレースホルダー）
          AudioPlaceholders.setDebugMode(true);
          AudioPlaceholders.initialize(this);
          
          // ロード中のエラーハンドリングを改善
          this.setupErrorHandling();
        }
        
        // アセットの読み込み
        this.loadAssets();
        
        // ロード進捗イベントのリスナー
        this.load.on('progress', this.updateProgressBar, this);
        this.load.on('complete', this.completeLoading, this);

        if (isDebugMode && AudioPlaceholders) {
          console.log('🎮 デバッグモード: オーディオプレースホルダーを初期化...');
          AudioPlaceholders.setDebugMode(true);
          AudioPlaceholders.initialize(this);
        }
      }
      
      create() {
        console.log('LoadingScene: create');
        
        // アニメーションの作成（キャラクターなど）
        this.createAnimations();
        
        if (isDebugMode) {
          console.log('🎮 デバッグモード: AssetManagerのデバッグ情報を表示...');
          this.assetManager.printAssetList();
        }
        
        // AssetManagerをゲームデータに登録
        this.registry.set('assetManager', this.assetManager);
        
        // 短い遅延後にメニューシーンへ移動
        this.time.delayedCall(500, () => {
          this.scene.start(SCENES.MAIN_MENU);
        });
      }
      
      /**
       * エラーハンドリングのセットアップ
       */
      setupErrorHandling() {
        // アセット読み込みエラーのハンドリング
        this.load.on('loaderror', (fileObj) => {
          console.warn(`⚠️ アセット読み込みエラー: ${fileObj.key} - プレースホルダーを使用します`);
          
          // アセットタイプに基づいてプレースホルダーを生成
          if (fileObj.type === 'image' || fileObj.type === 'spritesheet') {
            this.createTextureErrorPlaceholder(fileObj);
          } else if (fileObj.type === 'audio') {
            this.createAudioErrorPlaceholder(fileObj);
          }
        });
      }
      
      /**
       * テクスチャエラー時のプレースホルダー生成
       * @param {Phaser.Loader.File} fileObj - ロードに失敗したファイルオブジェクト
       */
      createTextureErrorPlaceholder(fileObj) {
        const key = fileObj.key;
        
        // キーから種類を判断
        let type = 'character';
        let color = 0xFFFF00; // デフォルト色
        let width = 32;
        let height = 32;
        
        if (key.includes('player')) {
          type = 'player';
          color = 0x00FF00;
        } else if (key.includes('enemy')) {
          type = 'enemy';
          color = 0xFF0000;
        } else if (key.includes('npc')) {
          type = 'npc';
          color = 0x0000FF;
        } else if (key.includes('tile')) {
          type = 'tile';
          color = 0x888888;
        } else if (key.includes('obstacle')) {
          type = 'obstacle';
          color = 0x8B4513;
        } else if (key.includes('item')) {
          type = 'item';
          color = 0xFFFF00;
          width = 16;
          height = 16;
        } else if (key.includes('ui')) {
          type = 'ui';
          color = 0x333333;
          if (key.includes('button')) {
            width = 100;
            height = 30;
          } else if (key.includes('panel')) {
            width = 200;
            height = 150;
          }
        } else if (key.includes('effect')) {
          type = 'effect';
          color = 0xFFFFFF;
          width = 64;
          height = 64;
        } else if (key.includes('menu') || key.includes('button') || key.includes('checkbox') || key.includes('slider')) {
          // SimplePlaceholderAssetsを使用
          SimplePlaceholderAssets.safeLoadImage(this, key, '');
          return;
        }
        
        // PlaceholderAssetsを使用してプレースホルダーを生成
        if (PlaceholderAssets.hasTexture(this, key)) {
          return; // すでに作成済み
        }
        
        if (typeof PlaceholderAssets.createColorRect === 'function') {
          PlaceholderAssets.createColorRect(this, key, width, height, color);
          console.log(`🎨 プレースホルダー生成: ${key} (${type})`);
          
          // AssetManagerに登録
          if (fileObj.type === 'spritesheet') {
            this.assetManager.registerTexture(key, 'spritesheet');
          } else {
            this.assetManager.registerTexture(key, 'texture');
          }
        } else {
          // フォールバックのプレースホルダーを使用
          const placeholderKey = PlaceholderAssets.getFallbackTexture(this, type);
          if (placeholderKey) {
            console.log(`🎨 フォールバックプレースホルダー使用: ${key} → ${placeholderKey}`);
            
            // AssetManagerに登録
            if (fileObj.type === 'spritesheet') {
              this.assetManager.registerTexture(placeholderKey, 'spritesheet');
            } else {
              this.assetManager.registerTexture(placeholderKey, 'texture');
            }
          }
        }
      }
      
      /**
       * オーディオエラー時のプレースホルダー生成
       * @param {Phaser.Loader.File} fileObj - ロードに失敗したファイルオブジェクト
       */
      createAudioErrorPlaceholder(fileObj) {
        const key = fileObj.key;
        
        // AudioPlaceholdersを使用してプレースホルダーを生成
        if (AudioPlaceholders) {
          const isBgm = key.includes('bgm');
          const type = AudioPlaceholders.getAudioTypeFromKey(key);
          
          if (isBgm) {
            AudioPlaceholders.addBgmPlaceholder(this, key);
          } else {
            AudioPlaceholders.addSfxPlaceholder(this, key, type);
          }
          
          console.log(`🔊 オーディオプレースホルダー生成: ${key} (${isBgm ? 'BGM' : 'SFX'})`);
          
          // AssetManagerに登録
          this.assetManager.registerAudio(key);
        }
      }
      
      /**
       * プログレスバーの初期設定
       */
      setupProgressBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // プログレスボックス
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        // ロード中テキスト
        this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
          font: '20px monospace',
          fill: '#ffffff'
        });
        this.loadingText.setOrigin(0.5, 0.5);
        
        // パーセント表示テキスト
        this.percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
          font: '18px monospace',
          fill: '#ffffff'
        });
        this.percentText.setOrigin(0.5, 0.5);
        
        // プログレスバー
        this.progressBar = this.add.graphics();
      }
      
      /**
       * アセットの読み込みを開始
       */
      loadAssets() {
        // 画像読み込み
        this.loadingAssets.images.forEach(img => {
          if (isDebugMode) {
            // デバッグモードではSimplePlaceholderAssetsを使用
            SimplePlaceholderAssets.safeLoadImage(this, img.key, img.path);
          } else {
            this.load.image(img.key, img.path);
          }
        });
        
        // スプライトシート読み込み
        this.loadingAssets.spritesheets.forEach(sheet => {
          this.load.spritesheet(sheet.key, sheet.path, sheet.frameConfig);
        });
        
        // オーディオ読み込み
        this.loadingAssets.audio.forEach(audio => {
          if (isDebugMode) {
            // デバッグモードではAudioPlaceholdersを使用
            AudioPlaceholders.safeLoadAudio(this, audio.key, audio.path);
          } else {
            this.load.audio(audio.key, audio.path);
          }
          
          // AssetManagerに事前に登録しておく
          this.assetManager.registerAudio(audio.key);
        });
        
        // その他のアセット読み込み
        this.loadingAssets.others.forEach(asset => {
          if (asset.type === 'json') {
            this.load.json(asset.key, asset.path);
          } else if (asset.type === 'atlas') {
            this.load.atlas(asset.key, asset.imagePath, asset.jsonPath);
          }
        });
      }
      
      /**
       * プログレスバーの更新
       * @param {number} value - 進捗値（0～1）
       */
      updateProgressBar(value) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // プログレスバーの更新
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        
        // パーセント表示の更新
        const percent = Math.floor(value * 100);
        this.percentText.setText(`${percent}%`);
      }
      
      /**
       * ロード完了時の処理
       */
      completeLoading() {
        // 「ロード完了」テキストに変更
        this.loadingText.setText('Load Complete!');
        this.percentText.setText('100%');
        
        // ロード完了時にAssetManagerを更新
        this.assetManager.scanTextures(this);
        this.assetManager.scanAudio(this);
      }
      
      /**
       * アニメーションの作成
       */
      createAnimations() {
        // プレイヤーアニメーション
        this.createCharacterAnimations('player', ['idle', 'walk', 'attack', 'hurt', 'death']);
        
        // 敵アニメーション
        this.createCharacterAnimations('enemy', ['idle', 'walk', 'attack', 'hurt', 'death']);
        
        // エフェクトアニメーション
        this.createEffectAnimations();
      }
      
      /**
       * キャラクターアニメーションの作成
       * @param {string} prefix - プレフィックス（'player'や'enemy'など）
       * @param {Array} actions - アクションリスト（'idle'、'walk'など）
       */
      createCharacterAnimations(prefix, actions) {
        // キャラクタータイプごとのアニメーション作成
        const types = prefix === 'player' ? 
          ['warrior', 'rogue', 'sorcerer'] : 
          ['skeleton', 'zombie', 'ghost', 'spider', 'slime', 'wolf', 'boss'];
        
        types.forEach(type => {
          actions.forEach(action => {
            // アニメーションキー（例: 'player_warrior_idle'）
            const key = `${prefix}_${type}_${action}`;
            
            // フレーム数とフレームレート設定
            let frameRate = 10;
            let frameCount = 4;
            
            switch (action) {
              case 'attack':
                frameRate = 15;
                break;
              case 'hurt':
                frameRate = 8;
                frameCount = 2;
                break;
              case 'death':
                frameRate = 8;
                frameCount = 6;
                break;
            }
            
            // アニメーション作成（対応するスプライトシートがあれば）
            const sheet = `${prefix}_sheet`;
            if (this.textures.exists(sheet)) {
              this.anims.create({
                key: key,
                frames: this.anims.generateFrameNumbers(sheet, {
                  start: 0,
                  end: frameCount - 1
                }),
                frameRate: frameRate,
                repeat: action === 'idle' || action === 'walk' ? -1 : 0
              });
            }
          });
        });
      }
      
      /**
       * エフェクトアニメーションの作成
       */
      createEffectAnimations() {
        const effects = ['attack', 'heal', 'magic'];
        
        effects.forEach(effect => {
          const key = `effect_${effect}`;
          
          // フレーム数とフレームレート設定
          let frameRate = 15;
          let frameCount = 5;
          
          // アニメーション作成
          if (this.textures.exists('effects_sheet')) {
            this.anims.create({
              key: key,
              frames: this.anims.generateFrameNumbers('effects_sheet', {
                start: 0,
                end: frameCount - 1
              }),
              frameRate: frameRate,
              repeat: 0
            });
          }
        });
      }
    }
    
    // 実装クラスを保存
    LoadingScene.instance = LoadingSceneImpl;
    return LoadingSceneImpl;
  }
  
  // シーンのインスタンス化
  constructor() {
    if (!LoadingScene.instance) {
      throw new Error('LoadingScene must be initialized before instantiation. Call LoadingScene.initialize() first.');
    }
    return new LoadingScene.instance();
  }
}