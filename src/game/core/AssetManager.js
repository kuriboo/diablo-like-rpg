// src/game/core/AssetManager.js

import PlaceholderAssets from '../../debug/PlaceholderAssets';
import SimplePlaceholderAssets from '../../debug/SimplePlaceholderAssets';
import MapLoader from '../../debug/MapLoader';
import CharacterLoader from '../../debug/CharacterLoader'; 
import { isDebugMode } from '../../debug';

/**
 * アセットマネージャー
 * ゲーム内のすべてのアセット（画像、スプライトシート、オーディオなど）を管理する
 * MapLoaderとの連携によりタイルセット管理機能も提供する
 * シングルトンパターンで実装されている
 */
class AssetManager {
  constructor() {
    // シングルトンの実装のため、インスタンスは一度だけ生成
    if (AssetManager.instance) {
      return AssetManager.instance;
    }
    
    // インスタンスをstaticプロパティに格納
    AssetManager.instance = this;
    
    // 初期化状態のフラグ
    this.initialized = false;
    
    // 現在のシーン（初期化時に設定）
    this.scene = null;
    
    // アセットタイプごとのマップ
    this.textures = new Map();
    this.spritesheets = new Map();
    this.audio = new Map();
    this.tilesets = new Map();
    
    // プレースホルダーの参照
    this.placeholders = {
      initialized: false,
      audio: null
    };
    
    // 統合タイルセット情報
    this.integratedTilesets = null;
    this.tileWalkability = null;
    
    // CharacterLoader参照
    this.characterLoader = null;
    
    // テクスチャマッピング（オブジェクトタイプとテクスチャキーの対応づけ）
    this.textureMap = {
      player: {
        warrior: 'player_warrior',
        rogue: 'player_rogue',
        sorcerer: 'player_sorcerer'
      },
      companion: {
        warrior: 'companion_warrior',
        rogue: 'companion_rogue',
        sorcerer: 'companion_sorcerer'
      },
      enemy: {
        skeleton: 'enemy_skeleton',
        zombie: 'enemy_zombie',
        ghost: 'enemy_ghost',
        spider: 'enemy_spider',
        slime: 'enemy_slime',
        wolf: 'enemy_wolf',
        boss: 'enemy_boss'
      },
      npc: {
        villager: 'npc_villager',
        guard: 'npc_guard',
        blacksmith: 'npc_blacksmith',
        merchant: 'npc_merchant',
        alchemist: 'npc_alchemist'
      },
      item: {
        potion_health: 'item_potion_health',
        potion_mana: 'item_potion_mana',
        chest: 'item_chest',
        weapon_sword: 'item_weapon_sword',
        weapon_axe: 'item_weapon_axe',
        weapon_bow: 'item_weapon_bow',
        armor: 'item_armor'
      },
      ui: {
        panel: 'ui_panel',
        button: 'ui_button',
        button_hover: 'ui_button_hover',
        inventory: 'ui_inventory',
        health_bar: 'ui_health_bar',
        mana_bar: 'ui_mana_bar',
        skill_icon: 'ui_skill_icon'
      },
      effect: {
        attack: 'effect_attack',
        heal: 'effect_heal',
        magic: 'effect_magic'
      }
    };
    
    // アニメーションマッピング
    this.animationMap = {
      player: {
        warrior: {
          idle: 'player_warrior_idle',
          walk: 'player_warrior_walk',
          attack: 'player_warrior_attack',
          hurt: 'player_warrior_hurt',
          death: 'player_warrior_death'
        },
        rogue: {
          idle: 'player_rogue_idle',
          walk: 'player_rogue_walk',
          attack: 'player_rogue_attack',
          hurt: 'player_rogue_hurt',
          death: 'player_rogue_death'
        },
        sorcerer: {
          idle: 'player_sorcerer_idle',
          walk: 'player_sorcerer_walk',
          attack: 'player_sorcerer_attack',
          hurt: 'player_sorcerer_hurt',
          death: 'player_sorcerer_death'
        }
      },
      enemy: {
        skeleton: {
          idle: 'enemy_skeleton_idle',
          walk: 'enemy_skeleton_walk',
          attack: 'enemy_skeleton_attack',
          hurt: 'enemy_skeleton_hurt',
          death: 'enemy_skeleton_death'
        },
        zombie: {
          idle: 'enemy_zombie_idle',
          walk: 'enemy_zombie_walk',
          attack: 'enemy_zombie_attack',
          hurt: 'enemy_zombie_hurt',
          death: 'enemy_zombie_death'
        },
        ghost: {
          idle: 'enemy_ghost_idle',
          walk: 'enemy_ghost_walk',
          attack: 'enemy_ghost_attack',
          hurt: 'enemy_ghost_hurt',
          death: 'enemy_ghost_death'
        },
        // 他の敵タイプも同様に定義
      },
      effect: {
        attack: 'effect_attack',
        heal: 'effect_heal',
        magic: 'effect_magic'
      }
    };
    
    // 統合タイルセットのマッピング
    this.integratedTextureMap = {
      tile: 'tileset_terrain',
      object: 'tileset_objects',
      walls: 'tileset_walls'
    };

    /**
     * 統合タイルセットのマッピング情報
     * 個別タイルの代わりに統合タイルセットを使用
     */
    this.tilesetMap = {
      // 地形タイルセット（統合）
      terrain: 'tileset_terrain',
      // オブジェクトタイルセット（統合）
      objects: 'tileset_objects',
      // 壁タイルセット（統合） - 新規追加
      walls: 'tileset_walls'
    };

    /**
     * タイルインデックスマッピング
     * 統合タイルセット内での各タイルの位置
     */
    this.tileIndexMap = {
      // 地形タイル
      terrain: {
        water: 0,  // 通行不可
        grass: 1,
        dirt: 2,
        sand: 3,
        stone: 4,
        snow: 5,
        lava: 6    // 通行不可
      },
      // オブジェクトタイル
      objects: {
        wall: 0,
        chest: 1,
        tree: 2,
        rock: 3,
        bush: 4,
        crate: 5
      },
      // 壁タイル - 新規追加
      walls: {
        stone: 0,
        brick: 1,
        wood: 2,
        ice: 3,
        metal: 4
      }
    };

    /**
     * タイルの通行可能性情報
     */
    this.tileWalkability = {
      'tile_water': false,
      'tile_grass': true,
      'tile_dirt': true,
      'tile_sand': true,
      'tile_stone': true,
      'tile_snow': true,
      'tile_lava': false,

      'tile_wall': false,
      'item_chest': false, // 通行不可（アイテム取得時に通行可能になる場合は、ゲームロジックで処理）
      'obstacle_tree': false,
      'obstacle_rock': false,
      'obstacle_bush': false,
      'obstacle_crate': false,

      'wall_stone': false,
      'wall_brick': false,
      'wall_wood': false,
      'wall_ice': false,
      'wall_metal': false
    };

    // タイルマッピング（統合タイルセット用）
    this.tileMapping = {
      // 地形タイル
      'tile_water': 0, // 通行不可
      'tile_grass': 1,
      'tile_dirt': 2,
      'tile_sand': 3,
      'tile_stone': 4,
      'tile_snow': 5,
      'tile_lava': 6, // 通行不可
      
      // オブジェクトタイル
      'tile_wall': 0,
      'item_chest': 1,
      'obstacle_tree': 2,
      'obstacle_rock': 3,
      'obstacle_bush': 4,
      'obstacle_crate': 5,

      // 壁タイル - 新規追加
      'wall_stone': 0,
      'wall_brick': 1,
      'wall_wood': 2,
      'wall_ice': 3,
      'wall_metal': 4
    };
    
    // アニメーションマッピング
    this.animationMap = {
      player: {
        warrior: {
          idle: 'player_warrior_idle',
          walk: 'player_warrior_walk',
          attack: 'player_warrior_attack',
          hurt: 'player_warrior_hurt',
          death: 'player_warrior_death'
        },
        rogue: {
          idle: 'player_rogue_idle',
          walk: 'player_rogue_walk',
          attack: 'player_rogue_attack',
          hurt: 'player_rogue_hurt',
          death: 'player_rogue_death'
        },
        sorcerer: {
          idle: 'player_sorcerer_idle',
          walk: 'player_sorcerer_walk',
          attack: 'player_sorcerer_attack',
          hurt: 'player_sorcerer_hurt',
          death: 'player_sorcerer_death'
        }
      },
      enemy: {
        skeleton: {
          idle: 'enemy_skeleton_idle',
          walk: 'enemy_skeleton_walk',
          attack: 'enemy_skeleton_attack',
          hurt: 'enemy_skeleton_hurt',
          death: 'enemy_skeleton_death'
        },
        zombie: {
          idle: 'enemy_zombie_idle',
          walk: 'enemy_zombie_walk',
          attack: 'enemy_zombie_attack',
          hurt: 'enemy_zombie_hurt',
          death: 'enemy_zombie_death'
        },
        ghost: {
          idle: 'enemy_ghost_idle',
          walk: 'enemy_ghost_walk',
          attack: 'enemy_ghost_attack',
          hurt: 'enemy_ghost_hurt',
          death: 'enemy_ghost_death'
        },
        // 他の敵タイプも同様に定義
      },
      effect: {
        attack: 'effect_attack',
        heal: 'effect_heal',
        magic: 'effect_magic'
      }
    };
    
    // サウンドマッピング
    this.soundMap = {
      bgm: {
        main: 'bgm_main',
        battle: 'bgm_battle',
        town: 'bgm_town'
      },
      sfx: {
        attack: 'sfx_attack',
        spell: 'sfx_spell',
        item: 'sfx_item',
        click: 'click-sfx',
        hover: 'hover-sfx',
        game_over: 'game_over'
      }
    };
    
    
  }
  
