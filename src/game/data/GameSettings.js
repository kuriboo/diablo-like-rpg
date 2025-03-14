// src/game/data/GameSettings.js

/**
 * ゲーム設定を管理するシングルトンクラス
 */
export class GameSettings {
    static instance = null;
  
    /**
     * シングルトンインスタンスを取得
     * @returns {GameSettings} GameSettingsのインスタンス
     */
    static getInstance() {
      if (!GameSettings.instance) {
        GameSettings.instance = new GameSettings();
      }
      return GameSettings.instance;
    }
  
    constructor() {
      // 既に存在する場合は既存のインスタンスを返す
      if (GameSettings.instance) {
        return GameSettings.instance;
      }
  
      // デフォルト設定
      this.defaultSettings = {
        bgmVolume: 0.7,
        sfxVolume: 0.8,
        fullscreen: false,
        effectQuality: 1, // 0: 低, 1: 中, 2: 高
        difficulty: 1, // 0: 簡単, 1: 普通, 2: 難しい
        language: 'ja',
        controls: {
          up: 'W',
          down: 'S',
          left: 'A',
          right: 'D',
          attack: 'SPACE',
          skill1: 'Q',
          skill2: 'E',
          skill3: 'R',
          potion: 'F',
          menu: 'ESC'
        }
      };
  
      // 現在の設定（ローカルストレージから読み込むか、デフォルト値を使用）
      this.loadSettings();
      
      // シングルトンインスタンスを設定
      GameSettings.instance = this;
    }
  
    /**
     * 設定をローカルストレージから読み込む
     */
    loadSettings() {
      try {
        const savedSettings = localStorage.getItem('diabloLikeRpgSettings');
        
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          
          // デフォルト設定とマージして、不足している設定があればデフォルト値で補完
          this.bgmVolume = parsedSettings.bgmVolume !== undefined ? 
            parsedSettings.bgmVolume : this.defaultSettings.bgmVolume;
          
          this.sfxVolume = parsedSettings.sfxVolume !== undefined ? 
            parsedSettings.sfxVolume : this.defaultSettings.sfxVolume;
          
          this.fullscreen = parsedSettings.fullscreen !== undefined ? 
            parsedSettings.fullscreen : this.defaultSettings.fullscreen;
          
          this.effectQuality = parsedSettings.effectQuality !== undefined ? 
            parsedSettings.effectQuality : this.defaultSettings.effectQuality;
          
          this.difficulty = parsedSettings.difficulty !== undefined ? 
            parsedSettings.difficulty : this.defaultSettings.difficulty;
          
          this.language = parsedSettings.language !== undefined ? 
            parsedSettings.language : this.defaultSettings.language;
          
          // コントロール設定の読み込み
          this.controls = { ...this.defaultSettings.controls };
          
          if (parsedSettings.controls) {
            Object.keys(this.controls).forEach(key => {
              if (parsedSettings.controls[key]) {
                this.controls[key] = parsedSettings.controls[key];
              }
            });
          }
        } else {
          // 保存されている設定がない場合はデフォルト値を使用
          this.resetToDefaults();
        }
      } catch (error) {
        console.error('設定の読み込み中にエラーが発生しました:', error);
        this.resetToDefaults();
      }
    }
  
    /**
     * 設定をローカルストレージに保存
     */
    saveSettings() {
      try {
        const settingsToSave = {
          bgmVolume: this.bgmVolume,
          sfxVolume: this.sfxVolume,
          fullscreen: this.fullscreen,
          effectQuality: this.effectQuality,
          difficulty: this.difficulty,
          language: this.language,
          controls: this.controls
        };
        
        localStorage.setItem('diabloLikeRpgSettings', JSON.stringify(settingsToSave));
        console.log('設定を保存しました');
      } catch (error) {
        console.error('設定の保存中にエラーが発生しました:', error);
      }
    }
  
    /**
     * 設定をデフォルト値にリセット
     */
    resetToDefaults() {
      this.bgmVolume = this.defaultSettings.bgmVolume;
      this.sfxVolume = this.defaultSettings.sfxVolume;
      this.fullscreen = this.defaultSettings.fullscreen;
      this.effectQuality = this.defaultSettings.effectQuality;
      this.difficulty = this.defaultSettings.difficulty;
      this.language = this.defaultSettings.language;
      this.controls = { ...this.defaultSettings.controls };
    }
  
    /**
     * 設定を適用する（ゲーム起動時や設定変更時に呼び出す）
     * @param {Phaser.Game} game - Phaserゲームインスタンス
     */
    applySettings(game) {
      // BGM音量の適用
      game.sound.volume = this.bgmVolume;
      
      // フルスクリーン設定の適用
      if (this.fullscreen && !game.scale.isFullscreen) {
        game.scale.startFullscreen();
      } else if (!this.fullscreen && game.scale.isFullscreen) {
        game.scale.stopFullscreen();
      }
      
      // その他の設定の適用（必要に応じて実装）
      console.log('設定を適用しました');
    }
}