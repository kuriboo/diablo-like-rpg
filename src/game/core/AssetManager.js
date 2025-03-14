// src/game/core/AssetManager.js

/**
 * アセットマネージャー
 * ゲーム内のすべてのアセット（画像、スプライトシート、オーディオなど）を管理する
 */
export default class AssetManager {
    constructor(scene) {
      this.scene = scene;
      
      // アセットタイプごとのマップ
      this.textures = new Map();
      this.spritesheets = new Map();
      this.audio = new Map();
      
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
        tile: {
          grass: 'tile_grass',
          dirt: 'tile_dirt',
          stone: 'tile_stone',
          water: 'tile_water',
          snow: 'tile_snow',
          sand: 'tile_sand',
          lava: 'tile_lava'
        },
        obstacle: {
          tree: 'obstacle_tree',
          rock: 'obstacle_rock',
          bush: 'obstacle_bush',
          crate: 'obstacle_crate'
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
          item: 'sfx_item'
        }
      };
      
      // シーンからアセットをロード
      this.initialize();
    }
    
    /**
     * アセットマネージャーの初期化
     */
    initialize() {
      console.log('AssetManager: Initializing...');
      
      // テクスチャの検証とマップへの追加
      if (this.scene && this.scene.textures) {
        const textureKeys = this.scene.textures.getTextureKeys();
        
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
            }
          }
        });
      }
      
      // オーディオの検証とマップへの追加
      if (this.scene && this.scene.sound && this.scene.cache.audio) {
        const audioKeys = this.scene.cache.audio.entries.keys();
        
        for (const key of audioKeys) {
          if (key.startsWith('bgm_') || key.startsWith('sfx_')) {
            this.audio.set(key, key);
          }
        }
      }
      
      console.log(`AssetManager: Initialized with ${this.textures.size} textures, ${this.spritesheets.size} spritesheets, and ${this.audio.size} audio files.`);
    }
    
    /**
     * テクスチャキーの取得
     * @param {string} type - オブジェクトタイプ（'player', 'enemy'など）
     * @param {string} subtype - サブタイプ（'warrior', 'skeleton'など）
     * @returns {string|null} - テクスチャキー、または存在しない場合はnull
     */
    getTextureKey(type, subtype) {
      const typeMap = this.textureMap[type];
      if (!typeMap) return null;
      
      const textureKey = typeMap[subtype];
      if (!textureKey) return null;
      
      // テクスチャの存在チェック
      if (!this.textures.has(textureKey)) {
        console.warn(`AssetManager: Texture key '${textureKey}' not found.`);
        return null;
      }
      
      return textureKey;
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
        console.warn(`AssetManager: Animation key '${animKey}' not found.`);
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
        if (!typeMap) return null;
        
        const soundKey = typeMap[subtype];
        if (!soundKey) return null;
        
        // サウンドの存在チェック
        if (!this.scene.cache.audio.exists(soundKey)) {
        console.warn(`AssetManager: Sound key '${soundKey}' not found.`);
        return null;
        }
        
        return soundKey;
    }
    
    /**
     * テクスチャの取得（Spriteの作成用）
     * @param {string} type - オブジェクトタイプ
     * @param {string} subtype - サブタイプ
     * @returns {Phaser.Textures.Texture|null} - テクスチャ、または存在しない場合はnull
     */
    getTexture(type, subtype) {
      const key = this.getTextureKey(type, subtype);
      if (!key) return null;
      
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
      if (!key) return false;
      
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
        // デフォルト設定
        const defaultConfig = {
            volume: type === 'bgm' ? 0.5 : 0.8,
            loop: type === 'bgm',
            rate: 1.0,
            detune: 0,
            seek: 0,
            delay: 0,
            mute: false
        };
        
        // ユーザー設定とデフォルト設定をマージ
        const mergedConfig = { ...defaultConfig, ...config };
        
        // サウンド再生
        const sound = this.scene.sound.add(key, mergedConfig);
        sound.play();
        
        // 効果音の場合は完了後に自動で破棄
        if (type === 'sfx') {
            sound.once('complete', () => {
            sound.destroy();
            });
        }
        
        // サウンドをマップに保存（BGMの場合）
        if (type === 'bgm') {
            this.audio.set(`playing_${key}`, sound);
        }
        
        return sound;
        
        } catch (error) {
        console.error(`AssetManager: Failed to play sound '${key}'`, error);
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
        
        if (bgm && fade) {
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
        if (fadeOut && sound.isPlaying) {
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
                if (fadeOut && sound.isPlaying) {
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
        
        if (fadeOut) {
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
        
        // マップをクリア
        this.audio.clear();
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
        if (sound.key.startsWith('bgm_')) {
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
        if (sound.key.startsWith('sfx_')) {
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
        if (!key) return false;
        
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
        if (!key) return false;
        
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
        console.error(`AssetManager: Failed to add marker '${markerName}' to sound '${key}'`, error);
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
        if (!key) return null;
        
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
        if (!sound.markers[markerName]) {
            console.warn(`AssetManager: Marker '${markerName}' not found in sound '${key}'.`);
            return null;
        }
        
        // マーカーを再生
        sound.play(markerName, config);
        return sound;
        } catch (error) {
        console.error(`AssetManager: Failed to play marker '${markerName}' of sound '${key}'`, error);
        return null;
        }
    }
}