  /**
   * シングルトンインスタンスを取得
   * @returns {AssetManager} インスタンス
   */
  static getInstance() {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }
  
  /**
   * アセットマネージャーを初期化
   * @param {Phaser.Scene} scene - Phaserシーン
   * @returns {boolean} 初期化が成功したかどうか
   */
  initialize(scene) {
    if (!scene) {
      console.error('AssetManager: 有効なPhaserシーンが必要です');
      return false;
    }
    
    this.scene = scene;
    
    // すでに初期化済みならば成功を返す
    if (this.initialized) {
      console.log('AssetManager: すでに初期化されています');
      return true;
    }
    
    console.log('AssetManager: 初期化中...');
    
    try {
      // デバッグモードの場合、プレースホルダーを初期化
      if (isDebugMode) {
        this.initializePlaceholders(scene);
        
        // MapLoaderの初期化
        this.initializeMapLoader(scene);
        
        // デフォルトサウンドの生成
        this.generateDefaultSounds();
      }
      
      // CharacterLoaderの初期化
      this.initializeCharacterLoader(scene);
      
      // テクスチャの検証とマップへの追加
      this.scanTextures(scene);
      
      // オーディオの検証とマップへの追加
      this.scanAudio(scene);
      
      // 初期化完了
      this.initialized = true;
      console.log(`AssetManager: 初期化完了 (${this.textures.size} textures, ${this.spritesheets.size} spritesheets, ${this.audio.size} audio files, ${this.tilesets.size} tilesets)`);
      
      return true;
    } catch (error) {
      console.error('AssetManager: 初期化中にエラーが発生しました:', error);
      return false;
    }
  }

   /**
   * CharacterLoaderを初期化
   * @param {Phaser.Scene} scene - Phaserシーン
   */
  initializeCharacterLoader(scene) {
    console.log('AssetManager: CharacterLoaderを初期化中...');
    
    // CharacterLoaderが存在し、まだ初期化されていない場合は初期化
    if (CharacterLoader) {
      if (!CharacterLoader.initialized) {
        CharacterLoader.initialize(scene);
      }
      this.characterLoader = CharacterLoader;
      console.log('AssetManager: CharacterLoaderの初期化が完了しました');
    } else {
      console.warn('AssetManager: CharacterLoaderが見つかりません');
    }
  }

  /**
   * 高さ値から地形タイル情報を取得
   * @param {number} heightValue - 高さ値（0.0～1.0）
   * @returns {Object} タイルセット情報（キーとインデックス）
   */
  getTerrainFromHeight(heightValue) {
    // 高さに基づいて地形タイプを決定
    let terrainType;
    
    if (heightValue < 0.3) {
      terrainType = 'water'; // 低い地形（水域）- 通行不可
    } else if (heightValue < 0.5) {
      terrainType = 'grass'; // 中程度の地形（草原）
    } else if (heightValue < 0.7) {
      terrainType = 'dirt';  // 中高地形（土）
    } else if (heightValue < 0.85) {
      terrainType = 'stone'; // 高地形（石）
    } else {
      terrainType = 'snow';  // 最高地（雪）
    }
    
    // 地形タイプをMapLoaderの命名規則に合わせる
    const tileKey = `tile_${terrainType}`;
    
    // nullチェックの追加
    if (!this.tilesetMap || !this.tileMapping || !this.tileWalkability) {
      // デフォルト値を返す（MapLoaderの命名規則に合わせる）
      return {
        key: 'tileset_terrain',
        index: terrainType === 'water' ? 0 : 
              terrainType === 'grass' ? 1 : 
              terrainType === 'dirt' ? 2 : 
              terrainType === 'stone' ? 4 : 
              terrainType === 'snow' ? 5 : 1, // デフォルトは草
        type: terrainType,
        walkable: terrainType !== 'water' && terrainType !== 'lava'
      };
    }
    
    // MapLoaderの命名規則に合わせてインデックスとWalkabilityを取得
    const index = this.tileMapping[tileKey];
    const walkable = this.tileWalkability[tileKey];
    
    // インデックスが見つからない場合のフォールバック
    if (index === undefined) {
      console.warn(`地形タイプ ${tileKey} のインデックスが見つかりません`);
      // タイプに基づいたデフォルト値を使用
      return {
        key: this.tilesetMap.terrain || 'tileset_terrain',
        index: terrainType === 'water' ? 0 : 
              terrainType === 'grass' ? 1 : 
              terrainType === 'dirt' ? 2 : 
              terrainType === 'stone' ? 4 : 
              terrainType === 'snow' ? 5 : 1, // デフォルトは草
        type: terrainType,
        walkable: terrainType !== 'water' && terrainType !== 'lava'
      };
    }
    
    // 統合タイルセットの情報を返す
    return {
      key: this.tilesetMap.terrain || 'tileset_terrain',
      index: index,
      type: terrainType,
      walkable: walkable !== undefined ? walkable : (terrainType !== 'water' && terrainType !== 'lava')
    };
  } 

  /**
   * オブジェクトタイプからオブジェクトタイル情報を取得
   * @param {number} objectType - オブジェクトタイプ（0=空き、2=宝箱、3=障害物）
   * @returns {Object|null} タイルセット情報またはnull
   */
  getObjectInfo(objectType) {
    let objectKey;
    
    // オブジェクトタイプからキーを決定 (MapLoaderの命名規則に合わせる)
    switch (objectType) {
      case 2: // 宝箱
        objectKey = 'item_chest';
        break;
      case 3: // 障害物 - ランダムに選択
        const obstacleTypes = ['obstacle_tree', 'obstacle_rock', 'obstacle_bush', 'obstacle_crate'];
        objectKey = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        break;
      case 4: // 壁 - ランダムに選択（新規追加）
        const wallTypes = ['wall_stone', 'wall_brick', 'wall_wood', 'wall_ice', 'wall_metal'];
        objectKey = wallTypes[Math.floor(Math.random() * wallTypes.length)];
        break;
      default:
        return null;
    }
    
    // nullチェックの追加
    if (!this.tilesetMap || !this.tileMapping || !this.tileWalkability) {
      // デフォルト値を返す
      return {
        key: objectType === 4 ? 'tileset_walls' : 'tileset_objects',
        index: objectKey === 'item_chest' ? 1 : 0,
        type: objectKey.replace('tile_', '').replace('obstacle_', '').replace('item_', '').replace('wall_', ''),
        walkable: false
      };
    }
    
    // MapLoaderの命名規則に合わせてインデックスとWalkabilityを取得
    const index = this.tileMapping[objectKey];
    const walkable = this.tileWalkability[objectKey];
    
    // インデックスが見つからない場合のフォールバック
    if (index === undefined) {
      console.warn(`オブジェクトタイプ ${objectKey} のインデックスが見つかりません`);
      // タイプに基づいたデフォルト値を使用
      return {
        key: objectType === 4 ? this.tilesetMap.walls || 'tileset_walls' : this.tilesetMap.objects || 'tileset_objects',
        index: objectKey === 'item_chest' ? 1 : 0,
        type: objectKey.replace('tile_', '').replace('obstacle_', '').replace('item_', '').replace('wall_', ''),
        walkable: false
      };
    }
    
    // 適切なタイルセットキーを選択
    let tilesetKey;
    if (objectKey.startsWith('wall_')) {
      tilesetKey = this.tilesetMap.walls || 'tileset_walls';
    } else {
      tilesetKey = this.tilesetMap.objects || 'tileset_objects';
    }
    
    // 統合タイルセットの情報を返す
    return {
      key: tilesetKey,
      index: index,
      type: objectKey.replace('tile_', '').replace('obstacle_', '').replace('item_', '').replace('wall_', ''),
      walkable: walkable !== undefined ? walkable : false
    };
  }
    
  /**
   * プレースホルダーサウンドを再生
   * @param {string} type - サウンドタイプ ('bgm' または 'sfx')
   * @param {string} subtype - サブタイプ ('attack', 'spell' など)
   * @returns {boolean} 再生が成功したかどうか
   */
  playPlaceholderSound(type, subtype) {
    if (!this.scene || !isDebugMode) return false;
    
    try {
      // AudioContextを取得（既存のものがあれば再利用、なければ新規作成）
      const audioContext = this.scene.sound?.context || new (window.AudioContext || window.webkitAudioContext)();
      
      // バッファの生成
      let audioBuffer;
      
      if (type === 'bgm') {
        audioBuffer = this.generateBgmBuffer(audioContext);
      } else {
        audioBuffer = this.generateSfxBuffer(audioContext, subtype);
      }
      
      if (!audioBuffer) return false;
      
      // Web Audio APIで直接音を再生
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // ゲインノード（音量調整用）
      const gainNode = audioContext.createGain();
      gainNode.gain.value = type === 'bgm' ? 0.5 : 0.8;
      
      // 接続
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 再生
      source.start();
      
      // BGMの場合はループ設定
      if (type === 'bgm') {
        source.loop = true;
      }
      
      console.log(`🔊 Web Audio APIで直接再生: ${type}/${subtype}`);
      return true;
    } catch (error) {
      console.error(`プレースホルダーサウンド再生エラー (${type}/${subtype}):`, error);
      return false;
    }
  }
  
  /**
   * マスターボリュームの設定
   * @param {number} volume - ボリューム値（0～1）
   */
  setMasterVolume(volume) {
    if (!this.scene || !this.scene.sound) return;
    
    // 値の範囲を確認
    const safeVolume = Math.max(0, Math.min(1, volume));
    
    // マスターボリュームを設定
    this.scene.sound.volume = safeVolume;
  }

  /**
   * BGMのボリューム設定
   * @param {number} volume - ボリューム値（0～1）
   */
  setBGMVolume(volume) {
    if (!this.scene || !this.scene.sound) return;
    
    // 値の範囲を確認
    const safeVolume = Math.max(0, Math.min(1, volume));
    
    // すべてのBGMのボリュームを設定
    const sounds = this.scene.sound.sounds;
    sounds.forEach(sound => {
      if (sound.key && sound.key.startsWith('bgm_')) {
        sound.setVolume(safeVolume);
      }
    });
  }
  
  /**
   * 効果音のボリューム設定
   * @param {number} volume - ボリューム値（0～1）
   */
  setSFXVolume(volume) {
    if (!this.scene || !this.scene.sound) return;
    
    // 値の範囲を確認
    const safeVolume = Math.max(0, Math.min(1, volume));
    
    // すべての効果音のボリュームを設定
    const sounds = this.scene.sound.sounds;
    sounds.forEach(sound => {
      if (sound.key && (sound.key.startsWith('sfx_') || sound.key.includes('-sfx'))) {
        sound.setVolume(safeVolume);
      }
    });
  }
  
  /**
   * 特定のサウンドが再生中かチェック
   * @param {string} type - サウンドタイプ
   * @param {string} subtype - サブタイプ
   * @returns {boolean} - 再生中かどうか
   */
  isSoundPlaying(type, subtype) {
    const key = this.getSoundKey(type, subtype);
    if (!key || !this.scene || !this.scene.sound) return false;
    
    // 再生中のサウンドをチェック
    const sounds = this.scene.sound.sounds;
    for (const sound of sounds) {
      if (sound.key === key && sound.isPlaying) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * サウンドループのマーカー設定
   * @param {string} type - サウンドタイプ
   * @param {string} subtype - サブタイプ
   * @param {string} markerName - マーカー名
   * @param {number} start - 開始位置（秒）
   * @param {number} duration - 長さ（秒）
   * @param {object} config - マーカー設定
   * @returns {boolean} - 成功したかどうか
   */
  addSoundMarker(type, subtype, markerName, start, duration, config = {}) {
    const key = this.getSoundKey(type, subtype);
    if (!key || !this.scene || !this.scene.sound) return false;
    
    try {
      // サウンドを取得
      let sound = null;
      const sounds = this.scene.sound.sounds;
      for (const s of sounds) {
        if (s.key === key) {
          sound = s;
          break;
        }
      }
      
      // サウンドが見つからない場合は新しく作成
      if (!sound) {
        sound = this.scene.sound.add(key);
      }
      
      // マーカーを追加
      sound.addMarker({
        name: markerName,
        start: start,
        duration: duration,
        config: config
      });
      
      return true;
    } catch (error) {
      console.error(`AssetManager: マーカー '${markerName}' をサウンド '${key}' に追加できませんでした`, error);
      return false;
    }
  }
  
  /**
   * サウンドマーカーの再生
   * @param {string} type - サウンドタイプ
   * @param {string} subtype - サブタイプ
   * @param {string} markerName - マーカー名
   * @param {object} config - 再生設定
   * @returns {Phaser.Sound.BaseSound|null} - サウンドオブジェクト、または失敗した場合はnull
   */
  playSoundMarker(type, subtype, markerName, config = {}) {
    const key = this.getSoundKey(type, subtype);
    if (!key || !this.scene || !this.scene.sound) return null;
    
    try {
      // サウンドを取得または作成
      let sound = null;
      const sounds = this.scene.sound.sounds;
      for (const s of sounds) {
        if (s.key === key) {
          sound = s;
          break;
        }
      }
      
      if (!sound) {
        sound = this.scene.sound.add(key);
      }
      
      // マーカーが存在するか確認
      if (!sound.markers || !sound.markers[markerName]) {
        console.warn(`AssetManager: マーカー '${markerName}' がサウンド '${key}' に見つかりません。`);
        return null;
      }
      
      // マーカーを再生
      sound.play(markerName, config);
      return sound;
    } catch (error) {
      console.error(`AssetManager: サウンド '${key}' のマーカー '${markerName}' の再生に失敗しました`, error);
      return null;
    }
  }
  
  /**
   * 現在のシーンを更新
   * @param {Phaser.Scene} scene - 新しいシーン
   */
  updateScene(scene) {
    if (!scene) return;
    
    this.scene = scene;
    
    // シーンが変わった場合でも、すでにスキャン済みのアセットはそのまま保持する
    // 必要に応じて新しいシーンのアセットをスキャン
    this.scanTextures(scene);
    this.scanAudio(scene);
    
    // MapLoaderのシーンも更新
    if (MapLoader && MapLoader.updateScene) {
      MapLoader.updateScene(scene);
    }
    
    // CharacterLoaderのシーンも更新
    if (this.characterLoader && this.characterLoader.updateScene) {
      this.characterLoader.updateScene(scene);
    }
  }
  
  /**
   * 全てのアセットをクリア
   */
  clearAll() {
    this.textures.clear();
    this.spritesheets.clear();
    this.audio.clear();
    this.tilesets.clear();
    
    // MapLoaderもクリア
    if (MapLoader && MapLoader.clearAll) {
      MapLoader.clearAll();
    }
    
    // CharacterLoaderもクリア
    if (this.characterLoader && this.characterLoader.clearAll) {
      this.characterLoader.clearAll();
    }
    
    this.integratedTilesets = null;
    this.tileWalkability = null;
  }

  /**
   * キャラクターのスプライトシートとアニメーションを作成
   * @param {Object} config - キャラクター設定
   * @returns {Object|null} 生成したアニメーション情報またはnull
   */
  createCharacterAnimations(config) {
    if (!this.characterLoader) {
      console.warn('AssetManager: CharacterLoaderが初期化されていません');
      return null;
    }
    
    return this.characterLoader.createCharacterAnimations(config);
  }

  /**
   * スプライトにアニメーションを設定
   * @param {Phaser.GameObjects.Sprite} sprite - アニメーションを設定するスプライト
   * @param {string} type - キャラクタータイプ ('player', 'enemy', 'npc', 'companion')
   * @param {string} subtype - サブタイプ ('warrior', 'skeleton' など)
   * @param {string} action - アクション ('idle', 'walk', 'attack' など)
   * @param {string} direction - 方向 ('down', 'left', 'right', 'up')
   * @returns {boolean} アニメーション設定が成功したかどうか
   */
  setCharacterAnimation(sprite, type, subtype, action, direction) {
    if (!this.characterLoader) {
      console.warn('AssetManager: CharacterLoaderが初期化されていません');
      return false;
    }
    
    return this.characterLoader.setAnimation(sprite, type, subtype, action, direction);
  }

  /**
   * キャラクタータイプに応じたテクスチャ名を取得
   * @param {string} classType - クラスタイプ
   * @returns {string} テクスチャ名
   */
  getClassTextureName(classType) {
    if (!this.characterLoader) {
      // フォールバック実装
      switch (classType) {
        case 'warrior':
        case 'fighter':
          return 'warrior';
        case 'rogue':
        case 'archer':
          return 'rogue';
        case 'mage':
        case 'sorcerer':
          return 'sorcerer';
        default:
          return 'warrior';
      }
    }
    
    return this.characterLoader.getClassTextureName(classType);
  }

  /**
   * キャラクタースプライトを作成
   * @param {Object} config - キャラクター設定
   * @returns {Phaser.GameObjects.Sprite|null} 作成したスプライトまたはnull
   */
  createCharacterSprite(config) {
    if (!this.characterLoader) {
      console.warn('AssetManager: CharacterLoaderが初期化されていません');
      return null;
    }
    
    return this.characterLoader.createCharacterSprite(config);
  }
  
  /**
   * アセット統計情報の取得
   * @returns {object} 統計情報
   */
  getStats() {
    return {
      textures: this.textures.size,
      spritesheets: this.spritesheets.size,
      audio: this.audio.size,
      tilesets: this.tilesets.size,
      initialized: this.initialized,
      placeholdersEnabled: isDebugMode && this.placeholders.initialized,
      integratedTilesetsReady: this.integratedTilesets !== null
    };
  }
  
  /**
   * アセット一覧を出力（デバッグ用）
   */
  printAssetList() {
    console.group('AssetManager: アセット一覧');
    
    console.log('=== テクスチャ ===');
    this.textures.forEach((value, key) => {
      console.log(`- ${key}`);
    });
    
    console.log('=== スプライトシート ===');
    this.spritesheets.forEach((value, key) => {
      console.log(`- ${key}`);
    });
    
    console.log('=== タイルセット ===');
    this.tilesets.forEach((value, key) => {
      console.log(`- ${key}`);
    });
    
    console.log('=== オーディオ ===');
    this.audio.forEach((value, key) => {
      console.log(`- ${key}`);
    });
    
    console.groupEnd();
  }
  
  /**
   * プレースホルダーを初期化
   * @param {Phaser.Scene} scene - Phaserシーン
   */
  initializePlaceholders(scene) {
    console.log('AssetManager: プレースホルダーを初期化中...');
    
    // 既に初期化されていれば何もしない
    if (this.placeholders.initialized) {
      return;
    }
    
    // PlaceholderAssetsの初期化
    if (PlaceholderAssets && typeof PlaceholderAssets.initialize === 'function') {
      PlaceholderAssets.initialize(scene);
    }
    
    // SimplePlaceholderAssetsの初期化
    if (SimplePlaceholderAssets && typeof SimplePlaceholderAssets.initialize === 'function') {
      SimplePlaceholderAssets.setDebugMode(true);
      SimplePlaceholderAssets.initialize(scene);
    }
    
    this.placeholders.initialized = true;
    console.log('AssetManager: プレースホルダーの初期化が完了しました');
  }
  
  /**
   * MapLoaderを初期化しタイルセットを準備
   * @param {Phaser.Scene} scene - Phaserシーン
   */
  initializeMapLoader(scene) {
    console.log('AssetManager: MapLoaderを初期化中...');
    
    // MapLoaderが存在し、まだ初期化されていない場合は初期化
    if (MapLoader && !MapLoader.initialized) {
      MapLoader.initialize(scene);
    }
    
    // タイルセットを準備
    this.prepareTilesets();
    
    console.log('AssetManager: MapLoaderの初期化が完了しました');
  }
  
  /**
   * タイルセットを準備
   * @returns {Object} 生成されたタイルセットの情報
   */
  prepareTilesets() {
    console.log('AssetManager: タイルセットを準備中...');
    
    // MapLoaderを使用してタイルセットを準備
    if (MapLoader && MapLoader.prepareTilesets) {
      const tilesets = MapLoader.prepareTilesets();
      
      // 統合タイルセットをセット
      this.setIntegratedTilesets(tilesets);
      
      // タイルの通行可能性情報を取得
      this.tileWalkability = MapLoader.tileWalkability;
      
      console.log('AssetManager: タイルセットの準備が完了しました');
      return this.integratedTilesets;
    } else {
      console.error('AssetManager: MapLoaderが利用できないため、タイルセットを準備できません');
      return null;
    }
  }

  /**
   * 統合タイルセットを準備
   * @param {Object} tilesets - MapLoaderから取得したタイルセット情報
   */
  setIntegratedTilesets(tilesets) {
    if (!tilesets) return;
    
    // タイルセットマップを更新
    if (tilesets.terrain) {
      this.tilesetMap.terrain = tilesets.terrain;
      this.registerTexture(this.tilesetMap.terrain, 'tileset');
    }
    
    if (tilesets.objects) {
      this.tilesetMap.objects = tilesets.objects;
      this.registerTexture(this.tilesetMap.objects, 'tileset');
    }
    
    // 壁タイルセットの更新 - 新規追加
    if (tilesets.walls) {
      this.tilesetMap.walls = tilesets.walls;
      this.registerTexture(this.tilesetMap.walls, 'tileset');
    }
    
    // integratedTilesetsプロパティも更新
    this.integratedTilesets = tilesets;
    
    console.log(`✅ 統合タイルセット設定完了（terrain: ${this.tilesetMap.terrain}, objects: ${this.tilesetMap.objects}, walls: ${this.tilesetMap.walls}）`);
  }
  
  /**
   * サウンドキーの取得
   * @param {string} type - サウンドタイプ（'bgm', 'sfx'など）
   * @param {string} subtype - サブタイプ（'main', 'attack'など）
   * @returns {string|null} - サウンドキー、または存在しない場合はnull
   */
  getSoundKey(type, subtype) {
    const typeMap = this.soundMap[type];
    if (!typeMap) {
      console.warn(`AssetManager: サウンドタイプ '${type}' が見つかりません。`);
      return null;
    }
    
    const soundKey = typeMap[subtype];
    if (!soundKey) {
      console.warn(`AssetManager: サウンドサブタイプ '${subtype}' が見つかりません。`);
      return null;
    }
    
    // サウンドの存在チェック
    if ((!this.audio.has(soundKey)) && this.scene && this.scene.cache && this.scene.cache.audio) {
      if (!this.scene.cache.audio.exists(soundKey)) {
        console.warn(`AssetManager: サウンド '${soundKey}' が見つかりません。プレースホルダーを生成します。`);
        
        // デバッグモードならプレースホルダーを生成
        if (isDebugMode) {
          this.generatePlaceholderAudio(type, subtype, soundKey);
        } else {
          return null;
        }
      } else {
        // キャッシュにはあるがマップにない場合はマップに追加
        this.registerAudio(soundKey);
      }
    }
    
    return soundKey;
  }
  
  /**
   * タイルセットの取得
   * @param {string} type - タイルセットタイプ ('terrain' または 'objects')
   * @returns {string|null} - タイルセットのキー、または存在しない場合はnull
   */
  getTilesetKey(type) {
    if (!this.tilesetMap) {
      console.warn('AssetManager: タイルセットマップが初期化されていません');
      return null;
    }
    
    return this.tilesetMap[type] || null;
  }

  /**
   * 全タイルセット情報を取得
   * @returns {Object} 統合タイルセット情報
   */
  getAllTilesets() {
    return {
      terrain: this.tilesetMap.terrain,
      objects: this.tilesetMap.objects,
      walls: this.tilesetMap.walls, // 壁タイルセットを追加
      indices: this.tileIndexMap,
      walkability: this.tileWalkability
    };
  }
  
  /**
   * タイルマッピングの取得
   * @returns {Object} タイルマッピング情報
   */
  getTileMapping() {
    return this.tileMapping;
  }
  
  /**
   * タイルの通行可能性情報の取得
   * @returns {Object} タイルの通行可能性情報
   */
  getTileWalkability() {
    return this.tileWalkability;
  }
  
  /**
   * テクスチャキーからインデックスを取得
   * @param {string} key - テクスチャキー
   * @returns {number|null} タイルインデックス
   */
  getTileIndexFromKey(key) {
    return this.tileMapping[key] !== undefined ? this.tileMapping[key] : null;
  }
  
  /**
   * テクスチャの取得（Spriteの作成用）
   * @param {string} type - オブジェクトタイプ
   * @param {string} subtype - サブタイプ
   * @returns {Phaser.Textures.Texture|null} - テクスチャ、または存在しない場合はnull
   */
  getTexture(type, subtype) {
    const key = this.getTextureKey(type, subtype);
    if (!key || !this.scene) return null;
    
    return this.scene.textures.get(key);
  }
  
  /**
   * テクスチャキーから直接テクスチャを取得
   * @param {string} key - テクスチャキー
   * @returns {Phaser.Textures.Texture|null} - テクスチャ、または存在しない場合はnull
   */
  getTextureByKey(key) {
    if (!key || !this.scene) return null;
    
    // テクスチャが存在するかチェック
    if (!this.textures.has(key) && !this.spritesheets.has(key) && !this.tilesets.has(key)) {
      // デバッグモードならプレースホルダーを返す
      if (isDebugMode && PlaceholderAssets) {
        const placeholderKey = PlaceholderAssets.getTexture(this.scene, key);
        this.registerTexture(placeholderKey);
        return this.scene.textures.get(placeholderKey);
      }
      return null;
    }
    
    return this.scene.textures.get(key);
  }
  
  /**
   * アニメーションの設定
   * @param {Phaser.GameObjects.Sprite} sprite - アニメーションを設定するスプライト
   * @param {string} type - オブジェクトタイプ
   * @param {string} subtype - サブタイプ
   * @param {string} action - アクション
   * @returns {boolean} - 成功したかどうか
   */
  setAnimation(sprite, type, subtype, action) {
    const key = this.getAnimationKey(type, subtype, action);
    if (!key || !sprite) return false;
    
    sprite.play(key);
    return true;
  }
  
  /**
   * サウンドの再生
   * @param {string} type - サウンドタイプ ('bgm', 'sfx' など)
   * @param {string} subtype - サブタイプ ('main', 'attack' など)
   * @param {object} config - サウンド設定
   * @returns {Phaser.Sound.BaseSound|null} - サウンドオブジェクト、または失敗した場合はnull
   */
  playSound(type, subtype, config = {}) {
    const key = this.getSoundKey(type, subtype);
    if (!key) return null;
    
    try {
      // サウンドキャッシュの存在チェック
      const soundExists = this.scene && this.scene.cache.audio && this.scene.cache.audio.exists(key);
      
      if (!soundExists) {
        console.warn(`AssetManager: サウンド '${key}' がキャッシュに見つかりません。プレースホルダーを直接再生します。`);
        
        // デバッグモードでプレースホルダーを直接再生
        if (isDebugMode) {
          return this.playPlaceholderSound(type, subtype) ? { isPlaceholder: true } : null;
        }
        
        return null;
      }
      
      // 以下は既存の実装と同じ
      const defaultConfig = {
        volume: type === 'bgm' ? 0.5 : 0.8,
        loop: type === 'bgm',
        rate: 1.0,
        detune: 0,
        seek: 0,
        delay: 0,
        mute: false
      };
      
      const mergedConfig = { ...defaultConfig, ...config };
      const sound = this.scene.sound.add(key, mergedConfig);
      sound.play();
      
      if (type === 'sfx') {
        sound.once('complete', () => {
          sound.destroy();
        });
      }
      
      if (type === 'bgm') {
        this.audio.set(`playing_${key}`, sound);
      }
      
      return sound;
      
    } catch (error) {
      console.error(`AssetManager: サウンド '${key}' の再生に失敗しました。プレースホルダーを試みます。`, error);
      
      // エラー時にプレースホルダーを直接再生
      if (isDebugMode) {
        return this.playPlaceholderSound(type, subtype) ? { isPlaceholder: true } : null;
      }
      
      return null;
    }
  }
  
  /**
   * BGMの再生（既存のBGMを停止して新しいBGMを再生）
   * @param {string} subtype - BGMのサブタイプ
   * @param {object} config - サウンド設定
   * @returns {Phaser.Sound.BaseSound|null} - サウンドオブジェクト、または失敗した場合はnull
   */
  playBGM(subtype, config = {}) {
    // 既存のBGM停止
    this.stopBGM();
    
    // デフォルト設定
    const defaultConfig = {
      volume: 0.5,
      loop: true,
      fade: false,
      fadeInDuration: 1000 // ミリ秒
    };
    
    // ユーザー設定とデフォルト設定をマージ
    const mergedConfig = { ...defaultConfig, ...config };
    
    // フェードイン設定を取り出す
    const fade = mergedConfig.fade;
    const fadeInDuration = mergedConfig.fadeInDuration;
    delete mergedConfig.fade;
    delete mergedConfig.fadeInDuration;
    
    // BGM再生
    const bgm = this.playSound('bgm', subtype, mergedConfig);
    
    if (bgm && fade && this.scene && this.scene.tweens) {
      // 初期ボリュームを0に設定してフェードイン
      const targetVolume = bgm.volume;
      bgm.setVolume(0);
      this.scene.tweens.add({
        targets: bgm,
        volume: targetVolume,
        duration: fadeInDuration,
        ease: 'Linear'
      });
    }
    
    return bgm;
  }
  
  /**
   * 現在再生中のBGMを停止
   * @param {boolean} fadeOut - フェードアウトするかどうか
   * @param {number} duration - フェードアウト時間（ミリ秒）
   */
  stopBGM(fadeOut = false, duration = 1000) {
    if (!this.scene || !this.scene.sound) return;
    
    // 再生中のBGMを検索
    const playingBGMs = [];
    this.audio.forEach((sound, key) => {
      if (key.startsWith('playing_bgm_')) {
        playingBGMs.push(sound);
      }
    });
    
    // 各BGMを停止
    playingBGMs.forEach(sound => {
      if (fadeOut && sound.isPlaying && this.scene.tweens) {
        // フェードアウト後に停止
        this.scene.tweens.add({
          targets: sound,
          volume: 0,
          duration: duration,
          ease: 'Linear',
          onComplete: () => {
            sound.stop();
            sound.destroy();
          }
        });
      } else {
        // 即座に停止
        sound.stop();
        sound.destroy();
      }
      
      // マップから削除
      this.audio.delete(`playing_${sound.key}`);
    });
    
    // バックアップ：キーによる停止（BGMプレフィックスのサウンドをすべて停止）
    const sounds = this.scene.sound.sounds;
    sounds.forEach(sound => {
      if (sound.key.startsWith('bgm_')) {
        if (fadeOut && sound.isPlaying && this.scene.tweens) {
          // フェードアウト後に停止
          this.scene.tweens.add({
            targets: sound,
            volume: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
              sound.stop();
            }
          });
        } else {
          // 即座に停止
          sound.stop();
        }
      }
    });
  }
  
  /**
   * 特定の効果音の再生
   * @param {string} subtype - 効果音のサブタイプ
   * @param {object} config - サウンド設定
   * @returns {Phaser.Sound.BaseSound|null} - サウンドオブジェクト、または失敗した場合はnull
   */
  playSFX(subtype, config = {}) {
    return this.playSound('sfx', subtype, config);
  }
  
  /**
   * すべてのサウンドを停止
   * @param {boolean} fadeOut - フェードアウトするかどうか
   * @param {number} duration - フェードアウト時間（ミリ秒）
   */
  stopAllSounds(fadeOut = false, duration = 500) {
    if (!this.scene || !this.scene.sound) return;
    
    if (fadeOut && this.scene.tweens) {
      // すべてのサウンドをフェードアウト
      const sounds = this.scene.sound.sounds;
      sounds.forEach(sound => {
        if (sound.isPlaying) {
          this.scene.tweens.add({
            targets: sound,
            volume: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
              sound.stop();
            }
          });
        }
      });
      
      // 少し待ってから完全停止
      this.scene.time.delayedCall(duration, () => {
        this.scene.sound.stopAll();
      });
    } else {
      // 即座にすべて停止
      this.scene.sound.stopAll();
    }
    
    // マップをクリア（再生中のBGM記録）
    this.audio.forEach((value, key) => {
      if (key.startsWith('playing_')) {
        this.audio.delete(key);
      }
    });
  }
  
  /**
   * プレースホルダーオーディオを生成してキャッシュに追加
   * @param {string} type - オーディオタイプ ('bgm' または 'sfx')
   * @param {string} subtype - サブタイプ ('attack', 'spell' など)
   * @param {string} key - キャッシュに登録するキー名
   * @returns {boolean} 生成に成功したかどうか
   */
  generatePlaceholderAudio(type, subtype, key) {
    if (!this.scene || !isDebugMode) return false;
    
    try {
      // AudioContextを取得
      const audioContext = this.scene.sound.context;
      if (!audioContext) {
        console.warn(`AudioContextが利用できないため、プレースホルダー ${key} を作成できません`);
        return false;
      }
      
      // バッファの生成
      let audioBuffer;
      
      if (type === 'bgm') {
        audioBuffer = this.generateBgmBuffer(audioContext);
      } else {
        audioBuffer = this.generateSfxBuffer(audioContext, subtype);
      }
      
      if (!audioBuffer) return false;
      
      // WAVファイル形式のBlobに変換
      const wavBlob = this.audioBufferToWav(audioBuffer);
      
      // BlobからURLを作成
      const blobUrl = URL.createObjectURL(wavBlob);
      
      // キーが既に存在する場合は削除
      if (this.scene.cache.audio.exists(key)) {
        this.scene.cache.audio.remove(key);
      }
      
      // URLからオーディオをキャッシュに追加
      this.scene.sound.addAudioSprite(key, {
        spritemap: {
          [key]: {
            start: 0,
            end: audioBuffer.duration * 1000, // ミリ秒単位
            loop: type === 'bgm'
          }
        },
        url: blobUrl
      });
      
      // audioマップに登録
      this.registerAudio(key);
      
      console.log(`🔊 プレースホルダーオーディオを生成: ${key} (${type}/${subtype})`);
      return true;
    } catch (error) {
      console.error(`プレースホルダーオーディオ生成エラー (${key}):`, error);
      return false;
    }
  }
  
  /**
   * BGM用バッファを生成
   * @param {AudioContext} audioContext - Web Audio API のコンテキスト
   * @returns {AudioBuffer} 生成したオーディオバッファ
   */
  generateBgmBuffer(audioContext) {
    // 2秒間の音声バッファを作成
    const sampleRate = audioContext.sampleRate;
    const duration = 2.0;
    const frameCount = sampleRate * duration;
    
    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // 単純な低音のサイン波を生成（BGM用）
    for (let i = 0; i < frameCount; i++) {
      // 低音のサイン波（110Hz程度）
      const oscillation = Math.sin(i * 2 * Math.PI * 110 / sampleRate);
      // 音量を下げる（0.1程度）
      channelData[i] = oscillation * 0.1;
    }
    
    // エンベロープ（音の変化）をつける
    this.applyEnvelope(channelData, sampleRate);
    
    return audioBuffer;
  }
  
  /**
   * SFX用バッファを生成
   * @param {AudioContext} audioContext - Web Audio API のコンテキスト
   * @param {string} sfxType - 効果音タイプ
   * @returns {AudioBuffer} 生成したオーディオバッファ
   */
  generateSfxBuffer(audioContext, sfxType) {
    // 0.3秒の短い音声バッファを作成
    const sampleRate = audioContext.sampleRate;
    const duration = 0.3;
    const frameCount = sampleRate * duration;
    
    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // 効果音タイプに基づいて音を生成
    let frequency = 440; // デフォルト周波数
    
    switch (sfxType) {
      case 'attack':
        // 攻撃音（強めで少し唸る）
        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;
          // 周波数を時間と共に変化させる
          const currentFreq = 300 - 150 * time;
          const oscillation = Math.sin(i * 2 * Math.PI * currentFreq / sampleRate);
          channelData[i] = oscillation * Math.exp(-3 * time);
        }
        break;
        
      case 'spell':
        // 魔法音（うねる高音）
        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;
          // うねりのある高音
          const currentFreq = 600 + 300 * Math.sin(time * 20);
          const oscillation = Math.sin(i * 2 * Math.PI * currentFreq / sampleRate);
          channelData[i] = oscillation * Math.exp(-2 * time);
        }
        break;
        
      case 'item':
        // アイテム音（明るく軽い）
        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;
          // 上昇する音
          const currentFreq = 440 + 400 * time;
          const oscillation = Math.sin(i * 2 * Math.PI * currentFreq / sampleRate);
          channelData[i] = oscillation * Math.exp(-4 * time);
        }
        break;
        
      case 'click':
        // クリック音（短く鋭い）
        frequency = 880;
        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;
          const oscillation = Math.sin(i * 2 * Math.PI * frequency / sampleRate);
          // 急速に減衰する音
          channelData[i] = oscillation * Math.exp(-10 * time);
        }
        break;
        
      case 'hover':
        // ホバー音（やや柔らかい）
        frequency = 440;
        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;
          const oscillation = Math.sin(i * 2 * Math.PI * frequency / sampleRate);
          // やや緩やかに減衰
          channelData[i] = oscillation * Math.exp(-5 * time);
        }
        break;
        
      case 'game_over':
        // ゲームオーバー音（下降する低音）
        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;
          // 下降する周波数
          const currentFreq = 300 * (1 - time / duration);
          const oscillation = Math.sin(i * 2 * Math.PI * currentFreq / sampleRate);
          channelData[i] = oscillation * Math.exp(-2 * time);
        }
        break;
        
      default:
        // その他のデフォルト効果音
        for (let i = 0; i < frameCount; i++) {
          const time = i / sampleRate;
          const oscillation = Math.sin(i * 2 * Math.PI * frequency / sampleRate);
          channelData[i] = oscillation * Math.exp(-7 * time);
        }
    }
    
    return audioBuffer;
  }
  
  /**
   * 音声にエンベロープを適用（音の変化をよりなめらかに）
   * @param {Float32Array} channelData - 音声データ
   * @param {number} sampleRate - サンプルレート
   */
  applyEnvelope(channelData, sampleRate) {
    const fadeInTime = 0.05; // フェードイン時間（秒）
    const fadeOutTime = 0.1;  // フェードアウト時間（秒）
    
    const fadeInSamples = Math.floor(fadeInTime * sampleRate);
    const fadeOutSamples = Math.floor(fadeOutTime * sampleRate);
    
    // フェードイン
    for (let i = 0; i < fadeInSamples; i++) {
      const factor = i / fadeInSamples;
      channelData[i] *= factor;
    }
    
    // フェードアウト
    const fadeOutStart = channelData.length - fadeOutSamples;
    for (let i = 0; i < fadeOutSamples; i++) {
      const factor = 1 - (i / fadeOutSamples);
      channelData[fadeOutStart + i] *= factor;
    }
  }
  
  /**
   * AudioBufferをWAVファイル形式のBlobに変換
   * @param {AudioBuffer} audioBuffer - 音声バッファ
   * @returns {Blob} WAVファイル形式のBlob
   */
  audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    // サンプルデータを取得
    const channelData = [];
    for (let channel = 0; channel < numChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }
    
    // WAVファイルのヘッダーとデータ部分を作成
    const dataLength = channelData[0].length * numChannels * (bitDepth / 8);
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    
    // WAVヘッダーの書き込み
    // "RIFF"
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    
    // ファイルサイズからRIFFチャンクサイズを計算
    view.setUint32(4, 36 + dataLength, true);
    
    // "WAVE"
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));
    
    // "fmt "チャンク
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    
    // fmtチャンクのサイズ (16)
    view.setUint32(16, 16, true);
    // フォーマット (1 = PCM)
    view.setUint16(20, format, true);
    // チャンネル数
    view.setUint16(22, numChannels, true);
    // サンプルレート
    view.setUint32(24, sampleRate, true);
    // バイトレート (サンプルレート * チャンネル数 * ビット深度 / 8)
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    // ブロックアライン (チャンネル数 * ビット深度 / 8)
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    // ビット深度
    view.setUint16(34, bitDepth, true);
    
    // "data"チャンク
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    
    // データ長
    view.setUint32(40, dataLength, true);
    
    // サンプルデータの書き込み
    let offset = 44;
    for (let i = 0; i < channelData[0].length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        let value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, value, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  /**
   * 初期デフォルトサウンドの生成
   */
  generateDefaultSounds() {
    if (!this.scene || !isDebugMode) return;
    
    console.log('🔊 デフォルトサウンドを初期化中...');
    
    // SFXの定義
    const sfxList = [
      { key: 'sfx_attack', type: 'sfx', subtype: 'attack' },
      { key: 'sfx_spell', type: 'sfx', subtype: 'spell' },
      { key: 'sfx_item', type: 'sfx', subtype: 'item' },
      { key: 'click-sfx', type: 'sfx', subtype: 'click' },
      { key: 'hover-sfx', type: 'sfx', subtype: 'hover' },
      { key: 'game_over', type: 'sfx', subtype: 'game_over' }
    ];
    
    // BGMの定義
    const bgmList = [
      { key: 'bgm_main', type: 'bgm', subtype: 'main' },
      { key: 'bgm_battle', type: 'bgm', subtype: 'battle' },
      { key: 'bgm_town', type: 'bgm', subtype: 'town' }
    ];
    
    // サウンドを生成
    [...sfxList, ...bgmList].forEach(sound => {
      // キャッシュにすでに存在するかチェック
      if (this.scene.cache.audio && this.scene.cache.audio.exists(sound.key)) {
        return;
      }
      
      // プレースホルダー生成
      this.generatePlaceholderAudio(sound.type, sound.subtype, sound.key);
    });
    
    console.log('✅ デフォルトサウンド初期化完了');
  }
  
  
  /**
   * マップデータを準備
   * @param {Object} mapData - 元のマップデータ
   * @returns {Object} 変換されたマップデータ
   */
  prepareMapData(mapData) {
    console.log('AssetManager: マップデータを準備中...');
    
    // MapLoaderを使用してマップデータを準備
    if (MapLoader && MapLoader.prepareMapData) {
      const preparedData = MapLoader.prepareMapData(mapData);
      
      // タイルセット情報を更新
      if (preparedData && preparedData.tilesets) {
        this.setIntegratedTilesets(preparedData.tilesets);
        this.tileWalkability = preparedData.tileWalkability;
      }
      
      console.log('AssetManager: マップデータの準備が完了しました');
      return preparedData;
    } else {
      console.error('AssetManager: MapLoaderが利用できないため、マップデータを準備できません');
      return mapData;
    }
  }
  
  /**
   * TopDownMapインスタンスにタイルセットを適用
   * @param {TopDownMap} topDownMap - TopDownMapインスタンス
   * @returns {boolean} 成功したかどうか
   */
  applyTilesetsToMap(topDownMap) {
    console.log('AssetManager: タイルセットをマップに適用中...');
    
    // MapLoaderを使用してタイルセットをマップに適用
    if (MapLoader && MapLoader.applyTilesetsToMap) {
      const result = MapLoader.applyTilesetsToMap(topDownMap);
      
      // 成功した場合、タイルセット情報を更新
      if (result && topDownMap.integratedTilesets) {
        this.integratedTilesets = topDownMap.integratedTilesets;
        this.tileWalkability = topDownMap.tileWalkability;
      }
      
      console.log('AssetManager: タイルセットの適用が完了しました');
      return result;
    } else {
      console.error('AssetManager: MapLoaderが利用できないため、タイルセットを適用できません');
      return false;
    }
  }
  
  /**
   * シーンのテクスチャをスキャンして登録
   * @param {Phaser.Scene} scene - Phaserシーン
   */
  scanTextures(scene) {
    if (!scene || !scene.textures) return;
    
    const textureKeys = scene.textures.getTextureKeys();
    
    textureKeys.forEach(key => {
      // __MISSING, __DEFAULT等の特殊テクスチャは除外
      if (!key.startsWith('__')) {
        // プレフィックスに基づいて分類
        if (key.startsWith('player_') || 
            key.startsWith('enemy_') || 
            key.startsWith('npc_') || 
            key.startsWith('tile_') || 
            key.startsWith('obstacle_') || 
            key.startsWith('item_') || 
            key.startsWith('ui_') || 
            key.startsWith('effect_')) {
          this.textures.set(key, key);
        } else if (key.endsWith('_sheet')) {
          this.spritesheets.set(key, key);
        } else if (key.startsWith('tileset_')) {
          this.tilesets.set(key, key);
        }
      }
    });
  }
  
  /**
   * シーンのオーディオをスキャンして登録
   * @param {Phaser.Scene} scene - Phaserシーン
   */
  scanAudio(scene) {
    if (!scene || !scene.sound || !scene.cache.audio) return;
    
    const audioKeys = scene.cache.audio.entries.keys();
    
    for (const key of audioKeys) {
      if (key.startsWith('bgm_') || 
          key.startsWith('sfx_') || 
          key.includes('-sfx') || 
          key === 'game_over') {
        this.audio.set(key, key);
      }
    }
  }
  
  /**
   * アセットが存在するかどうかをチェック
   * @param {string} key - アセットキー
   * @param {string} type - アセットタイプ ('texture', 'spritesheet', 'audio', 'tileset')
   * @returns {boolean} 存在するかどうか
   */
  hasAsset(key, type = 'texture') {
    switch (type) {
      case 'texture':
        return this.textures.has(key);
      case 'spritesheet':
        return this.spritesheets.has(key);
      case 'audio':
        return this.audio.has(key);
      case 'tileset':
        return this.tilesets.has(key);
      default:
        return false;
    }
  }
  
  /**
   * テクスチャを登録
   * @param {string} key - テクスチャキー
   * @param {string} type - テクスチャタイプ ('texture', 'spritesheet', 'tileset')
   */
  registerTexture(key, type = 'texture') {
    if (!key) return;
    
    switch (type) {
      case 'texture':
        if (!this.textures.has(key)) {
          this.textures.set(key, key);
        }
        break;
      case 'spritesheet':
        if (!this.spritesheets.has(key)) {
          this.spritesheets.set(key, key);
        }
        break;
      case 'tileset':
        if (!this.tilesets.has(key)) {
          this.tilesets.set(key, key);
        }
        break;
    }
  }
  
  /**
   * オーディオを登録
   * @param {string} key - オーディオキー
   */
  registerAudio(key) {
    if (!key) return;
    
    if (!this.audio.has(key)) {
      this.audio.set(key, key);
    }
  }
  
  /**
   * テクスチャキーの取得
   * @param {string} type - オブジェクトタイプ（'player', 'enemy'など）
   * @param {string} subtype - サブタイプ（'warrior', 'skeleton'など）
   * @returns {string|null} - テクスチャキー、または存在しない場合はnull
   */
  getTextureKey(type, subtype) {
    const typeMap = this.textureMap[type];
    if (!typeMap) return this.getPlaceholderTexture(type, subtype);
    
    const textureKey = typeMap[subtype];
    if (!textureKey) return this.getPlaceholderTexture(type, subtype);
    
    // テクスチャの存在チェック
    if (!this.textures.has(textureKey)) {
      console.warn(`AssetManager: テクスチャ '${textureKey}' が見つかりません。プレースホルダーを使用します。`);
      
      // デバッグモードならプレースホルダーを使用
      if (isDebugMode && this.scene) {
        return this.getPlaceholderTexture(type, subtype);
      }
      
      return null;
    }
    
    return textureKey;
  }
  
  /**
   * 統合タイルセットのテクスチャキーとインデックスの取得
   * @param {string} type - タイプ ('tile', 'object')
   * @param {string} subtype - サブタイプ ('grass', 'tree'など)
   * @returns {Object|null} - テクスチャキーとインデックス、または存在しない場合はnull
   */
  getIntegratedTextureInfo(type, subtype) {
    // 統合タイルセットが初期化されていない場合はnullを返す
    if (!this.integratedTilesets) {
      return null;
    }
    
    let key;
    let index;
    
    // タイプに基づいてキーを決定
    if (type === 'tile') {
      key = this.integratedTilesets.terrain;
      const tileKey = `tile_${subtype}`;
      index = this.tileMapping[tileKey];
    } else if (type === 'object') {
      key = this.integratedTilesets.objects;
      let objectKey;
      
      if (subtype === 'chest') {
        objectKey = 'item_chest';
      } else {
        objectKey = `obstacle_${subtype}`;
      }
      
      index = this.tileMapping[objectKey];
    } else if (type === 'wall') { // 壁タイルの処理を追加
      key = this.integratedTilesets.walls;
      const wallKey = `wall_${subtype}`;
      index = this.tileMapping[wallKey];
    } else {
      return null;
    }
    
    // キーとインデックスが見つからない場合はnullを返す
    if (!key || index === undefined) {
      return null;
    }
    
    return { key, index };
  }
  
  /**
   * プレースホルダーテクスチャを取得
   * @param {string} type - オブジェクトタイプ
   * @param {string} subtype - サブタイプ
   * @returns {string|null} プレースホルダーテクスチャキー
   */
  getPlaceholderTexture(type, subtype) {
    if (!this.scene || !isDebugMode) return null;
    
    let placeholderKey = null;
  
    // プレースホルダーキーの命名規則をAssetManagerのキー構造に合わせる
    switch (type) {
      case 'player':
        placeholderKey = `player_${subtype}`;
        break;
      case 'companion':
        placeholderKey = `companion_${subtype}`;
        break;
      case 'enemy':
        placeholderKey = `enemy_${subtype}`;
        break;
      case 'npc':
        placeholderKey = `npc_${subtype}`;
        break;
      case 'tile':
        placeholderKey = `tile_${subtype}`;
        break;
      case 'obstacle':
        placeholderKey = `obstacle_${subtype}`;
        break;
      case 'item':
        placeholderKey = `item_${subtype}`;
        break;
      case 'wall': // 壁タイプの処理を追加
        placeholderKey = `wall_${subtype}`;
        break;
      case 'ui':
        placeholderKey = `ui_${subtype}`;
        break;
      case 'effect':
        placeholderKey = `effect_${subtype}`;
        break;
      default:
        placeholderKey = `${type}_${subtype}`;
    }
    
    // PlaceholderAssetsを使用
    if (PlaceholderAssets) {
      // PlaceholderAssetsがテクスチャを持っているか確認
      if (PlaceholderAssets.hasTexture(this.scene, placeholderKey)) {
        this.registerTexture(placeholderKey);
        return placeholderKey;
      }
      
      // キーに基づいてプレースホルダーを生成
      // (fallbackGetTextureはsceneとキーをそのまま渡す)
      const fallbackKey = PlaceholderAssets.getFallbackTexture(this.scene, type);
      if (fallbackKey) {
        this.registerTexture(fallbackKey);
        return fallbackKey;
      }
      
      // 基本的なプレースホルダー（色付き矩形）を作成する場合
      const fallbackColors = {
        player: 0x00FF00,  // 緑
        enemy: 0xFF0000,   // 赤
        npc: 0x0000FF,     // 青
        companion: 0x00FFFF, // シアン
        tile: 0x888888,    // グレー
        obstacle: 0x8B4513, // 茶色
        wall: 0x696969,    // 暗いグレー（壁用に追加）
        item: 0xFFFF00,    // 黄色
        ui: 0x333333,      // 暗いグレー
        effect: 0xFFFFFF   // 白
      };
      
      const color = fallbackColors[type] || 0xFFFFFF;
      const size = type === 'item' ? 16 : 32;
      
      // PlaceholderAssetsを使用して単色矩形または適切な壁タイルを作成
      if (typeof PlaceholderAssets.createColorRect === 'function') {
        if (type === 'wall' && typeof PlaceholderAssets.createWallTile === 'function') {
          // 壁タイプの場合は専用の壁タイル生成メソッドを使用
          PlaceholderAssets.createWallTile(this.scene, placeholderKey, color, subtype);
        } else {
          // それ以外は通常の色付き矩形を作成
          PlaceholderAssets.createColorRect(this.scene, placeholderKey, size, size, color);
        }
        this.registerTexture(placeholderKey);
        console.log(`🎨 プレースホルダー生成: ${placeholderKey}`);
        return placeholderKey;
      }
    }
    
    return null;
  }
  
  /**
   * 特定の高さ値からテクスチャ情報を取得する
   * @param {number} heightValue - 高さ値（0.0～1.0）
   * @returns {Object} テクスチャキーとインデックスを含むオブジェクト
   */
  getTextureFromHeight(heightValue) {
    // 統合タイルセットを使用する場合
    if (this.integratedTilesets) {
      return this.getTerrainFromHeight(heightValue);
    }
    
    // 従来の処理として残す（後方互換性のため）
    let subtype;
    
    if (heightValue < 0.3) {
      subtype = 'water'; // 低い地形（水域）- 通行不可
    } else if (heightValue < 0.5) {
      subtype = 'grass'; // 中程度の地形（草原）
    } else if (heightValue < 0.7) {
      subtype = 'dirt';  // 中高地形（土）
    } else if (heightValue < 0.85) {
      subtype = 'stone'; // 高地形（石）
    } else {
      subtype = 'snow';  // 最高地（雪）
    }
    
    // 個別テクスチャを使用する場合
    return {
      key: `tile_${subtype}`,
      index: 0,
      type: subtype,
      walkable: subtype !== 'water' && subtype !== 'lava'
    };
  }
  
  /**
   * オブジェクトタイプからテクスチャ情報を取得する
   * @param {number} objectType - MapGeneratorのオブジェクトタイプ（0=空き、2=宝箱、3=障害物）
   * @returns {Object|null} テクスチャ情報または null
   */
  getObjectTexture(objectType) {
    let type, subtype;
    
    // MapGeneratorのオブジェクトタイプに基づいてタイプとサブタイプを決定
    switch (objectType) {
      case 2: // 宝箱
        type = 'item';
        subtype = 'chest';
        break;
      case 3: // 障害物 - ランダムな障害物タイプを選択
        type = 'obstacle';
        const obstacleTypes = ['tree', 'rock', 'bush', 'crate'];
        subtype = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        break;
      case 4: // 壁 - ランダムな壁タイプを選択（新規追加）
        type = 'wall';
        const wallTypes = ['stone', 'brick', 'wood', 'ice', 'metal'];
        subtype = wallTypes[Math.floor(Math.random() * wallTypes.length)];
        break;
      default:
        return null;
    }
    
    // 統合タイルセットを使用する場合
    if (this.integratedTilesets) {
      if (type === 'item') {
        return this.getIntegratedTextureInfo('object', 'chest');
      } else if (type === 'obstacle') {
        return this.getIntegratedTextureInfo('object', subtype);
      } else if (type === 'wall') { // 壁タイルの処理を追加
        return this.getIntegratedTextureInfo('wall', subtype);
      }
    }
    
    // 個別テクスチャを使用する場合
    return this.getTextureKey(type, subtype);
  }
  
  /**
   * アニメーションキーの取得
   * @param {string} type - オブジェクトタイプ（'player', 'enemy'など）
   * @param {string} subtype - サブタイプ（'warrior', 'skeleton'など）
   * @param {string} action - アクション（'idle', 'walk'など）
   * @returns {string|null} - アニメーションキー、または存在しない場合はnull
   */
  getAnimationKey(type, subtype, action) {
    const typeMap = this.animationMap[type];
    if (!typeMap) return null;
    
    const subtypeMap = typeMap[subtype];
    if (!subtypeMap) return null;
    
    const animKey = subtypeMap[action];
    if (!animKey) return null;
    
    // アニメーションの存在チェック
    if (this.scene && this.scene.anims && !this.scene.anims.exists(animKey)) {
      console.warn(`AssetManager: アニメーション '${animKey}' が見つかりません。`);
      return null;
    }
    
    return animKey;
  }
  
  /**
   * サウンドキーの取得
   * @param {string} type - サウンドタイプ（'bgm', 'sfx'など）
   * @param {string} subtype - サブタイプ（'main', 'attack'など）
   * @returns {string|null} - サウンドキー、または存在しない場合はnull
   */
  getSoundKey(type, subtype) {
    const typeMap = this.soundMap[type];
    if (!typeMap) {
      console.warn(`AssetManager: サウンドタイプ '${type}' が見つかりません。`);
      return null;
    }
    
    const soundKey = typeMap[subtype];
    if (!soundKey) {
      console.warn(`AssetManager: サウンドサブタイプ '${subtype}' が見つかりません。`);
      return null;
    }
    
    // サウンドの存在チェック
    if ((!this.audio.has(soundKey)) && this.scene && this.scene.cache && this.scene.cache.audio) {
      if (!this.scene.cache.audio.exists(soundKey)) {
        console.warn(`AssetManager: サウンド '${soundKey}' が見つかりません。プレースホルダーを生成します。`);
        
        // デバッグモードならプレースホルダーを生成
        if (isDebugMode) {
          this.generatePlaceholderAudio(type, subtype, soundKey);
        } else {
          return null;
        }
      } else {
        // キャッシュにはあるがマップにない場合はマップに追加
        this.registerAudio(soundKey);
      }
    }
    
    return soundKey;
  }
  
  /**
   * タイルセットの取得
   * @param {string} type - タイルセットタイプ ('terrain', 'objects')
   * @returns {string|null} - タイルセットキー、または存在しない場合はnull
   */
  getTilesetKey(type) {
    if (!this.integratedTilesets) {
      console.warn('AssetManager: 統合タイルセットが初期化されていません');
      return null;
    }
    
    let key = null;
    
    switch (type) {
      case 'terrain':
        key = this.integratedTilesets.terrain;
        break;
      case 'objects':
        key = this.integratedTilesets.objects;
        break;
      case 'walls': // 壁タイルセットを追加
        key = this.integratedTilesets.walls;
        break;
      default:
        console.warn(`AssetManager: 不明なタイルセットタイプ '${type}'`);
        return null;
    }
    
    // タイルセットの存在チェック
    if (!this.tilesets.has(key) && this.scene && this.scene.textures) {
      if (!this.scene.textures.exists(key)) {
        console.warn(`AssetManager: タイルセット '${key}' が見つかりません。`);
        return null;
      } else {
        // テクスチャには存在するがマップに登録されていない場合は登録
        this.registerTexture(key, 'tileset');
      }
    }
    
    return key;
  }
  
  /**
   * タイルマッピングの取得
   * @returns {Object} タイルマッピング情報
   */
  getTileMapping() {
    return this.tileMapping;
  }
  
  /**
   * タイルの通行可能性情報の取得
   * @returns {Object} タイルの通行可能性情報
   */
  getTileWalkability() {
    return this.tileWalkability;
  }
  
  
  /**
   * テクスチャの取得（Spriteの作成用）
   * @param {string} type - オブジェクトタイプ
   * @param {string} subtype - サブタイプ
   * @returns {Phaser.Textures.Texture|null} - テクスチャ、または存在しない場合はnull
   */
  getTexture(type, subtype) {
    const key = this.getTextureKey(type, subtype);
    if (!key || !this.scene) return null;
    
    return this.scene.textures.get(key);
  }
  
  /**
   * テクスチャキーから直接テクスチャを取得
   * @param {string} key - テクスチャキー
   * @returns {Phaser.Textures.Texture|null} - テクスチャ、または存在しない場合はnull
   */
  getTextureByKey(key) {
    if (!key || !this.scene) return null;
    
    // テクスチャが存在するかチェック
    if (!this.textures.has(key) && !this.spritesheets.has(key) && !this.tilesets.has(key)) {
      // デバッグモードならプレースホルダーを返す
      if (isDebugMode && PlaceholderAssets) {
        const placeholderKey = PlaceholderAssets.getTexture(this.scene, key);
        this.registerTexture(placeholderKey);
        return this.scene.textures.get(placeholderKey);
      }
      return null;
    }
    
    return this.scene.textures.get(key);
  }
  
  /**
   * アニメーションの設定
   * @param {Phaser.GameObjects.Sprite} sprite - アニメーションを設定するスプライト
   * @param {string} type - オブジェクトタイプ
   * @param {string} subtype - サブタイプ
   * @param {string} action - アクション
   * @returns {boolean} - 成功したかどうか
   */
  setAnimation(sprite, type, subtype, action) {
    const key = this.getAnimationKey(type, subtype, action);
    if (!key || !sprite) return false;
    
    sprite.play(key);
    return true;
  }
  
  /**
   * サウンドの再生
   * @param {string} type - サウンドタイプ ('bgm', 'sfx' など)
   * @param {string} subtype - サブタイプ ('main', 'attack' など)
   * @param {object} config - サウンド設定
   * @returns {Phaser.Sound.BaseSound|null} - サウンドオブジェクト、または失敗した場合はnull
   */
  playSound(type, subtype, config = {}) {
    const key = this.getSoundKey(type, subtype);
    if (!key) return null;
    
    try {
      // サウンドキャッシュの存在チェック
      const soundExists = this.scene && this.scene.cache.audio && this.scene.cache.audio.exists(key);
      
      if (!soundExists) {
        console.warn(`AssetManager: サウンド '${key}' がキャッシュに見つかりません。プレースホルダーを直接再生します。`);
        
        // デバッグモードでプレースホルダーを直接再生
        if (isDebugMode) {
          return this.playPlaceholderSound(type, subtype) ? { isPlaceholder: true } : null;
        }
        
        return null;
      }
      
      // 以下は既存の実装と同じ
      const defaultConfig = {
        volume: type === 'bgm' ? 0.5 : 0.8,
        loop: type === 'bgm',
        rate: 1.0,
        detune: 0,
        seek: 0,
        delay: 0,
        mute: false
      };
      
      const mergedConfig = { ...defaultConfig, ...config };
      const sound = this.scene.sound.add(key, mergedConfig);
      sound.play();
      
      if (type === 'sfx') {
        sound.once('complete', () => {
          sound.destroy();
        });
      }
      
      if (type === 'bgm') {
        this.audio.set(`playing_${key}`, sound);
      }
      
      return sound;
      
    } catch (error) {
      console.error(`AssetManager: サウンド '${key}' の再生に失敗しました。プレースホルダーを試みます。`, error);
      
      // エラー時にプレースホルダーを直接再生
      if (isDebugMode) {
        return this.playPlaceholderSound(type, subtype) ? { isPlaceholder: true } : null;
      }
      
      return null;
    }
  }
  
  /**
   * BGMの再生（既存のBGMを停止して新しいBGMを再生）
   * @param {string} subtype - BGMのサブタイプ
   * @param {object} config - サウンド設定
   * @returns {Phaser.Sound.BaseSound|null} - サウンドオブジェクト、または失敗した場合はnull
   */
  playBGM(subtype, config = {}) {
    // 既存のBGM停止
    this.stopBGM();
    
    // デフォルト設定
    const defaultConfig = {
      volume: 0.5,
      loop: true,
      fade: false,
      fadeInDuration: 1000 // ミリ秒
    };
    
    // ユーザー設定とデフォルト設定をマージ
    const mergedConfig = { ...defaultConfig, ...config };
    
    // フェードイン設定を取り出す
    const fade = mergedConfig.fade;
    const fadeInDuration = mergedConfig.fadeInDuration;
    delete mergedConfig.fade;
    delete mergedConfig.fadeInDuration;
    
    // BGM再生
    const bgm = this.playSound('bgm', subtype, mergedConfig);
    
    if (bgm && fade && this.scene && this.scene.tweens) {
      // 初期ボリュームを0に設定してフェードイン
      const targetVolume = bgm.volume;
      bgm.setVolume(0);
      this.scene.tweens.add({
        targets: bgm,
        volume: targetVolume,
        duration: fadeInDuration,
        ease: 'Linear'
      });
    }
    
    return bgm;
  }
  
  /**
   * 現在再生中のBGMを停止
   * @param {boolean} fadeOut - フェードアウトするかどうか
   * @param {number} duration - フェードアウト時間（ミリ秒）
   */
  stopBGM(fadeOut = false, duration = 1000) {
    if (!this.scene || !this.scene.sound) return;
    
    // 再生中のBGMを検索
    const playingBGMs = [];
    this.audio.forEach((sound, key) => {
      if (key.startsWith('playing_bgm_')) {
        playingBGMs.push(sound);
      }
    });
    
    // 各BGMを停止
    playingBGMs.forEach(sound => {
      if (fadeOut && sound.isPlaying && this.scene.tweens) {
        // フェードアウト後に停止
        this.scene.tweens.add({
          targets: sound,
          volume: 0,
          duration: duration,
          ease: 'Linear',
          onComplete: () => {
            sound.stop();
            sound.destroy();
          }
        });
      } else {
        // 即座に停止
        sound.stop();
        sound.destroy();
      }
      
      // マップから削除
      this.audio.delete(`playing_${sound.key}`);
    });
    
    // バックアップ：キーによる停止（BGMプレフィックスのサウンドをすべて停止）
    const sounds = this.scene.sound.sounds;
    sounds.forEach(sound => {
      if (sound.key.startsWith('bgm_')) {
        if (fadeOut && sound.isPlaying && this.scene.tweens) {
          // フェードアウト後に停止
          this.scene.tweens.add({
            targets: sound,
            volume: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
              sound.stop();
            }
          });
        } else {
          // 即座に停止
          sound.stop();
        }
      }
    });
  }
  
  /**
   * 特定の効果音の再生
   * @param {string} subtype - 効果音のサブタイプ
   * @param {object} config - サウンド設定
   * @returns {Phaser.Sound.BaseSound|null} - サウンドオブジェクト、または失敗した場合はnull
   */
  playSFX(subtype, config = {}) {
    return this.playSound('sfx', subtype, config);
  }
  
  /**
   * すべてのサウンドを停止
   * @param {boolean} fadeOut - フェードアウトするかどうか
   * @param {number} duration - フェードアウト時間（ミリ秒）
   */
  stopAllSounds(fadeOut = false, duration = 500) {
    if (!this.scene || !this.scene.sound) return;
    
    if (fadeOut && this.scene.tweens) {
      // すべてのサウンドをフェードアウト
      const sounds = this.scene.sound.sounds;
      sounds.forEach(sound => {
        if (sound.isPlaying) {
          this.scene.tweens.add({
            targets: sound,
            volume: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
              sound.stop();
            }
          });
        }
      });
      
      // 少し待ってから完全停止
      this.scene.time.delayedCall(duration, () => {
        this.scene.sound.stopAll();
      });
    } else {
      // 即座にすべて停止
      this.scene.sound.stopAll();
    }
    
    // マップをクリア（再生中のBGM記録）
    this.audio.forEach((value, key) => {
      if (key.startsWith('playing_')) {
        this.audio.delete(key);
      }
    });
  }

}

// シングルトンインスタンスをエクスポート
export default AssetManager.getInstance();
